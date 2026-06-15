/**
 * ITEM DETAIL PAGE - Dynamic Content Loading
 * Loads item data from database.json and renders complete item details
 */

class ItemDetailPage {
  constructor() {
    this.data = null;
    this.item = null;
    this.currentImageIndex = 0;
    this.allEquipmentTypes = {};
    this.allTrainingRequirements = {};
    this.psychtechEmails = [];

    this.elements = {
      loading: document.getElementById('loading'),
      error: document.getElementById('error'),
      errorMessage: document.getElementById('error-message'),
      itemContent: document.getElementById('item-content'),
      itemTitle: document.getElementById('item-title'),
      itemTypeBadge: document.querySelector('.item-type-badge'),
      itemQuantityInfo: document.querySelector('.item-quantity-info'),
      galleryImage: document.getElementById('gallery-image'),
      galleryCurrent: document.getElementById('gallery-current'),
      galleryTotal: document.getElementById('gallery-total'),
      galleryPrev: document.getElementById('gallery-prev'),
      galleryNext: document.getElementById('gallery-next'),
      galleryThumbnails: document.querySelector('.gallery-thumbnails'),
      itemTypeLabel: document.getElementById('item-type-label'),
      itemTypeDescription: document.getElementById('item-type-description'),
      itemDescription: document.getElementById('item-description'),
      itemTraining: document.getElementById('item-training'),
      trainingSection: document.getElementById('training-section'),
      itemUseCases: document.getElementById('item-use-cases'),
      itemRestrictions: document.getElementById('item-restrictions'),
      restrictionsSection: document.getElementById('restrictions-section'),
      itemWorksWith: document.getElementById('item-works-with'),
      worksWithSection: document.getElementById('works-with-section'),
      itemManuals: document.getElementById('item-manuals'),
      manualsSection: document.getElementById('manuals-section'),
      itemRiskAssessments: document.getElementById('item-risk-assessments'),
      riskSection: document.getElementById('risk-section'),
      itemOtherDocuments: document.getElementById('item-other-documents'),
      otherDocsSection: document.getElementById('other-docs-section'),
      itemSimilar: document.getElementById('item-similar'),
      similarSection: document.getElementById('similar-section'),
      contactBtn: document.getElementById('contact-btn'),
      documentTileTemplate: document.getElementById('document-tile-template'),
      trainingBadgeTemplate: document.getElementById('training-badge-template'),
      similarItemTemplate: document.getElementById('similar-item-template'),
      galleryThumbnailTemplate: document.getElementById('gallery-thumbnail-template')
    };

    this.init();
  }

  /**
   * Initialize the page
   */
  async init() {
    try {
      console.log('ItemDetailPage: Starting initialization...');
      await this.loadData();
      console.log('ItemDetailPage: Data loaded', this.data);
      this.getItemFromURL();
      console.log('ItemDetailPage: Item found', this.item);
      this.renderItemDetails();
      console.log('ItemDetailPage: Details rendered successfully');
      this.attachEventListeners();
    } catch (error) {
      console.error('ItemDetailPage: Failed to load item details:', error);
      this.showError(error.message || 'Failed to load item details');
    }
  }

  /**
   * Load database JSON
   */
  async loadData() {
    const response = await fetch('../data/database.json');
    if (!response.ok) {
      throw new Error(`Failed to load database: ${response.status} ${response.statusText}`);
    }
    this.data = await response.json();

    // Store references for lookups
    this.data.equipmentTypes.forEach((type) => {
      this.allEquipmentTypes[type.id] = type;
    });

    this.data.trainingRequirements.forEach((req) => {
      this.allTrainingRequirements[req.id] = req;
    });

    this.psychtechEmails = this.data.meta.psychtechEmails || [];
  }

  /**
   * Get item ID from URL and find item in data
   */
  getItemFromURL() {
    const params = new URLSearchParams(window.location.search);
    const itemId = params.get('id');

    if (!itemId) {
      throw new Error('No item ID specified in URL');
    }

    this.item = this.data.items.find((item) => item.id === itemId);

    if (!this.item) {
      throw new Error(`Item not found: ${itemId}`);
    }
  }

  /**
   * Render all item details
   */
  renderItemDetails() {
    // Hide loading, show content
    this.elements.loading.style.display = 'none';
    this.elements.itemContent.style.display = 'block';

    // Basic info
    this.elements.itemTitle.textContent = this.item.name;
    this.elements.itemTypeBadge.textContent = this.getEquipmentTypeLabel(this.item.type);
    this.elements.itemQuantityInfo.textContent = `Quantity: ${this.item.quantity} unit${this.item.quantity !== 1 ? 's' : ''}`;

    // Update page title
    document.title = `${this.item.name} - Project Database`;

    // Gallery
    this.renderGallery();

    // Type section
    this.renderTypeSection();

    // Description
    this.elements.itemDescription.innerHTML = this.linkify(this.escapeHtml(this.item.description));

    // Training
    this.renderTrainingRequirements();

    // Use cases
    this.elements.itemUseCases.textContent = this.item.useCases;

    // Restrictions
    if (this.item.restrictions) {
      this.elements.itemRestrictions.innerHTML = this.linkify(this.escapeHtml(this.item.restrictions));
      this.elements.restrictionsSection.hidden = false;
    }

    // Works with
    this.renderWorksWith();

    // Documents
    this.renderDocuments();

    // Similar equipment
    this.renderSimilarEquipment();

    // Update contact button href
    this.updateContactButton();
  }

