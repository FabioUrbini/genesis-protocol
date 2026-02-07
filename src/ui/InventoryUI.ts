/**
 * InventoryUI.ts
 * Visual interface for the inventory system
 */

import { InventorySystem, ResourceType, RESOURCE_INFO } from '../game/InventorySystem';

export class InventoryUI {
  private container: HTMLElement | null = null;
  private inventory: InventorySystem;
  private isVisible: boolean = false;
  private slotElements: HTMLElement[] = [];

  constructor(inventory: InventorySystem) {
    this.inventory = inventory;
    this.createUI();
  }

  private createUI(): void {
    // Create container
    this.container = document.createElement('div');
    this.container.id = 'inventory-ui';
    this.container.className = 'inventory-container hidden';
    this.container.innerHTML = `
      <div class="inventory-panel">
        <div class="inventory-header">
          <h2>Inventory</h2>
          <button class="close-btn" id="inventory-close">×</button>
        </div>
        <div class="inventory-grid" id="inventory-grid"></div>
        <div class="inventory-footer">
          <div class="inventory-stats">
            <div>Slots: <span id="inventory-used-slots">0</span>/<span id="inventory-max-slots">20</span></div>
          </div>
          <div class="inventory-actions">
            <button id="inventory-export">Export</button>
            <button id="inventory-import">Import</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.container);

    // Create inventory slots
    this.createSlots();

    // Setup event listeners
    this.setupEventListeners();

    // Apply styles
    this.applyStyles();
  }

  private createSlots(): void {
    const grid = document.getElementById('inventory-grid');
    if (!grid) return;

    this.slotElements = [];

    // Create slots for all resource types
    Object.values(ResourceType).forEach((resourceType, index) => {
      const slotElement = document.createElement('div');
      slotElement.className = 'inventory-slot';
      slotElement.dataset.slotIndex = index.toString();

      const quantity = this.inventory.getQuantity(resourceType);

      if (quantity > 0) {
        slotElement.classList.add('has-item');
        slotElement.innerHTML = `
          <div class="item-icon ${this.getItemClass(resourceType)}">
            ${this.getItemIcon(resourceType)}
          </div>
          <div class="item-quantity">${quantity}</div>
          <div class="item-tooltip">
            <div class="item-name">${this.getItemName(resourceType)}</div>
            <div class="item-desc">${this.getItemDescription(resourceType)}</div>
          </div>
        `;
      } else {
        slotElement.innerHTML = `<div class="slot-empty">Empty</div>`;
      }

      grid.appendChild(slotElement);
      this.slotElements.push(slotElement);
    });
  }

  private setupEventListeners(): void {
    // Close button
    const closeBtn = document.getElementById('inventory-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }

    // Export button
    const exportBtn = document.getElementById('inventory-export');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportInventory());
    }

    // Import button
    const importBtn = document.getElementById('inventory-import');
    if (importBtn) {
      importBtn.addEventListener('click', () => this.importInventory());
    }

    // ESC to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible) {
        this.hide();
      }
    });

    // Slot click handlers
    this.slotElements.forEach((slotEl, index) => {
      slotEl.addEventListener('click', () => this.handleSlotClick(index));
    });
  }

  private handleSlotClick(index: number): void {
    const resourceTypes = Object.values(ResourceType);
    if (index >= 0 && index < resourceTypes.length) {
      const resourceType = resourceTypes[index];
      if (!resourceType) return;

      const info = RESOURCE_INFO[resourceType];
      if (!info) return;

      if (info.canConsume && this.inventory.getQuantity(resourceType) > 0) {
        const energyGained = this.inventory.consumeResource(resourceType);
        console.log(`Used ${info.name}, gained ${energyGained} energy`);
        this.refresh();
      }
    }
  }

  private getItemClass(type: ResourceType): string {
    const classes: Record<ResourceType, string> = {
      [ResourceType.EnergyCore]: 'item-energy',
      [ResourceType.CrystallizedVoxel]: 'item-crystal',
      [ResourceType.TemporalShard]: 'item-temporal',
      [ResourceType.CorruptedFragment]: 'item-corrupted',
      [ResourceType.AliveEssence]: 'item-alive',
      [ResourceType.EnergizedCell]: 'item-energized'
    };
    return classes[type] || 'item-default';
  }

  private getItemIcon(type: ResourceType): string {
    const icons: Record<ResourceType, string> = {
      [ResourceType.EnergyCore]: '⚡',
      [ResourceType.CrystallizedVoxel]: '💎',
      [ResourceType.TemporalShard]: '⏳',
      [ResourceType.CorruptedFragment]: '🧨',
      [ResourceType.AliveEssence]: '🌟',
      [ResourceType.EnergizedCell]: '✨'
    };
    return icons[type] || '?';
  }

  private getItemName(type: ResourceType): string {
    return RESOURCE_INFO[type].name;
  }

  private getItemDescription(type: ResourceType): string {
    return RESOURCE_INFO[type].description;
  }

  private exportInventory(): void {
    const json = this.inventory.exportToJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'genesis-inventory.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  private importInventory(): void {
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
            this.inventory.importFromJSON(json);
            this.refresh();
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }

  private applyStyles(): void {
    if (document.getElementById('inventory-styles')) return;

    const style = document.createElement('style');
    style.id = 'inventory-styles';
    style.textContent = `
      .inventory-container {
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

      .inventory-container.hidden {
        display: none;
        opacity: 0;
      }

      .inventory-panel {
        background: rgba(20, 20, 30, 0.95);
        border: 2px solid rgba(80, 227, 194, 0.3);
        border-radius: 12px;
        padding: 20px;
        min-width: 600px;
        max-width: 800px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      }

      .inventory-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 1px solid rgba(80, 227, 194, 0.2);
      }

      .inventory-header h2 {
        color: #50e3c2;
        font-size: 24px;
        margin: 0;
      }

      .close-btn {
        background: none;
        border: none;
        color: #fff;
        font-size: 32px;
        cursor: pointer;
        padding: 0;
        width: 40px;
        height: 40px;
        line-height: 32px;
        transition: color 0.2s;
      }

      .close-btn:hover {
        color: #50e3c2;
      }

      .inventory-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 10px;
        margin-bottom: 20px;
      }

