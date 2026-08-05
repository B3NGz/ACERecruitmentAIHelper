// ============================================================
// SIDEBAR – Push without squish (body class toggle)
// ============================================================
(function() {
  'use strict';

  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;

  // One source of truth for sidebar artwork. The HTML keeps its inline icons as
  // a no-JavaScript fallback; these balanced 24px icons replace them at runtime.
  const sidebarIcons = {
    dashboard: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    campaign: '<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M8 7V5.5A2.5 2.5 0 0 1 10.5 3h3A2.5 2.5 0 0 1 16 5.5V7M3 12h18M10 12v2h4v-2"/>',
    applicants: '<path d="M15.5 20.5v-1.8a4.2 4.2 0 0 0-4.2-4.2H6.2A4.2 4.2 0 0 0 2 18.7v1.8"/><circle cx="8.75" cy="7.25" r="3.75"/><path d="M17 10.5a3.5 3.5 0 0 0 0-6.8M22 20.5v-1.8a4.2 4.2 0 0 0-3.15-4.07"/>',
    assessment: '<rect x="4" y="4.5" width="16" height="17" rx="2.5"/><path d="M9 4.5V3h6v1.5M8 10.5l1.5 1.5 3-3M8 16h8"/>',
    rankings: '<path d="M8 4h8v3.5a4 4 0 0 1-8 0V4Z"/><path d="M8 6H5.5v1A3.5 3.5 0 0 0 9 10.5M16 6h2.5v1a3.5 3.5 0 0 1-3.5 3.5M12 11.5V16M8.5 21h7M10 16h4a2 2 0 0 1 2 2v.5H8V18a2 2 0 0 1 2-2Z"/>',
    interviews: '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M16 3v4M8 3v4M3 9.5h18M8 15l2.2 2.2L16 12"/>',
    reports: '<path d="M6 2.5h8l4 4V21H6a2 2 0 0 1-2-2V4.5a2 2 0 0 1 2-2Z"/><path d="M14 2.5v4h4M8 16v2M12 13v5M16 10v8"/>',
    settings: '<path d="M12 2.75v2.1M12 19.15v2.1M21.25 12h-2.1M4.85 12h-2.1M18.54 5.46l-1.48 1.48M6.94 17.06l-1.48 1.48M18.54 18.54l-1.48-1.48M6.94 6.94 5.46 5.46"/><circle cx="12" cy="12" r="5.15"/><circle cx="12" cy="12" r="1.9"/>',
    logout: '<path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5M14 8l4 4-4 4M18 12H8"/>',
    applicantNotice: '<path d="M14.5 20.5v-1.6a4 4 0 0 0-4-4h-4a4 4 0 0 0-4 4v1.6"/><circle cx="8.5" cy="7.5" r="3.5"/><path d="M18 8v6M15 11h6"/>',
    campaignNotice: '<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M8 7V5.5A2.5 2.5 0 0 1 10.5 3h3A2.5 2.5 0 0 1 16 5.5V7M12 11v5M9.5 13.5h5"/>',
    activity: '<path d="M4 19V14M9.3 19V9.5M14.7 19v-7M20 19V5"/><path d="M2.5 21h19"/>'
  };

  function premiumIcon(paths) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths}</svg>`;
  }

  function upgradeSidebarIcons() {
    sidebar.querySelectorAll('.nav-item[data-page]').forEach(item => {
      const icon = item.querySelector('.icon');
      const artwork = sidebarIcons[item.dataset.page];
      if (icon && artwork) icon.innerHTML = premiumIcon(artwork);
    });

    const applicantNotice = sidebar.querySelector('#new-applicants-count')?.closest('.notification-item')?.querySelector('.notification-icon');
    const campaignNotice = sidebar.querySelector('#new-campaigns-count')?.closest('.notification-item')?.querySelector('.notification-icon');
    if (applicantNotice) applicantNotice.innerHTML = premiumIcon(sidebarIcons.applicantNotice);
    if (campaignNotice) campaignNotice.innerHTML = premiumIcon(sidebarIcons.campaignNotice);
  }

  upgradeSidebarIcons();

  // ============================================================
  // TEAM ACTIVITY FEED — shared across every authenticated page
  // ============================================================
  function initTeamActivityFeed() {
    const notifications = sidebar.querySelector('.sidebar-notifications');
    if (!notifications || notifications.querySelector('[data-team-activity-trigger]')) return;
    const divider = notifications.querySelector('.notification-divider');

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'notification-item team-activity-trigger';
    trigger.dataset.teamActivityTrigger = '';
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.innerHTML = `
      <span class="notification-icon" aria-hidden="true">
        ${premiumIcon(sidebarIcons.activity)}
      </span>
      <span class="notification-label" data-i18n="team_activity_feed">Team Activity</span>
      <span class="notification-badge zero" data-team-activity-count>0</span>`;
    notifications.insertBefore(trigger, divider);

    const panel = document.createElement('section');
    panel.className = 'team-activity-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Team Activity Feed');
    panel.innerHTML = `
      <div class="team-activity-header">
        <div>
          <strong>Team Activity Feed</strong>
          <span>Recent workspace updates</span>
        </div>
        <button type="button" class="team-activity-close" aria-label="Close activity feed">&times;</button>
      </div>
      <div class="team-activity-list" data-team-activity-list>
        <div class="team-activity-empty">Loading activity…</div>
      </div>`;
    document.body.appendChild(panel);

    const countBadge = trigger.querySelector('[data-team-activity-count]');
    const list = panel.querySelector('[data-team-activity-list]');
    const closeButton = panel.querySelector('.team-activity-close');
    let activitiesLoaded = false;

    function placePanel() {
      const rect = trigger.getBoundingClientRect();
      const panelWidth = Math.min(360, window.innerWidth - 24);
      const left = Math.min(rect.right + 12, window.innerWidth - panelWidth - 12);
      const desiredTop = rect.top - 118;
      panel.style.left = `${Math.max(12, left)}px`;
      panel.style.top = `${Math.max(12, Math.min(window.innerHeight - panel.offsetHeight - 12, desiredTop))}px`;
    }

    function closePanel() {
      panel.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
    }

    function actorFor(users, seed) {
      if (!users.length) return { fullName: 'Recruitment Team', role: 'Team member' };
      return users[Math.abs(Number(seed) || 0) % users.length];
    }

    function buildActivities(database) {
      const users = database.users || [];
      const entries = [];
      (database.campaigns || []).forEach(campaign => entries.push({
        actor: actorFor(users, campaign.id),
        action: 'created a campaign',
        subject: campaign.jobTitle,
        date: campaign.createdAt,
        type: 'campaign'
      }));
      (database.applicants || []).forEach(applicant => entries.push({
        actor: actorFor(users, applicant.id),
        action: 'added an applicant',
        subject: applicant.fullName,
        date: applicant.createdAt,
        type: 'applicant'
      }));
      (database.interviews || []).forEach(interview => {
        const applicant = (database.applicants || []).find(item => item.id === interview.applicantId);
        entries.push({
          actor: actorFor(users, interview.id || interview.applicantId),
          action: interview.status === 'Completed' ? 'completed an interview' : 'scheduled an interview',
          subject: applicant?.fullName || 'Applicant interview',
          date: interview.createdAt || interview.date,
          type: 'interview'
        });
      });
      return entries
        .filter(entry => entry.date && !Number.isNaN(new Date(entry.date).getTime()))
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    function renderActivities(activities) {
      list.replaceChildren();
      if (!activities.length) {
        const empty = document.createElement('div');
        empty.className = 'team-activity-empty';
        empty.textContent = 'No team activity yet.';
        list.appendChild(empty);
        return;
      }
      const dateFormatter = new Intl.DateTimeFormat(undefined, {
        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
      });
      activities.slice(0, 7).forEach(activity => {
        const item = document.createElement('article');
        item.className = 'team-activity-entry';
        const avatar = document.createElement('span');
        avatar.className = `team-activity-avatar is-${activity.type}`;
        avatar.setAttribute('aria-hidden', 'true');
        avatar.innerHTML = '<svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="3" stroke="currentColor" stroke-width="1.7"/><path d="M4 17c0-3.1 2.7-5.5 6-5.5s6 2.4 6 5.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>';
        const content = document.createElement('div');
        content.className = 'team-activity-content';
        const description = document.createElement('p');
        const actor = document.createElement('strong');
        actor.textContent = activity.actor.fullName;
        description.append(actor, document.createTextNode(` ${activity.action} `));
        const subject = document.createElement('span');
        subject.textContent = activity.subject || '';
        description.appendChild(subject);
        const meta = document.createElement('time');
        meta.dateTime = new Date(activity.date).toISOString();
        meta.textContent = `${activity.actor.role || 'Team member'} · ${dateFormatter.format(new Date(activity.date))}`;
        content.append(description, meta);
        item.append(avatar, content);
        list.appendChild(item);
      });
    }

    async function loadActivities() {
  if (activitiesLoaded) return;

  activitiesLoaded = true;

  try {

    // Load real backend data through dataService.js
    const {
      getCampaigns,
      getApplicants,
      getInterviews
    } = await import('./dataService.js');


    const [
      campaigns,
      applicants,
      interviews
    ] = await Promise.all([
      getCampaigns(),
      getApplicants(),
      getInterviews()
    ]);


    // buildActivities() already expects this structure.
    const database = {
      campaigns,
      applicants,
      interviews,

      // Users are not connected to the API yet.
      users: []
    };


    const activities =
      buildActivities(database);


    countBadge.textContent =
      activities.length > 9
        ? '9+'
        : String(activities.length);


    countBadge.classList.toggle(
      'zero',
      activities.length === 0
    );


    renderActivities(activities);

  }
  catch (error) {

    console.warn(
      'Team Activity: Could not load API data',
      error
    );


    countBadge.textContent = '0';

    countBadge.classList.add('zero');

    renderActivities([]);
  }
}

    trigger.addEventListener('click', async function() {
      const willOpen = !panel.classList.contains('is-open');
      if (!willOpen) {
        closePanel();
        return;
      }
      await loadActivities();
      panel.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
      requestAnimationFrame(placePanel);
    });
    closeButton.addEventListener('click', closePanel);
    document.addEventListener('pointerdown', function(event) {
      if (!panel.contains(event.target) && !trigger.contains(event.target)) closePanel();
    });
    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape') closePanel();
    });
    window.addEventListener('resize', function() {
      if (panel.classList.contains('is-open')) placePanel();
    });
    loadActivities();
  }


  // ============================================================
  // 1. ACTIVE PAGE HIGHLIGHTING
  // ============================================================
  const currentPath = location.pathname.replace(/^\/+/, '');
  sidebar.querySelectorAll('.nav-item:not(.logout-btn)').forEach(link => {
    const href = (link.getAttribute('href') || '').replace(/^\/+/, '');
    if (!href) return;
    const active = currentPath === href ||
                   currentPath.startsWith(href.split('/')[0]) ||
                   currentPath.includes(href.split('/').pop());
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });

  function syncSidebarLabels() {
    sidebar.querySelectorAll('.nav-item').forEach(item => {
      const label = item.querySelector('.label')?.textContent?.trim();
      if (!label) return;
      item.setAttribute('aria-label', label);
      item.title = label;
    });
    sidebar.querySelectorAll('.notification-item').forEach(item => {
      const label = item.querySelector('.notification-label')?.textContent?.trim();
      if (label) item.title = label;
    });
  }
  syncSidebarLabels();
  window.addEventListener('languageApplied', syncSidebarLabels);

  // ============================================================
  // 2. MOUSE TRACKING
  // ============================================================
  let mouseX = -9999;
  let mouseY = -9999;

  document.addEventListener('mousemove', function(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function isMouseOverSidebar() {
    const rect = sidebar.getBoundingClientRect();
    return (mouseX >= rect.left && mouseX <= rect.right &&
            mouseY >= rect.top && mouseY <= rect.bottom);
  }

  // ============================================================
  // 3. OPEN / CLOSE + BODY CLASS
  // ============================================================
  function openSidebar() {
    sidebar.classList.add('sidebar-hover');
    document.body.classList.add('sidebar-open');
  }

  function closeSidebar() {
    sidebar.classList.remove('sidebar-hover');
    document.body.classList.remove('sidebar-open');
  }

  // ============================================================
  // 4. HOVER LOGIC – INSTANT CLOSE
  // ============================================================
  let closeTimeout = null;
  let isNavigating = false;

  sidebar.addEventListener('mouseenter', function() {
    clearTimeout(closeTimeout);
    isNavigating = false;
    openSidebar();
  });

  sidebar.addEventListener('mouseleave', function() {
    if (isNavigating) return;

    clearTimeout(closeTimeout);
    closeTimeout = setTimeout(function() {
      if (!isMouseOverSidebar()) {
        closeSidebar();
      }
    }, 0); // ← Instant close
  });

  // ============================================================
  // 5. NAVIGATION – KEEP OPEN DURING PAGE CHANGE
  // ============================================================
  sidebar.querySelectorAll('a:not(.logout-btn)').forEach(function(link) {
    link.addEventListener('click', function() {
      isNavigating = true;
      sessionStorage.setItem('sidebarNavigating', 'true');
      openSidebar();
    });
  });

  // ============================================================
  // 6. INIT – NO BOUNCE
  // ============================================================
  function initSidebar() {
    const wasNavigating = sessionStorage.getItem('sidebarNavigating') === 'true';
    sessionStorage.removeItem('sidebarNavigating');

    // Disable transitions temporarily
    sidebar.style.transition = 'none';
    document.body.style.transition = 'none';

    if (wasNavigating) {
      if (isMouseOverSidebar()) {
        openSidebar();
      } else {
        closeSidebar();
      }
    } else {
      closeSidebar();
    }

    // Re-enable transitions
    void sidebar.offsetHeight; // force reflow
    requestAnimationFrame(function() {
      sidebar.style.transition = '';
      document.body.style.transition = '';
    });

    isNavigating = false;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSidebar);
  } else {
    initSidebar();
  }

  // ============================================================
  // 7. CLEANUP
  // ============================================================
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') {
      clearTimeout(closeTimeout);
    }
  });

  window.addEventListener('pagehide', function() {
    clearTimeout(closeTimeout);
  });

  console.log('✅ Sidebar: push without squish (body class)');

})();
