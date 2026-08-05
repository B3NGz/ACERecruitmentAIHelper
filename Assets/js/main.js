// ============================================================
// MAIN.JS – Shared functionality for all pages
// ============================================================


// ============================================================
// CUSTOM DROPDOWN – TOGGLE & SEARCH
// ============================================================
(function() {
  document.querySelectorAll('.custom-dropdown').forEach(function(dropdown) {
    const btn = dropdown.querySelector('.dropdown-btn');
    const items = dropdown.querySelectorAll('.dropdown-item');
    const selectedText = dropdown.querySelector('.selected-text');
    const searchInput = dropdown.querySelector('.dropdown-search-input');
    const noResults = dropdown.querySelector('.dropdown-no-results');
    const menu = dropdown.querySelector('.dropdown-menu');

    if (!btn) return;

    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      e.preventDefault();

      if (dropdown.classList.contains('open')) {
        dropdown.classList.remove('open');
        return;
      }

      document.querySelectorAll('.custom-dropdown.open').forEach(function(d) {
        d.classList.remove('open');
      });

      dropdown.classList.add('open');

      if (searchInput) {
        setTimeout(function() { searchInput.focus(); }, 50);
      }
    });

    if (searchInput) {
      searchInput.addEventListener('mousedown', function(e) {
        e.stopPropagation();
      });
      searchInput.addEventListener('click', function(e) {
        e.stopPropagation();
      });

      searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase().trim();
        let hasVisible = false;
        const allItems = dropdown.querySelectorAll('.dropdown-item');

        allItems.forEach(function(item) {
          const text = item.textContent.toLowerCase();
          if (text.includes(query)) {
            item.classList.remove('hidden');
            hasVisible = true;
          } else {
            item.classList.add('hidden');
          }
        });

        if (noResults) {
          noResults.style.display = hasVisible ? 'none' : 'block';
        }
      });
    }

    if (menu) {
      menu.addEventListener('mousedown', function(e) {
        e.stopPropagation();
      });
      menu.addEventListener('click', function(e) {
        e.stopPropagation();
      });
    }

    items.forEach(function(item) {
      item.addEventListener('mousedown', function(e) {
        e.stopPropagation();
      });

      item.addEventListener('click', function(e) {
        e.stopPropagation();

        items.forEach(function(i) { i.classList.remove('active'); });
        item.classList.add('active');

        if (selectedText) {
          selectedText.textContent = item.textContent.trim();
        }

        dropdown.dataset.value = item.dataset.value;
        dropdown.classList.remove('open');

        dropdown.dispatchEvent(new CustomEvent('dropdownChange', {
          detail: {
            value: item.dataset.value,
            text: item.textContent.trim()
          }
        }));
      });
    });

    dropdown.addEventListener('dropdownClose', function() {
      if (searchInput) {
        searchInput.value = '';
        dropdown.querySelectorAll('.dropdown-item').forEach(function(item) {
          item.classList.remove('hidden');
        });
        if (noResults) {
          noResults.style.display = 'none';
        }
      }
    });
  });

  document.addEventListener('mousedown', function(e) {
    const isInsideDropdown = e.target.closest('.custom-dropdown');
    if (!isInsideDropdown) {
      document.querySelectorAll('.custom-dropdown.open').forEach(function(d) {
        d.classList.remove('open');
        d.dispatchEvent(new CustomEvent('dropdownClose'));
      });
    }
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.custom-dropdown.open').forEach(function(d) {
        d.classList.remove('open');
        d.dispatchEvent(new CustomEvent('dropdownClose'));
      });
    }
  });
})();

// ============================================================
// SIDEBAR PERSISTENT HOVER
// ============================================================
(function() {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;
  
  if (sessionStorage.getItem('sidebarHover') === 'true') {
    sidebar.classList.add('sidebar-hover');
  }
  
  sidebar.addEventListener('mouseenter', function() {
    sidebar.classList.add('sidebar-hover');
    sessionStorage.setItem('sidebarHover', 'true');
  });
  
  sidebar.addEventListener('mouseleave', function() {
    setTimeout(function() {
      const rect = sidebar.getBoundingClientRect();
      const isOver = (
        window.event?.clientX >= rect.left &&
        window.event?.clientX <= rect.right &&
        window.event?.clientY >= rect.top &&
        window.event?.clientY <= rect.bottom
      );
      if (!isOver) {
        sidebar.classList.remove('sidebar-hover');
        sessionStorage.removeItem('sidebarHover');
      }
    }, 150);
  });
  
  sidebar.querySelectorAll('a').forEach(function(link) {
    link.addEventListener('click', function() {
      sessionStorage.setItem('sidebarHover', 'true');
    });
  });

// ============================================================
// PAGE TRANSITIONS – Prevent flash on load
// ============================================================
(function() {
  // Add a class to body to enable transitions after load
  document.body.classList.add('no-transition');
  
  // Enable transitions after a tiny delay (allows paint)
  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      document.body.classList.remove('no-transition');
    });
  });
})();

