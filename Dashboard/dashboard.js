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
    window.location.href = '/Login/login.html';
    return false;
  }
  return true;
}

function renderStats(db) {
  const campaigns = db?.campaigns || [];
  const applicants = db?.applicants || [];
  const assessments = db?.assessments || [];

  const activeCampaigns = campaigns.filter(
    campaign => String(campaign.status || '').toLowerCase() === 'active'
  );
  const awaitingReview = applicants.filter(applicant =>
    !assessments.some(assessment =>
      sameId(assessment.applicantId, applicant.id) &&
      sameId(assessment.campaignId, applicant.campaignId)
    )
  ).length;
  const strongRecommendations = assessments.filter(assessment =>
    assessment.recommendation === 'Excellent Match' ||
    assessment.recommendation === 'Strong Match'
  ).length;
  const numericScores = assessments
    .map(assessment => Number(assessment.overallScore))
    .filter(Number.isFinite);
  const averageScore = numericScores.length
    ? Math.round(numericScores.reduce((sum, score) => sum + score, 0) / numericScores.length)
    : 0;

  document.getElementById('total-campaigns').textContent = activeCampaigns.length;
  document.getElementById('total-applicants').textContent = applicants.length;
  document.getElementById('awaiting-review').textContent = awaitingReview;
  document.getElementById('shortlisted').textContent = strongRecommendations;
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
      <td><a href="/Campaign/campaign-details.html?id=${campaign.id}" style="color:var(--link-color);text-decoration:none;">${campaign.jobTitle}</a></td>
      <td>${campaign.clientName}</td>
      <td><span class="badge ${getStatusBadgeClass(campaign.status)}">${campaign.status}</span></td>
      <td>${applicants.length}</td>
      <td>${average}</td>
    </tr>`;
  }).join('');
}

async function renderTopCandidates() {
  const list = document.getElementById('top-candidates');
  if (!list) return;

  const candidates = await getRankedApplicants('all');
  if (!candidates.length) {
    list.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:2rem;color:var(--text-muted);">No ranked candidates</td></tr>';
    return;
  }

  list.innerHTML = candidates.slice(0, 5).map((candidate, index) => `<tr>
    <td><strong>#${index + 1}</strong></td>
    <td><a href="/Applicants/applicant-details.html?id=${candidate.id}" style="color:var(--link-color);text-decoration:none;">${candidate.fullName}</a></td>
    <td>${candidate.score}</td>
    <td>${candidate.campaignName}</td>
  </tr>`).join('');
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
    await renderTopCandidates();
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
