// ============================================================
// INTERVIEWS – Interview tracker with filtering, search, Show More
// ============================================================

import {
  loadDatabase,
  getCampaignNames,
  getInterviewStatusOptions,
  getStatusBadgeClass,
  sameId
} from '../Assets/js/dataService.js';
import { showToast } from '../Assets/js/toast.js';
import { queueCalendarEvent } from '../Assets/js/calendarService.js';

let allInterviews = [];
let visibleCount = 5;
const BATCH_SIZE = 5;
let db = null;

// ─── RENDER INTERVIEWS ────────────────────────────────────────────
function renderInterviews() {
  const list = document.getElementById('interviews-list');
  if (!list) return;

  const campaignFilter = document.getElementById('campaign-filter')?.dataset?.value || 'all';
  const statusFilter = document.getElementById('status-filter')?.dataset?.value || 'all';
  const searchInput = document.getElementById('search-interview');
  const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';

  let filtered = [...allInterviews];

  if (campaignFilter !== 'all') {
    filtered = filtered.filter(i => sameId(i.campaignId, campaignFilter));
  }

  if (statusFilter !== 'all') {
    filtered = filtered.filter(i => i.status === statusFilter);
  }

  if (searchQuery) {
    filtered = filtered.filter(i =>
      i.applicantName.toLowerCase().includes(searchQuery) ||
      i.campaignName.toLowerCase().includes(searchQuery) ||
      i.interviewer.toLowerCase().includes(searchQuery)
    );
  }

  const total = filtered.length;
  const hasMore = visibleCount < total;
  const showCount = Math.min(visibleCount, total);
  const itemsToShow = filtered.slice(0, showCount);

  if (total === 0) {
    list.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--text-muted);">No interviews found</td></tr>';
    updateShowMoreButton(0, false);
    return;
  }

  list.innerHTML = itemsToShow.map(i => {
    const statusClass = getStatusBadgeClass(i.status);

    const date = i.date ? new Date(i.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
    const time = i.time || '—';

    return `
      <tr>
        <td><a href="../Applicants/applicant-details.html?id=${i.applicantId}" style="color:var(--link-color);text-decoration:none;">${i.applicantName}</a></td>
        <td><a href="../Campaign/campaign-details.html?id=${i.campaignId}" style="color:var(--link-color);text-decoration:none;">${i.campaignName}</a></td>
        <td>${i.interviewer}</td>
        <td>${date} ${time}</td>
        <td><span class="badge ${statusClass}">${i.status}</span></td>
        <td>${i.score || '—'}</td>
        <td>
          <button class="btn btn-secondary schedule-btn" data-interview-id="${i.id}" data-applicant-id="${i.applicantId}" data-applicant-name="${i.applicantName}" style="padding:0.2rem 0.8rem;font-size:0.8rem;">Schedule</button>
          <a href="../Applicants/applicant-details.html?id=${i.applicantId}" class="btn btn-secondary" aria-label="View ${i.applicantName} applicant details" style="padding:0.2rem 0.8rem;font-size:0.8rem;">View</a>
        </td>
      </tr>
    `;
  }).join('');

  // Attach schedule button events
  document.querySelectorAll('.schedule-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const interviewId = parseInt(this.dataset.interviewId);
      const applicantId = this.dataset.applicantId;
      const applicantName = this.dataset.applicantName;
      openScheduleModal(interviewId, applicantId, applicantName);
    });
  });

  updateShowMoreButton(total, hasMore);
  updateStats();
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
  const interviews = allInterviews;

  const scheduledEl = document.getElementById('scheduled-count');
  const completedEl = document.getElementById('completed-count');
  const pendingEl = document.getElementById('pending-feedback-count');
  const offerEl = document.getElementById('offer-extended-count');

  if (scheduledEl) scheduledEl.textContent = interviews.filter(i => i.status === 'Scheduled').length;
  if (completedEl) completedEl.textContent = interviews.filter(i => i.status === 'Completed').length;
  if (pendingEl) pendingEl.textContent = interviews.filter(i => i.status === 'Pending Feedback').length;
  if (offerEl) offerEl.textContent = interviews.filter(i => i.status === 'Offer Extended').length;
}

