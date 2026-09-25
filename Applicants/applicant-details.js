// ============================================================
// APPLICANT DETAILS – Loads and displays full applicant profile
// ============================================================

import {
  loadDatabase,
  getApplicantById,
  getAssessmentByApplicantAndCampaign,
  getHrAssessmentsByApplicant,
  createHrAssessment,
  getCampaignById,
  getRecommendationBadgeClass,
  updateApplicant,
  sameId
} from '../Assets/js/dataService.js';
import { showToast } from '../Assets/js/toast.js';

let currentApplicant = null;
let currentCampaign = null;
let currentAssessment = null;
let currentHrAssessments = [];
let isSubmittingHrAssessment = false;
let db = null;

function normalizeExternalUrl(value) {
  const url = String(value || '').trim();
  if (!url) return '';
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getCurrentUserDisplayName() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?.fullName ?? user?.name ?? user?.displayName ?? user?.email ?? '';
  } catch {
    return '';
  }
}

function setupAddHrAssessmentModal(applicant, campaign) {
  const openButton = document.getElementById('add-hr-assessment-btn');
  const modal = document.getElementById('add-hr-assessment-modal');
  const form = document.getElementById('add-hr-assessment-form');
  const context = document.getElementById('add-hr-assessment-context');
  const submitButton = document.getElementById('submit-add-hr-assessment');
  const errorMessage = document.getElementById('add-hr-assessment-error');
  const closeButtons = document.querySelectorAll('#close-add-hr-assessment, #cancel-add-hr-assessment');
  if (!openButton || !modal || !form || !context) return;

  const closeModal = () => {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  };

  const openModal = () => {
    const assessedBy = getCurrentUserDisplayName();
    const assessedAt = new Date().toISOString();
    form.dataset.applicantId = applicant.id;
    form.dataset.campaignId = campaign?.id || applicant.campaignId;
    form.dataset.assessedBy = assessedBy;
    form.dataset.assessedAt = assessedAt;
    form.dataset.updatedAt = assessedAt;
    if (errorMessage) {
      errorMessage.textContent = '';
      errorMessage.style.display = 'none';
    }
    context.textContent = `Applicant: ${applicant.fullName || applicant.id} · Campaign: ${campaign?.jobTitle || applicant.campaignId || 'Unavailable'} · Assessor: ${assessedBy || 'Unavailable'}`;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    document.getElementById('add-hr-score')?.focus();
  };

  if (!openButton.dataset.bound) {
    openButton.dataset.bound = 'true';
    openButton.addEventListener('click', openModal);
    closeButtons.forEach(button => button.addEventListener('click', closeModal));
    modal.addEventListener('click', event => {
      if (event.target === modal) closeModal();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && modal.style.display === 'flex') closeModal();
    });
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (isSubmittingHrAssessment || !form.reportValidity()) return;

      const hrScore = Number(document.getElementById('add-hr-score')?.value);
      if (!Number.isFinite(hrScore) || hrScore < 0 || hrScore > 100) {
        if (errorMessage) {
          errorMessage.textContent = 'Enter an HR score from 0 to 100.';
          errorMessage.style.display = 'block';
        }
        return;
      }

      const payload = {
        applicantId: form.dataset.applicantId,
        campaignId: form.dataset.campaignId,
        assessmentNotes: document.getElementById('add-hr-notes')?.value.trim() || '',
        hrScore,
        hrComment: document.getElementById('add-hr-comment')?.value.trim() || '',
        assessedBy: form.dataset.assessedBy || '',
        assessedAt: form.dataset.assessedAt,
        updatedAt: form.dataset.updatedAt
      };

      isSubmittingHrAssessment = true;
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.setAttribute('aria-busy', 'true');
        submitButton.textContent = 'Saving…';
      }
      if (errorMessage) {
        errorMessage.textContent = '';
        errorMessage.style.display = 'none';
      }

      try {
        await createHrAssessment(payload);
        form.reset();
        closeModal();
        showToast('HR assessment saved successfully.', 'success');
        await loadHrAssessments(applicant.id);
      } catch (error) {
        console.error('Failed to save HR assessment:', error);
        if (errorMessage) {
          errorMessage.textContent = error.message || 'Unable to save the HR assessment. Please try again.';
          errorMessage.style.display = 'block';
        }
      } finally {
        isSubmittingHrAssessment = false;
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.setAttribute('aria-busy', 'false');
          submitButton.textContent = 'Save Assessment';
        }
      }
    });
  }
}