  /**
   * Render image gallery
   */
  renderGallery() {
    const images = this.item.images && this.item.images.length > 0
      ? this.item.images.map(path => path.replace('assets/', '../assets/'))
      : ['../assets/images/placeholder.png'];

    // Update total
    this.elements.galleryTotal.textContent = images.length;

    // Render main image
    this.currentImageIndex = 0;
    this.updateGalleryImage(images);

    // Render thumbnails only if there are multiple images
    if (images.length > 1) {
      this.elements.galleryThumbnails.innerHTML = '';
      images.forEach((imagePath, index) => {
        const thumbnail = this.elements.galleryThumbnailTemplate.content.cloneNode(true);
        const btn = thumbnail.querySelector('.gallery-thumbnail');
        const img = thumbnail.querySelector('.thumbnail-image');

        btn.setAttribute('aria-label', `Image ${index + 1} of ${images.length}`);
        if (index === 0) {
          btn.setAttribute('aria-selected', 'true');
        }

        btn.addEventListener('click', () => {
          this.currentImageIndex = index;
          this.updateGalleryImage(images);
          this.updateThumbnailSelection();
        });

        img.src = imagePath;
        img.alt = `${this.item.name} image ${index + 1}`;

        this.elements.galleryThumbnails.appendChild(thumbnail);
      });
    } else {
      // Hide thumbnails if only one image
      this.elements.galleryThumbnails.parentElement.style.display = 'none';
    }

    // Store images for keyboard nav
    this.currentImages = images;
  }

  /**
   * Update the main gallery image
   */
  updateGalleryImage(images) {
    this.elements.galleryImage.src = images[this.currentImageIndex];
    this.elements.galleryImage.alt = `${this.item.name} - Image ${this.currentImageIndex + 1}`;
    this.elements.galleryCurrent.textContent = this.currentImageIndex + 1;

    // Update button states
    this.elements.galleryPrev.disabled = this.currentImageIndex === 0;
    this.elements.galleryNext.disabled = this.currentImageIndex === images.length - 1;

    this.updateThumbnailSelection();
  }

  /**
   * Update thumbnail selection styling
   */
  updateThumbnailSelection() {
    const thumbnails = document.querySelectorAll('.gallery-thumbnail');
    thumbnails.forEach((thumb, index) => {
      if (index === this.currentImageIndex) {
        thumb.setAttribute('aria-selected', 'true');
      } else {
        thumb.setAttribute('aria-selected', 'false');
      }
    });
  }

  /**
   * Render type description section
   */
  renderTypeSection() {
    const type = this.allEquipmentTypes[this.item.type];
    if (type) {
      this.elements.itemTypeLabel.textContent = type.label;
      this.elements.itemTypeDescription.textContent = type.description;
    }
  }

  /**
   * Render training requirements
   */
  renderTrainingRequirements() {
    if (!this.item.trainingRequired || this.item.trainingRequired.length === 0) {
      this.elements.trainingSection.hidden = true;
      return;
    }

    this.elements.itemTraining.innerHTML = '';
    this.elements.trainingSection.hidden = false;

    this.item.trainingRequired.forEach((training) => {
      const req = this.allTrainingRequirements[training.requirementId];
      if (!req) return;

      const badge = this.elements.trainingBadgeTemplate.content.cloneNode(true);
      const icon = badge.querySelector('.training-icon');
      const label = badge.querySelector('.training-label');

      icon.textContent = req.icon;
      label.textContent = req.label;

      this.elements.itemTraining.appendChild(badge);
    });
  }

  /**
   * Render works with items
   */
  renderWorksWith() {
    if (!this.item.worksWithItems || this.item.worksWithItems.length === 0) {
      this.elements.worksWithSection.hidden = true;
      return;
    }

    this.elements.itemWorksWith.innerHTML = '';
    this.elements.worksWithSection.hidden = false;

    this.item.worksWithItems.forEach((itemId) => {
      const relatedItem = this.data.items.find((i) => i.id === itemId);
      if (!relatedItem) return;

      const li = document.createElement('li');
      const link = document.createElement('a');
      link.href = `?id=${relatedItem.id}`;
      link.textContent = relatedItem.name;
      li.appendChild(link);

      this.elements.itemWorksWith.appendChild(li);
    });
  }

