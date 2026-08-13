// ============================================================
// REPORTS – Client reports with candidate selection and report list
// ============================================================

import {
  loadDatabase,
  getCampaignNames,
  getRecommendationBadgeClass,
  getStatusBadgeClass,
  sameId
} from '../Assets/js/dataService.js';
import { showToast } from '../Assets/js/toast.js';

let allCandidates = [];
let allReports = [];
let visibleCandidates = 5;
let reportSearchQuery = '';
let candidateSearchQuery = '';
let activeReportId = null;
const BATCH_SIZE = 5;
let db = null;

// ─── RENDER CANDIDATE SELECTION TABLE ──────────────────────────
function renderCandidates() {
  const list = document.getElementById('candidate-selection-list');
  if (!list) return;

  const campaignFilter = document.getElementById('report-campaign-filter')?.dataset?.value || 'all';
  let filtered = [...allCandidates];

  if (campaignFilter !== 'all') {
    filtered = filtered.filter(a => sameId(a.campaignId, campaignFilter));
  }
  if (candidateSearchQuery) {
    filtered = filtered.filter(applicant => {
      const campaign = db.campaigns?.find(item => sameId(item.id, applicant.campaignId));
      const assessment = db.assessments?.find(item =>
        sameId(item.applicantId, applicant.id) &&
        sameId(item.campaignId, applicant.campaignId)
      );
      return [applicant.fullName, applicant.currentPosition, applicant.country, campaign?.jobTitle, campaign?.clientName, assessment?.recommendation]
        .some(value => String(value || '').toLocaleLowerCase().includes(candidateSearchQuery));
    });
  }

  const total = filtered.length;
  const resultLabel = document.getElementById('candidate-report-search-results');
  if (resultLabel) resultLabel.textContent = candidateSearchQuery
    ? `${total} of ${allCandidates.length} candidates`
    : `${allCandidates.length} candidates`;
  const hasMore = visibleCandidates < total;
  const showCount = Math.min(visibleCandidates, total);
  const itemsToShow = filtered.slice(0, showCount);

  if (total === 0) {
    list.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:1.5rem;color:var(--text-muted);">No candidates available</td></tr>';
    updateShowMoreButton(0, false);
    return;
  }

  list.innerHTML = itemsToShow.map(a => {
    const assessment = db.assessments?.find(ass =>
      sameId(ass.applicantId, a.id) &&
      sameId(ass.campaignId, a.campaignId)
    );
    const campaign = db.campaigns?.find(c => sameId(c.id, a.campaignId));
    const score = assessment?.overallScore || 'N/A';
    const rec = assessment?.recommendation || 'Not Assessed';

    const recClass = getRecommendationBadgeClass(rec);

    return `
      <tr>
        <td><input type="checkbox" data-applicant-id="${a.id}" /></td>
        <td><a href="../Applicants/applicant-details.html?id=${a.id}" style="color:var(--link-color);text-decoration:none;">${a.fullName}</a></td>
        <td>${campaign?.jobTitle || 'Unknown'}</td>
        <td>${score}</td>
        <td><span class="badge ${recClass} recommendation-preview">${rec}</span></td>
      </tr>
    `;
  }).join('');

  updateShowMoreButton(total, hasMore);
}

// ─── UPDATE SHOW MORE BUTTON (for candidates) ──────────────────
function updateShowMoreButton(total, hasMore) {
  const btn = document.getElementById('show-more-candidates-btn');
  const countSpan = document.getElementById('show-more-candidates-count');
  if (!btn) return;

  if (total === 0) {
    btn.style.display = 'none';
    return;
  }

  btn.style.display = 'inline-flex';

  if (!hasMore) {
    btn.textContent = 'Show All Candidates';
    btn.disabled = true;
    btn.style.opacity = '0.5';
    if (countSpan) countSpan.textContent = `(${total} total)`;
    return;
  }

  btn.textContent = 'Show More Candidates';
  btn.disabled = false;
  btn.style.opacity = '1';
  if (countSpan) {
    const showing = Math.min(visibleCandidates, total);
    countSpan.textContent = `(${showing}/${total})`;
  }
}

