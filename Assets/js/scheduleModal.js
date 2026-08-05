// ============================================================
// scheduleModal.js – Unified Schedule Interview modal
// ============================================================

import { showToast } from './toast.js';
import { loadDatabase } from './dataService.js';
import { initDropdowns } from './ui.js';
import { queueCalendarEvent } from './calendarService.js';

let modal = null;
let form = null;
let closeBtn = null;
let cancelBtn = null;
let db = null;

// ─── INITIALISE ──────────────────────────────────────────────────
export function initScheduleModal() {
  modal = document.getElementById('scheduleModal');
  if (!modal) return;

  form = document.getElementById('schedule-form');
  closeBtn = document.getElementById('close-schedule-modal');
  cancelBtn = document.getElementById('cancel-schedule-btn');

  const close = () => {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  };

  if (closeBtn) closeBtn.addEventListener('click', close);
  if (cancelBtn) cancelBtn.addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'flex') close();
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

  // Toggle Meet link visibility
  document.querySelectorAll('input[name="meeting-type"]').forEach(radio => {
    radio.addEventListener('change', function() {
      const container = document.getElementById('google-meet-link-container');
      if (container) {
        container.style.display = this.value === 'google-meet' ? 'block' : 'none';
      }
    });
  });

  // Form submission
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleFormSubmit();
    });
  }
}

// ─── FORM SUBMISSION HANDLER ──────────────────────────────────
async function handleFormSubmit() {
  const applicantId = document.getElementById('schedule-applicant-id').value;
  const interviewId = document.getElementById('schedule-interview-id')?.value;
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

  const db = await loadDatabase();
  if (!db) { showToast('Database not available.', 'error'); return; }

  const applicantName = document.getElementById('schedule-candidate-name').textContent;
  const campaignName = document.getElementById('schedule-campaign-name')?.textContent || 'Unknown';
  const campaignId = document.getElementById('schedule-campaign-id')?.value || null;

  // Check if we're editing an existing interview
  const existingId = interviewId ? parseInt(interviewId) : null;
  let existingIndex = -1;

  if (existingId) {
    existingIndex = db.interviews.findIndex(i => i.id === existingId);
  }

  const interviewData = {
    id: existingId || (db.interviews.length ? Math.max(...db.interviews.map(i => i.id)) + 1 : 1),
    applicantId,
    campaignId,
    applicantName,
    campaignName,
    interviewer,
    date: formattedDate,
    time: formattedTime,
    status: 'Scheduled',
    score: null,
    meetingType,
    meetLink: meetingType === 'google-meet' ? meetLink : '',
    createdAt: new Date().toISOString()
  };

  if (existingIndex >= 0) {
    // Update existing
    db.interviews[existingIndex] = { ...db.interviews[existingIndex], ...interviewData };
    showToast(`Interview updated for ${applicantName} on ${formattedDate} at ${formattedTime}`, 'success');
  } else {
    // Add new
    db.interviews.push(interviewData);
    showToast(`Interview scheduled for ${applicantName} on ${formattedDate} at ${formattedTime}`, 'success');
  }

  if (queueCalendarEvent(interviewData)) {
    showToast('Google Calendar event prepared for sync.', 'info');
  }

  // Close modal
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }

  // Dispatch event for other components to refresh
  window.dispatchEvent(new CustomEvent('interviewScheduled', { detail: { interview: interviewData } }));
}