// ─── POPULATE DROPDOWNS ──────────────────────────────────────────
async function populateDropdowns() {
  // Campaign filter
  const campaignDropdown = document.getElementById('campaign-filter');
  if (campaignDropdown) {
    const campaignItems = campaignDropdown.querySelector('.dropdown-items');
    if (campaignItems) {
      const campaignNames = await getCampaignNames();
      campaignItems.innerHTML = `
        <div class="dropdown-item active" data-value="all">All Campaigns <span class="check">✓</span></div>
        ${campaignNames.map(c =>
          `<div class="dropdown-item" data-value="${c.id}">${c.name} (${c.client}) <span class="check">✓</span></div>`
        ).join('')}
      `;
    }
    campaignDropdown.addEventListener('dropdownChange', () => {
      visibleCount = 5;
      renderInterviews();
    });
  }

  // Status filter
  const statusDropdown = document.getElementById('status-filter');
  if (statusDropdown) {
    const statusItems = statusDropdown.querySelector('.dropdown-items');
    if (statusItems) {
      const options = getInterviewStatusOptions();
      statusItems.innerHTML = options.map(opt =>
        `<div class="dropdown-item ${opt.value === 'all' ? 'active' : ''}" data-value="${opt.value}">${opt.label} <span class="check">✓</span></div>`
      ).join('');
    }
    statusDropdown.addEventListener('dropdownChange', () => {
      visibleCount = 5;
      renderInterviews();
    });
  }
}

// ─── SETUP SEARCH ────────────────────────────────────────────────
function setupSearch() {
  const searchInput = document.getElementById('search-interview');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      visibleCount = 5;
      renderInterviews();
    });
  }
}

// ─── SETUP SHOW MORE ─────────────────────────────────────────────
function setupShowMore() {
  const btn = document.getElementById('show-more-btn');
  if (btn) {
    btn.addEventListener('click', () => {
      visibleCount += BATCH_SIZE;
      renderInterviews();
    });
  }
}

// ─── POPULATE INTERVIEWERS FROM USERS ───────────────────────────
function populateInterviewers() {
  const dropdownItems = document.querySelector('#interviewer-dropdown .dropdown-items');
  if (!dropdownItems) return;

  const users = db?.users || [];
  const currentInterviewers = users.map(u => u.fullName).filter(Boolean);

  // Preserve selected value
  const selectedText = document.querySelector('#interviewer-dropdown .selected-text')?.textContent || '';
  const isSelected = selectedText !== 'Select Interviewer' && selectedText !== '';

  dropdownItems.innerHTML = currentInterviewers.length
    ? currentInterviewers.map(name =>
        `<div class="dropdown-item ${name === selectedText ? 'active' : ''}" data-value="${name}">${name} <span class="check">✓</span></div>`
      ).join('')
    : '<div class="dropdown-item" data-value="">No interviewers available</div>';

  if (!isSelected && currentInterviewers.length) {
    const selectedEl = document.querySelector('#interviewer-dropdown .selected-text');
    if (selectedEl) selectedEl.textContent = 'Select Interviewer';
  }
}