      .inventory-slot {
        aspect-ratio: 1;
        background: rgba(0, 0, 0, 0.4);
        border: 2px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        cursor: pointer;
        transition: all 0.2s;
      }

      .inventory-slot:hover {
        border-color: rgba(80, 227, 194, 0.5);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(80, 227, 194, 0.2);
      }

      .inventory-slot.has-item {
        background: rgba(80, 227, 194, 0.1);
      }

      .slot-empty {
        color: rgba(255, 255, 255, 0.3);
        font-size: 12px;
      }

      .item-icon {
        font-size: 36px;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
      }

      .item-quantity {
        position: absolute;
        bottom: 4px;
        right: 6px;
        background: rgba(0, 0, 0, 0.8);
        color: #fff;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: bold;
      }

      .item-tooltip {
        display: none;
        position: absolute;
        bottom: 110%;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.95);
        border: 1px solid rgba(80, 227, 194, 0.5);
        border-radius: 6px;
        padding: 10px;
        min-width: 150px;
        z-index: 10;
        pointer-events: none;
      }

      .inventory-slot:hover .item-tooltip {
        display: block;
      }

      .item-name {
        color: #50e3c2;
        font-weight: bold;
        margin-bottom: 4px;
      }

      .item-desc {
        color: rgba(255, 255, 255, 0.8);
        font-size: 12px;
      }

      .inventory-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 15px;
        border-top: 1px solid rgba(80, 227, 194, 0.2);
      }

      .inventory-stats {
        color: #fff;
        font-size: 14px;
      }

      .inventory-actions button {
        background: rgba(80, 227, 194, 0.2);
        border: 1px solid rgba(80, 227, 194, 0.5);
        color: #50e3c2;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        margin-left: 10px;
        transition: all 0.2s;
      }

      .inventory-actions button:hover {
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
    this.refresh();
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

  refresh(): void {
    const grid = document.getElementById('inventory-grid');
    if (grid) {
      grid.innerHTML = '';
      this.createSlots();
    }

    // Update stats
    const usedSlots = document.getElementById('inventory-used-slots');
    const maxSlots = document.getElementById('inventory-max-slots');
    if (usedSlots) {
      usedSlots.textContent = this.inventory.getOccupiedSlots().toString();
    }
    if (maxSlots) {
      maxSlots.textContent = this.inventory.getMaxSlots().toString();
    }
  }

  dispose(): void {
    if (this.container) {
      this.container.remove();
    }
  }
}