// ============================================================
// SIDEBAR ACTIVE STATE – using data-page attribute
// ============================================================
(function() {
  const currentPath = window.location.pathname;

  // Get the page name from the URL
  let currentPage = currentPath.split('/').pop().replace('.html', '') || 'dashboard';
  // If it's the root or dashboard, set to dashboard
  if (currentPath === '/' || currentPath === '/Dashboard/dashboard.html') {
    currentPage = 'dashboard';
  }

  document.querySelectorAll('.sidebar .nav-item[data-page]').forEach(link => {
    const page = link.dataset.page;
    if (page === currentPage || (page === 'dashboard' && currentPath === '/')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
})();

// ============================================================
// SIDEBAR NOTIFICATIONS – Count new items in 24h
// ============================================================

(function () {

  async function updateNotifications() {
    try {

      // Get real data from the backend through dataService.js
      const { getApplicants, getCampaigns } =
        await import('./dataService.js');

      const [applicants, campaigns] =
        await Promise.all([
          getApplicants(),
          getCampaigns()
        ]);

      const oneDayAgo =
        new Date(
          Date.now() - (24 * 60 * 60 * 1000)
        );


      // ========================================================
      // NEW APPLICANTS
      // ========================================================

      const newApplicants =
        applicants.filter(applicant => {

          const created =
            applicant.createdDate ??
            applicant.createdAt ??
            applicant.CreatedDate ??
            applicant.CreatedAt;

          if (!created) {
            return false;
          }

          const date = new Date(created);

          return (
            !Number.isNaN(date.getTime()) &&
            date >= oneDayAgo
          );

        }).length;


      // ========================================================
      // NEW CAMPAIGNS
      // ========================================================

      const newCampaigns =
        campaigns.filter(campaign => {

          const created =
            campaign.createdDate ??
            campaign.createdAt ??
            campaign.CreatedDate ??
            campaign.CreatedAt;

          if (!created) {
            return false;
          }

          const date = new Date(created);

          return (
            !Number.isNaN(date.getTime()) &&
            date >= oneDayAgo
          );

        }).length;


      // ========================================================
      // UPDATE BADGES
      // ========================================================

      const applicantsBadge =
        document.getElementById(
          'new-applicants-count'
        );

      const campaignsBadge =
        document.getElementById(
          'new-campaigns-count'
        );


      if (applicantsBadge) {
        applicantsBadge.textContent =
          newApplicants;

        applicantsBadge.classList.toggle(
          'zero',
          newApplicants === 0
        );
      }


      if (campaignsBadge) {
        campaignsBadge.textContent =
          newCampaigns;

        campaignsBadge.classList.toggle(
          'zero',
          newCampaigns === 0
        );
      }

    }
    catch (error) {

      console.warn(
        'Notifications: Could not load API data',
        error
      );

    }
  }


  // Run on page load
  if (document.readyState === 'loading') {

    document.addEventListener(
      'DOMContentLoaded',
      updateNotifications
    );

  }
  else {

    updateNotifications();

  }


  // Update every 60 seconds
  setInterval(
    updateNotifications,
    60000
  );

})();

// ============================================================
// SIDEBAR HOVER – DEBOUNCE TO PREVENT RAPID TOGGLES
// ============================================================
(function() {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;

  let hoverTimeout = null;

  sidebar.addEventListener('mouseenter', function() {
    clearTimeout(hoverTimeout);
    sidebar.classList.add('sidebar-hover');
    sessionStorage.setItem('sidebarHover', 'true');
  });

  sidebar.addEventListener('mouseleave', function() {
    clearTimeout(hoverTimeout);
    hoverTimeout = setTimeout(function() {
      const rect = sidebar.getBoundingClientRect();
      const isOver = (
        window.event?.clientX >= rect.left &&
        window.event?.clientX <= rect.right &&
        window.event?.clientY >= rect.top &&
        window.event?.clientY <= rect.bottom
      );
      if (!isOver) {
        sidebar.classList.remove('sidebar-hover');
        sessionStorage.removeItem('sidebarHover');
      }
    }, 100); // 100ms delay
  });
})();

// ============================================================
// MAIN.JS – Shared functionality for all pages
// ============================================================

// ─── i18n: apply translations on load ─────────────────────────
(async function initI18n() {
  try {
    const i18n = await import('./i18n.js');
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        i18n.applyLanguage();
        i18n.setupLanguageObserver();
      });
    } else {
      i18n.applyLanguage();
      i18n.setupLanguageObserver();
    }
  } catch (e) {
    // i18n not available – silently skip
  }
})();