// ─── OPEN SCHEDULE MODAL ─────────────────────────────────────────
function openScheduleModal(interviewId, applicantId, applicantName) {
  const modal = document.getElementById('scheduleModal');
  if (!modal) return;

  const interview = allInterviews.find(i => i.id === interviewId);

  // Set basic fields
  document.getElementById('schedule-applicant-id').value = applicantId;
  document.getElementById('schedule-interview-id').value = interviewId || '';
  document.getElementById('schedule-candidate-name').textContent = applicantName;

  // Pre-fill if editing an existing interview
  if (interview) {
    if (interview.date && interview.time) {
      const dt = new Date(`${interview.date}T${interview.time}`);
      if (!isNaN(dt)) {
        document.getElementById('schedule-datetime').value = dt.toISOString().slice(0, 16);
      }
    }
    if (interview.interviewer) {
      const selText = document.querySelector('#interviewer-dropdown .selected-text');
      if (selText) selText.textContent = interview.interviewer;
      document.querySelectorAll('#interviewer-dropdown .dropdown-item').forEach(item => {
        item.classList.toggle('active', item.dataset.value === interview.interviewer);
      });
    }
    if (interview.meetLink) {
      document.getElementById('schedule-meet-link').value = interview.meetLink;
    }
    if (interview.meetingType) {
      const supportedMeetingType = interview.meetingType === 'phone' ? 'phone' : 'google-meet';
      document.querySelectorAll('input[name="meeting-type"]').forEach(r => {
        r.checked = r.value === supportedMeetingType;
      });
      document.getElementById('google-meet-link-container').style.display =
        supportedMeetingType === 'google-meet' ? 'block' : 'none';
    }
  } else {
    // Default: 2 hours from now
    const now = new Date();
    now.setHours(now.getHours() + 2);
    now.setMinutes(0, 0, 0);
    document.getElementById('schedule-datetime').value = now.toISOString().slice(0, 16);
    document.getElementById('schedule-meet-link').value = '';
    document.querySelector('input[name="meeting-type"][value="google-meet"]').checked = true;
    document.getElementById('google-meet-link-container').style.display = 'block';

    const selText = document.querySelector('#interviewer-dropdown .selected-text');
    if (selText) selText.textContent = 'Select Interviewer';
    document.querySelectorAll('#interviewer-dropdown .dropdown-item').forEach(item => {
      item.classList.remove('active');
    });
  }

  // Populate interviewer dropdown
  populateInterviewers();

  // Show modal
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

// ─── SETUP SCHEDULE MODAL ────────────────────────────────────────
function setupScheduleModal() {
  const modal = document.getElementById('scheduleModal');
  if (!modal) return;

  const closeBtn = document.getElementById('close-schedule-modal');
  const cancelBtn = document.getElementById('cancel-schedule-btn');
  const form = document.getElementById('schedule-form');

  function closeModal() {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }

  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'flex') closeModal();
  });

  // Generate Meet link
  const genBtn = document.getElementById('generate-meet-link');
  if (genBtn) {
    genBtn.addEventListener('click', () => {
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
      let code = '';
      for (let i = 0; i < 10; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
      const formatted = `${code.slice(0, 3)}-${code.slice(3, 7)}-${code.slice(7, 10)}`;
      document.getElementById('schedule-meet-link').value = `https://meet.google.com/${formatted}`;
      showToast('Google Meet link generated!', 'success');
    });
  }

  // Toggle Meet visibility
  document.querySelectorAll('input[name="meeting-type"]').forEach(radio => {
    radio.addEventListener('change', function() {
      const container = document.getElementById('google-meet-link-container');
      container.style.display = this.value === 'google-meet' ? 'block' : 'none';
    });
  });

  // Form submission
  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    const applicantId = document.getElementById('schedule-applicant-id').value;
    const interviewId = document.getElementById('schedule-interview-id').value;
    const datetime = document.getElementById('schedule-datetime').value;
    const interviewerDropdown = document.getElementById('interviewer-dropdown');
    const selectedText = interviewerDropdown?.querySelector('.selected-text')?.textContent || '';
    const interviewer = (selectedText === 'Select Interviewer' || selectedText === '') ? '' : selectedText;
    const meetingType = document.querySelector('input[name="meeting-type"]:checked')?.value || 'google-meet';
    const meetLink = document.getElementById('schedule-meet-link').value;

    if (!datetime) { showToast('Please select a date and time.', 'warning'); return; }
    if (!interviewer) { showToast('Please select an interviewer.', 'warning'); return; }

    const dateObj = new Date(datetime);
    const formattedDate = dateObj.toISOString().split('T')[0];
    const formattedTime = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // Get the interview details
    const applicant = db.applicants?.find(a => sameId(a.id, applicantId));
    const campaign = db.campaigns?.find(c => sameId(c.id, applicant?.campaignId));

    // Build interview object
    const interviewData = {
      id: interviewId ? parseInt(interviewId) : (allInterviews.length ? Math.max(...allInterviews.map(i => i.id)) + 1 : 1),
      applicantId: applicantId,
      campaignId: applicant?.campaignId || null,
      applicantName: document.getElementById('schedule-candidate-name').textContent,
      campaignName: campaign?.jobTitle || 'Unknown',
      interviewer: interviewer,
      date: formattedDate,
      time: formattedTime,
      status: 'Scheduled',
      score: null,
      meetingType: meetingType,
      meetLink: meetingType === 'google-meet' ? meetLink : '',
      createdAt: new Date().toISOString()
    };

    // Check if updating existing
    const existingIndex = allInterviews.findIndex(i => i.id === interviewData.id);
    if (existingIndex >= 0) {
      allInterviews[existingIndex] = { ...allInterviews[existingIndex], ...interviewData };
    } else {
      allInterviews.push(interviewData);
    }

    // Update db reference
    if (db) {
      if (existingIndex >= 0) {
        const dbIndex = db.interviews.findIndex(i => i.id === interviewData.id);
        if (dbIndex >= 0) db.interviews[dbIndex] = { ...db.interviews[dbIndex], ...interviewData };
      } else {
        db.interviews.push(interviewData);
      }
    }

    updateStats();
    visibleCount = 5;
    renderInterviews();
    closeModal();

    const label = meetingType === 'google-meet' ? 'Google Meet' : 'Phone Call';
    showToast(`Interview ${existingIndex >= 0 ? 'updated' : 'scheduled'} for ${interviewData.applicantName} on ${formattedDate} at ${formattedTime} (${label})`, 'success');
    if (queueCalendarEvent(interviewData)) {
      showToast('Google Calendar event prepared for sync.', 'info');
    }
  });
}

