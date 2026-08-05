// ============================================================
// APPLICANTS – List with filter, sort, search, Show More, Select & Trash
// ============================================================

import {
  loadDatabase,
  getRecommendationBadgeClass,
  sameId
} from '../Assets/js/dataService.js';
import { showToast } from '../Assets/js/toast.js';

let allApplicants = [];
let visibleCount = 5;
const BATCH_SIZE = 5;
let sortField = 'fullName';
let sortDirection = 'asc';
let db = null;

// ─── SELECT MODE STATE ──────────────────────────────────────────
let selectMode = false;
let selectedIds = new Set();
const TRASH_KEY = 'trashed_applicants';
const NOT_ASSESSED_FILTER = '__not_assessed__';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getApplicantAssessment(applicant) {
  return db?.assessments?.find(assessment =>
    sameId(assessment.applicantId, applicant.id) &&
    (!assessment.campaignId || sameId(assessment.campaignId, applicant.campaignId))
  ) || null;
}

function getRecommendationValue(applicant) {
  const value = String(getApplicantAssessment(applicant)?.recommendation || '').trim();
  return /^(not assessed|n\/?a)$/i.test(value) ? '' : value;
}

function recommendationCategoryFromValue(value) {
  const recommendation = String(value || '').trim().toLowerCase();
  if (!recommendation) return { value: NOT_ASSESSED_FILTER, label: 'Not Assessed', rank: 0 };
  if (recommendation.includes('excellent') || recommendation.includes('exceptional') || recommendation.includes('highly recommended')) {
    return { value: 'excellent', label: 'Excellent', rank: 5 };
  }
  if (recommendation.includes('conditional') || recommendation.includes('worth interviewing') || recommendation.includes('worth interview')) {
    return { value: 'conditional', label: 'Conditional', rank: 3 };
  }
  if (recommendation.includes('strong')) return { value: 'strong', label: 'Strong', rank: 4 };
  if (recommendation.includes('possible')) return { value: 'possible', label: 'Possible', rank: 2 };
  if (recommendation.includes('not recommended') || recommendation.includes('reject') || recommendation.includes('unsuitable')) {
    return { value: 'not_recommended', label: 'Not Recommended', rank: 1 };
  }
  return { value: 'other', label: 'Other', rank: 1 };
}

function getRecommendationCategory(applicant) {
  return recommendationCategoryFromValue(getRecommendationValue(applicant));
}

