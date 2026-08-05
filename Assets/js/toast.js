// ============================================================
// toast.js – Toast notification system with SVG icons
// ============================================================

const toastContainer = document.createElement('div');
toastContainer.id = 'toast-container';
document.body.appendChild(toastContainer);

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - 'success', 'error', 'warning', 'info'
 * @param {number} duration - How long to show in milliseconds (default: 4000)
 * @returns {HTMLElement} - The toast element
 */
export function showToast(message, type = 'success', duration = 4000) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  // ─── Icon ──────────────────────────────────────────────────────
  const iconWrapper = document.createElement('span');
  iconWrapper.className = 'toast-icon';
  iconWrapper.innerHTML = getIcon(type);

  // ─── Message ──────────────────────────────────────────────────
  const text = document.createElement('span');
  text.className = 'toast-message';
  text.textContent = message;

  // ─── Close button ─────────────────────────────────────────────
  const closeBtn = document.createElement('button');
  closeBtn.className = 'toast-close';
  closeBtn.innerHTML = '✕';
  closeBtn.setAttribute('aria-label', 'Dismiss notification');

  toast.appendChild(iconWrapper);
  toast.appendChild(text);
  toast.appendChild(closeBtn);
  toastContainer.appendChild(toast);

  if (type === 'success' && !document.documentElement.classList.contains('reduce-motion') && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.dispatchEvent(new CustomEvent('ui:celebrate', { detail: { message } }));
  }

  // ─── Animate in ───────────────────────────────────────────────
  requestAnimationFrame(() => {
    toast.style.transform = 'translateX(0)';
    toast.style.opacity = '1';
  });

  // ─── Auto dismiss ─────────────────────────────────────────────
  const timeout = setTimeout(() => removeToast(toast), duration);
  toast._timeout = timeout;

  // ─── Close on click ──────────────────────────────────────────
  closeBtn.addEventListener('click', () => removeToast(toast));
  toast.addEventListener('click', (e) => {
    if (e.target === toast || e.target === text) removeToast(toast);
  });

  return toast;
}

/**
 * Remove a toast with animation
 * @param {HTMLElement} toast - The toast element to remove
 */
function removeToast(toast) {
  if (!toast || !toast.parentNode) return;
  clearTimeout(toast._timeout);
  toast.style.transform = 'translateX(calc(100% + 2rem))';
  toast.style.opacity = '0';
  setTimeout(() => {
    if (toast.parentNode) toast.remove();
  }, 400);
}

/**
 * Get SVG icon for toast type
 * @param {string} type - 'success', 'error', 'warning', 'info'
 * @returns {string} - SVG markup
 */
function getIcon(type) {
  const icons = {
    success: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="8 12 11 15 16 10"/>
      </svg>
    `,
    error: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="8" y1="8" x2="16" y2="16"/>
        <line x1="16" y1="8" x2="8" y2="16"/>
      </svg>
    `,
    warning: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2L1 21h22L12 2z"/>
        <line x1="12" y1="15" x2="12" y2="9"/>
        <circle cx="12" cy="18" r="0.5" fill="currentColor"/>
      </svg>
    `,
    info: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="16" x2="12" y2="12"/>
        <circle cx="12" cy="9" r="0.5" fill="currentColor"/>
      </svg>
    `
  };
  return icons[type] || icons.info;
}

// ─── SHORTCUT FUNCTIONS ────────────────────────────────────────
export function toastSuccess(message, duration = 4000) {
  return showToast(message, 'success', duration);
}

export function toastError(message, duration = 4000) {
  return showToast(message, 'error', duration);
}

export function toastWarning(message, duration = 4000) {
  return showToast(message, 'warning', duration);
}

export function toastInfo(message, duration = 4000) {
  return showToast(message, 'info', duration);
}

// ─── EXPOSE GLOBALLY (for non-module scripts) ──────────────────
window.showToast = showToast;
window.toastSuccess = toastSuccess;
window.toastError = toastError;
window.toastWarning = toastWarning;
window.toastInfo = toastInfo;

// ─── DEFAULT EXPORT ─────────────────────────────────────────────
export default {
  showToast,
  toastSuccess,
  toastError,
  toastWarning,
  toastInfo
};
