import { VoxelGrid } from '../core/VoxelGrid';
import { VoxelState } from '../core/VoxelState';
import { ResourceType, InventorySystem } from './InventorySystem';
import { Vector3 } from 'three';

/**
 * Buildable structure type
 */
export enum StructureType {
  BarrierShield = 'barrier_shield',
  StabilizerNode = 'stabilizer_node',
  PortalGate = 'portal_gate',
  EnergyGenerator = 'energy_generator',
  TemporalAnchor = 'temporal_anchor',
}

/**
 * Structure recipe (crafting requirements)
 */
export interface StructureRecipe {
  type: StructureType;
  name: string;
  description: string;
  cost: Partial<Record<ResourceType, number>>;
  size: { width: number; height: number; depth: number };
}

/**
 * Structure recipes
 */
export const STRUCTURE_RECIPES: Record<StructureType, StructureRecipe> = {
  [StructureType.BarrierShield]: {
    type: StructureType.BarrierShield,
    name: 'Barrier Shield',
    description: 'Protective barrier that blocks hostile patterns',
    cost: {
      [ResourceType.CrystallizedVoxel]: 10,
      [ResourceType.EnergizedCell]: 5,
    },
    size: { width: 3, height: 3, depth: 1 },
  },
  [StructureType.StabilizerNode]: {
    type: StructureType.StabilizerNode,
    name: 'Stabilizer Node',
    description: 'Prevents CA evolution in a radius',
    cost: {
      [ResourceType.CrystallizedVoxel]: 15,
      [ResourceType.TemporalShard]: 3,
    },
    size: { width: 2, height: 2, depth: 2 },
  },
  [StructureType.PortalGate]: {
    type: StructureType.PortalGate,
    name: 'Portal Gate',
    description: 'Teleportation gate to another location',
    cost: {
      [ResourceType.TemporalShard]: 10,
      [ResourceType.EnergyCore]: 5,
      [ResourceType.CrystallizedVoxel]: 20,
    },
    size: { width: 3, height: 5, depth: 1 },
  },
  [StructureType.EnergyGenerator]: {
    type: StructureType.EnergyGenerator,
    name: 'Energy Generator',
    description: 'Generates energy from nearby CA activity',
    cost: {
      [ResourceType.EnergizedCell]: 10,
      [ResourceType.EnergyCore]: 3,
      [ResourceType.CrystallizedVoxel]: 5,
    },
    size: { width: 2, height: 3, depth: 2 },
  },
  [StructureType.TemporalAnchor]: {
    type: StructureType.TemporalAnchor,
    name: 'Temporal Anchor',
    description: 'Sets a respawn point',
    cost: {
      [ResourceType.TemporalShard]: 5,
      [ResourceType.CrystallizedVoxel]: 10,
    },
    size: { width: 2, height: 2, depth: 2 },
  },
};

/**
 * Placed structure instance
 */
export interface PlacedStructure {
  type: StructureType;
  position: Vector3;
  active: boolean;
  health: number;
  maxHealth: number;
}

/**
 * Base Building System
 * Handles construction of structures
 */
export class BaseBuilding {
  private inventory: InventorySystem;
  private structures: PlacedStructure[] = [];
  private buildingEnabled: boolean = true;

  constructor(inventory: InventorySystem) {
    this.inventory = inventory;
  }

