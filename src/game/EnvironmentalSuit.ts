import { ResourceType, InventorySystem } from './InventorySystem';

/**
 * Upgrade types for environmental suit
 */
export enum UpgradeType {
  EnergyCapacity = 'energy_capacity',
  OxygenCapacity = 'oxygen_capacity',
  EnergyRegeneration = 'energy_regeneration',
  OxygenEfficiency = 'oxygen_efficiency',
  MovementSpeed = 'movement_speed',
  JumpHeight = 'jump_height',
}

/**
 * Upgrade level data
 */
export interface UpgradeLevel {
  level: number;
  cost: Partial<Record<ResourceType, number>>;
  effect: number; // Percentage increase or absolute value
}

/**
 * Upgrade configuration
 */
export interface UpgradeConfig {
  type: UpgradeType;
  name: string;
  description: string;
  maxLevel: number;
  levels: UpgradeLevel[];
}

/**
 * Upgrade definitions
 */
export const UPGRADES: Record<UpgradeType, UpgradeConfig> = {
  [UpgradeType.EnergyCapacity]: {
    type: UpgradeType.EnergyCapacity,
    name: 'Energy Capacity',
    description: 'Increases maximum energy',
    maxLevel: 5,
    levels: [
      { level: 1, cost: { [ResourceType.EnergyCore]: 5 }, effect: 20 },
      { level: 2, cost: { [ResourceType.EnergyCore]: 10 }, effect: 40 },
      { level: 3, cost: { [ResourceType.EnergyCore]: 15 }, effect: 60 },
      { level: 4, cost: { [ResourceType.EnergyCore]: 20 }, effect: 80 },
      { level: 5, cost: { [ResourceType.EnergyCore]: 25 }, effect: 100 },
    ],
  },
  [UpgradeType.OxygenCapacity]: {
    type: UpgradeType.OxygenCapacity,
    name: 'Oxygen Capacity',
    description: 'Increases maximum oxygen',
    maxLevel: 5,
    levels: [
      { level: 1, cost: { [ResourceType.CrystallizedVoxel]: 5 }, effect: 20 },
      { level: 2, cost: { [ResourceType.CrystallizedVoxel]: 10 }, effect: 40 },
      { level: 3, cost: { [ResourceType.CrystallizedVoxel]: 15 }, effect: 60 },
      { level: 4, cost: { [ResourceType.CrystallizedVoxel]: 20 }, effect: 80 },
      { level: 5, cost: { [ResourceType.CrystallizedVoxel]: 25 }, effect: 100 },
    ],
  },
  [UpgradeType.EnergyRegeneration]: {
    type: UpgradeType.EnergyRegeneration,
    name: 'Energy Regeneration',
    description: 'Increases energy regeneration rate in safe zones',
    maxLevel: 3,
    levels: [
      { level: 1, cost: { [ResourceType.EnergizedCell]: 10, [ResourceType.CrystallizedVoxel]: 5 }, effect: 25 },
      { level: 2, cost: { [ResourceType.EnergizedCell]: 20, [ResourceType.CrystallizedVoxel]: 10 }, effect: 50 },
      { level: 3, cost: { [ResourceType.EnergizedCell]: 30, [ResourceType.CrystallizedVoxel]: 15 }, effect: 100 },
    ],
  },
  [UpgradeType.OxygenEfficiency]: {
    type: UpgradeType.OxygenEfficiency,
    name: 'Oxygen Efficiency',
    description: 'Reduces oxygen consumption rate',
    maxLevel: 3,
    levels: [
      { level: 1, cost: { [ResourceType.AliveEssence]: 10, [ResourceType.CrystallizedVoxel]: 5 }, effect: 15 },
      { level: 2, cost: { [ResourceType.AliveEssence]: 20, [ResourceType.CrystallizedVoxel]: 10 }, effect: 30 },
      { level: 3, cost: { [ResourceType.AliveEssence]: 30, [ResourceType.CrystallizedVoxel]: 15 }, effect: 50 },
    ],
  },
  [UpgradeType.MovementSpeed]: {
    type: UpgradeType.MovementSpeed,
    name: 'Movement Speed',
    description: 'Increases movement speed',
    maxLevel: 3,
    levels: [
      { level: 1, cost: { [ResourceType.EnergizedCell]: 5, [ResourceType.AliveEssence]: 5 }, effect: 10 },
      { level: 2, cost: { [ResourceType.EnergizedCell]: 10, [ResourceType.AliveEssence]: 10 }, effect: 20 },
      { level: 3, cost: { [ResourceType.EnergizedCell]: 15, [ResourceType.AliveEssence]: 15 }, effect: 35 },
    ],
  },
  [UpgradeType.JumpHeight]: {
    type: UpgradeType.JumpHeight,
    name: 'Jump Height',
    description: 'Increases jump height',
    maxLevel: 3,
    levels: [
      { level: 1, cost: { [ResourceType.EnergizedCell]: 5 }, effect: 15 },
      { level: 2, cost: { [ResourceType.EnergizedCell]: 10 }, effect: 30 },
      { level: 3, cost: { [ResourceType.EnergizedCell]: 15 }, effect: 50 },
    ],
  },
};

/**
 * Environmental Suit Upgrade System
 * Manages player upgrades and enhancements
 */
export class EnvironmentalSuit {
  private inventory: InventorySystem;
  private upgradeLevels: Map<UpgradeType, number> = new Map();

  constructor(inventory: InventorySystem) {
    this.inventory = inventory;

    // Initialize all upgrades at level 0
    for (const upgradeType of Object.values(UpgradeType)) {
      this.upgradeLevels.set(upgradeType, 0);
    }
  }

