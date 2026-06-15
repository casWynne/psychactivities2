/**
 * PROJECT DATABASE - Main Application
 * Handles data loading, searching, filtering, and rendering equipment lists
 */

class ProjectDatabase {
  constructor() {
    this.data = null;
    this.filteredItems = [];
    this.allItems = [];
    this.activeFilters = {
      search: '',
      types: [],
      sort: 'name-asc'
    };

    this.elements = {
      searchInput: document.getElementById('search-input'),
      searchClear: document.getElementById('search-clear'),
      typeFilters: document.getElementById('type-filters'),
      sortSelect: document.getElementById('sort-select'),
      clearFiltersBtn: document.getElementById('clear-filters'),
      cardView: document.getElementById('card-view'),
      tableBody: document.getElementById('table-body'),
      noResults: document.getElementById('no-results'),
      resultCount: document.querySelector('.result-count'),
      howToContent: document.querySelector('.how-to-content'),
      cardTemplate: document.getElementById('item-card-template'),
      rowTemplate: document.getElementById('item-row-template'),
      filterCheckboxTemplate: document.getElementById('filter-checkbox-template')
    };

    this.init();
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      await this.loadData();
      this.setupUI();
      this.attachEventListeners();
      this.renderItems();
    } catch (error) {
      console.error('Failed to initialize Project Database:', error);
      this.showError('Failed to load database. Please refresh the page.');
    }
  }

  /**
   * Load database JSON
   */
  async loadData() {
    const response = await fetch('data/database.json');
    if (!response.ok) {
      throw new Error('Failed to load database.json');
    }
    this.data = await response.json();
    this.allItems = this.data.items || [];
    this.filteredItems = [...this.allItems];
  }

  /**
   * Setup UI elements from JSON data
   */
  setupUI() {
    // Populate "How to Use" content
    if (this.elements.howToContent && this.data.meta.howToUse) {
      this.elements.howToContent.innerHTML = `<p>${this.escapeHtml(this.data.meta.howToUse)}</p>`;
    }

    // Create type filter checkboxes
    if (this.elements.typeFilters && this.data.equipmentTypes) {
      this.data.equipmentTypes.forEach((type) => {
        const checkbox = this.elements.filterCheckboxTemplate.content.cloneNode(true);
        const input = checkbox.querySelector('input');
        const label = checkbox.querySelector('label');

        input.id = `filter-${type.id}`;
        input.value = type.id;
        label.htmlFor = `filter-${type.id}`;
        label.textContent = type.label;

        this.elements.typeFilters.appendChild(checkbox);
      });
    }
  }

  /**
   * Attach event listeners to interactive elements
   */
  attachEventListeners() {
    // Search input
    if (this.elements.searchInput) {
      this.elements.searchInput.addEventListener(
        'input',
        this.debounce(() => {
          this.activeFilters.search = this.elements.searchInput.value.toLowerCase();
          this.applyFilters();
        }, 300)
      );
    }

    // Search clear button
    if (this.elements.searchClear) {
      this.elements.searchClear.addEventListener('click', () => {
        this.elements.searchInput.value = '';
        this.elements.searchInput.focus();
        this.activeFilters.search = '';
        this.applyFilters();
      });
    }

    // Type filters
    const typeCheckboxes = document.querySelectorAll('.type-filter');
    typeCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.activeFilters.types.push(e.target.value);
        } else {
          this.activeFilters.types = this.activeFilters.types.filter(
            (t) => t !== e.target.value
          );
        }
        this.applyFilters();
      });
    });

    // Sort select
    if (this.elements.sortSelect) {
      this.elements.sortSelect.addEventListener('change', (e) => {
        this.activeFilters.sort = e.target.value;
        this.applyFilters();
      });
    }

    // Clear all filters
    if (this.elements.clearFiltersBtn) {
      this.elements.clearFiltersBtn.addEventListener('click', () => {
        this.clearAllFilters();
      });
    }
  }

  /**
   * Clear all active filters
   */
  clearAllFilters() {
    this.activeFilters = {
      search: '',
      types: [],
      sort: 'name-asc'
    };

    this.elements.searchInput.value = '';
    document.querySelectorAll('.type-filter').forEach((cb) => {
      cb.checked = false;
    });
    this.elements.sortSelect.value = 'name-asc';

    this.applyFilters();
  }

  /**
   * Apply filters and render results
   */
  applyFilters() {
    this.filteredItems = this.allItems.filter((item) => {
      // Search filter
      const matchesSearch =
        item.name.toLowerCase().includes(this.activeFilters.search) ||
        item.description.toLowerCase().includes(this.activeFilters.search);

      // Type filter
      const matchesType =
        this.activeFilters.types.length === 0 ||
        this.activeFilters.types.includes(item.type);

      return matchesSearch && matchesType;
    });

    // Sort items
    this.sortItems();

    // Render
    this.renderItems();

    // Update URL (optional, for browser history)
    this.updateURL();
  }

  /**
   * Sort filtered items
   */
  sortItems() {
    const sort = this.activeFilters.sort;

    switch (sort) {
      case 'name-asc':
        this.filteredItems.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        this.filteredItems.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'quantity-high':
        this.filteredItems.sort((a, b) => b.quantity - a.quantity);
        break;
      case 'quantity-low':
        this.filteredItems.sort((a, b) => a.quantity - b.quantity);
        break;
      case 'type':
        this.filteredItems.sort((a, b) => {
          const typeA = this.getEquipmentTypeLabel(a.type);
          const typeB = this.getEquipmentTypeLabel(b.type);
          return typeA.localeCompare(typeB);
        });
        break;
    }
  }

  /**
   * Render items (cards for mobile, table for desktop)
   */
  renderItems() {
    // Clear existing items
    this.elements.cardView.innerHTML = '';
    this.elements.tableBody.innerHTML = '';

    // Show/hide no results message
    if (this.filteredItems.length === 0) {
      this.elements.noResults.hidden = false;
      this.elements.noResults.setAttribute('aria-live', 'polite');
      this.elements.resultCount.textContent = 'No items found';
      return;
    }

    this.elements.noResults.hidden = true;
    this.elements.resultCount.textContent = `${this.filteredItems.length} item${this.filteredItems.length !== 1 ? 's' : ''} found`;

    // Render items
    this.filteredItems.forEach((item) => {
      this.renderCardView(item);
      this.renderTableRow(item);
    });
  }

  /**
   * Render individual card (mobile view)
   */
  renderCardView(item) {
    const card = this.elements.cardTemplate.content.cloneNode(true);

    const img = card.querySelector('img');
    const title = card.querySelector('.card-title');
    const typeEl = card.querySelector('.item-type');
    const quantityEl = card.querySelector('.item-quantity');
    const link = card.querySelector('.btn');

    img.src = this.getItemImagePath(item);
    img.alt = `${item.name} equipment image`;
    title.textContent = item.name;
    typeEl.textContent = this.getEquipmentTypeLabel(item.type);
    quantityEl.textContent = item.quantity;
    link.href = `item/?id=${item.id}`;

    this.elements.cardView.appendChild(card);
  }

  /**
   * Render individual table row (desktop view)
   */
  renderTableRow(item) {
    const row = this.elements.rowTemplate.content.cloneNode(true);

    const img = row.querySelector('.item-row-image');
    const nameLink = row.querySelector('.item-name-link');
    const imgLink = row.querySelector('.item-row-link');
    const typeEl = row.querySelector('.item-type');
    const manualEl = row.querySelector('.item-manual');
    const riskEl = row.querySelector('.item-risk');
    const quantityEl = row.querySelector('.item-quantity');

    img.src = this.getItemImagePath(item);
    img.alt = `${item.name}`;
    nameLink.href = `item/?id=${item.id}`;
    nameLink.textContent = item.name;
    imgLink.href = `item/?id=${item.id}`;
    typeEl.textContent = this.getEquipmentTypeLabel(item.type);
    quantityEl.textContent = item.quantity;

    // Manual status
    const hasManual = item.documents?.manuals && item.documents.manuals.length > 0;
    manualEl.innerHTML = hasManual
      ? '<span aria-label="Manual available">✓</span>'
      : '<span aria-label="Manual not available">—</span>';

    // Risk assessment status
    const hasRisk = item.documents?.riskAssessments && item.documents.riskAssessments.length > 0;
    riskEl.innerHTML = hasRisk
      ? '<span aria-label="Risk assessment available">✓</span>'
      : '<span aria-label="Risk assessment not available">—</span>';

    this.elements.tableBody.appendChild(row);
  }

  /**
   * Get equipment type label from ID
   */
  getEquipmentTypeLabel(typeId) {
    const type = this.data.equipmentTypes.find((t) => t.id === typeId);
    return type ? type.label : 'Unknown';
  }

  /**
   * Get first image path for an item, with fallback
   */
  getItemImagePath(item) {
    if (item.images && item.images.length > 0) {
      return item.images[0];
    }
    // Return placeholder if no image
    return 'assets/images/placeholder.png';
  }

  /**
   * Update URL with current filters (optional)
   */
  updateURL() {
    const params = new URLSearchParams();

    if (this.activeFilters.search) {
      params.set('search', this.activeFilters.search);
    }

    if (this.activeFilters.types.length > 0) {
      params.set('types', this.activeFilters.types.join(','));
    }

    if (this.activeFilters.sort !== 'name-asc') {
      params.set('sort', this.activeFilters.sort);
    }

    const queryString = params.toString();
    const url = queryString ? `?${queryString}` : window.location.pathname;

    window.history.replaceState({}, '', url);
  }

  /**
   * Debounce function for search input
   */
  debounce(func, delay) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }

  /**
   * Escape HTML special characters
   */
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  /**
   * Show error message
   */
  showError(message) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-error';
    alert.setAttribute('role', 'alert');
    alert.innerHTML = `<strong>Error:</strong> ${this.escapeHtml(message)}`;

    const main = document.querySelector('main');
    main.insertBefore(alert, main.firstChild);
  }
}

// Initialize application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ProjectDatabase();
  });
} else {
  new ProjectDatabase();
}
