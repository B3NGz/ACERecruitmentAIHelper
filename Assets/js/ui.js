// ============================================================
// ui.js – Shared UI utilities: dark mode, dropdowns, modals, search clear, breadcrumbs
// ============================================================

import { showToast } from './toast.js';
import './theme-transition.js';

// Shape-matched placeholders shown while API-backed page sections are empty.
export function initDataSkeletons(root = document) {
  root.querySelectorAll('tbody:empty').forEach(tbody => {
    const table = tbody.closest('table');
    const columnCount = Math.max(1, table?.querySelectorAll('thead th:not([style*="display:none"])').length || 1);
    const rowCount = tbody.id === 'skills-matrix' ? 4 : 5;
    tbody.setAttribute('aria-busy', 'true');
    tbody.innerHTML = Array.from({ length: rowCount }, () =>
      `<tr class="skeleton-table-row" aria-hidden="true">${Array.from(
        { length: columnCount },
        () => '<td><span class="skeleton-block"></span></td>'
      ).join('')}</tr>`
    ).join('');
  });

  root.querySelectorAll('.stat-value:empty').forEach(element => {
    element.setAttribute('aria-busy', 'true');
    element.innerHTML = '<span class="skeleton-block skeleton-block--stat" aria-hidden="true"></span>';
  });

  const detailSkeletons = {
    '#applicant-name': 'title',
    '#campaign-title': 'title',
    '#applicant-score': 'score',
    '#applicant-recommendation': 'badge'
  };
  Object.entries(detailSkeletons).forEach(([selector, shape]) => {
    const element = root.querySelector(selector);
    if (!element || element.textContent.trim() || element.children.length) return;
    element.setAttribute('aria-busy', 'true');
    element.innerHTML = `<span class="skeleton-block skeleton-block--${shape}" aria-hidden="true"></span>`;
  });

  root.querySelectorAll('#applicant-summary:empty, #score-breakdown:empty, #category-scores:empty').forEach(element => {
    element.setAttribute('aria-busy', 'true');
    element.innerHTML = Array.from(
      { length: element.id === 'category-scores' ? 4 : 3 },
      () => '<span class="skeleton-block skeleton-block--line" aria-hidden="true"></span>'
    ).join('');
  });
}

const PAGE_DESCRIPTIONS = {
  '/Dashboard/': 'Monitor recruitment activity and focus the team on the next decisions.',
  '/Applicants/applicants': 'Review every candidate, compare fit, and move the strongest applicants forward.',
  '/Applicants/applicant-details': 'Review candidate evidence, assessment results, and hiring recommendations.',
  '/Assessments/': 'Evaluate completed AI assessments and identify candidates requiring review.',
  '/Campaign/create-campaign': 'Set up a campaign using the fields supported by the recruitment database.',
  '/Campaign/campaign-details': 'Review campaign requirements, documents, and associated applicants.',
  '/Campaign/campaign': 'Manage active and historical recruitment campaigns from one workspace.',
  '/Interviews/': 'Coordinate upcoming interviews and keep feedback moving on schedule.',
  '/Rankings/': 'Compare candidates by assessment score and recommendation strength.',
  '/Reports/': 'Prepare concise candidate submission packs for client review.',
  '/Settings/': 'Configure workspace preferences, appearance, and connected services.'
};

export function initPageHierarchy(root = document) {
  const header = root.querySelector('.dashboard-header');
  const title = header?.querySelector('h1');
  if (!header || !title) return;

  let heading = title.parentElement;
  if (heading === header) {
    heading = document.createElement('div');
    heading.className = 'page-heading';
    header.insertBefore(heading, title);
    heading.appendChild(title);
  } else {
    heading.classList.add('page-heading');
  }

  if (heading.querySelector('.page-subtitle')) return;
  const path = window.location.pathname;
  const key = Object.keys(PAGE_DESCRIPTIONS).find(candidate => path.includes(candidate));
  if (!key) return;
  const subtitle = document.createElement('p');
  subtitle.className = 'page-subtitle';
  subtitle.textContent = PAGE_DESCRIPTIONS[key];
  title.insertAdjacentElement('afterend', subtitle);
}

const EMPTY_ACTIONS = {
  'campaign-list': { label: 'Create campaign', href: '../Campaign/create-campaign.html' },
  'applicant-list': { label: 'View campaigns', href: '../Campaign/campaign.html' },
  'assessments-list': { label: 'View applicants', href: '../Applicants/applicants.html' },
  'interviews-list': { label: 'View applicants', href: '../Applicants/applicants.html' },
  'rankings-list': { label: 'View applicants', href: '../Applicants/applicants.html' },
  'reports-list': { label: 'View applicants', href: '../Applicants/applicants.html' },
  'candidate-selection-list': { label: 'View applicants', href: '../Applicants/applicants.html' },
  'top-candidates': { label: 'View all applicants', href: '../Applicants/applicants.html' }
};

