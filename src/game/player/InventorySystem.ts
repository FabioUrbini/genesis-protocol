/**
 * Resource types that can be collected
 */
export enum ResourceType {
  CrystallizedVoxel = 'crystallized_voxel',
  EnergyCore = 'energy_core',
  TemporalShard = 'temporal_shard',
  CorruptedFragment = 'corrupted_fragment',
  AliveEssence = 'alive_essence',
  EnergizedCell = 'energized_cell',
}

/**
 * Resource metadata
 */
export interface ResourceInfo {
  type: ResourceType;
  name: string;
  description: string;
  maxStack: number;
  energyValue: number; // Energy restored when consumed
  canConsume: boolean;
}

/**
 * Resource definitions
 */
export const RESOURCE_INFO: Record<ResourceType, ResourceInfo> = {
  [ResourceType.CrystallizedVoxel]: {
    type: ResourceType.CrystallizedVoxel,
    name: 'Crystallized Voxel',
    description: 'Stable crystallized matter. Used for building and energy restoration.',
    maxStack: 99,
    energyValue: 20,
    canConsume: true,
  },
  [ResourceType.EnergyCore]: {
    type: ResourceType.EnergyCore,
    name: 'Energy Core',
    description: 'Concentrated energy from energized voxels. Restores significant energy.',
    maxStack: 50,
    energyValue: 50,
    canConsume: true,
  },
  [ResourceType.TemporalShard]: {
    type: ResourceType.TemporalShard,
    name: 'Temporal Shard',
    description: 'Fragment of frozen time. Used for temporal anchors and time manipulation.',
    maxStack: 20,
    energyValue: 0,
    canConsume: false,
  },
  [ResourceType.CorruptedFragment]: {
    type: ResourceType.CorruptedFragment,
    name: 'Corrupted Fragment',
    description: 'Dangerous corrupted matter. Handle with care.',
    maxStack: 50,
    energyValue: -10,
    canConsume: false,
  },
  [ResourceType.AliveEssence]: {
    type: ResourceType.AliveEssence,
    name: 'Alive Essence',
    description: 'Pure life force from alive voxels. Used for crafting and healing.',
    maxStack: 99,
    energyValue: 15,
    canConsume: true,
  },
  [ResourceType.EnergizedCell]: {
    type: ResourceType.EnergizedCell,
    name: 'Energized Cell',
    description: 'Volatile energized matter. Can be used for power or weapons.',
    maxStack: 50,
    energyValue: 30,
    canConsume: true,
  },
};

/**
 * Inventory item stack
 */
export interface InventoryItem {
  resource: ResourceType;
  quantity: number;
}

/**
 * Inventory configuration
 */
export interface InventoryConfig {
  maxSlots: number;
}

/**
 * Default inventory configuration
 */
export const DEFAULT_INVENTORY_CONFIG: InventoryConfig = {
  maxSlots: 20,
};

/**
 * Inventory System
 * Manages player resources and items
 */
export class InventorySystem {
  private items: Map<ResourceType, number> = new Map();
  private config: InventoryConfig;

  constructor(config: Partial<InventoryConfig> = {}) {
    this.config = { ...DEFAULT_INVENTORY_CONFIG, ...config };

    // Initialize all resource types with 0 quantity
    for (const resourceType of Object.values(ResourceType)) {
      this.items.set(resourceType, 0);
    }
  }

  /**
   * Add resource to inventory
   */
  public addResource(resource: ResourceType, quantity: number = 1): boolean {
    const info = RESOURCE_INFO[resource];
    const currentQuantity = this.items.get(resource) || 0;
    const newQuantity = currentQuantity + quantity;

    // Check if we exceed max stack
    if (newQuantity > info.maxStack) {
      // Add what we can
      const amountToAdd = info.maxStack - currentQuantity;
      if (amountToAdd > 0) {
        this.items.set(resource, info.maxStack);
        console.log(`Added ${amountToAdd}x ${info.name} (inventory full)`);
        return false; // Couldn't add all
      }
      console.log(`Inventory full for ${info.name}`);
      return false;
    }

    this.items.set(resource, newQuantity);
    console.log(`Added ${quantity}x ${info.name} (total: ${newQuantity})`);
    return true;
  }

