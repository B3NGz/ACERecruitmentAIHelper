// ============================================================
// searchService.js – Global search across campaigns & applicants
// ============================================================

import { loadDatabase, sameId } from './dataService.js';

let indexedData = null;
let isIndexing = false;

// ─── BUILD SEARCH INDEX ──────────────────────────────────────────
export async function getSearchIndex() {
  if (indexedData) return indexedData;
  if (isIndexing) {
    return new Promise((resolve) => {
      const checkIndex = setInterval(() => {
        if (indexedData) {
          clearInterval(checkIndex);
          resolve(indexedData);
        }
        if (!isIndexing) {
          clearInterval(checkIndex);
          resolve(indexedData || { campaigns: [], applicants: [] });
        }
      }, 100);
    });
  }

  isIndexing = true;
  const db = await loadDatabase();

  if (!db) {
    isIndexing = false;
    return { campaigns: [], applicants: [] };
  }

  // ─── CAMPAIGN ICON (SVG) ──────────────────────────────────────
  const campaignIcon = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
  `;

  // ─── APPLICANT ICON (SVG) ─────────────────────────────────────
  const applicantIcon = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  `;

  const campaigns = (db.campaigns || []).map(c => ({
    id: c.id,
    title: c.jobTitle,
    subtitle: `Client: ${c.clientName} • ${c.status}`,
    url: `https://b3ngz.github.io/ACERecruitmentAIHelper/Campaign/campaign-details.html?id=${c.id}`,
    type: 'campaign',
    icon: campaignIcon,
    searchText: `${c.jobTitle} ${c.clientName} ${c.status} ${c.jobDescription || ''}`.toLowerCase(),
    status: c.status
  }));

  const applicants = (db.applicants || []).map(a => {
    const campaign = db.campaigns?.find(c => sameId(c.id, a.campaignId));
    const assessment = db.assessments?.find(ass =>
      sameId(ass.applicantId, a.id) &&
      sameId(ass.campaignId, a.campaignId)
    );
    return {
      id: a.id,
      title: a.fullName,
      subtitle: `${a.currentPosition} • ${campaign?.jobTitle || 'Unknown'}`,
      url: `../Applicants/applicant-details.html?id=${a.id}`,
      type: 'applicant',
      icon: applicantIcon,
      searchText: `${a.fullName} ${a.email} ${a.currentPosition} ${a.employer || ''} ${campaign?.jobTitle || ''}`.toLowerCase(),
      score: assessment?.overallScore || null,
      recommendation: assessment?.recommendation || null
    };
  });

  indexedData = { campaigns, applicants };
  isIndexing = false;
  return indexedData;
}

// ─── PERFORM SEARCH ──────────────────────────────────────────────
export function search(query) {
  if (!query || query.length < 1) return [];
  const q = query.toLowerCase().trim();

  if (!indexedData) {
    getSearchIndex().then(() => {});
    return [];
  }

  const all = [...indexedData.campaigns, ...indexedData.applicants];
  return all.filter(item => item.searchText.includes(q));
}

// ─── SEARCH WITH LIMIT ──────────────────────────────────────────
export function searchWithLimit(query, limit = 10) {
  const results = search(query);
  return results.slice(0, limit);
}

// ─── SEARCH BY TYPE ─────────────────────────────────────────────
export function searchByType(query, type) {
  if (!query || query.length < 1) return [];
  const q = query.toLowerCase().trim();

  if (!indexedData) {
    getSearchIndex();
    return [];
  }

  const source = type === 'campaign' ? indexedData.campaigns : indexedData.applicants;
  return source.filter(item => item.searchText.includes(q));
}

// ─── GET RECOMMENDATIONS ─────────────────────────────────────────
export function getTopRecommendations(limit = 5) {
  if (!indexedData) {
    getSearchIndex();
    return [];
  }

  const scored = indexedData.applicants
    .filter(a => a.score !== null && a.score > 0)
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, limit);

  return scored;
}

// ─── REBUILD INDEX ──────────────────────────────────────────────
export async function rebuildSearchIndex() {
  indexedData = null;
  isIndexing = false;
  return await getSearchIndex();
}

// ─── RENDER SEARCH RESULTS ─────────────────────────────────────────
export function renderSearchResults(results, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!results || results.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = results.map(r => `
    <a href="${r.url}" class="result-item" data-type="${r.type}">
      <span class="result-icon">${r.icon}</span>
      <div class="result-info">
        <span class="result-title">${r.title}</span>
        <span class="result-subtitle">${r.subtitle}</span>
      </div>
      <span class="result-badge">${r.type}</span>
    </a>
  `).join('');
}

// ─── SETUP GLOBAL SEARCH ──────────────────────────────────────────
export function setupGlobalSearch(inputId, dropdownId, resultsId, noResultsId) {
  const input = document.getElementById(inputId);
  const dropdown = document.getElementById(dropdownId);
  const resultsContainer = document.getElementById(resultsId);
  const noResults = document.getElementById(noResultsId);

  if (!input || !dropdown) {
    console.warn('Search input or dropdown not found:', inputId, dropdownId);
    return;
  }

  let debounceTimer = null;

  function positionDropdown() {
    const rect = input.getBoundingClientRect();
    dropdown.style.top = (rect.bottom + 8) + 'px';
    dropdown.style.left = rect.left + 'px';
    dropdown.style.width = Math.max(rect.width, 300) + 'px';
  }

  function performSearch() {
    const query = input.value.trim();

    // Update clear button
    const clearBtn = document.getElementById('searchClearBtn');
    if (clearBtn) {
      clearBtn.style.display = query ? 'block' : 'none';
    }

    if (!query) {
      dropdown.style.display = 'none';
      return;
    }

    // Ensure index is built
    getSearchIndex().then(() => {
      const results = search(query);
      positionDropdown();

      if (results.length === 0) {
        resultsContainer.innerHTML = '';
        if (noResults) {
          noResults.style.display = 'block';
          noResults.textContent = 'No results found';
        }
        dropdown.style.display = 'block';
        return;
      }

      if (noResults) noResults.style.display = 'none';

      const limited = results.slice(0, 10);
      resultsContainer.innerHTML = limited.map(r => `
        <a href="${r.url}" class="result-item" data-type="${r.type}">
          <span class="result-icon">${r.icon}</span>
          <div class="result-info">
            <span class="result-title">${r.title}</span>
            <span class="result-subtitle">${r.subtitle}</span>
          </div>
          <span class="result-badge">${r.type}</span>
        </a>
      `).join('');

      dropdown.style.display = 'block';
    });
  }

  // ─── Event listeners ──────────────────────────────────────────
  input.addEventListener('input', function() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(performSearch, 250);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      dropdown.style.display = 'none';
      input.blur();
    }
  });

  input.addEventListener('focus', function() {
    if (this.value.trim()) {
      performSearch();
    }
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest(`#${inputId}`) && !e.target.closest(`#${dropdownId}`)) {
      dropdown.style.display = 'none';
    }
  });

  // Reposition on resize/scroll
  window.addEventListener('resize', () => {
    if (dropdown.style.display === 'block') {
      positionDropdown();
    }
  });

  document.addEventListener('scroll', () => {
    if (dropdown.style.display === 'block') {
      positionDropdown();
    }
  }, { passive: true });

  console.log('✅ Global search initialised:', inputId);
}
