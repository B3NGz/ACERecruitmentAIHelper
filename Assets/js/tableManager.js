// ============================================================
// tableManager.js – Reusable table with "Show More" pagination
// ============================================================

export class TableManager {
  /**
   * @param {string} tbodyId        – ID of the <tbody> element
   * @param {string} showMoreBtnId  – ID of the "Show More" button
   * @param {string} countSpanId    – ID of the span to show (showing/total)
   * @param {number} batchSize      – Number of rows to add per click (default: 5)
   */
  constructor(tbodyId, showMoreBtnId, countSpanId, batchSize = 5) {
    this.tbody = document.getElementById(tbodyId);
    this.btn = document.getElementById(showMoreBtnId);
    this.countSpan = document.getElementById(countSpanId);
    this.batchSize = batchSize;
    this.allData = [];
    this.visibleCount = batchSize;
    this.renderFn = null;
    this.emptyMessage = 'No data available';
    this.attachShowMore();
  }

  /**
   * Set the data to be displayed
   * @param {Array} data – Array of items to display
   */
  setData(data) {
    this.allData = data || [];
    this.visibleCount = this.batchSize;
    this.render();
  }

  /**
   * Set the render function that converts a data slice to HTML
   * @param {Function} fn – Function that takes (dataSlice) and returns HTML string
   */
  setRenderFunction(fn) {
    this.renderFn = fn;
  }

  /**
   * Set custom empty message
   * @param {string} message – Message to show when no data
   */
  setEmptyMessage(message) {
    this.emptyMessage = message;
  }

  /**
   * Render the current visible slice of data
   */
  render() {
    if (!this.tbody) return;
    if (typeof this.renderFn !== 'function') {
      console.warn('TableManager: renderFn not set');
      return;
    }

    const total = this.allData.length;

    if (total === 0) {
      this.tbody.innerHTML = `<tr><td colspan="100" style="text-align:center;padding:2rem;color:var(--text-muted);">${this.emptyMessage}</td></tr>`;
      this.updateButton(0, false);
      return;
    }

    const hasMore = this.visibleCount < total;
    const showCount = Math.min(this.visibleCount, total);
    const slice = this.allData.slice(0, showCount);

    this.tbody.innerHTML = this.renderFn(slice);
    this.updateButton(total, hasMore);
  }

  /**
   * Update the "Show More" button state
   */
  updateButton(total, hasMore) {
    if (!this.btn) return;

    if (total === 0) {
      this.btn.style.display = 'none';
      return;
    }

    this.btn.style.display = 'inline-flex';

    if (!hasMore) {
      this.btn.textContent = 'Show All';
      this.btn.disabled = true;
      this.btn.style.opacity = '0.5';
      this.btn.style.cursor = 'default';
      if (this.countSpan) this.countSpan.textContent = `(${total} total)`;
    } else {
      this.btn.textContent = 'Show More';
      this.btn.disabled = false;
      this.btn.style.opacity = '1';
      this.btn.style.cursor = 'pointer';
      if (this.countSpan) {
        const showing = Math.min(this.visibleCount, total);
        this.countSpan.textContent = `(${showing}/${total})`;
      }
    }
  }

  /**
   * Show the next batch of items
   */
  showMore() {
    this.visibleCount += this.batchSize;
    this.render();
  }

  /**
   * Reset to initial visible count
   */
  reset() {
    this.visibleCount = this.batchSize;
    this.render();
  }

  /**
   * Attach click event to the "Show More" button
   */
  attachShowMore() {
    if (this.btn) {
      // Remove any existing listeners to avoid duplicates
      const newBtn = this.btn.cloneNode(true);
      this.btn.parentNode.replaceChild(newBtn, this.btn);
      this.btn = newBtn;
      this.btn.addEventListener('click', () => this.showMore());
    }
  }

  /**
   * Get the current filtered/sorted data (useful for exports)
   */
  getData() {
    return this.allData;
  }

  /**
   * Get the current visible data
   */
  getVisibleData() {
    return this.allData.slice(0, this.visibleCount);
  }
}

// ─── HELPER: Create a TableManager instance with defaults ────
export function createTableManager(tbodyId, showMoreBtnId, countSpanId, batchSize = 5) {
  return new TableManager(tbodyId, showMoreBtnId, countSpanId, batchSize);
}