// ─── OPEN MODAL ──────────────────────────────────────────────────
export async function openScheduleModal(
  applicantId,
  applicantName,
  campaignId = null,
  campaignName = null,
  existingInterview = null
) {
  if (!modal) {
    console.warn('Schedule modal not initialised. Call initScheduleModal() first.');
    return;
  }

  // Load database for interviewer list
  db = await loadDatabase();

  // Set basic fields
  document.getElementById('schedule-applicant-id').value = applicantId;
  document.getElementById('schedule-campaign-id').value = campaignId || '';
  document.getElementById('schedule-candidate-name').textContent = applicantName;
  document.getElementById('schedule-campaign-name').textContent = campaignName || 'Unknown';

  // Set interview ID if editing
  const interviewIdEl = document.getElementById('schedule-interview-id');
  if (interviewIdEl) {
    interviewIdEl.value = existingInterview?.id || '';
  }

  // Pre-fill if editing an existing interview
  if (existingInterview) {
    if (existingInterview.date && existingInterview.time) {
      const dt = new Date(`${existingInterview.date}T${existingInterview.time}`);
      if (!isNaN(dt)) {
        document.getElementById('schedule-datetime').value = dt.toISOString().slice(0, 16);
      }
    }
    if (existingInterview.interviewer) {
      const selText = document.querySelector('#interviewer-dropdown .selected-text');
      if (selText) selText.textContent = existingInterview.interviewer;
      const items = document.querySelectorAll('#interviewer-dropdown .dropdown-item');
      items.forEach(item => {
        item.classList.toggle('active', item.dataset.value === existingInterview.interviewer);
      });
    }
    if (existingInterview.meetLink) {
      document.getElementById('schedule-meet-link').value = existingInterview.meetLink;
    }
    if (existingInterview.meetingType) {
      const supportedMeetingType = existingInterview.meetingType === 'phone' ? 'phone' : 'google-meet';
      const radios = document.querySelectorAll('input[name="meeting-type"]');
      radios.forEach(r => r.checked = r.value === supportedMeetingType);
      const container = document.getElementById('google-meet-link-container');
      if (container) {
        container.style.display = supportedMeetingType === 'google-meet' ? 'block' : 'none';
      }
    }
    // Update modal title
    const title = document.getElementById('schedule-modal-title');
    if (title) title.textContent = 'Edit Interview';
  } else {
    // Default: 2 hours from now
    const now = new Date();
    now.setHours(now.getHours() + 2);
    now.setMinutes(0, 0, 0);
    document.getElementById('schedule-datetime').value = now.toISOString().slice(0, 16);
    document.getElementById('schedule-meet-link').value = '';
    document.querySelector('input[name="meeting-type"][value="google-meet"]').checked = true;
    document.getElementById('google-meet-link-container').style.display = 'block';

    // Reset interviewer selection
    const selText = document.querySelector('#interviewer-dropdown .selected-text');
    if (selText) selText.textContent = 'Select Interviewer';
    document.querySelectorAll('#interviewer-dropdown .dropdown-item').forEach(item => item.classList.remove('active'));

    // Reset modal title
    const title = document.getElementById('schedule-modal-title');
    if (title) title.textContent = 'Schedule Interview';
  }

  // Populate interviewer dropdown from users
  populateInterviewers(db);

  // Re-initialise dropdowns inside the modal
  initDropdowns(modal);

  // Show modal
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

// ─── POPULATE INTERVIEWERS ─────────────────────────────────────
function populateInterviewers(db) {
  const dropdownItems = document.querySelector('#interviewer-dropdown .dropdown-items');
  if (!dropdownItems) return;

  const users = db?.users || [];
  const currentInterviewer = document.querySelector('#interviewer-dropdown .selected-text')?.textContent || '';
  const isSelected = currentInterviewer !== 'Select Interviewer' && currentInterviewer !== '';

  // Build list of interviewer names from users
  const interviewerNames = users.map(u => u.fullName).filter(Boolean);

  if (interviewerNames.length === 0) {
    dropdownItems.innerHTML = `<div class="dropdown-item" data-value="">No interviewers available <span class="check">✓</span></div>`;
    return;
  }

  dropdownItems.innerHTML = interviewerNames.map(name =>
    `<div class="dropdown-item ${name === currentInterviewer ? 'active' : ''}" data-value="${name}">${name} <span class="check">✓</span></div>`
  ).join('');

  // If no selection and we have interviewers, reset text
  if (!isSelected && interviewerNames.length) {
    const sel = document.querySelector('#interviewer-dropdown .selected-text');
    if (sel) sel.textContent = 'Select Interviewer';
  }
}

// ─── CLOSE MODAL ─────────────────────────────────────────────────
export function closeScheduleModal() {
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
}

// ─── CHECK IF MODAL IS OPEN ────────────────────────────────────
export function isScheduleModalOpen() {
  return modal && modal.style.display === 'flex';
}
