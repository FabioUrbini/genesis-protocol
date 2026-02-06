import { VoxelState } from '../core/VoxelState';
import { ResourceType, InventorySystem } from './InventorySystem';

/**
 * Drop chance for resources from voxels
 */
export interface ResourceDropTable {
  resource: ResourceType;
  chance: number; // 0.0 to 1.0
  minAmount: number;
  maxAmount: number;
}

/**
 * Voxel resource drops
 */
export const VOXEL_DROPS: Record<VoxelState, ResourceDropTable[]> = {
  [VoxelState.Dead]: [],
  [VoxelState.Alive]: [
    {
      resource: ResourceType.AliveEssence,
      chance: 0.3,
      minAmount: 1,
      maxAmount: 3,
    },
  ],
  [VoxelState.Energized]: [
    {
      resource: ResourceType.EnergizedCell,
      chance: 0.5,
      minAmount: 1,
      maxAmount: 2,
    },
    {
      resource: ResourceType.EnergyCore,
      chance: 0.2,
      minAmount: 1,
      maxAmount: 1,
    },
  ],
  [VoxelState.Crystallized]: [
    {
      resource: ResourceType.CrystallizedVoxel,
      chance: 0.8,
      minAmount: 1,
      maxAmount: 2,
    },
    {
      resource: ResourceType.TemporalShard,
      chance: 0.1,
      minAmount: 1,
      maxAmount: 1,
    },
  ],
  [VoxelState.Corrupted]: [
    {
      resource: ResourceType.CorruptedFragment,
      chance: 0.6,
      minAmount: 1,
      maxAmount: 3,
    },
  ],
};

/**
 * Resource Harvesting System
 * Handles resource drops and collection
 */
export class ResourceHarvesting {
  private inventory: InventorySystem;
  private harvestingEnabled: boolean = true;

  constructor(inventory: InventorySystem) {
    this.inventory = inventory;
  }

  /**
   * Harvest a voxel and add resources to inventory
   */
  public harvestVoxel(voxelState: VoxelState): boolean {
    if (!this.harvestingEnabled) {
      return false;
    }

    if (voxelState === VoxelState.Dead) {
      return false;
    }

    const drops = VOXEL_DROPS[voxelState];
    let harvested = false;

    for (const drop of drops) {
      // Check if resource drops
      if (Math.random() < drop.chance) {
        // Calculate amount
        const amount = Math.floor(
          Math.random() * (drop.maxAmount - drop.minAmount + 1) + drop.minAmount
        );

        // Add to inventory
        if (this.inventory.addResource(drop.resource, amount)) {
          harvested = true;
        }
      }
    }

    return harvested;
  }

  /**
   * Toggle harvesting on/off
   */
  public setHarvestingEnabled(enabled: boolean): void {
    this.harvestingEnabled = enabled;
    console.log(`Resource harvesting: ${enabled ? 'ON' : 'OFF'}`);
  }

  /**
   * Check if harvesting is enabled
   */
  public isHarvestingEnabled(): boolean {
    return this.harvestingEnabled;
  }

  /**
   * Get drop chances for a voxel type
   */
  public getDropChances(voxelState: VoxelState): ResourceDropTable[] {
    return VOXEL_DROPS[voxelState];
  }

  /**
   * Calculate expected value of harvesting a voxel type
   */
  public getExpectedValue(voxelState: VoxelState): number {
    const drops = VOXEL_DROPS[voxelState];
    let expectedValue = 0;

    for (const drop of drops) {
      const avgAmount = (drop.minAmount + drop.maxAmount) / 2;
      expectedValue += drop.chance * avgAmount;
    }

    return expectedValue;
  }
}
