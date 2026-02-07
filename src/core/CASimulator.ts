import { VoxelGrid } from './VoxelGrid';
import { VoxelState } from './VoxelState';
import { CARule, DefaultCARule, count3DMooreNeighbors } from './CARule';

/**
 * Region for dirty tracking - currently using string keys instead
 */
// interface DirtyRegion {
//   minX: number;
//   minY: number;
//   minZ: number;
//   maxX: number;
//   maxY: number;
//   maxZ: number;
// }

/**
 * Cellular Automaton Simulator
 * Simulates 3D Game of Life rules across voxel world using double buffering
 * with dirty region tracking for optimization
 */
export class CASimulator {
  private rule: CARule;
  private currentGrid: VoxelGrid;
  private nextGrid: VoxelGrid;
  private tickCount: number;
  private useDirtyTracking: boolean = true;
  private dirtyRegions: Set<number> = new Set(); // Changed from Set<string> to Set<number>
  private regionSize: number = 8; // Size of each region for tracking

  // Reusable neighbor count result to avoid object allocation
  private neighborResult = { aliveNeighbors: 0, corruptedNeighbors: 0 };

  constructor(width: number, height: number, depth: number, rule?: CARule) {
    this.rule = rule ?? new DefaultCARule();
    this.currentGrid = new VoxelGrid(width, height, depth);
    this.nextGrid = new VoxelGrid(width, height, depth);
    this.tickCount = 0;
  }

  /**
   * Hash region coordinates to single integer for fast Set operations
   */
  private getRegionHash(rx: number, ry: number, rz: number): number {
    return (rx & 0x3FF) | ((ry & 0x3FF) << 10) | ((rz & 0x3FF) << 20);
  }

  /**
   * Decode region hash back to coordinates
   */
  private decodeRegionHash(hash: number): [number, number, number] {
    return [
      hash & 0x3FF,
      (hash >> 10) & 0x3FF,
      (hash >> 20) & 0x3FF
    ];
  }

