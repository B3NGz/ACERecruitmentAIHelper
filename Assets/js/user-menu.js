// ============================================================
// USER MENU – Sidebar + Header Welcome
// ============================================================

'use strict';

// ─── CONFIGURATION ───────────────────────────────────────────────
const CONFIG = {
  GOOGLE_CLIENT_ID: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
  PROTECT_PAGES: false,
  REDIRECT_URL: '../Dashboard/dashboard.html',
};

const IS_LOGIN_PAGE = window.location.pathname.includes('/Login/');

// ─── UTILITY ────────────────────────────────────────────────────
function getUser() {
  try {
    const data = localStorage.getItem('user');
    return data ? JSON.parse(data) : null;
  } catch { return null; }
}

function setUser(user) {
  localStorage.setItem('user', JSON.stringify(user));
}

function clearUser() {
  localStorage.removeItem('user');
}

function getProfileIcon(size = 20) {
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  `;
}

// ─── LOGOUT ──────────────────────────────────────────────────────
import { showLogoutModal } from './ui.js';
import { initChat } from './chat.js';

function logout() {
  const user = getUser();
  if (user && user.idToken) {
    try {
      google.accounts.id.disableAutoSelect();
      google.accounts.id.revoke(user.idToken, () => {});
    } catch (e) {}
  }
  clearUser();
  window.location.href = '../Login/login.html';
}

// ─── RENDER HEADER WELCOME ────────────────────────────────────
function renderHeaderWelcome(user) {
  const container = document.getElementById('userMenuContainer');
  if (!container) return;

  if (!user) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <span class="welcome-text">Welcome,</span>
    <span class="user-name-header">${user.fullName || 'User'}</span>
    <a href="../Settings/settings.html" class="settings-icon-link" aria-label="Open settings" title="Settings">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M12 2.75v2.1M12 19.15v2.1M21.25 12h-2.1M4.85 12h-2.1M18.54 5.46l-1.48 1.48M6.94 17.06l-1.48 1.48M18.54 18.54l-1.48-1.48M6.94 6.94 5.46 5.46"/>
        <circle cx="12" cy="12" r="5.15"/>
        <circle cx="12" cy="12" r="1.9"/>
      </svg>
      <span class="settings-icon-label">Settings</span>
    </a>
  `;
}

// ─── RENDER SIDEBAR USER MENU ────────────────────────────────
function renderSidebarUserMenu(user) {
  const generalNav = document.querySelector('.sidebar .general-nav');
  if (!generalNav) {
    console.warn('⚠️ .sidebar .general-nav not found – skipping sidebar user menu');
    return;
  }

  if (!user) {
    generalNav.innerHTML = `
      <a href="#" class="nav-item logout-btn" id="logoutSidebarBtn" data-page="logout">
        <span class="icon"><svg viewBox="0 0 20 20" fill="none"><path d="M8 1H4C2.89543 1 2 1.89543 2 3V17C2 18.1046 2.89543 19 4 19H8M13 14L18 9L13 14ZM18 9L13 4L18 9ZM18 9H8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
        <span class="label">Logout</span>
      </a>
    `;
    return;
  }

  generalNav.innerHTML = `
    <div class="user-menu-sidebar" id="userMenuSidebar">
      <button class="user-menu-trigger sidebar-user-trigger" id="userMenuTrigger" aria-label="User menu">
        <span class="user-avatar">${getProfileIcon(20)}</span>
        <span class="user-name">${user.fullName || 'User'}</span>
        <svg class="user-chevron" width="12" height="8" viewBox="0 0 12 8" fill="none">
          <path d="M1 1L6 6L11 1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

      <div class="user-dropdown sidebar-user-dropdown" id="userDropdown">
        <div class="user-dropdown-header">
          <span class="user-dropdown-avatar">${getProfileIcon(24)}</span>
          <div>
            <div class="user-dropdown-name">${user.fullName || 'User'}</div>
            <div class="user-dropdown-email">${user.email || ''}</div>
          </div>
        </div>
        <div class="user-dropdown-divider"></div>
        <a href="../Settings/settings.html" class="user-dropdown-item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c0 .66.39 1.26 1 1.51H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          Settings
        </a>
        <a href="#" class="user-dropdown-item" id="userDropdownLogout">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M8 1H4C2.89543 1 2 1.89543 2 3V17C2 18.1046 2.89543 19 4 19H8M13 14L18 9L13 14ZM18 9L13 4L18 9ZM18 9H8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Sign Out
        </a>
      </div>
    </div>
  `;

  setupDropdown();
}

// ─── DROPDOWN LOGIC ────────────────────────────────────────────
function setupDropdown() {
  const trigger = document.getElementById('userMenuTrigger');
  const menu = document.getElementById('userMenuSidebar');

  if (trigger && menu) {
    trigger.removeEventListener('click', trigger._clickHandler);
    trigger._clickHandler = function(e) {
      e.stopPropagation();
      menu.classList.toggle('open');
    };
    trigger.addEventListener('click', trigger._clickHandler);

    document.removeEventListener('click', menu._outsideClickHandler);
    menu._outsideClickHandler = function(e) {
      if (menu && !menu.contains(e.target)) {
        menu.classList.remove('open');
      }
    };
    document.addEventListener('click', menu._outsideClickHandler);

    document.removeEventListener('keydown', menu._escapeHandler);
    menu._escapeHandler = function(e) {
      if (e.key === 'Escape' && menu && menu.classList.contains('open')) {
        menu.classList.remove('open');
      }
    };
    document.addEventListener('keydown', menu._escapeHandler);
  }

  // Sign Out button inside dropdown – use event delegation
  const dropdown = document.getElementById('userDropdown');
  if (dropdown) {
    dropdown.removeEventListener('click', dropdown._logoutHandler);
    dropdown._logoutHandler = function(e) {
      const target = e.target.closest('#userDropdownLogout');
      if (target) {
        e.preventDefault();
        showLogoutModal();
      }
    };
    dropdown.addEventListener('click', dropdown._logoutHandler);
  }
}

