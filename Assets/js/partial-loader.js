// ============================================================
// partial-loader.js – Load HTML partials into placeholders
// ============================================================

/**
 * Load a single partial HTML file into a placeholder element
 * @param {string} placeholderId – ID of the element to insert into
 * @param {string} url – URL of the partial HTML file
 * @param {Function} callback – Optional callback after load
 * @returns {Promise} – Resolves when loaded
 */
export function loadPartial(placeholderId, url, callback = null) {
  return new Promise((resolve, reject) => {
    const placeholder = document.getElementById(placeholderId);
    if (!placeholder) {
      console.warn(`⚠️ Placeholder #${placeholderId} not found`);
      reject(new Error(`Placeholder #${placeholderId} not found`));
      return;
    }

    // Check if already loaded (to avoid double fetching)
    if (placeholder.dataset.loaded === 'true') {
      if (callback) callback();
      resolve();
      return;
    }

    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load ${url}: ${response.status} ${response.statusText}`);
        }
        return response.text();
      })
      .then(html => {
        placeholder.innerHTML = html;
        placeholder.dataset.loaded = 'true';
        if (callback) callback();
        resolve();
      })
      .catch(error => {
        console.warn(`⚠️ Could not load partial ${url}:`, error);
        // Leave placeholder empty or show error message
        placeholder.innerHTML = `<div style="color:var(--text-muted);padding:0.5rem;">⚠️ Could not load component</div>`;
        reject(error);
      });
  });
}

/**
 * Load multiple partials in parallel
 * @param {Array} partials – Array of { id, url } objects
 * @param {Function} onProgress – Optional callback per loaded partial
 * @returns {Promise} – Resolves when all are loaded
 */
export function loadPartials(partials, onProgress = null) {
  if (!partials || partials.length === 0) {
    return Promise.resolve();
  }

  const promises = partials.map(({ id, url }) => {
    return loadPartial(id, url)
      .then(() => {
        if (onProgress) onProgress(id, url);
      })
      .catch(() => {
        // Continue even if one fails
        if (onProgress) onProgress(id, url, true);
      });
  });

  return Promise.all(promises);
}

/**
 * Load partials with a loading indicator
 * @param {Array} partials – Array of { id, url } objects
 * @param {string} loadingText – Text to show while loading
 * @returns {Promise}
 */
export function loadPartialsWithIndicator(partials, loadingText = 'Loading...') {
  // Show loading state in all placeholders
  partials.forEach(({ id }) => {
    const el = document.getElementById(id);
    if (el) {
      el.innerHTML = `<div style="padding:0.5rem;text-align:center;color:var(--text-muted);font-size:0.85rem;">${loadingText}</div>`;
    }
  });

  return loadPartials(partials);
}

/**
 * Load sidebar, logout modal, and floating background (common set)
 * @param {Object} options – Optional overrides for IDs
 * @returns {Promise}
 */
export function loadCommonPartials(options = {}) {
  const {
    sidebarId = 'sidebar-placeholder',
    logoutModalId = 'logout-modal-placeholder',
    floatingBgId = 'floating-bg-placeholder',
    basePath = '/Assets/partials/'
  } = options;

  return loadPartials([
    { id: sidebarId, url: `${basePath}sidebar.html` },
    { id: logoutModalId, url: `${basePath}logout-modal.html` },
    { id: floatingBgId, url: `${basePath}floating-bg.html` }
  ]);
}

/**
 * Check if a partial is already loaded
 * @param {string} placeholderId – ID of the placeholder element
 * @returns {boolean}
 */
export function isPartialLoaded(placeholderId) {
  const el = document.getElementById(placeholderId);
  return el && el.dataset.loaded === 'true';
}

/**
 * Clear a loaded partial (for dynamic content refresh)
 * @param {string} placeholderId – ID of the placeholder element
 */
export function clearPartial(placeholderId) {
  const el = document.getElementById(placeholderId);
  if (el) {
    el.innerHTML = '';
    el.dataset.loaded = 'false';
  }
}

// ─── DEFAULT EXPORT ──────────────────────────────────────────────
export default {
  loadPartial,
  loadPartials,
  loadPartialsWithIndicator,
  loadCommonPartials,
  isPartialLoaded,
  clearPartial
};