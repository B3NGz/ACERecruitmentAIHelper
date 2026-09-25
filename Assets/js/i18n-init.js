import { applyLanguage, setupLanguageObserver } from './i18n.js';

function initializeLanguage() {
  try {
    const preferences = JSON.parse(localStorage.getItem('user_preferences') || '{}');
    const compact = preferences.density === 'compact' || (!preferences.density && preferences.compactMode === true);
    document.body.classList.toggle('compact', compact);
    document.documentElement.classList.toggle('reduce-motion', preferences.reduceMotion === true);
  } catch {}
  applyLanguage();
  setupLanguageObserver();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeLanguage, { once: true });
} else {
  initializeLanguage();
}
