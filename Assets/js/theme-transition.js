// macOS-style coordinator for the existing light/dark theme setters.
(function () {
  'use strict';

  const root = document.documentElement;
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const duration = 320;
  let running = false;
  let pending = null;

  function reducedMotion() {
    return motionPreference.matches || root.classList.contains('reduce-motion');
  }

  function run(task) {
    running = true;
    root.classList.add('theme-transition-smooth');

    // Give the browser one frame to register transition properties before the
    // existing setter changes html.dark and its design tokens.
    requestAnimationFrame(() => {
      task.update();
      window.setTimeout(() => {
        root.classList.remove('theme-transition-smooth');
        running = false;
        task.resolve();

        if (pending) {
          const next = pending;
          pending = null;
          run(next);
        }
      }, duration);
    });
  }

  window.runThemeTransition = function runThemeTransition({ update } = {}) {
    if (typeof update !== 'function') return Promise.resolve();

    if (reducedMotion()) {
      update();
      return Promise.resolve();
    }

    return new Promise(resolve => {
      const task = { update, resolve };
      if (!running) {
        run(task);
        return;
      }

      // Latest intent wins during rapid toggling. Resolve any superseded task
      // without running another unnecessary animation.
      pending?.resolve();
      pending = task;
    });
  };
}());
