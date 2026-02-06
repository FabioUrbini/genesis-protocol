/**
 * PatternLibraryUI.ts
 * Visual interface for the Pattern Library system
 */

import { PatternLibrary, PatternData } from '../game/PatternLibrary';

export class PatternLibraryUI {
  private container: HTMLElement | null = null;
  private library: PatternLibrary;
  private isVisible: boolean = false;
  private selectedPattern: string | null = null;

  constructor(library: PatternLibrary) {
    this.library = library;
    this.createUI();
  }

  private createUI(): void {
    this.container = document.createElement('div');
    this.container.id = 'pattern-library-ui';
    this.container.className = 'pattern-library-container hidden';
    this.container.innerHTML = `
      <div class="pattern-library-panel">
        <div class="pattern-library-header">
          <h2>Pattern Library</h2>
          <button class="close-btn" id="pattern-library-close">×</button>
        </div>
        <div class="pattern-library-content">
          <div class="pattern-categories" id="pattern-categories"></div>
          <div class="pattern-list" id="pattern-list"></div>
          <div class="pattern-details" id="pattern-details">
            <div class="no-selection">Select a pattern to view details</div>
          </div>
        </div>
        <div class="pattern-library-footer">
          <button id="pattern-save">Save Current Pattern</button>
          <button id="pattern-spawn">Spawn Selected</button>
          <button id="pattern-export">Export All</button>
          <button id="pattern-import">Import</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.container);
    this.setupEventListeners();
    this.applyStyles();
    this.refreshCategories();
  }

  private setupEventListeners(): void {
    const closeBtn = document.getElementById('pattern-library-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }

    const saveBtn = document.getElementById('pattern-save');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveCurrentPattern());
    }

    const spawnBtn = document.getElementById('pattern-spawn');
    if (spawnBtn) {
      spawnBtn.addEventListener('click', () => this.spawnSelectedPattern());
    }

    const exportBtn = document.getElementById('pattern-export');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportLibrary());
    }

    const importBtn = document.getElementById('pattern-import');
    if (importBtn) {
      importBtn.addEventListener('click', () => this.importLibrary());
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible) {
        this.hide();
      }
    });
  }

  private refreshCategories(): void {
    const categoriesContainer = document.getElementById('pattern-categories');
    if (!categoriesContainer) return;

    const categories = this.library.getCategories();
    categoriesContainer.innerHTML = `
      <div class="category-item active" data-category="all">All Patterns</div>
      ${categories.map(cat => `
        <div class="category-item" data-category="${cat}">${cat}</div>
      `).join('')}
    `;

    // Add click listeners
    const categoryItems = categoriesContainer.querySelectorAll('.category-item');
    categoryItems.forEach(item => {
      item.addEventListener('click', () => {
        categoryItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        const category = item.getAttribute('data-category');
        this.refreshPatternList(category === 'all' ? undefined : category || undefined);
      });
    });

    this.refreshPatternList();
  }

  private refreshPatternList(category?: string): void {
    const listContainer = document.getElementById('pattern-list');
    if (!listContainer) return;

    const patterns = category
      ? this.library.getPatternsByCategory(category)
      : this.library.listAllPatterns();

    if (patterns.length === 0) {
      listContainer.innerHTML = '<div class="no-patterns">No patterns found</div>';
      return;
    }

    listContainer.innerHTML = patterns.map(name => {
      const pattern = this.library.getPattern(name);
      return `
        <div class="pattern-item" data-pattern="${name}">
          <div class="pattern-icon">${this.getCategoryIcon(pattern?.category)}</div>
          <div class="pattern-info">
            <div class="pattern-name">${name}</div>
            <div class="pattern-meta">
              ${pattern?.data.length || 0} voxels | ${pattern?.category || 'Uncategorized'}
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Add click listeners
    const patternItems = listContainer.querySelectorAll('.pattern-item');
    patternItems.forEach(item => {
      item.addEventListener('click', () => {
        patternItems.forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        const patternName = item.getAttribute('data-pattern');
        if (patternName) {
          this.selectedPattern = patternName;
          this.showPatternDetails(patternName);
        }
      });
    });
  }