  /**
   * Remove resource from inventory
   */
  public removeResource(resource: ResourceType, quantity: number = 1): boolean {
    const currentQuantity = this.items.get(resource) || 0;

    if (currentQuantity < quantity) {
      console.log(`Not enough ${RESOURCE_INFO[resource].name}`);
      return false;
    }

    this.items.set(resource, currentQuantity - quantity);
    console.log(`Removed ${quantity}x ${RESOURCE_INFO[resource].name}`);
    return true;
  }

  /**
   * Consume a resource (use for energy/health)
   */
  public consumeResource(resource: ResourceType): number {
    const info = RESOURCE_INFO[resource];

    if (!info.canConsume) {
      console.log(`Cannot consume ${info.name}`);
      return 0;
    }

    if (!this.removeResource(resource, 1)) {
      return 0;
    }

    console.log(`Consumed ${info.name} (+${info.energyValue} energy)`);
    return info.energyValue;
  }

  /**
   * Check if player has enough of a resource
   */
  public hasResource(resource: ResourceType, quantity: number = 1): boolean {
    const currentQuantity = this.items.get(resource) || 0;
    return currentQuantity >= quantity;
  }

  /**
   * Get quantity of a resource
   */
  public getQuantity(resource: ResourceType): number {
    return this.items.get(resource) || 0;
  }

  /**
   * Get all items in inventory
   */
  public getAllItems(): InventoryItem[] {
    const items: InventoryItem[] = [];

    for (const [resource, quantity] of this.items) {
      if (quantity > 0) {
        items.push({ resource, quantity });
      }
    }

    return items;
  }

  /**
   * Get number of occupied slots
   */
  public getOccupiedSlots(): number {
    let occupied = 0;
    for (const quantity of this.items.values()) {
      if (quantity > 0) occupied++;
    }
    return occupied;
  }

  /**
   * Get max slots
   */
  public getMaxSlots(): number {
    return this.config.maxSlots;
  }

  /**
   * Check if inventory is full
   */
  public isFull(): boolean {
    return this.getOccupiedSlots() >= this.config.maxSlots;
  }

  /**
   * Clear all items
   */
  public clear(): void {
    for (const resourceType of Object.values(ResourceType)) {
      this.items.set(resourceType, 0);
    }
    console.log('Inventory cleared');
  }

  /**
   * Get inventory summary
   */
  public getSummary(): string {
    const items = this.getAllItems();
    if (items.length === 0) {
      return 'Inventory empty';
    }

    const lines = items.map(item => {
      const info = RESOURCE_INFO[item.resource];
      return `${info.name}: ${item.quantity}`;
    });

    return lines.join('\n');
  }

  /**
   * Export inventory to JSON
   */
  public exportToJSON(): string {
    const data: Record<string, number> = {};

    for (const [resource, quantity] of this.items) {
      if (quantity > 0) {
        data[resource] = quantity;
      }
    }

    return JSON.stringify(data);
  }

  /**
   * Import inventory from JSON
   */
  public importFromJSON(json: string): boolean {
    try {
      const data = JSON.parse(json) as Record<string, number>;

      this.clear();

      for (const [resource, quantity] of Object.entries(data)) {
        if (Object.values(ResourceType).includes(resource as ResourceType)) {
          this.items.set(resource as ResourceType, quantity);
        }
      }

      console.log('Inventory imported successfully');
      return true;
    } catch (error) {
      console.error('Failed to import inventory:', error);
      return false;
    }
  }

  /**
   * Serialize inventory state
   */
  public serialize(): any {
    const data: Record<string, number> = {};

    for (const [resource, quantity] of this.items) {
      if (quantity > 0) {
        data[resource] = quantity;
      }
    }

    return {
      items: data,
      maxSlots: this.config.maxSlots
    };
  }

  /**
   * Deserialize inventory state
   */
  public deserialize(data: any): void {
    if (!data) return;

    this.clear();

    if (data.items) {
      for (const [resource, quantity] of Object.entries(data.items)) {
        if (Object.values(ResourceType).includes(resource as ResourceType)) {
          this.items.set(resource as ResourceType, quantity as number);
        }
      }
    }

    if (data.maxSlots) {
      this.config.maxSlots = data.maxSlots;
    }
  }
}