function formatAssessmentDate(value) {
  if (!value) return '—';

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

function renderHrAssessmentTable() {
  const list = document.getElementById('hr-assessment-list');
  const status = document.getElementById('hr-assessment-status');
  const average = document.getElementById('hr-assessment-average');
  if (!list) return;

  const scores = currentHrAssessments
    .map(assessment => assessment.hrScore)
    .filter(Number.isFinite);
  const averageScore = scores.length
    ? scores.reduce((total, score) => total + score, 0) / scores.length
    : null;

  if (average) {
    average.textContent = averageScore === null
      ? 'No HR score available'
      : (Number.isInteger(averageScore) ? String(averageScore) : averageScore.toFixed(1));
  }

  if (currentHrAssessments.length === 0) {
    list.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-muted);">No HR assessments have been recorded for this applicant.</td></tr>';
    if (status) status.textContent = 'No HR assessments have been recorded for this applicant.';
    return;
  }

  list.innerHTML = currentHrAssessments.map(assessment => `
    <tr>
      <td>${escapeHtml(assessment.assessedBy || 'Not specified')}</td>
      <td><strong>${Number.isFinite(assessment.hrScore) ? assessment.hrScore : '—'}</strong></td>
      <td style="white-space:pre-wrap;min-width:180px;">${escapeHtml(assessment.assessmentNotes || '—')}</td>
      <td style="white-space:pre-wrap;min-width:180px;">${escapeHtml(assessment.hrComment || '—')}</td>
      <td>${escapeHtml(formatAssessmentDate(assessment.assessedAt))}</td>
      <td>${escapeHtml(formatAssessmentDate(assessment.updatedAt))}</td>
    </tr>`).join('');

  if (status) {
    status.textContent = `${currentHrAssessments.length} HR assessment${currentHrAssessments.length === 1 ? '' : 's'} loaded.${scores.length ? '' : ' No HR score is available.'}`;
  }
}