// ─── RENDER REPORTS TABLE ────────────────────────────────────────
function renderReports() {
  const list = document.getElementById('reports-list');
  if (!list) return;

  const reports = allReports.filter(report => {
    if (!reportSearchQuery) return true;
    const generatedDate = report.dateGenerated || report.createdAt || '';
    return [
      report.name,
      report.candidateName,
      report.campaignName,
      report.status,
      report.format,
      generatedDate,
      generatedDate ? new Date(generatedDate).toLocaleDateString() : ''
    ].some(value => String(value || '').toLocaleLowerCase().includes(reportSearchQuery));
  });
  const resultsLabel = document.getElementById('report-search-results');
  if (resultsLabel) {
    resultsLabel.textContent = reportSearchQuery
      ? `${reports.length} of ${allReports.length} reports`
      : `${allReports.length} reports`;
  }

  if (reports.length === 0) {
    list.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-muted);">No reports found</td></tr>';
    return;
  }

  list.innerHTML = reports.map(r => {
    const statusClass = getStatusBadgeClass(r.status);

    const date = r.dateGenerated || r.createdAt || 'N/A';
    const displayDate = date !== 'N/A' ? new Date(date).toLocaleDateString() : 'N/A';

    return `
      <tr>
        <td>${r.name}</td>
        <td><a href="../Applicants/applicant-details.html?id=${r.candidateId}" style="color:var(--link-color);text-decoration:none;">${r.candidateName}</a></td>
        <td>${r.campaignName}</td>
        <td>${displayDate}</td>
        <td><span class="badge ${statusClass}">${r.status}</span></td>
        <td>
          <button type="button" class="btn btn-secondary view-report-btn" data-report-id="${r.id}" style="padding:0.2rem 0.8rem;font-size:0.8rem;">View</button>
          <button type="button" class="btn btn-secondary share-report-btn" data-report-id="${r.id}" style="padding:0.2rem 0.8rem;font-size:0.8rem;">Share</button>
        </td>
      </tr>
    `;
  }).join('');
}

// ─── UPDATE STATS ────────────────────────────────────────────────
function updateStats() {
  const reports = allReports;
  const today = new Date().toISOString().split('T')[0];

  const totalEl = document.getElementById('total-reports');
  const todayEl = document.getElementById('reports-today');
  const pendingEl = document.getElementById('pending-reports');
  const sharedEl = document.getElementById('shared-reports');

  if (totalEl) totalEl.textContent = reports.length;
  if (todayEl) todayEl.textContent = reports.filter(r => r.dateGenerated === today).length;
  if (pendingEl) pendingEl.textContent = reports.filter(r => r.status === 'Pending' || r.status === 'Draft').length;
  if (sharedEl) sharedEl.textContent = reports.filter(r => r.status === 'Shared').length;
}

// ─── POPULATE CAMPAIGN DROPDOWN ─────────────────────────────────
async function populateCampaignDropdown() {
  const campaignFilter = document.getElementById('report-campaign-filter');
  if (!campaignFilter) return;

  const campaignItems = campaignFilter.querySelector('.dropdown-items');
  if (!campaignItems) return;

  const campaignNames = await getCampaignNames();
  campaignItems.innerHTML = `
    <div class="dropdown-item active" data-value="all">All Campaigns <span class="check">✓</span></div>
    ${campaignNames.map(c =>
      `<div class="dropdown-item" data-value="${c.id}">${c.name} (${c.client}) <span class="check">✓</span></div>`
    ).join('')}
  `;

  campaignFilter.addEventListener('dropdownChange', () => {
    visibleCandidates = 5;
    renderCandidates();
  });
}

// ─── SETUP CLEAR SELECTION ──────────────────────────────────────
function setupClearSelection() {
  const btn = document.getElementById('clear-selection-btn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const checkboxes = document.querySelectorAll('#candidate-selection-list input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
    const selectAll = document.getElementById('select-all-candidates');
    if (selectAll) selectAll.checked = false;
  });
}

// ─── SETUP SELECT ALL ────────────────────────────────────────────
function setupSelectAll() {
  const selectAll = document.getElementById('select-all-candidates');
  if (!selectAll) return;

  selectAll.addEventListener('change', function() {
    const checkboxes = document.querySelectorAll('#candidate-selection-list input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = this.checked);
  });
}

// ─── SETUP GENERATE REPORT ──────────────────────────────────────
function setupGenerateReport() {
  const btn = document.getElementById('generate-report-btn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const selected = document.querySelectorAll('#candidate-selection-list input[type="checkbox"]:checked');
    if (selected.length === 0) {
      showToast('Please select at least one candidate.', 'warning');
      return;
    }

    const branding = document.getElementById('report-branding')?.dataset?.value || 'standard';
    const format = document.getElementById('report-format')?.dataset?.value || 'pdf';
    const includeCV = document.getElementById('include-cv')?.checked || false;
    const includeCoverLetter = document.getElementById('include-cover-letter')?.checked || false;
    const includeNotes = document.getElementById('include-notes')?.checked || false;

    const candidateNames = Array.from(selected).map(cb => {
      const tr = cb.closest('tr');
      const nameCell = tr?.querySelector('td:nth-child(2) a');
      return nameCell?.textContent || 'Unknown';
    });

    showToast(`Generating ${format.toUpperCase()} report for ${candidateNames.length} candidate(s)...`, 'info');

    // Simulate report generation
    setTimeout(() => {
      showToast(`Report generated successfully!`, 'success');
      // In a real app, you'd add the report to the database and refresh
    }, 1500);
  });
}