// ─── SIDEBAR LOGOUT ──────────────────────────────────────────
function setupSidebarLogout() {
  const generalNav = document.querySelector('.sidebar .general-nav');
  if (!generalNav) return;

  generalNav.removeEventListener('click', generalNav._logoutHandler);
  generalNav._logoutHandler = function(e) {
    const target = e.target.closest('#logoutSidebarBtn');
    if (target) {
      e.preventDefault();
      showLogoutModal();
    }
  };
  generalNav.addEventListener('click', generalNav._logoutHandler);
}

// ─── PAGE PROTECTION ────────────────────────────────────────────
function protectPage() {
  const user = getUser();

  if (IS_LOGIN_PAGE) {
    if (CONFIG.PROTECT_PAGES && user) {
      window.location.href = '../Dashboard/dashboard.html';
      return;
    }
    return;
  }

  if (!CONFIG.PROTECT_PAGES) {
    if (!user) {
      const defaultUser = {
        fullName: 'Demo User',
        email: 'demo@acerecruit.com',
        picture: '',
        givenName: 'Demo',
        familyName: 'User',
        sub: 'demo-123',
        idToken: 'demo-token'
      };
      setUser(defaultUser);
    }
    const currentUser = getUser();
    renderHeaderWelcome(currentUser);
    renderSidebarUserMenu(currentUser);
    return;
  }

  if (!user) {
    window.location.href = '../Login/login.html';
    return;
  }

  renderHeaderWelcome(user);
  renderSidebarUserMenu(user);
}

// ─── GOOGLE SIGN-IN ─────────────────────────────────────────────
function initGoogleSignIn() {
  const buttonContainer = document.getElementById('google-signin-button');
  if (!buttonContainer) {
    console.warn('Google button container not found');
    return;
  }

  if (typeof google === 'undefined') {
    console.warn('Google Identity Services not loaded – retrying...');
    setTimeout(initGoogleSignIn, 2000);
    return;
  }

  const isDark = document.documentElement.classList.contains('dark');

  google.accounts.id.initialize({
    client_id: CONFIG.GOOGLE_CLIENT_ID,
    callback: handleCredentialResponse,
    cancel_on_tap_outside: false,
  });

  google.accounts.id.renderButton(buttonContainer, {
    type: 'standard',
    shape: 'pill',
    theme: isDark ? 'filled_blue' : 'outline',
    text: 'continue_with',
    size: 'large',
    logo_alignment: 'left',
    width: 280,
  });
}

function handleCredentialResponse(response) {
  try {
    const payload = decodeJwt(response.credential);
    const user = {
      fullName: payload.name || 'User',
      email: payload.email || '',
      picture: payload.picture || '',
      givenName: payload.given_name || '',
      familyName: payload.family_name || '',
      sub: payload.sub || '',
      idToken: response.credential,
    };
    setUser(user);
    window.location.href = CONFIG.REDIRECT_URL;
  } catch (err) {
    console.error('Sign-in failed:', err);
  }
}

function decodeJwt(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
  );
  return JSON.parse(jsonPayload);
}

// ─── SPLASH ANIMATION ──────────────────────────────────────────
function setupSplash() {
  if (!IS_LOGIN_PAGE) return;
  const splash = document.getElementById('splash-overlay');
  const login = document.getElementById('login-container');
  if (!splash || !login) return;

  function revealLogin() {
    splash.classList.add('fade-out');
    const onEnd = () => {
      splash.classList.add('hidden');
      login.classList.add('visible');
      splash.removeEventListener('transitionend', onEnd);
    };
    splash.addEventListener('transitionend', onEnd);
    setTimeout(() => {
      if (!splash.classList.contains('hidden')) {
        splash.classList.add('hidden');
        login.classList.add('visible');
      }
    }, 2500);
  }

  setTimeout(revealLogin, 2500);
}

// ─── INIT ──────────────────────────────────────────────────────
function init() {
  setupSplash();

  if (IS_LOGIN_PAGE) {
    if (document.readyState === 'complete') {
      setTimeout(initGoogleSignIn, 500);
    } else {
      window.addEventListener('load', function() {
        setTimeout(initGoogleSignIn, 500);
      });
    }
  } else {
    protectPage();
    initChat();
  }

  // ─── Setup sidebar logout (uses showLogoutModal from ui.js) ──
  setupSidebarLogout();

  if (localStorage.getItem('theme') === 'dark') {
    document.documentElement.classList.add('dark');
  }
}

// ─── EXPORT ─────────────────────────────────────────────────────
export { init as initUserMenu };

// ─── GLOBAL FALLBACK ───────────────────────────────────────────
window.initUserMenu = init;
window.handleCredentialResponse = handleCredentialResponse;
