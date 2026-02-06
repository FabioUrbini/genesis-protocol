import { VoxelState, isValidVoxelState } from './VoxelState';

/**
 * Efficient 3D voxel grid using flat Uint8Array for cache locality
 * Uses 3D-to-1D index conversion: x + y * width + z * width * height
 */
export class VoxelGrid {
  private data: Uint8Array;
  public readonly width: number;
  public readonly height: number;
  public readonly depth: number;
  private readonly size: number;

  constructor(width: number, height: number, depth: number) {
    if (width <= 0 || height <= 0 || depth <= 0) {
      throw new Error('VoxelGrid dimensions must be positive');
    }

    this.width = width;
    this.height = height;
    this.depth = depth;
    this.size = width * height * depth;
    this.data = new Uint8Array(this.size);
  }

  /**
   * Convert 3D coordinates to 1D array index
   */
  private getIndex(x: number, y: number, z: number): number {
    return x + y * this.width + z * this.width * this.height;
  }

  /**
   * Check if coordinates are within bounds
   */
  public isInBounds(x: number, y: number, z: number): boolean {
    return x >= 0 && x < this.width &&
           y >= 0 && y < this.height &&
           z >= 0 && z < this.depth;
  }

  /**
   * Get voxel state at coordinates
   * Returns Dead if out of bounds
   */
  public get(x: number, y: number, z: number): VoxelState {
    if (!this.isInBounds(x, y, z)) {
      return VoxelState.Dead;
    }
    const value = this.data[this.getIndex(x, y, z)];
    return isValidVoxelState(value) ? value : VoxelState.Dead;
  }

  /**
   * Set voxel state at coordinates
   * Does nothing if out of bounds
   */
  public set(x: number, y: number, z: number, state: VoxelState): void {
    if (!this.isInBounds(x, y, z)) {
      return;
    }
    this.data[this.getIndex(x, y, z)] = state;
  }

  /**
   * Fill entire grid with a single state
   */
  public fill(state: VoxelState): void {
    this.data.fill(state);
  }

  /**
   * Clear grid (set all to Dead)
   */
  public clear(): void {
    this.fill(VoxelState.Dead);
  }

  /**
   * Get direct access to underlying data (for performance-critical operations)
   */
  public getData(): Uint8Array {
    return this.data;
  }

  /**
   * Clone this grid
   */
  public clone(): VoxelGrid {
    const cloned = new VoxelGrid(this.width, this.height, this.depth);
    cloned.data.set(this.data);
    return cloned;
  }

  /**
   * Copy data from another grid
   */
  public copyFrom(other: VoxelGrid): void {
    if (this.width !== other.width || 
        this.height !== other.height || 
        this.depth !== other.depth) {
      throw new Error('Cannot copy from grid with different dimensions');
    }
    this.data.set(other.data);
  }

  /**
   * Count non-dead voxels
   */
  public countNonEmpty(): number {
    let count = 0;
    for (let i = 0; i < this.size; i++) {
      if (this.data[i] !== VoxelState.Dead) {
        count++;
      }
    }
    return count;
  }

  /**
   * Iterate over all voxels
   */
  public forEach(callback: (x: number, y: number, z: number, state: VoxelState) => void): void {
    for (let z = 0; z < this.depth; z++) {
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          callback(x, y, z, this.get(x, y, z));
        }
      }
    }
  }
}