// ─── SETUP PREVIEW ──────────────────────────────────────────────
function setupPreview() {
  const btn = document.getElementById('preview-report-btn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const selected = document.querySelectorAll('#candidate-selection-list input[type="checkbox"]:checked');
    if (selected.length === 0) {
      showToast('Please select at least one candidate to preview.', 'warning');
      return;
    }
    showToast('Preview functionality will open a modal with the report preview.', 'info');
  });
}

// ─── SETUP SHOW MORE (for candidates) ──────────────────────────
function setupShowMore() {
  const btn = document.getElementById('show-more-candidates-btn');
  if (btn) {
    btn.addEventListener('click', () => {
      visibleCandidates += BATCH_SIZE;
      renderCandidates();
    });
  }
}

// ─── LISTEN FOR CHECKBOX CHANGES ───────────────────────────────
function setupCheckboxListeners() {
  document.addEventListener('change', function(e) {
    if (e.target.closest('#candidate-selection-list input[type="checkbox"]')) {
      const checkboxes = document.querySelectorAll('#candidate-selection-list input[type="checkbox"]');
      const checked = document.querySelectorAll('#candidate-selection-list input[type="checkbox"]:checked');
      const selectAll = document.getElementById('select-all-candidates');
      if (selectAll) {
        selectAll.checked = checkboxes.length > 0 && checkboxes.length === checked.length;
      }
    }
  });
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────
function setupCandidateSearch() {
  const input = document.getElementById('candidate-report-search');
  const clearButton = document.getElementById('candidate-report-search-clear');
  if (!input) return;
  const clear = () => {
    input.value = '';
    candidateSearchQuery = '';
    visibleCandidates = 5;
    if (clearButton) clearButton.style.display = 'none';
    renderCandidates();
  };
  input.addEventListener('input', () => {
    candidateSearchQuery = input.value.trim().toLocaleLowerCase();
    visibleCandidates = 5;
    if (clearButton) clearButton.style.display = candidateSearchQuery ? 'block' : 'none';
    renderCandidates();
  });
  clearButton?.addEventListener('click', () => { clear(); input.focus(); });
  input.addEventListener('keydown', event => {
    if (event.key === 'Escape' && input.value) clear();
  });
}

function setupReportActions() {
  const list = document.getElementById('reports-list');
  const viewModal = document.getElementById('report-view-modal');
  const shareModal = document.getElementById('report-share-modal');
  const shareForm = document.getElementById('report-share-form');
  let lastFocused = null;

  const closeModal = modal => {
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = '';
    lastFocused?.focus?.();
  };
  const openModal = modal => {
    if (!modal) return;
    lastFocused = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => modal.querySelector('button, input, textarea')?.focus());
  };
  const findReport = id => allReports.find(report => Number(report.id) === Number(id));

  function openShare(report) {
    if (!report || !shareModal) return;
    activeReportId = report.id;
    shareModal.querySelector('[data-share-report-name]').textContent = report.name || 'Client Report';
    const link = document.getElementById('report-share-link');
    if (link) link.value = new URL(`../Reports/client-reports.html?report=${encodeURIComponent(report.id)}`, location.href).href;
    document.getElementById('report-share-email').value = '';
    document.getElementById('report-share-message').value = '';
    closeModal(viewModal);
    openModal(shareModal);
  }

  function openView(report) {
    if (!report || !viewModal) return;
    activeReportId = report.id;
    const applicant = db.applicants?.find(item => Number(item.id) === Number(report.candidateId));
    const assessment = db.assessments?.find(item => Number(item.applicantId) === Number(report.candidateId));
    viewModal.querySelector('[data-view-report-name]').textContent = report.name || 'Client Report';
    viewModal.querySelector('[data-view-report-status]').textContent = report.status || 'Unknown';
    const candidateLink = viewModal.querySelector('[data-view-candidate-link]');
    candidateLink.textContent = report.candidateName || applicant?.fullName || 'Unknown';
    candidateLink.href = `../Applicants/applicant-details.html?id=${encodeURIComponent(report.candidateId)}`;
    viewModal.querySelector('[data-view-campaign]').textContent = report.campaignName || 'Unknown';
    const date = report.dateGenerated || report.createdAt;
    viewModal.querySelector('[data-view-date]').textContent = date ? new Date(date).toLocaleDateString() : 'N/A';
    viewModal.querySelector('[data-view-format]').textContent = report.format || 'PDF';
    viewModal.querySelector('[data-view-summary]').textContent = assessment?.executiveSummary ||
      `Client-ready candidate submission for ${report.candidateName || 'this applicant'}, prepared for the ${report.campaignName || 'selected'} campaign.`;
    openModal(viewModal);
  }

  list?.addEventListener('click', event => {
    const viewButton = event.target.closest('.view-report-btn');
    const shareButton = event.target.closest('.share-report-btn');
    if (viewButton) openView(findReport(viewButton.dataset.reportId));
    if (shareButton) openShare(findReport(shareButton.dataset.reportId));
  });
  document.querySelectorAll('[data-close-report-modal]').forEach(button => {
    button.addEventListener('click', () => closeModal(button.closest('.report-action-modal')));
  });
  [viewModal, shareModal].forEach(modal => {
    modal?.addEventListener('click', event => { if (event.target === modal) closeModal(modal); });
  });
  viewModal?.querySelector('[data-view-share]')?.addEventListener('click', () => openShare(findReport(activeReportId)));
  document.getElementById('copy-report-link')?.addEventListener('click', async () => {
    const link = document.getElementById('report-share-link')?.value || '';
    try {
      await navigator.clipboard.writeText(link);
      showToast('Report link copied.', 'success');
    } catch {
      showToast('Copy the selected report link manually.', 'info');
      document.getElementById('report-share-link')?.select();
    }
  });
  shareForm?.addEventListener('submit', event => {
    event.preventDefault();
    const report = findReport(activeReportId);
    const recipient = document.getElementById('report-share-email').value.trim();
    if (!shareForm.checkValidity()) {
      shareForm.reportValidity();
      return;
    }
    showToast(`${report?.name || 'Report'} shared with ${recipient}.`, 'success');
    closeModal(shareModal);
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (!shareModal?.hidden) closeModal(shareModal);
    else if (!viewModal?.hidden) closeModal(viewModal);
  });
}