export function enhanceEmptyStates(root = document) {
  root.querySelectorAll('tbody').forEach(tbody => {
    if (tbody.querySelector('.empty-state')) return;
    const rows = tbody.querySelectorAll('tr');
    if (rows.length !== 1) return;
    const cells = rows[0].querySelectorAll('td');
    if (cells.length !== 1) return;
    const message = cells[0].textContent.trim();
    if (!/^(No\b|Trash is empty)/i.test(message)) return;

    const action = EMPTY_ACTIONS[tbody.id];
    cells[0].innerHTML = `<div class="empty-state">
      <span class="empty-state-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M7 3.75h7.5L19 8.25v11A1.75 1.75 0 0 1 17.25 21H7a2 2 0 0 1-2-2V5.75A2 2 0 0 1 7 3.75Z" stroke="currentColor" stroke-width="1.6"/><path d="M14 3.75v4.5h5M8.5 13h7M8.5 16.5h4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></span>
      <strong>Nothing to show yet</strong>
      <p>${message}</p>
      ${action ? `<a class="btn btn-secondary" href="${action.href}">${action.label}</a>` : ''}
    </div>`;
  });
}

function scoreBand(score) {
  if (score >= 80) return 'score-band--high';
  if (score >= 60) return 'score-band--good';
  if (score >= 40) return 'score-band--review';
  return 'score-band--low';
}

export function applySemanticDataStyles(root = document) {
  root.querySelectorAll('table').forEach(table => {
    const headers = [...table.querySelectorAll('thead th')];
    const scoreIndex = headers.findIndex(header => /score$/.test(header.textContent.trim().toLowerCase()));
    if (scoreIndex < 0) return;

    table.querySelectorAll('tbody tr:not(.skeleton-table-row)').forEach(row => {
      const cell = row.children[scoreIndex];
      if (!cell || cell.classList.contains('score-cell')) return;
      const score = Number.parseFloat(cell.textContent.trim());
      if (!Number.isFinite(score)) return;
      cell.classList.add('score-cell', scoreBand(score));
      cell.dataset.score = String(score);
      cell.setAttribute('aria-label', `Score: ${score}`);
    });
  });

  const applicantScore = root.querySelector('#applicant-score');
  if (applicantScore && !applicantScore.querySelector('.skeleton-block')) {
    const score = Number.parseFloat(applicantScore.textContent.trim());
    applicantScore.classList.remove('score-band--high', 'score-band--good', 'score-band--review', 'score-band--low');
    if (Number.isFinite(score)) applicantScore.classList.add(scoreBand(score));
  }

  root.querySelectorAll('#rankings-list tr:not(.skeleton-table-row)').forEach((row, index) => {
    row.classList.remove('rank-tier--gold', 'rank-tier--silver', 'rank-tier--bronze');
    if (index === 0) row.classList.add('rank-tier--gold');
    if (index === 1) row.classList.add('rank-tier--silver');
    if (index === 2) row.classList.add('rank-tier--bronze');
  });
}

let lastInteraction = {
  x: window.innerWidth / 2,
  y: window.innerHeight / 2,
  time: 0
};

