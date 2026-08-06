// ============================================================
// RANKINGS – Loads and displays candidate rankings with "Show More"
// ============================================================

import {
  loadDatabase,
  getCampaignNames,
  getRankedApplicants,
  getRecommendationBadgeClass
} from '../Assets/js/dataService.js';
import { showToast } from '../Assets/js/toast.js';

let allRankedData = [];
let visibleCount = 5;
const BATCH_SIZE = 5;
let db = null;

// ─── RENDER RANKINGS ─────────────────────────────────────────────
function renderRankings(ranked) {
  const list = document.getElementById('rankings-list');
  if (!list) return;

  const total = ranked.length;
  const hasMore = visibleCount < total;
  const showCount = Math.min(visibleCount, total);
  const itemsToShow = ranked.slice(0, showCount);

  if (total === 0) {
    list.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--text-muted);">No candidates found</td></tr>';
    updateShowMoreButton(0, false);
    return;
  }

  list.innerHTML = itemsToShow.map((c, index) => {
    const recClass = getRecommendationBadgeClass(c.recommendation);

    return `
      <tr>
        <td><input type="checkbox" data-applicant-id="${c.id}" /></td>
        <td><strong>#${index + 1}</strong></td>
        <td><a href="../Applicants/applicant-details.html?id=${c.id}" style="color:var(--link-color);text-decoration:none;">${c.fullName}</a></td>
        <td>${c.campaignName}</td>
        <td><strong>${c.score}</strong></td>
        <td><span class="badge ${recClass} recommendation-preview">${c.recommendation}</span></td>
        <td><a href="../Applicants/applicant-details.html?id=${c.id}" class="btn btn-secondary" style="padding:0.2rem 0.8rem;font-size:0.8rem;">View</a></td>
      </tr>
    `;
  }).join('');

  // Reattach change events for checkboxes
  document.querySelectorAll('#rankings-list input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', updateCompareButton);
  });

  updateShowMoreButton(total, hasMore);
  updateCompareButton();
}

// ─── UPDATE SHOW MORE BUTTON ────────────────────────────────────
function updateShowMoreButton(total, hasMore) {
  const btn = document.getElementById('show-more-btn');
  const countSpan = document.getElementById('show-more-count');
  if (!btn) return;

  if (total === 0) {
    btn.style.display = 'none';
    return;
  }

  btn.style.display = 'inline-flex';

  if (!hasMore) {
    btn.textContent = 'Show All';
    btn.disabled = true;
    btn.style.opacity = '0.5';
    if (countSpan) countSpan.textContent = `(${total} total)`;
    return;
  }

  btn.textContent = 'Show More';
  btn.disabled = false;
  btn.style.opacity = '1';
  if (countSpan) {
    const showing = Math.min(visibleCount, total);
    countSpan.textContent = `(${showing}/${total})`;
  }
}

// ─── UPDATE COMPARE BUTTON ──────────────────────────────────────
function updateCompareButton() {
  const btn = document.getElementById('compare-selected-btn');
  if (!btn) return;
  const selected = document.querySelectorAll('#rankings-list input[type="checkbox"]:checked');
  btn.disabled = selected.length < 2;
}

// ─── UPDATE TITLE ────────────────────────────────────────────────
function updateTitle(count) {
  const title = document.getElementById('rankings-title');
  if (title) {
    title.textContent = `Rankings (${count} candidates)`;
  }
}

// ─── LOAD RANKINGS ───────────────────────────────────────────────
async function loadRankings(campaignId) {
  try {
    const ranked = await getRankedApplicants(campaignId);
    allRankedData = ranked;
    visibleCount = 5;

    if (ranked.length === 0) {
      renderRankings([]);
      updateTitle(0);
      return;
    }

    updateTitle(ranked.length);
    renderRankings(ranked);

    console.log(`✅ Rankings loaded: ${ranked.length} candidates`);

  } catch (error) {
    console.error('Load rankings error:', error);
    showToast('Error loading rankings', 'error');
    renderRankings([]);
  }
}