async function loadHrAssessments(applicantId) {
  const list = document.getElementById('hr-assessment-list');
  const status = document.getElementById('hr-assessment-status');
  if (list) {
    list.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-muted);">Loading HR assessments…</td></tr>';
  }
  if (status) status.textContent = 'Loading HR assessments…';
  const average = document.getElementById('hr-assessment-average');
  if (average) average.textContent = 'Loading…';

  try {
    const assessments = await getHrAssessmentsByApplicant(applicantId);
    currentHrAssessments = assessments;

    renderHrAssessmentTable();
  } catch (error) {
    console.error('Failed to load HR assessments:', error);
    currentHrAssessments = [];
    if (average) average.textContent = 'Unavailable';

    if (list) {
      const isNetworkError = error instanceof TypeError;
      list.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--clr-charcoal);">${escapeHtml(
        isNetworkError
          ? 'Network error while loading HR assessments. Please try again.'
          : (error.message || 'Unable to load HR assessments.')
      )}</td></tr>`;
    }
    if (status) status.textContent = 'Unable to load HR assessments.';

    showToast(error.message || 'Unable to load HR assessments.', 'error');
  }
}

// ─── POPULATE APPLICANT INFO ────────────────────────────────────
function populateApplicantInfo(applicant, campaign) {
  const fields = {
    'applicant-name': applicant.fullName,
    'applicant-email': applicant.email,
    'applicant-phone': applicant.phone,
    'applicant-country': applicant.country,
    'applicant-position': applicant.currentPosition,
    'applicant-experience': applicant.yearsExperience + ' yrs',
    'applicant-salary': applicant.expectedSalary,
    'applicant-availability': applicant.availability,
    'applicant-campaign': campaign?.jobTitle || 'Unknown'
  };

  Object.entries(fields).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value || 'N/A';
  });

  // LinkedIn
  const linkedinEl = document.getElementById('applicant-linkedin');
  if (linkedinEl) {
    if (applicant.linkedin) {
      linkedinEl.href = 'https://' + applicant.linkedin;
      linkedinEl.textContent = 'View Profile';
      linkedinEl.style.color = 'var(--clr-maya-blue)';
    } else {
      linkedinEl.textContent = 'Not provided';
      linkedinEl.href = '#';
      linkedinEl.style.color = 'var(--text-muted)';
    }
  }

  // Portfolio
  const portfolioEl = document.getElementById('applicant-portfolio');
  const portfolioUrlEl = document.getElementById('applicant-portfolio-url');
  if (portfolioEl) {
    if (applicant.portfolio) {
      const portfolioUrl = normalizeExternalUrl(applicant.portfolio);
      portfolioEl.href = portfolioUrl;
      portfolioEl.textContent = 'Open Portfolio';
      portfolioEl.target = '_blank';
      portfolioEl.rel = 'noopener noreferrer';
      portfolioEl.style.color = 'var(--clr-maya-blue)';
      if (portfolioUrlEl) portfolioUrlEl.textContent = applicant.portfolio;
    } else {
      portfolioEl.textContent = 'Not provided';
      portfolioEl.removeAttribute('href');
      portfolioEl.style.color = 'var(--text-muted)';
      if (portfolioUrlEl) portfolioUrlEl.textContent = 'No portfolio URL provided';
    }
  }

  const cvEl = document.getElementById('view-cv-link-btn');
  const cvUrlEl = document.getElementById('applicant-cv-url');
  if (cvEl) {
    if (applicant.cvUrl) {
      cvEl.href = normalizeExternalUrl(applicant.cvUrl);
      cvEl.target = '_blank';
      cvEl.rel = 'noopener noreferrer';
      cvEl.removeAttribute('aria-disabled');
      if (cvUrlEl) cvUrlEl.textContent = applicant.cvUrl;
    } else {
      cvEl.removeAttribute('href');
      cvEl.setAttribute('aria-disabled', 'true');
      cvEl.classList.add('is-disabled');
      if (cvUrlEl) cvUrlEl.textContent = 'No CV URL provided';
    }
  }
}

// ─── POPULATE ASSESSMENT ────────────────────────────────────────
function populateAssessment(assessment, applicant) {
  if (!assessment) {
    const scoreEl = document.getElementById('applicant-score');
    if (scoreEl) scoreEl.textContent = 'N/A';

    const recEl = document.getElementById('applicant-recommendation');
    if (recEl) {
      recEl.textContent = 'Not Assessed';
      recEl.className = 'badge badge-draft';
    }

    const summaryEl = document.getElementById('applicant-summary');
    if (summaryEl) summaryEl.textContent = 'No backend assessment is available.';

    // Show score breakdown
    updateScoreBreakdown(applicant.id, null, null);

    return;
  }

  // ─── CALCULATE COMBINED SCORE ────────────────────────────────
  const aiScore = assessment.overallScore;
  const finalScore = aiScore;

  // Score
  const scoreEl = document.getElementById('applicant-score');
  if (scoreEl) scoreEl.textContent = finalScore;

  // Score breakdown
  updateScoreBreakdown(applicant.id, aiScore, null);

  // Recommendation
  const recEl = document.getElementById('applicant-recommendation');
  if (recEl) {
    const recommendation = assessment.recommendation;
    recEl.textContent = recommendation;
    recEl.title = recommendation;
    recEl.setAttribute('aria-label', `Recommendation: ${recommendation}`);
    const recClass = getRecommendationBadgeClass(recommendation);
    recEl.className = `badge ${recClass} recommendation-preview recommendation-preview--detail`;
  }

  // AI Summary (renamed)
  const summaryEl = document.getElementById('applicant-summary');
  if (summaryEl) {
    summaryEl.textContent = assessment.executiveSummary || 'No summary provided.';
  }

  // Category scores
  const catContainer = document.getElementById('category-scores');
  if (catContainer && assessment.categoryScores) {
    const catColors = ['#6BC6CC', '#5BA0D4', '#89D9DE', '#7DB8E6', '#2C1F1D', '#4A3431', '#8A7A77'];
    let catIndex = 0;
    catContainer.innerHTML = Object.entries(assessment.categoryScores).map(([key, value]) => {
      const color = catColors[catIndex % catColors.length];
      catIndex++;
      return `<div class="stat-card" style="padding:0.8rem;">
        <span style="font-size:0.65rem;text-transform:uppercase;color:var(--text-muted);">${key}</span>
        <span style="display:block;font-size:1.8rem;font-weight:700;color:${color};">${value}%</span>
      </div>`;
    }).join('');
  }

  // Skills matrix
  const skillContainer = document.getElementById('skills-matrix');
  if (skillContainer && assessment.skillsMatrix) {
    skillContainer.innerHTML = assessment.skillsMatrix.map(s =>
      `<tr>
        <td>${s.skill}</td>
        <td>${s.has ? '✔' : '✖'}</td>
        <td>${s.level}</td>
      </tr>`
    ).join('');
  }

  // Strengths
  const strengthsList = document.getElementById('applicant-strengths');
  if (strengthsList && assessment.strengths) {
    strengthsList.innerHTML = assessment.strengths.map(s =>
      `<li style="padding:0.3rem 0;display:flex;align-items:center;gap:0.5rem;"><span style="color:var(--clr-sky-aqua);">●</span> ${s}</li>`
    ).join('');
  }

  // Weaknesses
  const weaknessesList = document.getElementById('applicant-weaknesses');
  if (weaknessesList && assessment.weaknesses) {
    weaknessesList.innerHTML = assessment.weaknesses.map(w =>
      `<li style="padding:0.3rem 0;display:flex;align-items:center;gap:0.5rem;"><span style="color:var(--clr-charcoal);">●</span> ${w}</li>`
    ).join('');
  }

  // Missing requirements
  const missingList = document.getElementById('applicant-missing');
  if (missingList && assessment.missingRequirements) {
    missingList.innerHTML = assessment.missingRequirements.map(m =>
      `<li style="padding:0.3rem 0;display:flex;align-items:center;gap:0.5rem;"><span style="color:var(--clr-charcoal);">✖</span> ${m}</li>`
    ).join('');
  }

  // Final recommendation
  const finalEl = document.getElementById('applicant-final-recommendation');
  if (finalEl) {
    const finalText =
      assessment.finalRecommendation ||
      assessment.recommendation ||
      'No recommendation provided.';
    finalEl.textContent = finalText;
  }
}

// ─── UPDATE SCORE BREAKDOWN ─────────────────────────────────────
function updateScoreBreakdown(applicantId, aiScore, hrScore) {
  const el = document.getElementById('score-breakdown');
  if (!el) return;
  if (aiScore !== null && hrScore !== null && hrScore !== undefined) {
    el.textContent = `AI: ${aiScore} | HR: ${hrScore} | Combined: ${Math.round((aiScore * 0.7) + (hrScore * 0.3))}`;
  } else if (aiScore !== null) {
    el.textContent = `AI Score: ${aiScore}`;
  } else if (hrScore !== null && hrScore !== undefined) {
    el.textContent = `HR Score: ${hrScore}`;
  } else {
    el.textContent = '';
  }
}

// ─── SETUP CV MODAL ─────────────────────────────────────────────
function setupCampaignReassignment(applicant) {
  const trigger = document.getElementById('reassign-applicant-campaign');
  const modal = document.getElementById('campaign-reassign-modal');
  const applicantName = document.getElementById('campaign-reassign-applicant');
  const dropdown = document.getElementById('applicant-destination-campaign');
  const items = dropdown?.querySelector('.dropdown-items');
  const confirmButton = document.getElementById('confirm-campaign-reassign');
  const closeButtons = document.querySelectorAll('#close-campaign-reassign-modal, #close-campaign-reassign-footer');
  if (!trigger || !modal || !dropdown || !items || !confirmButton) return;

  if (applicantName) applicantName.textContent = applicant.fullName || 'this applicant';
  const campaigns = (db?.campaigns || []).filter(campaign =>
    !sameId(campaign.id, applicant.campaignId) &&
    String(campaign.status || '').toLowerCase() === 'active'
  );
  items.innerHTML = campaigns.map(campaign =>
    `<div class="dropdown-item" data-value="${escapeHtml(campaign.id)}">${escapeHtml(campaign.jobTitle || 'Untitled campaign')} <small>${escapeHtml(campaign.status || '')}</small></div>`
  ).join('');
  if (!campaigns.length) {
    dropdown.querySelector('.selected-text').textContent = 'No other campaigns available';
    dropdown.querySelector('.dropdown-btn')?.setAttribute('disabled', '');
  }

  const close = () => {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  };
  const open = () => {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    document.getElementById('close-campaign-reassign-modal')?.focus();
  };

  trigger.addEventListener('click', open);
  dropdown.addEventListener('dropdownChange', () => {
    confirmButton.disabled = !dropdown.dataset.value;
  });
  confirmButton.addEventListener('click', async () => {
    const campaignId = dropdown.dataset.value;
    if (!campaignId || confirmButton.disabled) return;
    confirmButton.disabled = true;
    confirmButton.textContent = 'Moving...';
    try {
      await updateApplicant(applicant.id, { ...applicant, campaignId });
      showToast('Applicant moved to the selected campaign.', 'success');
      close();
      window.location.reload();
    } catch (error) {
      console.error('Campaign reassignment error:', error);
      showToast('Unable to move the applicant. Please try again.', 'error');
      confirmButton.disabled = false;
      confirmButton.textContent = 'Move Applicant';
    }
  });
  closeButtons.forEach(button => button.addEventListener('click', close));
  modal.addEventListener('click', event => { if (event.target === modal) close(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && modal.style.display === 'flex') close();
  });
}

function setupCVModal(applicant) {
  const modal = document.getElementById('cv-modal');
  const modalName = document.getElementById('modal-cv-name');
  const modalContent = document.getElementById('cv-modal-content');
  const downloadBtn = document.getElementById('modal-download-btn');

  const viewBtns = document.querySelectorAll('#view-cv-btn, #view-cv-link-btn');
  const cvUrl = String(applicant.cvUrl || '').trim();

  function normalizeExternalUrl(value) {
    if (!value) return '';
    return /^https?:\/\//i.test(value) ? value : `https://${value}`;
  }

  function googleDrivePreviewUrl(value) {
    const match = value.match(/[?&]id=([^&]+)/i) ||
      value.match(/\/file\/d\/([^/]+)/i);
    return match ? `https://drive.google.com/file/d/${match[1]}/preview` : value;
  }

  if (!cvUrl) {
    viewBtns.forEach(btn => {
      btn.disabled = true;
      btn.setAttribute('aria-disabled', 'true');
      btn.title = 'No CV document was provided by the applicant API.';
      const label = btn.querySelector('span');
      const hint = btn.querySelector('small');
      if (label) label.textContent = 'CV unavailable';
      if (hint) hint.textContent = 'Not provided by API';
    });
  }

  const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character]);

  function renderMockCV(cv) {
    const skills = Array.isArray(cv.keySkills) ? cv.keySkills : [];
    return `
      <article class="mock-cv" aria-label="Mock CV for ${escapeHtml(applicant.fullName)}">
        <header class="mock-cv-header">
          <div class="mock-cv-monogram" aria-hidden="true">${escapeHtml(applicant.fullName.split(/\s+/).map(part => part[0]).slice(0, 2).join(''))}</div>
          <div>
            <span class="mock-cv-kicker">Candidate CV</span>
            <h2>${escapeHtml(applicant.fullName)}</h2>
            <p>${escapeHtml(applicant.currentPosition)} · ${escapeHtml(applicant.country)}</p>
          </div>
        </header>
        <div class="mock-cv-contact">
          <span>${escapeHtml(applicant.email)}</span>
          <span>${escapeHtml(applicant.phone)}</span>
          <span>${escapeHtml(applicant.yearsExperience)} years experience</span>
        </div>
        <section><h3>Professional summary</h3><p>${escapeHtml(cv.professionalSummary)}</p></section>
        <section><h3>Career highlight</h3><p>${escapeHtml(cv.careerHighlight)}</p></section>
        <section><h3>Current experience</h3><div class="mock-cv-role"><strong>${escapeHtml(applicant.currentPosition)}</strong><span>${escapeHtml(applicant.employer)}</span></div></section>
        <section><h3>Education</h3><p>${escapeHtml(cv.education)}</p></section>
        <section><h3>Key skills</h3><div class="mock-cv-skills">${skills.map(skill => `<span>${escapeHtml(skill)}</span>`).join('')}</div></section>
      </article>`;
  }

  function buildDownload(cv) {
    const skills = Array.isArray(cv.keySkills) ? cv.keySkills.join(', ') : '';
    return [
      applicant.fullName, applicant.currentPosition,
      `${applicant.email} | ${applicant.phone} | ${applicant.country}`,
      '', 'PROFESSIONAL SUMMARY', cv.professionalSummary,
      '', 'CAREER HIGHLIGHT', cv.careerHighlight,
      '', 'CURRENT EXPERIENCE', `${applicant.currentPosition} — ${applicant.employer}`,
      '', 'EDUCATION', cv.education,
      '', 'KEY SKILLS', skills
    ].join('\n');
  }

  function openModal() {
    if (modalName) modalName.textContent = applicant.fullName;

    if (modalContent) {
      const sourceUrl = normalizeExternalUrl(cvUrl);
      const cleanUrl = sourceUrl.split(/[?#]/)[0];
      const ext = cleanUrl.includes('.') ? cleanUrl.split('.').pop().toLowerCase() : '';

      if (applicant.mockCv) {
        modalContent.innerHTML = renderMockCV(applicant.mockCv);
      } else if (/drive\.google\.com/i.test(sourceUrl)) {
        modalContent.innerHTML = `
          <div style="display:flex;flex-direction:column;gap:0.75rem;height:100%;min-height:600px;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;padding:0.75rem 1rem;border:1px solid var(--border-light);border-radius:10px;background:var(--bg-glass);">
              <span style="color:var(--text-secondary);font-size:0.85rem;">Preview supplied by Google Drive</span>
              <a class="btn btn-secondary" href="${sourceUrl}" target="_blank" rel="noopener noreferrer">Open in Google Drive</a>
            </div>
            <iframe src="${googleDrivePreviewUrl(sourceUrl)}" title="${escapeHtml(applicant.fullName)} CV" loading="lazy" allow="autoplay" style="width:100%;flex:1;min-height:520px;border:none;border-radius:8px;background:white;"></iframe>
          </div>`;
      } else if (ext === 'pdf') {
        modalContent.innerHTML = `<iframe src="${sourceUrl}" title="${escapeHtml(applicant.fullName)} CV" style="width:100%;height:600px;border:none;border-radius:8px;"></iframe>`;
      } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
        modalContent.innerHTML = `<img src="${sourceUrl}" alt="${escapeHtml(applicant.fullName)} CV" style="max-width:100%;max-height:600px;border-radius:8px;" />`;
      } else {
        modalContent.innerHTML = `<p style="color:var(--text-muted);">This CV cannot be embedded in the page.</p><p><a class="btn btn-secondary" href="${sourceUrl}" target="_blank" rel="noopener noreferrer">Open CV in a new tab</a></p>`;
      }
    }

    if (downloadBtn) {
      if (applicant.mockCv) {
        downloadBtn.href = URL.createObjectURL(new Blob([buildDownload(applicant.mockCv)], { type: 'text/plain;charset=utf-8' }));
        downloadBtn.download = `${applicant.fullName.replace(/\s+/g, '_')}_CV.txt`;
      } else {
        downloadBtn.href = normalizeExternalUrl(cvUrl);
        downloadBtn.target = '_blank';
        downloadBtn.rel = 'noopener noreferrer';
        downloadBtn.removeAttribute('download');
        downloadBtn.textContent = /drive\.google\.com/i.test(cvUrl)
          ? 'Open in Google Drive'
          : 'Open CV';
      }
    }

    if (modal) {
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }
  }

  function closeModal() {
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }
    if (modalContent) {
      modalContent.innerHTML = '<span style="color:var(--text-muted);">Loading CV...</span>';
    }
    if (downloadBtn?.href?.startsWith('blob:')) {
      URL.revokeObjectURL(downloadBtn.href);
      downloadBtn.removeAttribute('href');
    }
    if (downloadBtn) downloadBtn.textContent = 'Open CV';
  }

  viewBtns.forEach(btn => {
    if (btn) btn.addEventListener('click', openModal);
  });

  const closeBtns = document.querySelectorAll('#close-cv-modal, #close-cv-modal-footer');
  closeBtns.forEach(btn => {
    if (btn) btn.addEventListener('click', closeModal);
  });

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }
}