  private showPatternDetails(name: string): void {
    const detailsContainer = document.getElementById('pattern-details');
    if (!detailsContainer) return;

    const pattern = this.library.getPattern(name);
    if (!pattern) {
      detailsContainer.innerHTML = '<div class="no-selection">Pattern not found</div>';
      return;
    }

    const bounds = this.calculateBounds(pattern.data);

    detailsContainer.innerHTML = `
      <div class="pattern-detail-header">
        <div class="pattern-detail-icon">${this.getCategoryIcon(pattern.category)}</div>
        <div class="pattern-detail-title">${name}</div>
      </div>
      <div class="pattern-detail-info">
        <div class="detail-row">
          <span class="detail-label">Category:</span>
          <span class="detail-value">${pattern.category || 'Uncategorized'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Voxels:</span>
          <span class="detail-value">${pattern.data.length}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Size:</span>
          <span class="detail-value">${bounds.x}×${bounds.y}×${bounds.z}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Created:</span>
          <span class="detail-value">${new Date(pattern.timestamp).toLocaleDateString()}</span>
        </div>
      </div>
      <div class="pattern-detail-actions">
        <button class="detail-action-btn" id="pattern-delete">Delete</button>
        <button class="detail-action-btn" id="pattern-duplicate">Duplicate</button>
        <button class="detail-action-btn" id="pattern-rename">Rename</button>
      </div>
    `;

    // Setup action buttons
    const deleteBtn = document.getElementById('pattern-delete');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => this.deletePattern(name));
    }

    const duplicateBtn = document.getElementById('pattern-duplicate');
    if (duplicateBtn) {
      duplicateBtn.addEventListener('click', () => this.duplicatePattern(name));
    }

    const renameBtn = document.getElementById('pattern-rename');
    if (renameBtn) {
      renameBtn.addEventListener('click', () => this.renamePattern(name));
    }
  }

  private calculateBounds(data: Array<{x: number, y: number, z: number, state: number}>): {x: number, y: number, z: number} {
    if (data.length === 0) return {x: 0, y: 0, z: 0};

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    data.forEach(v => {
      minX = Math.min(minX, v.x);
      maxX = Math.max(maxX, v.x);
      minY = Math.min(minY, v.y);
      maxY = Math.max(maxY, v.y);
      minZ = Math.min(minZ, v.z);
      maxZ = Math.max(maxZ, v.z);
    });

    return {
      x: maxX - minX + 1,
      y: maxY - minY + 1,
      z: maxZ - minZ + 1
    };
  }

  private getCategoryIcon(category?: string): string {
    const icons: Record<string, string> = {
      'Still Life': '🔷',
      'Oscillators': '🔄',
      'Spaceships': '🚀',
      'Guns': '🔫',
      'Custom': '⭐',
      'Energy': '⚡',
      'Structures': '🏗️'
    };
    return icons[category || ''] || '📦';
  }

  private saveCurrentPattern(): void {
    const name = prompt('Enter pattern name:');
    if (!name) return;

    const category = prompt('Enter category (optional):') || 'Custom';

    // This would need to be connected to the actual game state
    // For now, just show a message
    console.log(`Save pattern: ${name} in category ${category}`);
    alert('Pattern saving requires integration with game state. Feature pending.');
  }

  private spawnSelectedPattern(): void {
    if (!this.selectedPattern) {
      alert('Please select a pattern first');
      return;
    }

    // This would trigger the actual spawn in the game
    console.log(`Spawn pattern: ${this.selectedPattern}`);
    this.hide();
  }

  private deletePattern(name: string): void {
    if (!confirm(`Delete pattern "${name}"?`)) return;

    this.library.deletePattern(name);
    this.selectedPattern = null;
    this.refreshCategories();
  }

  private duplicatePattern(name: string): void {
    const newName = prompt(`Duplicate "${name}" as:`, name + ' (copy)');
    if (!newName) return;

    const pattern = this.library.getPattern(name);
    if (pattern) {
      this.library.savePattern(newName, pattern.data, pattern.category);
      this.refreshCategories();
    }
  }

  private renamePattern(name: string): void {
    const newName = prompt(`Rename "${name}" to:`, name);
    if (!newName || newName === name) return;

    const pattern = this.library.getPattern(name);
    if (pattern) {
      this.library.savePattern(newName, pattern.data, pattern.category);
      this.library.deletePattern(name);
      this.selectedPattern = newName;
      this.refreshCategories();
      this.showPatternDetails(newName);
    }
  }

  private exportLibrary(): void {
    const json = this.library.exportToJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'genesis-patterns.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  private importLibrary(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const json = e.target?.result as string;
          if (json) {
            this.library.importFromJSON(json);
            this.refreshCategories();
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }

  private applyStyles(): void {
    if (document.getElementById('pattern-library-styles')) return;

    const style = document.createElement('style');
    style.id = 'pattern-library-styles';
    style.textContent = `
      .pattern-library-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        opacity: 1;
        transition: opacity 0.3s ease;
      }

      .pattern-library-container.hidden {
        display: none;
        opacity: 0;
      }

      .pattern-library-panel {
        background: rgba(20, 20, 30, 0.95);
        border: 2px solid rgba(80, 227, 194, 0.3);
        border-radius: 12px;
        padding: 20px;
        width: 90%;
        max-width: 1000px;
        height: 80vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      }

      .pattern-library-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 1px solid rgba(80, 227, 194, 0.2);
      }

      .pattern-library-header h2 {
        color: #50e3c2;
        font-size: 24px;
        margin: 0;
      }

      .pattern-library-content {
        flex: 1;
        display: grid;
        grid-template-columns: 200px 1fr 300px;
        gap: 20px;
        overflow: hidden;
      }

      .pattern-categories {
        background: rgba(0, 0, 0, 0.3);
        border-radius: 8px;
        padding: 10px;
        overflow-y: auto;
      }

      .category-item {
        padding: 10px;
        margin-bottom: 5px;
        border-radius: 6px;
        cursor: pointer;
        color: #fff;
        transition: all 0.2s;
      }

      .category-item:hover {
        background: rgba(80, 227, 194, 0.2);
      }

      .category-item.active {
        background: rgba(80, 227, 194, 0.3);
        color: #50e3c2;
        font-weight: bold;
      }

      .pattern-list {
        background: rgba(0, 0, 0, 0.3);
        border-radius: 8px;
        padding: 10px;
        overflow-y: auto;
      }

      .pattern-item {
        display: flex;
        align-items: center;
        padding: 12px;
        margin-bottom: 8px;
        background: rgba(0, 0, 0, 0.4);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .pattern-item:hover {
        border-color: rgba(80, 227, 194, 0.5);
        transform: translateX(4px);
      }

      .pattern-item.selected {
        background: rgba(80, 227, 194, 0.2);
        border-color: rgba(80, 227, 194, 0.7);
      }

      .pattern-icon {
        font-size: 24px;
        margin-right: 12px;
      }

      .pattern-info {
        flex: 1;
      }

      .pattern-name {
        color: #fff;
        font-weight: bold;
        margin-bottom: 4px;
      }

      .pattern-meta {
        color: rgba(255, 255, 255, 0.6);
        font-size: 12px;
      }

      .pattern-details {
        background: rgba(0, 0, 0, 0.3);
        border-radius: 8px;
        padding: 20px;
        overflow-y: auto;
      }

      .no-selection, .no-patterns {
        color: rgba(255, 255, 255, 0.5);
        text-align: center;
        padding: 40px 20px;
      }

      .pattern-detail-header {
        display: flex;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 1px solid rgba(80, 227, 194, 0.2);
      }

      .pattern-detail-icon {
        font-size: 36px;
        margin-right: 15px;
      }

      .pattern-detail-title {
        color: #50e3c2;
        font-size: 20px;
        font-weight: bold;
      }

      .pattern-detail-info {
        margin-bottom: 20px;
      }

      .detail-row {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .detail-label {
        color: rgba(255, 255, 255, 0.7);
      }

      .detail-value {
        color: #fff;
        font-weight: bold;
      }

      .pattern-detail-actions {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .detail-action-btn {
        background: rgba(80, 227, 194, 0.2);
        border: 1px solid rgba(80, 227, 194, 0.5);
        color: #50e3c2;
        padding: 10px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .detail-action-btn:hover {
        background: rgba(80, 227, 194, 0.3);
      }

      .pattern-library-footer {
        display: flex;
        justify-content: center;
        gap: 10px;
        padding-top: 15px;
        border-top: 1px solid rgba(80, 227, 194, 0.2);
        margin-top: 20px;
      }

      .pattern-library-footer button {
        background: rgba(80, 227, 194, 0.2);
        border: 1px solid rgba(80, 227, 194, 0.5);
        color: #50e3c2;
        padding: 10px 20px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .pattern-library-footer button:hover {
        background: rgba(80, 227, 194, 0.3);
        transform: translateY(-1px);
      }
    `;
    document.head.appendChild(style);
  }

  show(): void {
    if (!this.container) return;
    this.isVisible = true;
    this.container.classList.remove('hidden');
    this.refreshCategories();
    document.exitPointerLock();
  }

  hide(): void {
    if (!this.container) return;
    this.isVisible = false;
    this.container.classList.add('hidden');
  }

  toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  dispose(): void {
    if (this.container) {
      this.container.remove();
    }
  }
}
