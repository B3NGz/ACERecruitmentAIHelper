import { getCampaigns } from './dataService.js';

const FIELD_CONFIG = [
  { inputId: 'industry', campaignKey: 'industry' },
  { inputId: 'location', campaignKey: 'location' },
  { inputId: 'work-setup', campaignKey: 'workSetup' },
  { inputId: 'experience-level', campaignKey: 'experienceLevel' },
  { inputId: 'department', campaignKey: 'department' },
  { inputId: 'job-category', campaignKey: 'jobCategory' },
  { inputId: 'education-requirement', campaignKey: 'educationRequirement' },
  { inputId: 'skills', campaignKey: 'skills', splitValues: true }
];
const MAX_RESULTS = 8;
let suggestionCache = null;

function normalizeValues(rawValue, splitValues) {
  if (Array.isArray(rawValue)) return rawValue;
  if (splitValues && typeof rawValue === 'string') return rawValue.split(/[,;\n]/);
  return [rawValue];
}

function buildSuggestionCache(campaigns) {
  const cache = new Map();
  FIELD_CONFIG.forEach(config => {
    const counts = new Map();
    campaigns.forEach(campaign => {
      normalizeValues(campaign?.[config.campaignKey], config.splitValues).forEach(rawValue => {
        if (typeof rawValue !== 'string') return;
        const value = rawValue.trim().replace(/\s+/g, ' ');
        if (!value || value.length > 120) return;
        const key = value.toLocaleLowerCase();
        const existing = counts.get(key);
        counts.set(key, existing
          ? { value: existing.value, count: existing.count + 1 }
          : { value, count: 1 });
      });
    });
    cache.set(config.inputId, [...counts.values()].sort((a, b) =>
      b.count - a.count || a.value.localeCompare(b.value)
    ));
  });
  return cache;
}

function appendHighlightedText(container, value, query) {
  if (!query) {
    container.textContent = value;
    return;
  }
  const lowerValue = value.toLocaleLowerCase();
  const matchIndex = lowerValue.indexOf(query.toLocaleLowerCase());
  if (matchIndex < 0) {
    container.textContent = value;
    return;
  }
  container.append(document.createTextNode(value.slice(0, matchIndex)));
  const mark = document.createElement('mark');
  mark.textContent = value.slice(matchIndex, matchIndex + query.length);
  container.append(mark, document.createTextNode(value.slice(matchIndex + query.length)));
}

function attachAutocomplete(input, suggestions) {
  if (!suggestions.length || input.closest('.smart-suggest')) return;
  const wrapper = document.createElement('div');
  wrapper.className = 'smart-suggest';
  input.parentNode.insertBefore(wrapper, input);
  wrapper.appendChild(input);

  const list = document.createElement('ul');
  const listId = `${input.id}-suggestions`;
  list.id = listId;
  list.className = 'smart-suggest-list';
  list.setAttribute('role', 'listbox');
  wrapper.appendChild(list);

  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-controls', listId);
  input.setAttribute('aria-expanded', 'false');
  input.setAttribute('autocomplete', 'off');

  let filtered = [];
  let activeIndex = -1;

  function close() {
    list.classList.remove('is-open');
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    activeIndex = -1;
  }

  function setActive(index) {
    const options = [...list.children];
    if (!options.length) return;
    activeIndex = (index + options.length) % options.length;
    options.forEach((option, optionIndex) =>
      option.classList.toggle('is-active', optionIndex === activeIndex)
    );
    const active = options[activeIndex];
    input.setAttribute('aria-activedescendant', active.id);
    active.scrollIntoView({ block: 'nearest' });
  }

  function choose(index) {
    const suggestion = filtered[index];
    if (!suggestion) return;
    input.value = suggestion.value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    close();
    input.focus();
  }

  function render() {
    const query = input.value.trim();
    const normalizedQuery = query.toLocaleLowerCase();
    filtered = suggestions
      .filter(item => !normalizedQuery || item.value.toLocaleLowerCase().includes(normalizedQuery))
      .slice(0, MAX_RESULTS);
    list.replaceChildren();
    activeIndex = -1;
    if (!filtered.length) {
      close();
      return;
    }
    filtered.forEach((item, index) => {
      const option = document.createElement('li');
      option.id = `${listId}-${index}`;
      option.className = 'smart-suggest-option';
      option.setAttribute('role', 'option');
      const value = document.createElement('span');
      value.className = 'smart-suggest-value';
      appendHighlightedText(value, item.value, query);
      const frequency = document.createElement('span');
      frequency.className = 'smart-suggest-frequency';
      frequency.textContent = item.count === 1 ? 'Used once' : `Used ${item.count}×`;
      option.append(value, frequency);
      option.addEventListener('pointerdown', event => event.preventDefault());
      option.addEventListener('click', () => choose(index));
      option.addEventListener('pointerenter', () => setActive(index));
      list.appendChild(option);
    });
    list.classList.add('is-open');
    input.setAttribute('aria-expanded', 'true');
  }

  input.addEventListener('focus', render);
  input.addEventListener('input', render);
  input.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      close();
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!list.classList.contains('is-open')) render();
      setActive(activeIndex + (event.key === 'ArrowDown' ? 1 : -1));
      return;
    }
    if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      choose(activeIndex);
    }
  });
  document.addEventListener('pointerdown', event => {
    if (!wrapper.contains(event.target)) close();
  });
}

export async function initCampaignSuggestions() {
  const form = document.getElementById('create-campaign-form');
  if (!form) return;
  if (!suggestionCache) suggestionCache = buildSuggestionCache(await getCampaigns());
  FIELD_CONFIG.forEach(config => {
    const input = document.getElementById(config.inputId);
    if (input instanceof HTMLInputElement) {
      attachAutocomplete(input, suggestionCache.get(config.inputId) || []);
    }
  });
}
