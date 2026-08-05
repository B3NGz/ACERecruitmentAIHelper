import { applyLanguage, setupLanguageObserver } from './i18n.js';

const APP_ROUTE_PATTERN = /^\/(Applicants|Assessments|Assets|Campaign|Dashboard|Interviews|Login|Rankings|Reports|Settings)(\/|$)/;
const GITHUB_PAGES_BASE_PATH = '/ACERecruitmentAIHelper';

function detectAppBasePath() {
  if (window.location.hostname.toLowerCase() === 'b3ngz.github.io') {
    return GITHUB_PAGES_BASE_PATH;
  }
  const segments = window.location.pathname.split('/').filter(Boolean);
  const appFolderIndex = segments.findIndex(segment =>
    /^(Applicants|Assessments|Assets|Campaign|Dashboard|Interviews|Login|Rankings|Reports|Settings)$/i.test(segment)
  );
  return appFolderIndex > 0 ? `/${segments.slice(0, appFolderIndex).join('/')}` : '';
}

const appBasePath = detectAppBasePath();

window.appUrl = function appUrl(path) {
  const value = String(path || '');
  if (!APP_ROUTE_PATTERN.test(value)) return value;
  return `${appBasePath}${value}`;
};

function rewriteInternalRoutes(root = document) {
  root.querySelectorAll?.('a[href], form[action]').forEach(element => {
    const attribute = element.hasAttribute('href') ? 'href' : 'action';
    const value = element.getAttribute(attribute);
    if (APP_ROUTE_PATTERN.test(value || '')) element.setAttribute(attribute, window.appUrl(value));
  });
}

function initializeAppRoutes() {
  rewriteInternalRoutes();
  document.addEventListener('click', event => {
    const anchor = event.target.closest('a[href]');
    if (!anchor || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const href = anchor.getAttribute('href');
    if (!APP_ROUTE_PATTERN.test(href || '')) return;
    event.preventDefault();
    window.location.assign(window.appUrl(href));
  }, true);

  new MutationObserver(records => {
    records.forEach(record => record.addedNodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) rewriteInternalRoutes(node);
    }));
  }).observe(document.body, { childList: true, subtree: true });
}

function initializeLanguage() {
  initializeAppRoutes();
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
