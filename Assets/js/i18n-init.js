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
  if (!value || /^(?:[a-z]+:)?\/\//i.test(value) || value.startsWith('#')) return value;

  // Normalize legacy/manual GitHub Pages prefixes before adding the canonical
  // base. This makes routing idempotent and collapses accidental doubled paths.
  let route = value.replace(/^(?:\.\.\/)+/, '/');
  route = route.replace(/^\/?(?:ACERec(?:r)?uitmentAIHelper\/)+/i, '/');
  if (!APP_ROUTE_PATTERN.test(route)) return value;
  return `${appBasePath}${route}`;
};

function rewriteInternalRoutes(root = document) {
  const elements = [
    ...(root.matches?.('a[href], form[action]') ? [root] : []),
    ...(root.querySelectorAll?.('a[href], form[action]') || [])
  ];
  elements.forEach(element => {
    const attribute = element.hasAttribute('href') ? 'href' : 'action';
    const value = element.getAttribute(attribute);
    const normalized = window.appUrl(value);
    if (normalized !== value) element.setAttribute(attribute, normalized);
  });
}

function initializeAppRoutes() {
  rewriteInternalRoutes();
  document.addEventListener('click', event => {
    const anchor = event.target.closest('a[href]');
    if (!anchor || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const href = anchor.getAttribute('href');
    const normalized = window.appUrl(href);
    if (normalized === href) return;
    event.preventDefault();
    window.location.assign(normalized);
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
