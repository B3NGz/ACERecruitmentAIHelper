// ============================================================
// CUSTOM CURSOR - theme-aware glow with particle trail
// ============================================================

(function () {
  'use strict';

  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  let cursor = document.getElementById('customCursor');
  if (!cursor) {
    cursor = document.createElement('div');
    cursor.id = 'customCursor';
    cursor.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cursor);
  }

  let particlesContainer = document.getElementById('particles-container');
  if (!particlesContainer) {
    particlesContainer = document.createElement('div');
    particlesContainer.id = 'particles-container';
    particlesContainer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(particlesContainer);
  }

  const interactiveSelector = 'a, button, select, summary, label[for], input:not([type="hidden"]), textarea, [role="button"], [role="link"], .btn, .nav-item, .dropdown-item, .dropdown-btn, .clickable, .tab';
  const maxParticles = 80;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let particleCount = 0;
  let lastParticleAt = 0;

  function themeColor() {
    return document.documentElement.classList.contains('dark') ? '#89d9de' : '#1a5276';
  }

  function createParticle(x, y) {
    if (reducedMotion.matches || document.documentElement.classList.contains('reduce-motion') || particleCount >= maxParticles) return;

    const particle = document.createElement('span');
    const size = Math.random() * 6 + 2;
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 60 + 20;
    const color = themeColor();

    particle.className = 'cursor-particle';
    particle.style.setProperty('--particle-size', `${size}px`);
    particle.style.setProperty('--particle-color', color);
    particle.style.setProperty('--particle-x', `${x}px`);
    particle.style.setProperty('--particle-y', `${y}px`);
    particle.style.setProperty('--particle-dx', `${Math.cos(angle) * distance}px`);
    particle.style.setProperty('--particle-dy', `${Math.sin(angle) * distance}px`);
    particlesContainer.appendChild(particle);
    particleCount += 1;

    particle.addEventListener('animationend', () => {
      particle.remove();
      particleCount -= 1;
    }, { once: true });
  }

  function showCursor() {
    // The CSS class is the single source of truth for visibility.
    cursor.classList.add('is-visible');
  }

  function hideCursor() {
    cursor.classList.remove('is-visible', 'hover', 'click');
  }

  document.addEventListener('pointermove', event => {
    if (event.pointerType && event.pointerType !== 'mouse') return;

    cursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
    showCursor();

    const now = performance.now();
    if (now - lastParticleAt >= 30) {
      lastParticleAt = now;
      createParticle(event.clientX, event.clientY);
    }
  }, { passive: true });

  document.addEventListener('pointerover', event => {
    if (!event.pointerType || event.pointerType === 'mouse') {
      cursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
      showCursor();
    }
    cursor.classList.toggle('hover', Boolean(event.target.closest?.(interactiveSelector)));
  }, { passive: true });

  document.addEventListener('pointerout', event => {
    if (!event.relatedTarget) hideCursor();
  }, { passive: true });

  document.addEventListener('pointerdown', () => cursor.classList.add('click'), { passive: true });
  document.addEventListener('pointerup', () => cursor.classList.remove('click'), { passive: true });
  document.addEventListener('pointercancel', hideCursor, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) hideCursor();
  });
  window.addEventListener('blur', hideCursor);
}());