// ─── CUSTOM DROPDOWN ──────────────────────────────────────────
(function() {
  document.querySelectorAll('.custom-dropdown').forEach(function(dropdown) {
    const btn = dropdown.querySelector('.dropdown-btn');
    const items = dropdown.querySelectorAll('.dropdown-item');
    const selectedText = dropdown.querySelector('.selected-text');
    const searchInput = dropdown.querySelector('.dropdown-search-input');
    const noResults = dropdown.querySelector('.dropdown-no-results');
    const menu = dropdown.querySelector('.dropdown-menu');

    if (!btn) return;

    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      e.preventDefault();

      if (dropdown.classList.contains('open')) {
        dropdown.classList.remove('open');
        return;
      }

      document.querySelectorAll('.custom-dropdown.open').forEach(function(d) {
        d.classList.remove('open');
      });

      dropdown.classList.add('open');

      if (searchInput) {
        setTimeout(function() { searchInput.focus(); }, 50);
      }
    });

    if (searchInput) {
      searchInput.addEventListener('mousedown', function(e) {
        e.stopPropagation();
      });
      searchInput.addEventListener('click', function(e) {
        e.stopPropagation();
      });

      searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase().trim();
        let hasVisible = false;
        const allItems = dropdown.querySelectorAll('.dropdown-item');

        allItems.forEach(function(item) {
          const text = item.textContent.toLowerCase();
          if (text.includes(query)) {
            item.classList.remove('hidden');
            hasVisible = true;
          } else {
            item.classList.add('hidden');
          }
        });

        if (noResults) {
          noResults.style.display = hasVisible ? 'none' : 'block';
        }
      });
    }

    if (menu) {
      menu.addEventListener('mousedown', function(e) {
        e.stopPropagation();
      });
      menu.addEventListener('click', function(e) {
        e.stopPropagation();
      });
    }

    items.forEach(function(item) {
      item.addEventListener('mousedown', function(e) {
        e.stopPropagation();
      });

      item.addEventListener('click', function(e) {
        e.stopPropagation();

        items.forEach(function(i) { i.classList.remove('active'); });
        item.classList.add('active');

        if (selectedText) {
          selectedText.textContent = item.textContent.trim();
        }

        dropdown.dataset.value = item.dataset.value;
        dropdown.classList.remove('open');

        dropdown.dispatchEvent(new CustomEvent('dropdownChange', {
          detail: {
            value: item.dataset.value,
            text: item.textContent.trim()
          }
        }));
      });
    });

    dropdown.addEventListener('dropdownClose', function() {
      if (searchInput) {
        searchInput.value = '';
        dropdown.querySelectorAll('.dropdown-item').forEach(function(item) {
          item.classList.remove('hidden');
        });
        if (noResults) {
          noResults.style.display = 'none';
        }
      }
    });
  });

  document.addEventListener('mousedown', function(e) {
    const isInsideDropdown = e.target.closest('.custom-dropdown');
    if (!isInsideDropdown) {
      document.querySelectorAll('.custom-dropdown.open').forEach(function(d) {
        d.classList.remove('open');
        d.dispatchEvent(new CustomEvent('dropdownClose'));
      });
    }
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.custom-dropdown.open').forEach(function(d) {
        d.classList.remove('open');
        d.dispatchEvent(new CustomEvent('dropdownClose'));
      });
    }
  });
})();

// ─── SIDEBAR PERSISTENT HOVER ────────────────────────────────
(function() {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;
  
  if (sessionStorage.getItem('sidebarHover') === 'true') {
    sidebar.classList.add('sidebar-hover');
  }
  
  sidebar.addEventListener('mouseenter', function() {
    sidebar.classList.add('sidebar-hover');
    sessionStorage.setItem('sidebarHover', 'true');
  });
  
  sidebar.addEventListener('mouseleave', function() {
    setTimeout(function() {
      const rect = sidebar.getBoundingClientRect();
      const isOver = (
        window.event?.clientX >= rect.left &&
        window.event?.clientX <= rect.right &&
        window.event?.clientY >= rect.top &&
        window.event?.clientY <= rect.bottom
      );
      if (!isOver) {
        sidebar.classList.remove('sidebar-hover');
        sessionStorage.removeItem('sidebarHover');
      }
    }, 150);
  });
  
  sidebar.querySelectorAll('a').forEach(function(link) {
    link.addEventListener('click', function() {
      sessionStorage.setItem('sidebarHover', 'true');
    });
  });
})();

