import { VoxelGrid } from './VoxelGrid';
import { VoxelState } from './VoxelState';

/**
 * Chunk size constant (32³ voxels per chunk - optimal for meshing)
 */
export const CHUNK_SIZE = 32;

/**
 * 3D vector for chunk position
 */
export interface ChunkPosition {
  x: number;
  y: number;
  z: number;
}

/**
 * Represents a 32³ chunk of voxels in the world
 */
export class Chunk {
  public readonly position: ChunkPosition;
  public readonly grid: VoxelGrid;
  private _isDirty: boolean;
  private _needsRemesh: boolean;

  constructor(x: number, y: number, z: number) {
    this.position = { x, y, z };
    this.grid = new VoxelGrid(CHUNK_SIZE, CHUNK_SIZE, CHUNK_SIZE);
    this._isDirty = false;
    this._needsRemesh = true; // New chunks need initial mesh
  }

  /**
   * Check if chunk has been modified and needs CA update
   */
  public get isDirty(): boolean {
    return this._isDirty;
  }

  /**
   * Mark chunk as dirty (needs CA update)
   */
  public markDirty(): void {
    this._isDirty = true;
    this._needsRemesh = true;
  }

  /**
   * Clear dirty flag after CA update
   */
  public clearDirty(): void {
    this._isDirty = false;
  }

  /**
   * Check if chunk needs remeshing
   */
  public get needsRemesh(): boolean {
    return this._needsRemesh;
  }

  /**
   * Mark chunk as needing remesh
   */
  public markNeedsRemesh(): void {
    this._needsRemesh = true;
  }

  /**
   * Clear remesh flag after mesh generation
   */
  public clearRemeshFlag(): void {
    this._needsRemesh = false;
  }

  /**
   * Get voxel at local chunk coordinates
   */
  public getVoxel(x: number, y: number, z: number): VoxelState {
    return this.grid.get(x, y, z);
  }

  /**
   * Set voxel at local chunk coordinates
   */
  public setVoxel(x: number, y: number, z: number, state: VoxelState): void {
    this.grid.set(x, y, z, state);
    this.markDirty();
  }

  /**
   * Convert world coordinates to local chunk coordinates
   */
  public static worldToLocal(worldX: number, worldY: number, worldZ: number): {
    chunkX: number;
    chunkY: number;
    chunkZ: number;
    localX: number;
    localY: number;
    localZ: number;
  } {
    const chunkX = Math.floor(worldX / CHUNK_SIZE);
    const chunkY = Math.floor(worldY / CHUNK_SIZE);
    const chunkZ = Math.floor(worldZ / CHUNK_SIZE);
    
    const localX = worldX - chunkX * CHUNK_SIZE;
    const localY = worldY - chunkY * CHUNK_SIZE;
    const localZ = worldZ - chunkZ * CHUNK_SIZE;

    return { chunkX, chunkY, chunkZ, localX, localY, localZ };
  }

  /**
   * Convert local chunk coordinates to world coordinates
   */
  public localToWorld(localX: number, localY: number, localZ: number): {
    worldX: number;
    worldY: number;
    worldZ: number;
  } {
    return {
      worldX: this.position.x * CHUNK_SIZE + localX,
      worldY: this.position.y * CHUNK_SIZE + localY,
      worldZ: this.position.z * CHUNK_SIZE + localZ,
    };
  }

  /**
   * Get chunk key for use in maps
   */
  public static getKey(x: number, y: number, z: number): string {
    return `${x},${y},${z}`;
  }

  /**
   * Get this chunk's key
   */
  public getKey(): string {
    return Chunk.getKey(this.position.x, this.position.y, this.position.z);
  }

  /**
   * Check if chunk is empty (all Dead voxels)
   */
  public isEmpty(): boolean {
    return this.grid.countNonEmpty() === 0;
  }

  /**
   * Fill chunk with a pattern (for testing/generation)
   */
  public fillPattern(pattern: (x: number, y: number, z: number) => VoxelState): void {
    for (let z = 0; z < CHUNK_SIZE; z++) {
      for (let y = 0; y < CHUNK_SIZE; y++) {
        for (let x = 0; x < CHUNK_SIZE; x++) {
          this.grid.set(x, y, z, pattern(x, y, z));
        }
      }
    }
    this.markDirty();
  }
}