// ─── TRASH HELPERS ──────────────────────────────────────────────
function getTrashedIds() {
  try {
    const data = localStorage.getItem(TRASH_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function setTrashedIds(ids) {
  localStorage.setItem(TRASH_KEY, JSON.stringify(ids));
}

function addToTrash(ids) {
  const current = getTrashedIds();
  const newSet = new Set([...current, ...ids]);
  setTrashedIds([...newSet]);
}

function removeFromTrash(ids) {
  const current = getTrashedIds();
  const remaining = current.filter(id => !ids.includes(id));
  setTrashedIds(remaining);
}

function isTrashed(id) {
  return getTrashedIds().includes(id);
}

// ─── SORT HELPERS ──────────────────────────────────────────────
function getSortValue(a, field) {
  if (field === 'campaign') {
    const campaign = db.campaigns.find(c => sameId(c.id, a.campaignId));
    return campaign?.jobTitle || '';
  }
  if (field === 'score') {
    const score = Number(getApplicantAssessment(a)?.overallScore);
    return Number.isFinite(score) ? score : null;
  }
  if (field === 'recommendation') {
    const recommendation = getRecommendationValue(a);
    return recommendation ? recommendationCategoryFromValue(recommendation).rank : null;
  }
  if (field === 'yearsExperience') {
    const years = Number(a.yearsExperience);
    return Number.isFinite(years) ? years : null;
  }
  return (a[field] || '').toString().toLowerCase();
}

function sortApplicants(list, field, direction) {
  return [...list].sort((a, b) => {
    let valA = getSortValue(a, field);
    let valB = getSortValue(b, field);
    const missingA = valA === null || valA === undefined || valA === '';
    const missingB = valB === null || valB === undefined || valB === '';
    if (missingA !== missingB) return missingA ? 1 : -1;
    if (missingA && missingB) return 0;
    if (typeof valA === 'string') {
      valA = valA.toLowerCase();
      valB = valB.toLowerCase();
    }
    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

// ─── FILTER APPLICANTS ──────────────────────────────────────────
function filterApplicants() {
  const campaignFilter = document.getElementById('campaign-filter-popup')?.dataset?.value || 'all';
  const recFilter = document.getElementById('recommendation-filter-popup')?.dataset?.value || 'all';
  const searchInput = document.getElementById('search-applicant');
  const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';

  let filtered = [...allApplicants];

  if (campaignFilter !== 'all') {
    filtered = filtered.filter(a => sameId(a.campaignId, campaignFilter));
  }

  if (recFilter !== 'all') {
    filtered = filtered.filter(applicant => {
      return getRecommendationCategory(applicant).value === recFilter;
    });
  }

  if (searchQuery) {
    filtered = filtered.filter(a => {
      const campaign = db.campaigns.find(c => sameId(c.id, a.campaignId));
      return [a.fullName, a.email, a.currentPosition, a.country, campaign?.jobTitle, campaign?.clientName]
        .some(value => String(value || '').toLowerCase().includes(searchQuery));
    });
  }

  return filtered;
}

function updateFilterSummary() {
  const trigger = document.getElementById('filterSortTrigger');
  const label = trigger?.querySelector('span');
  if (!trigger || !label) return;
  const campaign = document.getElementById('campaign-filter-popup')?.dataset?.value || 'all';
  const recommendation = document.getElementById('recommendation-filter-popup')?.dataset?.value || 'all';
  const activeCount = Number(campaign !== 'all') + Number(recommendation !== 'all');
  label.textContent = activeCount ? `Sort & Filter (${activeCount})` : 'Sort & Filter';
  trigger.setAttribute('aria-label', activeCount
    ? `Sort and filter, ${activeCount} active filter${activeCount === 1 ? '' : 's'}`
    : 'Sort and filter');
}

// ─── RENDER APPLICANTS ──────────────────────────────────────────
function renderApplicants() {
  const list = document.getElementById('applicant-list');
  if (!list) return;

  const filtered = filterApplicants();
  const sorted = sortApplicants(filtered, sortField, sortDirection);

  const total = sorted.length;
  const hasMore = visibleCount < total;
  const showCount = Math.min(visibleCount, total);
  const itemsToShow = sorted.slice(0, showCount);
  updateFilterSummary();

  // Show/hide checkbox header
  const checkboxHeader = document.getElementById('checkbox-header');
  if (checkboxHeader) {
    checkboxHeader.style.display = selectMode ? '' : 'none';
  }

  if (total === 0) {
    list.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--text-muted);">No applicants found</td></tr>';
    updateShowMoreButton(0, false);
    updateSelectionUI();
    return;
  }

  list.innerHTML = itemsToShow.map(a => {
    const assessment = getApplicantAssessment(a);
    const campaign = db.campaigns.find(c => sameId(c.id, a.campaignId));
    const score = assessment?.overallScore || 'N/A';
    const rec = assessment?.recommendation || 'Not Assessed';

    const recClass = getRecommendationBadgeClass(rec);

    const isChecked = selectedIds.has(a.id) ? 'checked' : '';

    return `<tr data-applicant-id="${a.id}">
      ${selectMode ? `<td><input type="checkbox" class="applicant-checkbox" data-id="${a.id}" ${isChecked} /></td>` : ''}
      <td><a href="/Applicants/applicant-details.html?id=${a.id}" style="color:var(--link-color);text-decoration:none;">${a.fullName}</a></td>
      <td>${campaign?.jobTitle || 'Unknown'}</td>
      <td>${a.currentPosition}</td>
      <td>${Number.isFinite(Number(a.yearsExperience)) ? `${Number(a.yearsExperience)} yrs` : 'N/A'}</td>
      <td>${score}</td>
      <td><span class="badge ${recClass} recommendation-preview">${rec}</span></td>
      <td><a href="/Applicants/applicant-details.html?id=${a.id}" class="btn btn-secondary" style="padding:0.3rem 1rem;">View</a></td>
    </tr>`;
  }).join('');

  // Attach checkbox events
  if (selectMode) {
    document.querySelectorAll('.applicant-checkbox').forEach(cb => {
      cb.addEventListener('change', function() {
        const id = this.dataset.id;
        if (this.checked) {
          selectedIds.add(id);
        } else {
          selectedIds.delete(id);
        }
        updateSelectionUI();
        updateSelectAllState();
      });
    });

    // Select all
    const selectAll = document.getElementById('select-all-checkbox');
    if (selectAll) {
      selectAll.checked = false;
      selectAll.addEventListener('change', function() {
        const checkboxes = document.querySelectorAll('.applicant-checkbox');
        checkboxes.forEach(cb => {
          cb.checked = this.checked;
          const id = cb.dataset.id;
          if (this.checked) {
            selectedIds.add(id);
          } else {
            selectedIds.delete(id);
          }
        });
        updateSelectionUI();
      });
    }
  }

  updateShowMoreButton(total, hasMore);
  updateSelectionUI();
}

// ─── UPDATE SELECTION UI ────────────────────────────────────────
function updateSelectionUI() {
  const toolbar = document.getElementById('selection-toolbar');
  const countSpan = document.getElementById('selection-count');
  const count = selectedIds.size;

  if (selectMode && count > 0) {
    toolbar.style.display = 'flex';
    countSpan.textContent = `${count} selected`;
  } else {
    toolbar.style.display = 'none';
  }

  // Update Select button label
  const label = document.getElementById('select-btn-label');
  if (label) {
    label.textContent = selectMode ? 'Cancel' : 'Select';
  }

  // Update checkbox header visibility
  const header = document.getElementById('checkbox-header');
  if (header) {
    header.style.display = selectMode ? '' : 'none';
  }
}

function updateSelectAllState() {
  const checkboxes = document.querySelectorAll('.applicant-checkbox');
  const checked = document.querySelectorAll('.applicant-checkbox:checked');
  const selectAll = document.getElementById('select-all-checkbox');
  if (selectAll) {
    selectAll.checked = checkboxes.length > 0 && checkboxes.length === checked.length;
  }
}

// ─── UPDATE SHOW MORE BUTTON ────────────────────────────────────
function updateShowMoreButton(total, hasMore) {
  const btn = document.getElementById('show-more-btn');
  const countSpan = document.getElementById('show-more-count');
  if (!btn) return;
  if (total === 0) { btn.style.display = 'none'; return; }
  btn.style.display = 'inline-flex';
  if (!hasMore) {
    btn.textContent = 'Show All';
    btn.disabled = true;
    btn.style.opacity = '0.5';
    if (countSpan) countSpan.textContent = `(${total} total)`;
  } else {
    btn.textContent = 'Show More';
    btn.disabled = false;
    btn.style.opacity = '1';
    if (countSpan) countSpan.textContent = `(${Math.min(visibleCount, total)}/${total})`;
  }
}

// ─── SETUP FILTER/SORT PANEL ────────────────────────────────────
function setupPanel() {
  const applyBtn = document.getElementById('applyFiltersSortBtn');
  const clearBtn = document.getElementById('clearFiltersSortBtn');

  applyBtn.addEventListener('click', () => {
    const sortFieldDropdown = document.getElementById('sort-field-popup');
    sortField = sortFieldDropdown?.dataset?.value || 'fullName';
    const dirRadio = document.querySelector('input[name="sort-direction"]:checked');
    sortDirection = dirRadio ? dirRadio.value : 'asc';
    visibleCount = 5;
    selectedIds.clear();
    renderApplicants();
    document.getElementById('filterSortPanel').style.display = 'none';
  });

  clearBtn.addEventListener('click', () => {
    const campaignPopup = document.getElementById('campaign-filter-popup');
    campaignPopup.dataset.value = 'all';
    campaignPopup.querySelector('.selected-text').textContent = 'All Campaigns';

    const recPopup = document.getElementById('recommendation-filter-popup');
    recPopup.dataset.value = 'all';
    recPopup.querySelector('.selected-text').textContent = 'All Recommendations';

    const sortFieldDropdown = document.getElementById('sort-field-popup');
    sortFieldDropdown.dataset.value = 'fullName';
    sortFieldDropdown.querySelector('.selected-text').textContent = 'Name';

    document.querySelector('input[name="sort-direction"][value="asc"]').checked = true;

    document.querySelectorAll('#campaign-filter-popup .dropdown-item, #recommendation-filter-popup .dropdown-item, #sort-field-popup .dropdown-item')
      .forEach(i => i.classList.remove('active'));

    document.querySelector('#campaign-filter-popup .dropdown-item[data-value="all"]')?.classList.add('active');
    document.querySelector('#recommendation-filter-popup .dropdown-item[data-value="all"]')?.classList.add('active');
    document.querySelector('#sort-field-popup .dropdown-item[data-value="fullName"]')?.classList.add('active');

    sortField = 'fullName';
    sortDirection = 'asc';
    visibleCount = 5;
    selectedIds.clear();
    renderApplicants();
    document.getElementById('filterSortPanel').style.display = 'none';
  });
}

// ─── POPULATE DROPDOWNS ──────────────────────────────────────────
function populateDropdowns() {
  const applicantCampaigns = db.campaigns
    .filter(campaign => allApplicants.some(applicant => sameId(applicant.campaignId, campaign.id)))
    .map(campaign => ({
      id: campaign.id,
      name: campaign.jobTitle || 'Untitled campaign',
      client: campaign.clientName || '',
      count: allApplicants.filter(applicant => sameId(applicant.campaignId, campaign.id)).length
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const campaignPopupItems = document.querySelector('#campaign-filter-popup .dropdown-items');
  if (campaignPopupItems) {
    campaignPopupItems.innerHTML = `
      <div class="dropdown-item active" data-value="all">All Campaigns <span class="check">✓</span></div>
      ${applicantCampaigns.map(c => `<div class="dropdown-item" data-value="${escapeHtml(c.id)}">${escapeHtml(c.name)}${c.client ? ` (${escapeHtml(c.client)})` : ''} <small>${c.count}</small><span class="check">✓</span></div>`).join('')}
    `;
  }

  const recPopupItems = document.querySelector('#recommendation-filter-popup .dropdown-items');
  if (recPopupItems) {
    const categoryMap = new Map();
    allApplicants.forEach(applicant => {
      const category = getRecommendationCategory(applicant);
      const existing = categoryMap.get(category.value) || { ...category, count: 0 };
      existing.count += 1;
      categoryMap.set(category.value, existing);
    });
    const recommendationCategories = [...categoryMap.values()]
      .filter(category => category.value !== NOT_ASSESSED_FILTER)
      .sort((a, b) => b.rank - a.rank || a.label.localeCompare(b.label));
    const unassessedCount = categoryMap.get(NOT_ASSESSED_FILTER)?.count || 0;
    recPopupItems.innerHTML = `
      <div class="dropdown-item active" data-value="all">All Recommendations <span class="check">✓</span></div>
      ${recommendationCategories.map(category => `<div class="dropdown-item" data-value="${category.value}">${category.label} <small>${category.count}</small><span class="check">✓</span></div>`).join('')}
      ${unassessedCount ? `<div class="dropdown-item" data-value="${NOT_ASSESSED_FILTER}">Not Assessed <small>${unassessedCount}</small><span class="check">✓</span></div>` : ''}
    `;

    const sortItems = document.querySelector('#sort-field-popup .dropdown-items');
    if (sortItems) {
      const fields = [
        { value: 'fullName', label: 'Name', available: true },
        { value: 'campaign', label: 'Campaign', available: applicantCampaigns.length > 0 },
        { value: 'currentPosition', label: 'Position', available: allApplicants.some(a => a.currentPosition) },
        { value: 'yearsExperience', label: 'Experience', available: allApplicants.some(a => Number.isFinite(Number(a.yearsExperience))) },
        { value: 'score', label: 'Score', available: allApplicants.some(a => Number.isFinite(Number(getApplicantAssessment(a)?.overallScore))) },
        { value: 'recommendation', label: 'Recommendation', available: recommendationCategories.length > 0 }
      ].filter(field => field.available);
      sortItems.innerHTML = fields.map(field =>
        `<div class="dropdown-item ${field.value === 'fullName' ? 'active' : ''}" data-value="${field.value}">${field.label} <span class="check">✓</span></div>`
      ).join('');
    }
  }
}

// ─── SETUP SEARCH ────────────────────────────────────────────────
function setupSearch() {
  const searchInput = document.getElementById('search-applicant');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      visibleCount = 5;
      selectedIds.clear();
      renderApplicants();
    });
  }
}

// ─── SETUP SHOW MORE ─────────────────────────────────────────────
function setupShowMore() {
  const btn = document.getElementById('show-more-btn');
  if (btn) {
    btn.addEventListener('click', () => {
      visibleCount += BATCH_SIZE;
      renderApplicants();
    });
  }
}

// ─── SETUP FILTER/SORT TRIGGER ──────────────────────────────────
function setupFilterSortTrigger() {
  const trigger = document.getElementById('filterSortTrigger');
  const panel = document.getElementById('filterSortPanel');
  const closeBtn = document.getElementById('closeFilterPanel');

  if (trigger && panel) {
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = panel.style.display === 'block';
      panel.style.display = isOpen ? 'none' : 'block';
    });
    closeBtn.addEventListener('click', () => { panel.style.display = 'none'; });
    document.addEventListener('click', (e) => {
      if (!panel.contains(e.target) && !trigger.contains(e.target)) {
        panel.style.display = 'none';
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && panel.style.display === 'block') {
        panel.style.display = 'none';
      }
    });
  }
}

// ─── SETUP SELECT MODE ───────────────────────────────────────────
function setupSelectMode() {
  const selectBtn = document.getElementById('select-toggle-btn');
  const cancelBtn = document.getElementById('cancel-selection-btn');

  // ─── Custom Confirmation Modal ────────────────────────────────
  const confirmTrashModal = document.getElementById('confirm-trash-modal');
  const confirmTrashYes = document.getElementById('confirm-trash-yes');
  const confirmTrashNo = document.getElementById('confirm-trash-no');
  const confirmTrashTitle = document.getElementById('confirm-trash-title');
  const confirmTrashMessage = document.getElementById('confirm-trash-message');

  function openConfirmTrashModal() {
    const count = selectedIds.size;
    if (count === 0) {
      showToast('No applicants selected.', 'warning');
      return;
    }
    const names = [...selectedIds].slice(0, 3).map(id => {
      const app = allApplicants.find(a => sameId(a.id, id));
      return app ? app.fullName : 'Unknown';
    });
    const nameList = names.join(', ') + (selectedIds.size > 3 ? ` and ${selectedIds.size - 3} more` : '');
    confirmTrashTitle.textContent = `Move ${count} applicant(s) to Trash?`;
    confirmTrashMessage.textContent = `Are you sure you want to move ${nameList} to trash? They can be restored later.`;
    confirmTrashModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function closeConfirmTrashModal() {
    confirmTrashModal.style.display = 'none';
    document.body.style.overflow = '';
  }

  const moveToTrashBtn = document.getElementById('move-to-trash-btn');

  selectBtn.addEventListener('click', () => {
    selectMode = !selectMode;
    if (!selectMode) {
      selectedIds.clear();
    } else {
      const filtered = filterApplicants();
      if (filtered.length === 0) {
        showToast('No applicants to select.', 'info');
        selectMode = false;
        renderApplicants();
        return;
      }
    }
    renderApplicants();
  });

  cancelBtn.addEventListener('click', () => {
    selectMode = false;
    selectedIds.clear();
    renderApplicants();
  });

  moveToTrashBtn.addEventListener('click', openConfirmTrashModal);

  confirmTrashYes.addEventListener('click', function() {
    if (selectedIds.size === 0) {
      showToast('No applicants selected.', 'warning');
      closeConfirmTrashModal();
      return;
    }
    const ids = [...selectedIds];
    addToTrash(ids);
    selectedIds.clear();
    selectMode = false;
    renderApplicants();
    closeConfirmTrashModal();
    showToast(`${ids.length} applicant(s) moved to trash.`, 'success');
  });

  confirmTrashNo.addEventListener('click', closeConfirmTrashModal);
  confirmTrashModal.addEventListener('click', (e) => {
    if (e.target === confirmTrashModal) closeConfirmTrashModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && confirmTrashModal.style.display === 'flex') closeConfirmTrashModal();
  });
}

// ─── SETUP TRASH MODAL ──────────────────────────────────────────
function setupTrashModal() {
  const trashBtn = document.getElementById('trash-btn');
  const modal = document.getElementById('trash-modal');
  const closeBtns = document.querySelectorAll('#close-trash-modal, #close-trash-modal-footer');
  const emptyBtn = document.getElementById('empty-trash-btn');
  const listContainer = document.getElementById('trash-list');

  function openTrashModal() {
    const trashedIds = getTrashedIds();
    if (trashedIds.length === 0) {
      listContainer.innerHTML = '<p style="color:var(--text-muted);">Trash is empty.</p>';
    } else {
      const trashedApplicants = allApplicants.filter(a => trashedIds.includes(a.id));
      if (trashedApplicants.length === 0) {
        // If applicants are missing (maybe deleted from db), clean up trash
        setTrashedIds([]);
        listContainer.innerHTML = '<p style="color:var(--text-muted);">Trash is empty.</p>';
      } else {
        listContainer.innerHTML = trashedApplicants.map(a => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:0.5rem 0;border-bottom:1px solid var(--border-light);">
            <span><a href="/Applicants/applicant-details.html?id=${a.id}" style="color:var(--link-color);text-decoration:none;">${a.fullName}</a></span>
            <div style="display:flex;gap:0.5rem;">
              <button class="btn btn-secondary restore-btn" data-id="${a.id}" style="padding:0.2rem 0.8rem;font-size:0.8rem;">Restore</button>
              <button class="btn btn-secondary delete-permanent-btn" data-id="${a.id}" style="padding:0.2rem 0.8rem;font-size:0.8rem;color:#E74C3C;border-color:#E74C3C;">Delete Permanently</button>
            </div>
          </div>
        `).join('');

        // Attach restore events
        document.querySelectorAll('.restore-btn').forEach(btn => {
          btn.addEventListener('click', function() {
            const id = this.dataset.id;
            removeFromTrash([id]);
            openTrashModal(); // refresh modal
            renderApplicants();
            showToast('Applicant restored.', 'success');
          });
        });

        // Attach delete permanent events
        document.querySelectorAll('.delete-permanent-btn').forEach(btn => {
          btn.addEventListener('click', function() {
            const id = this.dataset.id;
            if (confirm('Permanently delete this applicant? This cannot be undone.')) {
              removeFromTrash([id]);
              openTrashModal(); // refresh modal
              renderApplicants();
              showToast('Applicant permanently deleted.', 'info');
            }
          });
        });
      }
    }
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function closeTrashModal() {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }

  trashBtn.addEventListener('click', openTrashModal);
  closeBtns.forEach(btn => btn.addEventListener('click', closeTrashModal));
  modal.addEventListener('click', (e) => { if (e.target === modal) closeTrashModal(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'flex') closeTrashModal();
  });

  emptyBtn.addEventListener('click', () => {
    if (confirm('Empty trash? All trashed applicants will be permanently deleted.')) {
      const trashedIds = getTrashedIds();
      if (trashedIds.length === 0) {
        showToast('Trash is already empty.', 'info');
        return;
      }
      setTrashedIds([]);
      openTrashModal(); // refresh
      renderApplicants();
      showToast('Trash emptied.', 'info');
    }
  });
}

// ─── LISTEN FOR DROPDOWN CHANGES ────────────────────────────────
function setupDropdownListeners() {
  document.addEventListener('dropdownChange', (e) => {
    const target = e.target;
    if (target.id === 'campaign-filter-popup' || target.id === 'recommendation-filter-popup') {
      visibleCount = 5;
      selectedIds.clear();
      renderApplicants();
    }
  });
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────
export default async function initApplicants() {
  try {
    db = await loadDatabase();
    if (!db) {
      showToast('Error loading applicant data', 'error');
      return;
    }

    // Set recruiter name
    const nameEl = document.getElementById('recruiter-name');
    if (nameEl && db.users?.length) {
      nameEl.textContent = db.users[0].fullName;
    }

    allApplicants = db.applicants || [];

    // Populate dropdowns
    populateDropdowns();

    // Setup UI
    setupFilterSortTrigger();
    setupPanel();
    setupSearch();
    setupShowMore();
    setupDropdownListeners();

    // Initial render
    renderApplicants();

    console.log('✅ Applicants loaded successfully');

  } catch (error) {
    console.error('Applicants error:', error);
    showToast('Error loading applicants', 'error');
    const list = document.getElementById('applicant-list');
    if (list) {
      list.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--text-muted);">Error loading applicants</td></tr>';
    }
  }
}