// ─── POPULATE CAMPAIGN DROPDOWN ─────────────────────────────────
async function populateCampaignDropdown() {
  const campaignDropdown = document.getElementById('campaign-filter');
  if (!campaignDropdown) return;

  const campaignItems = campaignDropdown.querySelector('.dropdown-items');
  if (!campaignItems) return;

  const campaignNames = await getCampaignNames();
  campaignItems.innerHTML = `
    <div class="dropdown-item active" data-value="all">All Campaigns <span class="check">✓</span></div>
    ${campaignNames.map(c =>
      `<div class="dropdown-item" data-value="${c.id}">${c.name} (${c.client}) <span class="check">✓</span></div>`
    ).join('')}
  `;
}

// ─── SETUP LOAD RANKINGS BUTTON ────────────────────────────────
function setupLoadButton() {
  const btn = document.getElementById('load-rankings-btn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const campaignDropdown = document.getElementById('campaign-filter');
    const campaignId = campaignDropdown?.dataset?.value || 'all';
    loadRankings(campaignId);
  });
}

// ─── SETUP COMPARE SELECTED ─────────────────────────────────────
function setupCompareSelected() {
  const btn = document.getElementById('compare-selected-btn');
  if (!btn) return;

  btn.addEventListener('click', function() {
    const selected = document.querySelectorAll('#rankings-list input[type="checkbox"]:checked');
    if (selected.length < 2) {
      showToast('Please select at least 2 candidates to compare.', 'warning');
      return;
    }
    const ids = Array.from(selected).map(cb => cb.dataset.applicantId);
    window.location.href = `../Applicants/applicant-details.html?compare=${ids.join(',')}`;
  });
}

// ─── SETUP SELECT ALL ────────────────────────────────────────────
function setupSelectAll() {
  const selectAll = document.getElementById('select-all');
  if (!selectAll) return;

  selectAll.addEventListener('change', function() {
    const checkboxes = document.querySelectorAll('#rankings-list input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = this.checked);
    updateCompareButton();
  });
}

// ─── SETUP EXPORT ────────────────────────────────────────────────
function setupExport() {
  const btn = document.getElementById('export-rankings-btn');
  if (!btn) return;

  btn.addEventListener('click', function() {
    const data = allRankedData || [];
    if (data.length === 0) {
      showToast('No data to export', 'warning');
      return;
    }
    showToast(`Exporting ${data.length} candidates... (CSV/PDF coming soon)`, 'info');
  });
}

// ─── SETUP CAMPAIGN DROPDOWN CHANGE ─────────────────────────────
function setupCampaignDropdownChange() {
  const campaignDropdown = document.getElementById('campaign-filter');
  if (!campaignDropdown) return;

  campaignDropdown.addEventListener('dropdownChange', () => {
    const campaignId = campaignDropdown.dataset.value || 'all';
    loadRankings(campaignId);
  });
}

// ─── SETUP SHOW MORE BUTTON (FIX) ──────────────────────────────
function setupShowMore() {
  const btn = document.getElementById('show-more-btn');
  if (!btn) return;

  btn.addEventListener('click', function() {
    visibleCount += BATCH_SIZE;
    renderRankings(allRankedData);
  });
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────
export default async function initRankings() {
  try {
    db = await loadDatabase();
    if (!db) {
      showToast('Error loading rankings data', 'error');
      return;
    }

    // Set recruiter name
    const nameEl = document.getElementById('recruiter-name');
    if (nameEl && db.users?.length) {
      nameEl.textContent = db.users[0].fullName;
    }

    // Populate campaign dropdown
    await populateCampaignDropdown();

    // Setup UI
    setupLoadButton();
    setupCompareSelected();
    setupSelectAll();
    setupCampaignDropdownChange();
    setupShowMore(); // ─── FIX: attaches show more click handler

    // Auto-load rankings on page load
    await loadRankings('all');

    // Listen for checkbox changes to update compare button
    document.addEventListener('change', function(e) {
      if (e.target.closest('#rankings-list input[type="checkbox"]')) {
        updateCompareButton();
        const selectAll = document.getElementById('select-all');
        if (selectAll) {
          const checkboxes = document.querySelectorAll('#rankings-list input[type="checkbox"]');
          const checked = document.querySelectorAll('#rankings-list input[type="checkbox"]:checked');
          selectAll.checked = checkboxes.length > 0 && checkboxes.length === checked.length;
        }
      }
    });

    console.log('✅ Rankings page initialised');

  } catch (error) {
    console.error('Rankings error:', error);
    showToast('Error loading rankings', 'error');
    throw error;
  }
}