  /**
   * Render documents (manuals, risk assessments, other)
   */
  renderDocuments() {
    // Manuals
    if (this.item.documents?.manuals && this.item.documents.manuals.length > 0) {
      this.elements.manualsSection.hidden = false;
      this.elements.itemManuals.innerHTML = '';
      this.item.documents.manuals.forEach((doc) => {
        this.appendDocumentTile(this.elements.itemManuals, doc);
      });
    } else {
      this.elements.manualsSection.hidden = true;
    }

    // Risk assessments
    if (this.item.documents?.riskAssessments && this.item.documents.riskAssessments.length > 0) {
      this.elements.riskSection.hidden = false;
      this.elements.itemRiskAssessments.innerHTML = '';
      this.item.documents.riskAssessments.forEach((doc) => {
        this.appendDocumentTile(this.elements.itemRiskAssessments, doc);
      });
    } else {
      this.elements.riskSection.hidden = true;
    }

    // Other documents
    if (this.item.documents?.other && this.item.documents.other.length > 0) {
      this.elements.otherDocsSection.hidden = false;
      this.elements.itemOtherDocuments.innerHTML = '';
      this.item.documents.other.forEach((doc) => {
        this.appendDocumentTile(this.elements.itemOtherDocuments, doc);
      });
    } else {
      this.elements.otherDocsSection.hidden = true;
    }
  }

  /**
   * Append a document tile
   */
  appendDocumentTile(container, doc) {
    const tile = this.elements.documentTileTemplate.content.cloneNode(true);
    const link = tile.querySelector('.document-tile');
    const icon = tile.querySelector('.document-icon');
    const name = tile.querySelector('.document-name');
    const type = tile.querySelector('.document-type');

    // Fix document path to go up one level
    const docPath = doc.path.replace('assets/', '../assets/');
    link.href = docPath;
    link.setAttribute('aria-label', `Download ${doc.filename}`);
    name.textContent = doc.filename;
    type.textContent = doc.type.toUpperCase();

    // Icon based on type
    const iconMap = {
      pdf: '📄',
      docx: '📝',
      doc: '📝',
      xlsx: '📊',
      xls: '📊',
      markdown: '📝',
      md: '📝',
      zip: '📦',
      default: '📎'
    };

    const fileExt = doc.type.toLowerCase();
    icon.textContent = iconMap[fileExt] || iconMap.default;

    container.appendChild(tile);
  }

  /**
   * Render similar equipment (by type)
   */
  renderSimilarEquipment() {
    const similarItems = this.data.items.filter(
      (item) => item.type === this.item.type && item.id !== this.item.id
    );

    if (similarItems.length === 0) {
      this.elements.similarSection.hidden = true;
      return;
    }

    this.elements.itemSimilar.innerHTML = '';
    this.elements.similarSection.hidden = false;

    similarItems.forEach((similarItem) => {
      const li = this.elements.similarItemTemplate.content.cloneNode(true);
      const link = li.querySelector('.similar-link');
      link.href = `?id=${similarItem.id}`;
      link.textContent = similarItem.name;

      this.elements.itemSimilar.appendChild(li);
    });
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Gallery navigation
    this.elements.galleryPrev.addEventListener('click', () => {
      if (this.currentImageIndex > 0) {
        this.currentImageIndex--;
        this.updateGalleryImage(this.currentImages);
      }
    });

    this.elements.galleryNext.addEventListener('click', () => {
      if (this.currentImageIndex < this.currentImages.length - 1) {
        this.currentImageIndex++;
        this.updateGalleryImage(this.currentImages);
      }
    });

    // Keyboard navigation for gallery
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' && this.currentImageIndex > 0) {
        this.currentImageIndex--;
        this.updateGalleryImage(this.currentImages);
        this.elements.galleryImage.focus();
      } else if (e.key === 'ArrowRight' && this.currentImageIndex < this.currentImages.length - 1) {
        this.currentImageIndex++;
        this.updateGalleryImage(this.currentImages);
        this.elements.galleryImage.focus();
      }
    });

    // Contact button
    this.elements.contactBtn.addEventListener('click', () => {
      this.sendContactEmail();
    });
  }

  /**
   * Send contact email via mailto
   */
  sendContactEmail() {
    if (this.psychtechEmails.length === 0) {
      alert('Psychology technician email not configured');
      return;
    }

    const to = this.psychtechEmails.join(',');
    const subject = `Enquiry about: ${this.item.name}`;
    const body = `I would like more information about the ${this.item.name}.`;

    window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  /**
   * Get equipment type label
   */
  getEquipmentTypeLabel(typeId) {
    const type = this.allEquipmentTypes[typeId];
    return type ? type.label : 'Unknown';
  }

  /**
   * Convert URLs in text to clickable links
   */
  linkify(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, (url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });
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
   * Update contact button
   */
  updateContactButton() {
    this.elements.contactBtn.textContent = `Contact Psychology Technician about ${this.item.name}`;
  }

  /**
   * Show error message
   */
  showError(message) {
    this.elements.loading.style.display = 'none';
    this.elements.itemContent.style.display = 'none';
    this.elements.error.hidden = false;
    this.elements.errorMessage.textContent = message;
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ItemDetailPage();
  });
} else {
  new ItemDetailPage();
}