  /**
   * Check if player can build a structure
   */
  public canBuild(structureType: StructureType): boolean {
    if (!this.buildingEnabled) {
      return false;
    }

    const recipe = STRUCTURE_RECIPES[structureType];

    // Check if player has all required resources
    for (const [resource, amount] of Object.entries(recipe.cost)) {
      if (!this.inventory.hasResource(resource as ResourceType, amount)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Build a structure at a location
   */
  public buildStructure(
    structureType: StructureType,
    grid: VoxelGrid,
    x: number,
    y: number,
    z: number
  ): boolean {
    if (!this.canBuild(structureType)) {
      console.log(`Cannot build ${STRUCTURE_RECIPES[structureType].name} - insufficient resources`);
      return false;
    }

    const recipe = STRUCTURE_RECIPES[structureType];

    // Check if space is available
    if (!this.isSpaceAvailable(grid, x, y, z, recipe.size)) {
      console.log('Not enough space to build here');
      return false;
    }

    // Consume resources
    for (const [resource, amount] of Object.entries(recipe.cost)) {
      this.inventory.removeResource(resource as ResourceType, amount);
    }

    // Place structure voxels
    this.placeStructureVoxels(grid, x, y, z, structureType, recipe.size);

    // Register structure
    const structure: PlacedStructure = {
      type: structureType,
      position: new Vector3(x, y, z),
      active: true,
      health: 100,
      maxHealth: 100,
    };
    this.structures.push(structure);

    console.log(`Built ${recipe.name} at (${x}, ${y}, ${z})`);
    return true;
  }

  /**
   * Check if space is available for building
   */
  private isSpaceAvailable(
    grid: VoxelGrid,
    x: number,
    y: number,
    z: number,
    size: { width: number; height: number; depth: number }
  ): boolean {
    for (let dz = 0; dz < size.depth; dz++) {
      for (let dy = 0; dy < size.height; dy++) {
        for (let dx = 0; dx < size.width; dx++) {
          const checkX = x + dx;
          const checkY = y + dy;
          const checkZ = z + dz;

          // Check bounds
          if (checkX < 0 || checkX >= grid.width ||
              checkY < 0 || checkY >= grid.height ||
              checkZ < 0 || checkZ >= grid.depth) {
            return false;
          }

          // Check if occupied
          if (grid.get(checkX, checkY, checkZ) !== VoxelState.Dead) {
            return false;
          }
        }
      }
    }

    return true;
  }

  /**
   * Place structure voxels in the grid
   */
  private placeStructureVoxels(
    grid: VoxelGrid,
    x: number,
    y: number,
    z: number,
    type: StructureType,
    size: { width: number; height: number; depth: number }
  ): void {
    // Different structures use different voxel types
    let voxelState = VoxelState.Crystallized;

    switch (type) {
      case StructureType.BarrierShield:
        voxelState = VoxelState.Crystallized;
        break;
      case StructureType.StabilizerNode:
        voxelState = VoxelState.Crystallized;
        break;
      case StructureType.PortalGate:
        voxelState = VoxelState.Energized;
        break;
      case StructureType.EnergyGenerator:
        voxelState = VoxelState.Energized;
        break;
      case StructureType.TemporalAnchor:
        voxelState = VoxelState.Crystallized;
        break;
    }

    // Place voxels
    for (let dz = 0; dz < size.depth; dz++) {
      for (let dy = 0; dy < size.height; dy++) {
        for (let dx = 0; dx < size.width; dx++) {
          grid.set(x + dx, y + dy, z + dz, voxelState);
        }
      }
    }
  }

  /**
   * Get all structures
   */
  public getStructures(): PlacedStructure[] {
    return this.structures;
  }

  /**
   * Get structures by type
   */
  public getStructuresByType(type: StructureType): PlacedStructure[] {
    return this.structures.filter(s => s.type === type);
  }

  /**
   * Find nearest structure of a type
   */
  public findNearestStructure(position: Vector3, type?: StructureType): PlacedStructure | null {
    let nearest: PlacedStructure | null = null;
    let minDistance = Infinity;

    for (const structure of this.structures) {
      if (type && structure.type !== type) continue;
      if (!structure.active) continue;

      const distance = position.distanceTo(structure.position);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = structure;
      }
    }

    return nearest;
  }

  /**
   * Damage a structure
   */
  public damageStructure(structure: PlacedStructure, damage: number): void {
    structure.health = Math.max(0, structure.health - damage);

    if (structure.health <= 0) {
      structure.active = false;
      console.log(`${STRUCTURE_RECIPES[structure.type].name} destroyed`);
    }
  }

  /**
   * Repair a structure
   */
  public repairStructure(structure: PlacedStructure, amount: number): void {
    structure.health = Math.min(structure.maxHealth, structure.health + amount);
  }

  /**
   * Toggle building mode
   */
  public setBuildingEnabled(enabled: boolean): void {
    this.buildingEnabled = enabled;
    console.log(`Building mode: ${enabled ? 'ON' : 'OFF'}`);
  }

  /**
   * Get building mode status
   */
  public isBuildingEnabled(): boolean {
    return this.buildingEnabled;
  }

  /**
   * Clear all structures
   */
  public clearStructures(): void {
    this.structures = [];
    console.log('All structures cleared');
  }
}