// ─── SETUP SCHEDULE INTERVIEW ──────────────────────────────────
function setupScheduleInterview(applicant, campaign) {
  const btn = document.getElementById('schedule-interview-btn');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    if (!applicant) {
      showToast('No applicant data available.', 'error');
      return;
    }

    try {
      await openScheduleModal(
        applicant.id,
        applicant.fullName,
        applicant.campaignId,
        campaign?.jobTitle || 'Unknown',
        null
      );
    } catch (error) {
      console.error('Failed to load schedule modal:', error);
      showToast('Schedule interview feature is not available.', 'error');
    }
  });
}

// ─── SETUP ACTION BUTTONS ──────────────────────────────────────
function setupActionButtons(applicant) {
  const shortlistBtn = document.getElementById('add-to-shortlist-btn');
  if (shortlistBtn) {
    shortlistBtn.addEventListener('click', () => {
      showToast(`${applicant.fullName} added to shortlist!`, 'success');
    });
  }

  const reportBtn = document.getElementById('generate-report-btn');
  if (reportBtn) {
    reportBtn.addEventListener('click', () => {
      showToast(`Generating report for ${applicant.fullName}...`, 'info');
    });
  }

  const clientReportBtn = document.getElementById('generate-client-report-btn');
  if (clientReportBtn) {
    clientReportBtn.addEventListener('click', () => {
      showToast(`Generating client report for ${applicant.fullName}...`, 'info');
    });
  }

  const compareBtn = document.getElementById('compare-btn');
  if (compareBtn) {
    compareBtn.addEventListener('click', () => {
      window.location.href = `../Rankings/rankings.html?compare=${applicant.id}`;
    });
  }

  const compareOthersBtn = document.getElementById('compare-candidates-btn');
  if (compareOthersBtn) {
    compareOthersBtn.addEventListener('click', () => {
      window.location.href = '../Rankings/rankings.html';
    });
  }
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────
export default async function initApplicantDetails() {
  try {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) {
      document.getElementById('applicant-name').textContent = 'No applicant specified';
      showToast('No applicant ID provided', 'warning');
      return;
    }

    db = await loadDatabase();
    if (!db) {
      document.getElementById('applicant-name').textContent = 'Error loading data';
      showToast('Error loading database', 'error');
      return;
    }

    const applicant = await getApplicantById(id);
    if (!applicant) {
      document.getElementById('applicant-name').textContent = 'Applicant not found';
      showToast('Applicant not found', 'error');
      return;
    }

    currentApplicant = applicant;
    const campaign = await getCampaignById(applicant.campaignId);
    const assessment = await getAssessmentByApplicantAndCampaign(
      id,
      applicant.campaignId
    );
    currentAssessment = assessment;
    currentCampaign = campaign;

    populateApplicantInfo(applicant, campaign);
    populateAssessment(assessment, applicant);
    setupCampaignReassignment(applicant);
    setupAddHrAssessmentModal(applicant, campaign);
    await loadHrAssessments(id);

    // ─── HR Features ─────────────────────────────────────────────

    // Update breadcrumb
    const breadcrumbEl = document.getElementById('breadcrumb-applicant-name');
    if (breadcrumbEl) breadcrumbEl.textContent = applicant.fullName;

    console.log('✅ Applicant details loaded:', applicant.fullName);

  } catch (error) {
    console.error('Applicant details error:', error);
    document.getElementById('applicant-name').textContent = 'Error loading applicant';
    showToast('Error loading applicant details', 'error');
    throw error;
  }
}