// ─── SETUP SCHEDULE INTERVIEW BUTTON ────────────────────────────
function setupMainScheduleButton() {
  const btn = document.getElementById('schedule-interview-btn');
  if (!btn) return;

  btn.addEventListener('click', function() {
    // Open modal with no pre-filled data
    openScheduleModal(null, null, 'Select a candidate');
  });
}

// ─── SETUP INTERVIEW SCHEDULED EVENT LISTENER ──────────────────
function setupEventListeners() {
  window.addEventListener('interviewScheduled', function() {
    // Refresh the list
    visibleCount = 5;
    renderInterviews();
  });
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────
export default async function initInterviews() {
  try {
    db = await loadDatabase();
    if (!db) {
      showToast('Error loading interview data', 'error');
      return;
    }

    // Set recruiter name
    const nameEl = document.getElementById('recruiter-name');
    if (nameEl && db.users?.length) {
      nameEl.textContent = db.users[0].fullName;
    }

    allInterviews = db.interviews || [];

    // Update stats
    updateStats();

    // Populate dropdowns
    await populateDropdowns();

    // Setup search
    setupSearch();

    // Setup show more
    setupShowMore();

    // Setup schedule modal
    setupScheduleModal();

    // Setup main schedule button
    setupMainScheduleButton();

    // Setup event listeners
    setupEventListeners();

    // Initial render
    renderInterviews();

    console.log('✅ Interviews loaded successfully:', allInterviews.length);

  } catch (error) {
    console.error('Interviews error:', error);
    showToast('Error loading interviews', 'error');
    throw error;
  }
}
