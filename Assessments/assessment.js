// ============================================================
// ASSESSMENTS – Loads and displays assessment list with "Show More"
// ============================================================

import { loadDatabase, sameId, getRecommendationBadgeClass } from '../Assets/js/dataService.js';
import { showToast } from '../Assets/js/toast.js';

let allAssessments = [];
let visibleCount = 5;
const BATCH_SIZE = 5;
let db = null;
const NOT_ASSESSED_FILTER = '__not_assessed__';

function recommendationCategoryFromValue(value) {
  const recommendation = String(value || '').trim().toLowerCase();
  if (!recommendation || /^(not assessed|n\/?a)$/i.test(recommendation)) return { value: NOT_ASSESSED_FILTER, label: 'Not Assessed', rank: 0 };
  if (recommendation.includes('excellent') || recommendation.includes('exceptional') || recommendation.includes('highly recommended')) return { value: 'excellent', label: 'Excellent', rank: 6 };
  if (recommendation.includes('qualified')) return { value: 'qualified', label: 'Qualified', rank: 5 };
  if (recommendation.includes('conditional') || recommendation.includes('worth interviewing') || recommendation.includes('worth interview')) return { value: 'conditional', label: 'Conditional', rank: 3 };
  if (recommendation.includes('strong')) return { value: 'strong', label: 'Strong', rank: 4 };
  if (recommendation.includes('possible')) return { value: 'possible', label: 'Possible', rank: 2 };
  if (recommendation.includes('not recommended') || recommendation.includes('reject') || recommendation.includes('unsuitable')) return { value: 'not_recommended', label: 'Not Recommended', rank: 1 };
  return { value: 'other', label: 'Other', rank: 1 };
}

// ─── RENDER ASSESSMENTS ──────────────────────────────────────────
function renderAssessments() {
  const list = document.getElementById('assessments-list');
  if (!list) return;

  const searchInput = document.getElementById('search-assessment');
  const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';

  let filtered = [...allAssessments];

  if (searchQuery) {
    filtered = filtered.filter(a => {
      const applicant = db.applicants?.find(app => sameId(app.id, a.applicantId));
      const campaign = db.campaigns?.find(c => sameId(c.id, a.campaignId));
      const candidateName = applicant?.fullName || '';
      const campaignName = campaign?.jobTitle || '';
      return candidateName.toLowerCase().includes(searchQuery) ||
             campaignName.toLowerCase().includes(searchQuery) ||
             String(a.recommendation || '').toLowerCase().includes(searchQuery);
    });
  }

  const recommendationFilter = document.getElementById('assessment-filter')?.dataset.value || 'all';
  if (recommendationFilter !== 'all') filtered = filtered.filter(assessment => recommendationCategoryFromValue(assessment.recommendation).value === recommendationFilter);

  const sort = document.getElementById('assessment-sort')?.dataset.value || 'date-desc';
  filtered.sort((left, right) => {
    const leftApplicant = db.applicants?.find(item => sameId(item.id, left.applicantId));
    const rightApplicant = db.applicants?.find(item => sameId(item.id, right.applicantId));
    const leftCampaign = db.campaigns?.find(item => sameId(item.id, left.campaignId));
    const rightCampaign = db.campaigns?.find(item => sameId(item.id, right.campaignId));
    if (sort === 'date-asc') return (Date.parse(left.assessedDate) || 0) - (Date.parse(right.assessedDate) || 0);
    if (sort === 'score-desc') return (Number(right.overallScore) || 0) - (Number(left.overallScore) || 0);
    if (sort === 'score-asc') return (Number(left.overallScore) || 0) - (Number(right.overallScore) || 0);
    if (sort === 'candidate-asc') return (leftApplicant?.fullName || '').localeCompare(rightApplicant?.fullName || '');
    if (sort === 'campaign-asc') return (leftCampaign?.jobTitle || '').localeCompare(rightCampaign?.jobTitle || '');
    return (Date.parse(right.assessedDate) || 0) - (Date.parse(left.assessedDate) || 0);
  });

  const total = filtered.length;
  const hasMore = visibleCount < total;
  const showCount = Math.min(visibleCount, total);
  const itemsToShow = filtered.slice(0, showCount);

  if (total === 0) {
    list.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-muted);">No assessments found</td></tr>';
    updateShowMoreButton(0, false);
    return;
  }

  list.innerHTML = itemsToShow.map(a => {
    const applicant = db.applicants?.find(app => sameId(app.id, a.applicantId));
    const campaign = db.campaigns?.find(c => sameId(c.id, a.campaignId));
    const candidateName = applicant?.fullName || 'Unknown';
    const campaignName = campaign?.jobTitle || 'Unknown';

    const recClass = getRecommendationBadgeClass(a.recommendation);

    const date = a.assessedDate || 'N/A';
    const displayDate = date !== 'N/A' ? new Date(date).toLocaleDateString() : 'N/A';

    return `
      <tr>
        <td><a href="../Applicants/applicant-details.html?id=${a.applicantId}" style="color:var(--link-color);text-decoration:none;">${candidateName}</a></td>
        <td><a href="../Campaign/campaign-details.html?id=${a.campaignId}" style="color:var(--link-color);text-decoration:none;">${campaignName}</a></td>
        <td><strong>${a.overallScore}</strong></td>
        <td><span class="badge ${recClass} recommendation-preview">${a.recommendation}</span></td>
        <td>${displayDate}</td>
        <td>
          <a href="../Applicants/applicant-details.html?id=${a.applicantId}" class="btn btn-secondary" style="padding:0.2rem 0.8rem;font-size:0.8rem;">View</a>
        </td>
      </tr>
    `;
  }).join('');

  updateShowMoreButton(total, hasMore);
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