// ─── PAGE TRANSITIONS ─────────────────────────────────────────
(function() {
  document.body.classList.add('no-transition');
  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      document.body.classList.remove('no-transition');
    });
  });
})();

// ─── SIDEBAR ACTIVE STATE ─────────────────────────────────────
(function() {
  const currentPath = window.location.pathname;
  let currentPage = currentPath.split('/').pop().replace('.html', '') || 'dashboard';
  if (currentPath === '/' || currentPath === '/Dashboard/dashboard.html') {
    currentPage = 'dashboard';
  }
  document.querySelectorAll('.sidebar .nav-item[data-page]').forEach(link => {
    const page = link.dataset.page;
    if (page === currentPage || (page === 'dashboard' && currentPath === '/')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
})();

// ─── SIDEBAR NOTIFICATIONS ────────────────────────────────────
(function () {

  async function updateNotifications() {
    try {

      // Use the real API data through dataService.js
      const { getApplicants, getCampaigns } =
        await import('./dataService.js');

      const [applicants, campaigns] =
        await Promise.all([
          getApplicants(),
          getCampaigns()
        ]);

      const now = new Date();

      const oneDayAgo =
        new Date(
          now.getTime() - (24 * 60 * 60 * 1000)
        );


      // ─── NEW APPLICANTS ─────────────────────────────────────

      const newApplicants =
        applicants.filter(applicant => {

          const created =
            applicant.createdDate ??
            applicant.createdAt ??
            applicant.CreatedDate ??
            applicant.CreatedAt;

          if (!created) {
            return false;
          }

          const date = new Date(created);

          return (
            !Number.isNaN(date.getTime()) &&
            date >= oneDayAgo
          );

        }).length;


      // ─── NEW CAMPAIGNS ──────────────────────────────────────

      const newCampaigns =
        campaigns.filter(campaign => {

          const created =
            campaign.createdDate ??
            campaign.createdAt ??
            campaign.CreatedDate ??
            campaign.CreatedAt;

          if (!created) {
            return false;
          }

          const date = new Date(created);

          return (
            !Number.isNaN(date.getTime()) &&
            date >= oneDayAgo
          );

        }).length;


      // ─── UPDATE BADGES ──────────────────────────────────────

      const applicantsBadge =
        document.getElementById(
          'new-applicants-count'
        );

      const campaignsBadge =
        document.getElementById(
          'new-campaigns-count'
        );


      if (applicantsBadge) {
        applicantsBadge.textContent =
          newApplicants;

        applicantsBadge.classList.toggle(
          'zero',
          newApplicants === 0
        );
      }


      if (campaignsBadge) {
        campaignsBadge.textContent =
          newCampaigns;

        campaignsBadge.classList.toggle(
          'zero',
          newCampaigns === 0
        );
      }

    }
    catch (error) {

      console.warn(
        'Notifications: Could not load API data',
        error
      );

    }
  }


  if (document.readyState === 'loading') {

    document.addEventListener(
      'DOMContentLoaded',
      updateNotifications
    );

  }
  else {

    updateNotifications();

  }


  setInterval(
    updateNotifications,
    60000
  );

})();

// ─── SIDEBAR HOVER DEBOUNCE ──────────────────────────────────
(function() {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;

  let hoverTimeout = null;

  sidebar.addEventListener('mouseenter', function() {
    clearTimeout(hoverTimeout);
    sidebar.classList.add('sidebar-hover');
    sessionStorage.setItem('sidebarHover', 'true');
  });

  sidebar.addEventListener('mouseleave', function() {
    clearTimeout(hoverTimeout);
    hoverTimeout = setTimeout(function() {
      const rect = sidebar.getBoundingClientRect();
      const isOver = (
        window.event?.clientX >= rect.left &&
        window.event?.clientX <= rect.right &&
        window.event?.clientY >= rect.top &&
        window.event?.clientY <= rect.bottom
      );
      if (!isOver) {
        sidebar.classList.remove('sidebar-hover');
        sessionStorage.removeItem('sidebarHover');
      }
    }, 100);
  });
})();

})();