  /**
   * Check if an upgrade can be purchased
   */
  public canUpgrade(upgradeType: UpgradeType): boolean {
    const config = UPGRADES[upgradeType];
    const currentLevel = this.upgradeLevels.get(upgradeType) || 0;

    // Check if max level reached
    if (currentLevel >= config.maxLevel) {
      return false;
    }

    // Get next level cost
    const nextLevel = config.levels[currentLevel];
    if (!nextLevel) return false;

    // Check if player has required resources
    for (const [resource, amount] of Object.entries(nextLevel.cost)) {
      if (!this.inventory.hasResource(resource as ResourceType, amount)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Purchase an upgrade
   */
  public upgrade(upgradeType: UpgradeType): boolean {
    if (!this.canUpgrade(upgradeType)) {
      console.log(`Cannot upgrade ${UPGRADES[upgradeType].name}`);
      return false;
    }

    const config = UPGRADES[upgradeType];
    const currentLevel = this.upgradeLevels.get(upgradeType) || 0;
    const nextLevel = config.levels[currentLevel]!;

    // Consume resources
    for (const [resource, amount] of Object.entries(nextLevel.cost)) {
      this.inventory.removeResource(resource as ResourceType, amount);
    }

    // Apply upgrade
    this.upgradeLevels.set(upgradeType, currentLevel + 1);

    console.log(`Upgraded ${config.name} to level ${currentLevel + 1}`);
    return true;
  }

  /**
   * Get current level of an upgrade
   */
  public getLevel(upgradeType: UpgradeType): number {
    return this.upgradeLevels.get(upgradeType) || 0;
  }

  /**
   * Get effect value for an upgrade
   */
  public getEffect(upgradeType: UpgradeType): number {
    const level = this.getLevel(upgradeType);
    if (level === 0) return 0;

    const config = UPGRADES[upgradeType];
    const levelData = config.levels[level - 1];
    return levelData?.effect || 0;
  }

  /**
   * Get multiplier for percentage-based upgrades
   */
  public getMultiplier(upgradeType: UpgradeType): number {
    const effect = this.getEffect(upgradeType);
    return 1 + (effect / 100);
  }

  /**
   * Get all upgrade levels
   */
  public getAllLevels(): Map<UpgradeType, number> {
    return new Map(this.upgradeLevels);
  }

  /**
   * Reset all upgrades
   */
  public reset(): void {
    for (const upgradeType of Object.values(UpgradeType)) {
      this.upgradeLevels.set(upgradeType, 0);
    }
    console.log('All upgrades reset');
  }

  /**
   * Get upgrade summary
   */
  public getSummary(): string {
    const lines: string[] = ['=== UPGRADES ==='];

    for (const [type, level] of this.upgradeLevels) {
      if (level > 0) {
        const config = UPGRADES[type];
        const effect = this.getEffect(type);
        lines.push(`${config.name}: Level ${level}/${config.maxLevel} (+${effect}%)`);
      }
    }

    if (lines.length === 1) {
      lines.push('No upgrades purchased');
    }

    lines.push('================');
    return lines.join('\n');
  }

  /**
   * Export upgrades to JSON
   */
  public exportToJSON(): string {
    const data: Record<string, number> = {};

    for (const [type, level] of this.upgradeLevels) {
      if (level > 0) {
        data[type] = level;
      }
    }

    return JSON.stringify(data);
  }

  /**
   * Import upgrades from JSON
   */
  public importFromJSON(json: string): boolean {
    try {
      const data = JSON.parse(json) as Record<string, number>;

      this.reset();

      for (const [type, level] of Object.entries(data)) {
        if (Object.values(UpgradeType).includes(type as UpgradeType)) {
          this.upgradeLevels.set(type as UpgradeType, level);
        }
      }

      console.log('Upgrades imported successfully');
      return true;
    } catch (error) {
      console.error('Failed to import upgrades:', error);
      return false;
    }
  }

  /**
   * Serialize environmental suit state
   */
  public serialize(): any {
    const upgrades: Record<string, number> = {};

    for (const [type, level] of this.upgradeLevels) {
      if (level > 0) {
        upgrades[type] = level;
      }
    }

    return {
      upgrades,
      currentEnergy: this.getCurrentEnergy(),
      currentOxygen: this.getCurrentOxygen(),
      maxEnergy: this.getMaxEnergy(),
      maxOxygen: this.getMaxOxygen()
    };
  }

  /**
   * Deserialize environmental suit state
   */
  public deserialize(data: any): void {
    if (!data) return;

    this.reset();

    if (data.upgrades) {
      for (const [type, level] of Object.entries(data.upgrades)) {
        if (Object.values(UpgradeType).includes(type as UpgradeType)) {
          this.upgradeLevels.set(type as UpgradeType, level as number);
        }
      }
    }

    // Note: currentEnergy, currentOxygen, maxEnergy, maxOxygen will be restored
    // by the physics system, not here
  }

  /**
   * Get current energy (for save/load)
   */
  public getCurrentEnergy(): number {
    // This will be connected to player physics in a future update
    return 100;
  }

  /**
   * Get current oxygen (for save/load)
   */
  public getCurrentOxygen(): number {
    // This will be connected to player physics in a future update
    return 100;
  }

  /**
   * Get max energy based on upgrades
   */
  public getMaxEnergy(): number {
    const baseEnergy = 100;
    const multiplier = this.getMultiplier(UpgradeType.EnergyCapacity);
    return baseEnergy * multiplier;
  }

  /**
   * Get max oxygen based on upgrades
   */
  public getMaxOxygen(): number {
    const baseOxygen = 100;
    const multiplier = this.getMultiplier(UpgradeType.OxygenCapacity);
    return baseOxygen * multiplier;
  }
}