// ─── UPDATE STATS ────────────────────────────────────────────────
function updateStats() {
  const assessments = allAssessments;

  const totalEl = document.getElementById('total-assessments');
  const qualifiedEl = document.getElementById('qualified-match');
  const strongEl = document.getElementById('strong-match');
  const avgEl = document.getElementById('avg-assessment-score');

  if (totalEl) totalEl.textContent = assessments.length;
  if (qualifiedEl) {
    qualifiedEl.textContent = assessments.filter(a =>
      recommendationCategoryFromValue(a.recommendation).value === 'qualified'
    ).length;
  }
  if (strongEl) {
    strongEl.textContent = assessments.filter(a =>
      recommendationCategoryFromValue(a.recommendation).value === 'strong'
    ).length;
  }

  const avg = assessments.length > 0
    ? Math.round(assessments.reduce((sum, a) => sum + a.overallScore, 0) / assessments.length)
    : 0;
  if (avgEl) avgEl.textContent = avg;
}

// ─── SETUP SEARCH ────────────────────────────────────────────────
function setupSearch() {
  const searchInput = document.getElementById('search-assessment');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      visibleCount = 5;
      renderAssessments();
    });
  }
}

// ─── SETUP SHOW MORE ─────────────────────────────────────────────
function setupShowMore() {
  const btn = document.getElementById('show-more-btn');
  if (btn) {
    btn.addEventListener('click', () => {
      visibleCount += BATCH_SIZE;
      renderAssessments();
    });
  }
}

// ─── SETUP NEW ASSESSMENT BUTTON ─────────────────────────────────
// ─── MAIN EXPORT ──────────────────────────────────────────────────
export default async function initAssessments() {
  try {
    db = await loadDatabase();
    if (!db) {
      showToast('Error loading assessment data', 'error');
      return;
    }

    // Set recruiter name
    const nameEl = document.getElementById('recruiter-name');
    if (nameEl && db.users?.length) {
      nameEl.textContent = db.users[0].fullName;
    }

    allAssessments = db.assessments || [];

    // Update stats
    updateStats();

    // Setup search, show more, new button
    setupSearch();
    setupSortAndFilter();
    setupShowMore();

    // Initial render
    renderAssessments();

    console.log('✅ Assessments loaded successfully:', allAssessments.length);

  } catch (error) {
    console.error('Assessments error:', error);
    showToast('Error loading assessments', 'error');
    throw error;
  }
}

function setupSortAndFilter() {
  const filter = document.getElementById('assessment-filter');
  const items = filter?.querySelector('.dropdown-items');
  const categories = new Map();
  allAssessments.forEach(assessment => {
    const category = recommendationCategoryFromValue(assessment.recommendation);
    const current = categories.get(category.value) || { ...category, count: 0 };
    current.count += 1;
    categories.set(category.value, current);
  });
  [...categories.values()]
    .sort((a, b) => b.rank - a.rank || a.label.localeCompare(b.label))
    .forEach(category => {
      const item = document.createElement('div');
      item.className = 'dropdown-item';
      item.dataset.value = category.value;
      item.textContent = category.label;
      const count = document.createElement('small');
      count.textContent = category.count;
      item.appendChild(count);
      items?.appendChild(item);
    });
  [filter, document.getElementById('assessment-sort')].forEach(control => {
    control?.addEventListener('dropdownChange', () => {
      visibleCount = BATCH_SIZE;
      renderAssessments();
    });
  });
}
