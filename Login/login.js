// ============================================================
// login.js – Google Authentication + Dark Mode (Pill Toggle)
// ============================================================

// ─── CONFIGURATION ───────────────────────────────────────────────
const CONFIG = {
    GOOGLE_CLIENT_ID: '1017608553091-1a8cla5nbt66t3gc8921n8d6hq4r42sf.apps.googleusercontent.com',
    API_BASE_URL: 'https://acerecruitmentai.onrender.com',
   REDIRECT_URL: 'https://b3ngz.github.io/ACERecruitmentAIHelper/Dashboard/dashboard.html',
    SPLASH_DURATION: 1450,
};

// ─── DOM REFS ────────────────────────────────────────────────────
const splash = document.getElementById('splash-overlay');
const loginContainer = document.getElementById('login-container');
const loadingEl = document.getElementById('google-loading');
const errorEl = document.getElementById('google-error');
let splashRevealed = false;
let googleLoadAttempts = 0;

// ─── SPLASH ANIMATION ───────────────────────────────────────────
function revealLogin() {
  if (!splash || splashRevealed) return;
  splashRevealed = true;
  if (loginContainer) loginContainer.classList.add('visible');
  requestAnimationFrame(() => splash.classList.add('fade-out'));
  const onEnd = (event) => {
    if (event.target !== splash || event.propertyName !== 'opacity') return;
    splash.classList.add('hidden');
    if (loginContainer) loginContainer.classList.add('visible');
    splash.removeEventListener('transitionend', onEnd);
  };
  splash.addEventListener('transitionend', onEnd);
  setTimeout(() => {
    if (!splash.classList.contains('hidden')) {
      splash.classList.add('hidden');
      if (loginContainer) loginContainer.classList.add('visible');
    }
  }, 1200);
}

// ─── DARK MODE ──────────────────────────────────────────────────
function getCurrentTheme() {
  return localStorage.getItem('theme') || 'light';
}

function setTheme(theme) {
  const isDark = theme === 'dark';
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  localStorage.setItem('theme', theme);
  // Update the pill toggle checkbox
  const checkbox = document.getElementById('loginDarkToggle');
  if (checkbox) checkbox.checked = isDark;
}

// ─── GOOGLE SIGN-IN ─────────────────────────────────────────────
function initGoogleSignIn() {
  const buttonContainer = document.getElementById('google-signin-button');
  if (!buttonContainer) {
    console.warn('Google button container not found');
    return;
  }

  if (typeof google === 'undefined') {
    googleLoadAttempts += 1;
    if (googleLoadAttempts >= 5) {
      if (errorEl) {
        errorEl.textContent = 'Google sign-in could not load. Please refresh and try again.';
        errorEl.style.display = 'block';
      }
      return;
    }
    setTimeout(initGoogleSignIn, 1000);
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

async function handleCredentialResponse(response) {
    if (loadingEl) loadingEl.style.display = 'block';
    if (errorEl) errorEl.style.display = 'none';

    try {
        if (!response?.credential) {
            throw new Error('Google did not return an ID token.');
        }

        const apiResponse = await fetch(
            `${CONFIG.API_BASE_URL}/api/Auth/google`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    idToken: response.credential
                })
            }
        );

        let result;

        try {
            result = await apiResponse.json();
        } catch {
            throw new Error(
                `Server returned ${apiResponse.status}.`
            );
        }

        if (!apiResponse.ok) {
            // Pending / Rejected / Inactive responses from AuthController
            throw new Error(
                result.message || 'Authentication failed.'
            );
        }

        if (!result.success || !result.token) {
            throw new Error(
                result.message || 'Login failed.'
            );
        }

        // This is OUR backend JWT, not Google's token.
        localStorage.setItem('token', result.token);

        // Store the backend user returned by AuthController.
        localStorage.setItem(
            'user',
            JSON.stringify(result.user)
        );

        window.location.href = CONFIG.REDIRECT_URL;
    }
    catch (err) {
        console.error('Sign-in failed:', err);

        if (errorEl) {
            errorEl.textContent =
                err.message || 'Sign-in failed. Please try again.';

            errorEl.style.display = 'block';
        }
    }
    finally {
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }
    }
}


// ─── DARK MODE TOGGLE (PILL) ──────────────────────────────────
function setupDarkToggle() {
  const checkbox = document.getElementById('loginDarkToggle');
  if (!checkbox) return;

  // Set initial state
  const isDark = document.documentElement.classList.contains('dark');
  checkbox.checked = isDark;

  checkbox.addEventListener('change', function() {
    const isDarkNow = this.checked;
    window.runThemeTransition({
      source: checkbox,
      update: () => {
        setTheme(isDarkNow ? 'dark' : 'light');
    // Re‑render Google button with new theme
        const container = document.getElementById('google-signin-button');
        if (container && typeof google !== 'undefined') {
          container.innerHTML = '';
          initGoogleSignIn();
        }
      }
    });
  });

  // Listen for theme changes from other tabs
  window.addEventListener('storage', (e) => {
    if (e.key === 'theme') {
      const newTheme = e.newValue || 'light';
      const isDarkNow = newTheme === 'dark';
      checkbox.checked = isDarkNow;
      setTheme(newTheme);
    }
  });
}

// ─── INIT ──────────────────────────────────────────────────────
function init() {
  // Apply saved theme
  const savedTheme = getCurrentTheme();
  setTheme(savedTheme);

  // Splash
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  setTimeout(revealLogin, reducedMotion ? 240 : CONFIG.SPLASH_DURATION);
  document.addEventListener('click', (e) => {
    if (e.target.closest('#google-signin-button')) return;
    if (!splash?.classList.contains('fade-out') && !splash?.classList.contains('hidden')) {
      revealLogin();
    }
  });
  document.addEventListener('keydown', () => {
    if (!splash?.classList.contains('fade-out') && !splash?.classList.contains('hidden')) {
      revealLogin();
    }
  });

  // Google Sign-In
  if (document.readyState === 'complete') {
    setTimeout(initGoogleSignIn, 500);
  } else {
    window.addEventListener('load', () => {
      setTimeout(initGoogleSignIn, 500);
    });
  }

  // Dark mode toggle
  setupDarkToggle();

}

// ─── START ─────────────────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Expose for Google callback
window.handleCredentialResponse = handleCredentialResponse;