  /**
   * Inline neighbor counting for performance - avoids object allocation
   */
  private countNeighborsInline(x: number, y: number, z: number): void {
    let alive = 0;
    let corrupted = 0;

    const grid = this.currentGrid;

    for (let dz = -1; dz <= 1; dz++) {
      const nz = z + dz;
      for (let dy = -1; dy <= 1; dy++) {
        const ny = y + dy;
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0 && dz === 0) continue;

          const nx = x + dx;
          const state = grid.get(nx, ny, nz);

          if (state !== VoxelState.Dead && state !== VoxelState.Corrupted) {
            alive++;
          }
          if (state === VoxelState.Corrupted) {
            corrupted++;
          }
        }
      }
    }

    this.neighborResult.aliveNeighbors = alive;
    this.neighborResult.corruptedNeighbors = corrupted;
  }

  /**
   * Get current grid (read-only access)
   */
  public getGrid(): VoxelGrid {
    return this.currentGrid;
  }

  /**
   * Get current tick count
   */
  public getTick(): number {
    return this.tickCount;
  }

  /**
   * Set voxel in current grid
   */
  public setVoxel(x: number, y: number, z: number, state: VoxelState): void {
    this.currentGrid.set(x, y, z, state);
  }

  /**
   * Get voxel from current grid
   */
  public getVoxel(x: number, y: number, z: number): VoxelState {
    return this.currentGrid.get(x, y, z);
  }

  /**
   * Perform one simulation step
   * Uses double buffering: read from currentGrid, write to nextGrid, then swap
   * With optional dirty region tracking for optimization
   */
  public step(): void {
    const width = this.currentGrid.width;
    const height = this.currentGrid.height;
    const depth = this.currentGrid.depth;

    const newDirtyRegions = new Set<number>();

    if (this.useDirtyTracking && this.tickCount > 0 && this.dirtyRegions.size > 0) {
      // Only update dirty regions and their neighbors
      const regionsToUpdate = new Set<number>();

      // Expand dirty regions to include neighbors
      for (const regionHash of this.dirtyRegions) {
        const [rx, ry, rz] = this.decodeRegionHash(regionHash);

        // Add region and its neighbors
        for (let dz = -1; dz <= 1; dz++) {
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const nrx = rx + dx;
              const nry = ry + dy;
              const nrz = rz + dz;

              if (nrx >= 0 && nry >= 0 && nrz >= 0 &&
                  nrx < Math.ceil(width / this.regionSize) &&
                  nry < Math.ceil(height / this.regionSize) &&
                  nrz < Math.ceil(depth / this.regionSize)) {
                regionsToUpdate.add(this.getRegionHash(nrx, nry, nrz));
              }
            }
          }
        }
      }

      // Update only necessary regions
      for (const regionHash of regionsToUpdate) {
        const [rx, ry, rz] = this.decodeRegionHash(regionHash);
        const changed = this.updateRegion(rx, ry, rz);
        if (changed) {
          newDirtyRegions.add(regionHash);
        }
      }
    } else {
      // Full update (first tick or dirty tracking disabled)
      for (let z = 0; z < depth; z++) {
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const currentState = this.currentGrid.get(x, y, z);

            // Inline neighbor counting (avoids object allocation)
            this.countNeighborsInline(x, y, z);

            // Apply CA rule to get next state
            const nextState = this.rule.getNextState(
              currentState,
              this.neighborResult.aliveNeighbors,
              this.neighborResult.corruptedNeighbors
            );

            this.nextGrid.set(x, y, z, nextState);

            // Track if this voxel changed
            if (currentState !== nextState) {
              const rx = Math.floor(x / this.regionSize);
              const ry = Math.floor(y / this.regionSize);
              const rz = Math.floor(z / this.regionSize);
              newDirtyRegions.add(this.getRegionHash(rx, ry, rz));
            }
          }
        }
      }
    }

    // Update dirty regions
    this.dirtyRegions = newDirtyRegions;

    // Swap buffers
    this.swapBuffers();
    this.tickCount++;
  }

  /**
   * Update a specific region and return if it changed
   */
  private updateRegion(rx: number, ry: number, rz: number): boolean {
    const width = this.currentGrid.width;
    const height = this.currentGrid.height;
    const depth = this.currentGrid.depth;

    let changed = false;

    const startX = rx * this.regionSize;
    const startY = ry * this.regionSize;
    const startZ = rz * this.regionSize;
    const endX = Math.min(startX + this.regionSize, width);
    const endY = Math.min(startY + this.regionSize, height);
    const endZ = Math.min(startZ + this.regionSize, depth);

    for (let z = startZ; z < endZ; z++) {
      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const currentState = this.currentGrid.get(x, y, z);

          // Inline neighbor counting (avoids object allocation)
          this.countNeighborsInline(x, y, z);

          const nextState = this.rule.getNextState(
            currentState,
            this.neighborResult.aliveNeighbors,
            this.neighborResult.corruptedNeighbors
          );

          this.nextGrid.set(x, y, z, nextState);

          if (currentState !== nextState) {
            changed = true;
          }
        }
      }
    }

    return changed;
  }

  /**
   * Swap current and next grids (double buffering)
   */
  private swapBuffers(): void {
    const temp = this.currentGrid;
    this.currentGrid = this.nextGrid;
    this.nextGrid = temp;
  }

  /**
   * Reset simulation
   */
  public reset(): void {
    this.currentGrid.clear();
    this.nextGrid.clear();
    this.tickCount = 0;
    this.dirtyRegions.clear();
  }

  /**
   * Mark a region as dirty (needs update)
   */
  public markRegionDirty(x: number, y: number, z: number): void {
    const rx = Math.floor(x / this.regionSize);
    const ry = Math.floor(y / this.regionSize);
    const rz = Math.floor(z / this.regionSize);
    this.dirtyRegions.add(this.getRegionHash(rx, ry, rz));
  }

  /**
   * Toggle dirty region tracking
   */
  public toggleDirtyTracking(): void {
    this.useDirtyTracking = !this.useDirtyTracking;
    console.log(`Dirty Region Tracking: ${this.useDirtyTracking ? 'ON' : 'OFF'}`);

    // Mark all regions as dirty when enabling
    if (this.useDirtyTracking) {
      this.markAllRegionsDirty();
    }
  }

  /**
   * Mark all regions as dirty
   */
  private markAllRegionsDirty(): void {
    const width = this.currentGrid.width;
    const height = this.currentGrid.height;
    const depth = this.currentGrid.depth;

    for (let z = 0; z < Math.ceil(depth / this.regionSize); z++) {
      for (let y = 0; y < Math.ceil(height / this.regionSize); y++) {
        for (let x = 0; x < Math.ceil(width / this.regionSize); x++) {
          this.dirtyRegions.add(this.getRegionHash(x, y, z));
        }
      }
    }
  }

  /**
   * Get dirty region tracking status
   */
  public isUsingDirtyTracking(): boolean {
    return this.useDirtyTracking;
  }

  /**
   * Get number of dirty regions
   */
  public getDirtyRegionCount(): number {
    return this.dirtyRegions.size;
  }

  /**
   * Fill grid with initial pattern
   */
  public fillPattern(pattern: (x: number, y: number, z: number) => VoxelState): void {
    this.currentGrid.forEach((x, y, z) => {
      this.currentGrid.set(x, y, z, pattern(x, y, z));
    });
  }

  /**
   * Detect if grid has reached a still life state (no changes between steps)
   * Useful for optimization - can skip updates for stable regions
   */
  public isStillLife(): boolean {
    const currentData = this.currentGrid.getData();
    const width = this.currentGrid.width;
    const height = this.currentGrid.height;
    const depth = this.currentGrid.depth;

    // Simulate one step into a temporary grid
    const tempGrid = new VoxelGrid(width, height, depth);
    
    for (let z = 0; z < depth; z++) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const currentState = this.currentGrid.get(x, y, z);
          
          const { aliveNeighbors, corruptedNeighbors } = count3DMooreNeighbors(
            (nx, ny, nz) => this.currentGrid.get(nx, ny, nz),
            x,
            y,
            z
          );

          const nextState = this.rule.getNextState(
            currentState,
            aliveNeighbors,
            corruptedNeighbors
          );

          tempGrid.set(x, y, z, nextState);
        }
      }
    }

    // Compare current grid with simulated next state
    const tempData = tempGrid.getData();
    for (let i = 0; i < currentData.length; i++) {
      if (currentData[i] !== tempData[i]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get statistics about current grid state
   */
  public getStats(): {
    dead: number;
    alive: number;
    energized: number;
    crystallized: number;
    corrupted: number;
    total: number;
  } {
    const stats = {
      dead: 0,
      alive: 0,
      energized: 0,
      crystallized: 0,
      corrupted: 0,
      total: 0,
    };

    this.currentGrid.forEach((_x, _y, _z, state) => {
      stats.total++;
      switch (state) {
        case VoxelState.Dead:
          stats.dead++;
          break;
        case VoxelState.Alive:
          stats.alive++;
          break;
        case VoxelState.Energized:
          stats.energized++;
          break;
        case VoxelState.Crystallized:
          stats.crystallized++;
          break;
        case VoxelState.Corrupted:
          stats.corrupted++;
          break;
      }
    });

    return stats;
  }
}