export default async function initReports() {
  try {
    db = await loadDatabase();
    if (!db) {
      showToast('Error loading report data', 'error');
      return;
    }

    // Set recruiter name
    const nameEl = document.getElementById('recruiter-name');
    if (nameEl && db.users?.length) {
      nameEl.textContent = db.users[0].fullName;
    }

    allCandidates = db.applicants || [];
    allReports = db.reports || [];

    // Update stats
    updateStats();

    // Populate campaign dropdown
    await populateCampaignDropdown();

    // Setup UI
    setupClearSelection();
    setupSelectAll();
    setupGenerateReport();
    setupPreview();
    setupShowMore();
    setupCheckboxListeners();
    setupReportSearch();
    setupCandidateSearch();
    setupReportActions();

    // Initial renders
    renderCandidates();
    renderReports();

    console.log('✅ Reports loaded successfully:', {
      candidates: allCandidates.length,
      reports: allReports.length
    });

  } catch (error) {
    console.error('Reports error:', error);
    showToast('Error loading reports', 'error');
    throw error;
  }
}

function setupReportSearch() {
  const input = document.getElementById('report-search');
  const clearButton = document.getElementById('report-search-clear');
  if (!input) return;

  const clearSearch = () => {
    input.value = '';
    reportSearchQuery = '';
    if (clearButton) clearButton.style.display = 'none';
    renderReports();
  };

  input.addEventListener('input', () => {
    reportSearchQuery = input.value.trim().toLocaleLowerCase();
    if (clearButton) clearButton.style.display = reportSearchQuery ? 'block' : 'none';
    renderReports();
  });
  clearButton?.addEventListener('click', () => {
    clearSearch();
    input.focus();
  });
  input.addEventListener('keydown', event => {
    if (event.key === 'Escape' && input.value) clearSearch();
  });
}