function addButtonRipple(control, event) {
  if (document.documentElement.classList.contains('reduce-motion') || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const rect = control.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 1.8;
  const ripple = document.createElement('span');
  ripple.className = 'interaction-ripple';
  ripple.style.width = `${size}px`;
  ripple.style.height = `${size}px`;
  ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
  ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
  control.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
}

function celebrate(origin = lastInteraction) {
  if (document.documentElement.classList.contains('reduce-motion') || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const recent = Date.now() - origin.time < 1800;
  const x = recent ? origin.x : window.innerWidth - 48;
  const y = recent ? origin.y : 72;
  const colors = ['#2563eb', '#0f8b8d', '#7555b7', '#16805d', '#e5aa55'];

  for (let index = 0; index < 18; index += 1) {
    const particle = document.createElement('span');
    const angle = (Math.PI * 2 * index) / 18 + Math.random() * 0.28;
    const distance = 42 + Math.random() * 66;
    particle.className = 'success-confetti';
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    particle.style.background = colors[index % colors.length];
    particle.style.setProperty('--confetti-x', `${Math.cos(angle) * distance}px`);
    particle.style.setProperty('--confetti-y', `${Math.sin(angle) * distance + 32}px`);
    particle.style.setProperty('--confetti-rotate', `${120 + Math.random() * 480}deg`);
    particle.style.setProperty('--confetti-delay', `${Math.random() * 70}ms`);
    document.body.appendChild(particle);
    particle.addEventListener('animationend', () => particle.remove(), { once: true });
  }
}

export function initMicroInteractions() {
  document.addEventListener('pointerdown', event => {
    const control = event.target.closest('.btn, .nav-item, .user-dropdown-item, .theme-choice, .density-choice');
    if (!control || control.matches(':disabled, [aria-disabled="true"]')) return;
    lastInteraction = { x: event.clientX, y: event.clientY, time: Date.now() };
    addButtonRipple(control, event);
  });

  document.addEventListener('click', event => {
    const destructive = event.target.closest('#move-to-trash-btn, #empty-trash-btn, .delete-permanent-btn');
    if (!destructive) return;
    destructive.classList.remove('interaction-nudge');
    void destructive.offsetWidth;
    destructive.classList.add('interaction-nudge');
  });

  window.addEventListener('ui:celebrate', () => celebrate());
}

function clearResolvedSkeletonState(mutations) {
  mutations.forEach(({ target }) => {
    const element = target.nodeType === Node.ELEMENT_NODE ? target : target.parentElement;
    const busy = element?.closest?.('[aria-busy="true"]');
    if (busy && !busy.querySelector('.skeleton-block')) busy.removeAttribute('aria-busy');
  });
  enhanceEmptyStates(document);
  applySemanticDataStyles(document);
}

// Page modules are loaded at the end of the document, before their API calls begin.
initPageHierarchy(document);
initDataSkeletons(document);
enhanceEmptyStates(document);
applySemanticDataStyles(document);
initMicroInteractions();
new MutationObserver(clearResolvedSkeletonState).observe(document.body, {
  childList: true,
  subtree: true
});

// ─── DARK MODE TOGGLE SWITCH ──────────────────────────────
export function initDarkMode() {
  const toggle = document.getElementById('darkModeToggle');
  if (!toggle) return;

  function applyTheme(isDark) {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    toggle.checked = isDark;
    updateKnob(isDark);
    // Dispatch event for charts and other listeners
    document.dispatchEvent(new CustomEvent('themeChanged', { detail: { isDark } }));
  }

  function updateKnob(isDark) {
    const knob = document.getElementById('toggleKnob');
    if (knob) {
      knob.classList.toggle('dark', isDark);
    }
  }

  // Load saved state
  const savedTheme = localStorage.getItem('theme');
  const isDark = savedTheme === 'dark';
  applyTheme(isDark);

  // Event listener
  toggle.addEventListener('change', function() {
    const requestedTheme = this.checked;
    window.runThemeTransition({
      source: toggle,
      update: () => applyTheme(requestedTheme)
    });
  });
}

// ─── Watch for theme changes (sync knob) ──────────────────
const themeObserver = new MutationObserver(() => {
  const isDark = document.documentElement.classList.contains('dark');
  const knob = document.getElementById('toggleKnob');
  if (knob) {
    knob.classList.toggle('dark', isDark);
  }
  document.dispatchEvent(new CustomEvent('themeChanged', { detail: { isDark } }));
});
themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

// ─── CUSTOM DROPDOWNS ──────────────────────────────────────
export function initDropdowns(container = document) {
  const dropdowns = container.querySelectorAll('.custom-dropdown');

  dropdowns.forEach(dropdown => {
    const btn = dropdown.querySelector('.dropdown-btn');
    const searchInput = dropdown.querySelector('.dropdown-search-input');
    const selectedText = dropdown.querySelector('.selected-text');
    const menu = dropdown.querySelector('.dropdown-menu');
    const noResults = dropdown.querySelector('.dropdown-no-results');

    if (!btn) return;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdown.classList.contains('open');
      document.querySelectorAll('.custom-dropdown.open').forEach(d => d.classList.remove('open'));
      if (!isOpen) {
        dropdown.classList.add('open');
        if (searchInput) setTimeout(() => searchInput.focus(), 50);
      }
    });

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        e.stopPropagation();
        const query = searchInput.value.toLowerCase().trim();
        let hasVisible = false;
        dropdown.querySelectorAll('.dropdown-item').forEach(item => {
          const text = item.textContent.toLowerCase();
          if (text.includes(query)) {
            item.classList.remove('hidden');
            hasVisible = true;
          } else {
            item.classList.add('hidden');
          }
        });
        if (noResults) noResults.style.display = hasVisible ? 'none' : 'block';
      });
      searchInput.addEventListener('click', e => e.stopPropagation());
      searchInput.addEventListener('mousedown', e => e.stopPropagation());
    }

    if (menu) {
      menu.addEventListener('mousedown', e => e.stopPropagation());
      menu.addEventListener('click', e => {
        const item = e.target.closest('.dropdown-item');
        if (!item || !menu.contains(item)) return;
        e.stopPropagation();
        dropdown.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        const itemText = item.childNodes[0]?.textContent?.trim() || item.textContent.trim();
        if (selectedText) selectedText.textContent = itemText;
        dropdown.dataset.value = item.dataset.value;
        dropdown.classList.remove('open');
        dropdown.dispatchEvent(new CustomEvent('dropdownChange', {
          detail: { value: item.dataset.value, text: itemText }
        }));
      });
    }
  });

  document.addEventListener('mousedown', (e) => {
    if (!e.target.closest('.custom-dropdown')) {
      document.querySelectorAll('.custom-dropdown.open').forEach(d => d.classList.remove('open'));
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.custom-dropdown.open').forEach(d => d.classList.remove('open'));
    }
  });
}

