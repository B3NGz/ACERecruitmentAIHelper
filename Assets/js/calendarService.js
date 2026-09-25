const SETTINGS_KEY = 'user_preferences';
const EVENTS_KEY = 'calendar_event_previews';

export function getCalendarPreferences() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}').calendar || {};
  } catch {
    return {};
  }
}

export function queueCalendarEvent(interview) {
  const preferences = getCalendarPreferences();
  if (!preferences.connected || preferences.autoSync === false) return false;

  let events = [];
  try {
    events = JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]');
  } catch {
    events = [];
  }

  const event = {
    interviewId: interview.id,
    title: `Interview: ${interview.applicantName}`,
    date: interview.date,
    time: interview.time,
    meetingType: interview.meetingType,
    meetingLink: interview.meetLink || '',
    calendarAccount: preferences.account,
    reminderMinutes: preferences.reminders === false ? null : 15,
    syncStatus: 'frontend-preview'
  };
  const existingIndex = events.findIndex(item => item.interviewId === interview.id);
  if (existingIndex >= 0) events[existingIndex] = event;
  else events.push(event);
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  return true;
}
