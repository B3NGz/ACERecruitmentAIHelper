// ============================================================
// DASHBOARD – Backend-backed summary and tables
// ============================================================

import {
  loadDatabase,
  getRankedApplicants,
  getStatusBadgeClass,
  sameId
} from '../Assets/js/dataService.js';

function requireAuthentication() {
  if (!localStorage.getItem('token')) {
    window.location.href = '../Login/login.html';
    return false;
  }
  return true;
}

function getRecommendationCategory(value) {
  const recommendation = String(value || '').trim().toLowerCase();
  if (!recommendation || /^(not assessed|n\/?a)$/i.test(recommendation)) return 'not_assessed';
  if (recommendation.includes('conditional') || recommendation.includes('worth interviewing') || recommendation.includes('worth interview')) return 'conditional';
  if (recommendation.includes('qualified')) return 'qualified';
  if (recommendation.includes('strong')) return 'strong';
  return 'other';
}

function renderStats(db) {
  const campaigns = db?.campaigns || [];
  const applicants = db?.applicants || [];
  const assessments = db?.assessments || [];

  const activeCampaigns = campaigns.filter(
    campaign => String(campaign.status || '').toLowerCase() === 'active'
  );
  const qualifiedRecommendations = assessments.filter(assessment =>
    getRecommendationCategory(assessment.recommendation) === 'qualified'
  ).length;
  const strongRecommendations = assessments.filter(assessment =>
    getRecommendationCategory(assessment.recommendation) === 'strong'
  ).length;
  const numericScores = assessments
    .map(assessment => Number(assessment.overallScore))
    .filter(Number.isFinite);
  const averageScore = numericScores.length
    ? Math.round(numericScores.reduce((sum, score) => sum + score, 0) / numericScores.length)
    : 0;

  document.getElementById('total-campaigns').textContent = activeCampaigns.length;
  document.getElementById('total-applicants').textContent = applicants.length;
  document.getElementById('qualified-recommendations').textContent = qualifiedRecommendations;
  document.getElementById('strong-recommendations').textContent = strongRecommendations;
  document.getElementById('avg-score').textContent = averageScore;
}

function renderActiveCampaigns(db) {
  const list = document.getElementById('campaign-list');
  if (!list) return;

  const activeCampaigns = (db.campaigns || []).filter(
    campaign => String(campaign.status || '').toLowerCase() === 'active'
  );

  if (!activeCampaigns.length) {
    list.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--text-muted);">No active campaigns</td></tr>';
    return;
  }

  list.innerHTML = activeCampaigns.map(campaign => {
    const applicants = db.applicants.filter(applicant =>
      sameId(applicant.campaignId, campaign.id)
    );
    const scores = db.assessments
      .filter(assessment => sameId(assessment.campaignId, campaign.id))
      .map(assessment => Number(assessment.overallScore))
      .filter(Number.isFinite);
    const average = scores.length
      ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
      : 'N/A';

    return `<tr>
      <td><a href="https://b3ngz.github.io/ACERecruitmentAIHelper/Campaign/campaign-details.html?id=${campaign.id}" style="color:var(--link-color);text-decoration:none;">${campaign.jobTitle}</a></td>
      <td>${campaign.clientName}</td>
      <td><span class="badge ${getStatusBadgeClass(campaign.status)}">${campaign.status}</span></td>
      <td>${applicants.length}</td>
      <td>${average}</td>
    </tr>`;
  }).join('');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function renderTopCandidates(campaignId) {
  const list = document.getElementById('top-candidates');
  if (!list) return;

  if (!campaignId) {
    list.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:2rem;color:var(--text-muted);">Choose a campaign to view its rankings</td></tr>';
    return;
  }

  const candidates = (await getRankedApplicants(campaignId)).filter(candidate =>
    candidate.assessment && Number.isFinite(Number(candidate.assessment.overallScore))
  );
  if (!candidates.length) {
    list.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:2rem;color:var(--text-muted);">No assessed candidates are ranked for this campaign</td></tr>';
    return;
  }

  list.innerHTML = candidates.slice(0, 5).map((candidate, index) => `<tr>
    <td><strong>#${index + 1}</strong></td>
    <td><a href="../Applicants/applicant-details.html?id=${encodeURIComponent(candidate.id)}" style="color:var(--link-color);text-decoration:none;">${escapeHtml(candidate.fullName)}</a></td>
    <td>${candidate.score}</td>
    <td>${escapeHtml(candidate.campaignName)}</td>
  </tr>`).join('');
}

async function setupTopCandidateCampaigns(db) {
  const dropdown = document.getElementById('dashboard-ranking-campaign');
  const items = dropdown?.querySelector('.dropdown-items');
  const selectedText = dropdown?.querySelector('.selected-text');
  if (!dropdown || !items || !selectedText) return;

  const rankedCampaigns = (db.campaigns || []).filter(campaign =>
    (db.assessments || []).some(assessment => sameId(assessment.campaignId, campaign.id))
  );

  if (!rankedCampaigns.length) {
    selectedText.textContent = 'No campaigns with rankings';
    dropdown.querySelector('.dropdown-btn')?.setAttribute('disabled', '');
    await renderTopCandidates('');
    return;
  }

  const selectedCampaign = rankedCampaigns.find(campaign =>
    String(campaign.status || '').toLowerCase() === 'active'
  ) || rankedCampaigns[0];

  dropdown.dataset.value = String(selectedCampaign.id);
  selectedText.textContent = selectedCampaign.jobTitle || 'Untitled campaign';
  items.innerHTML = rankedCampaigns.map(campaign => {
    const count = (db.assessments || []).filter(assessment => sameId(assessment.campaignId, campaign.id)).length;
    const active = sameId(campaign.id, selectedCampaign.id) ? ' active' : '';
    return `<div class="dropdown-item${active}" data-value="${escapeHtml(campaign.id)}">${escapeHtml(campaign.jobTitle || 'Untitled campaign')} <small>${count}</small></div>`;
  }).join('');

  dropdown.addEventListener('dropdownChange', event => {
    renderTopCandidates(event.detail.value).catch(error => console.error('Ranking filter error:', error));
  });
  await renderTopCandidates(selectedCampaign.id);
}

function updateUserName() {
  const nameElement = document.getElementById('recruiter-name');
  if (!nameElement) return;

  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    nameElement.textContent = user?.fullName || 'Recruiter';
  } catch {
    nameElement.textContent = 'Recruiter';
  }
}

export default async function initDashboard() {
  if (!requireAuthentication()) return;

  try {
    updateUserName();
    const db = await loadDatabase();
    if (!db) throw new Error('No database loaded.');

    renderStats(db);
    renderActiveCampaigns(db);
    await setupTopCandidateCampaigns(db);
    console.log('✅ Dashboard loaded successfully');
  } catch (error) {
    console.error('Dashboard error:', error);
    const campaignList = document.getElementById('campaign-list');
    const topCandidates = document.getElementById('top-candidates');
    if (campaignList) {
      campaignList.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--text-muted);">No data available</td></tr>';
    }
    if (topCandidates) {
      topCandidates.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:2rem;color:var(--text-muted);">No candidates</td></tr>';
    }
  }
}