// ─── SEARCH CLEAR BUTTON ──────────────────────────────────
export function initSearchClear(inputId, clearBtnId) {
  const input = document.getElementById(inputId);
  const clearBtn = document.getElementById(clearBtnId);
  if (!input || !clearBtn) return;

  input.addEventListener('input', () => {
    clearBtn.style.display = input.value ? 'block' : 'none';
  });
  clearBtn.addEventListener('click', () => {
    input.value = '';
    input.dispatchEvent(new Event('input'));
    clearBtn.style.display = 'none';
  });
}

// ─── OPTIMIZED LOGOUT MODAL ──────────────────────────────
let modalTimeout = null;

export function showLogoutModal() {
  const modal = document.getElementById('logoutModal');
  if (!modal) return;
  
  // Make it visible but start hidden
  modal.style.display = 'flex';
  // Force reflow to enable transition
  void modal.offsetHeight;
  // Animate in
  modal.style.opacity = '1';
  const inner = modal.querySelector('div:first-child');
  if (inner) {
    inner.style.opacity = '1';
    inner.style.transform = 'scale(1)';
  }
  document.body.style.overflow = 'hidden';
}

export function hideLogoutModal() {
  const modal = document.getElementById('logoutModal');
  if (!modal) return;
  
  // Animate out
  modal.style.opacity = '0';
  const inner = modal.querySelector('div:first-child');
  if (inner) {
    inner.style.opacity = '0';
    inner.style.transform = 'scale(0.95)';
  }
  // After transition, hide completely
  clearTimeout(modalTimeout);
  modalTimeout = setTimeout(() => {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }, 300);
}

export function initLogoutModal() {
  const logoutBtn = document.getElementById('logoutSidebarBtn');
  const logoutModal = document.getElementById('logoutModal');
  const confirmBtn = document.getElementById('confirmLogoutBtn');
  const cancelBtn = document.getElementById('cancelLogoutBtn');

  if (logoutBtn) {
    // Remove existing listeners to prevent duplicates
    const newBtn = logoutBtn.cloneNode(true);
    logoutBtn.parentNode.replaceChild(newBtn, logoutBtn);
    newBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showLogoutModal();
    });
  }

  // Confirm button
  if (confirmBtn) {
    const newConfirm = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirm, confirmBtn);
    newConfirm.addEventListener('click', () => {
      sessionStorage.removeItem('sidebarHover');
      localStorage.removeItem('theme');
      window.location.href = '../Login/login.html';
    });
  }

  // Cancel button
  if (cancelBtn) {
    const newCancel = cancelBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);
    newCancel.addEventListener('click', hideLogoutModal);
  }

  // Click outside
  if (logoutModal) {
    logoutModal.removeEventListener('click', window._modalOutsideClick);
    window._modalOutsideClick = (e) => {
      if (e.target === logoutModal) {
        hideLogoutModal();
      }
    };
    logoutModal.addEventListener('click', window._modalOutsideClick);
  }

  // Escape key
  document.removeEventListener('keydown', window._logoutEscapeHandler);
  window._logoutEscapeHandler = (e) => {
    if (e.key === 'Escape') {
      const modal = document.getElementById('logoutModal');
      if (modal && modal.style.display === 'flex') {
        hideLogoutModal();
      }
    }
  };
  document.addEventListener('keydown', window._logoutEscapeHandler);
}

// ─── BREADCRUMBS ──────────────────────────────────────────
export function renderBreadcrumbs(containerId, items) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const html = `
    <ol class="breadcrumbs">
      ${items.map((item, index) => `
        <li>
          ${item.url ? `<a href="${item.url}">${item.label}</a>` : `<span class="current">${item.label}</span>`}
          ${index < items.length - 1 ? `<span class="separator"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6" /></svg></span>` : ''}
        </li>
      `).join('')}
    </ol>
  `;
  container.innerHTML = html;
}

// ─── TOAST WRAPPER ────────────────────────────────────────
export function toast(message, type = 'success', duration = 4000) {
  return showToast(message, type, duration);
}
