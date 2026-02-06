import { VoxelGrid } from './VoxelGrid';
import { VoxelState } from './VoxelState';
import { CARule, DefaultCARule, count3DMooreNeighbors } from './CARule';

/**
 * Cellular Automaton Simulator
 * Simulates 3D Game of Life rules across voxel world using double buffering
 */
export class CASimulator {
  private rule: CARule;
  private currentGrid: VoxelGrid;
  private nextGrid: VoxelGrid;
  private tickCount: number;

  constructor(width: number, height: number, depth: number, rule?: CARule) {
    this.rule = rule ?? new DefaultCARule();
    this.currentGrid = new VoxelGrid(width, height, depth);
    this.nextGrid = new VoxelGrid(width, height, depth);
    this.tickCount = 0;
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
   */
  public step(): void {
    const width = this.currentGrid.width;
    const height = this.currentGrid.height;
    const depth = this.currentGrid.depth;

    // Calculate next state for all voxels
    for (let z = 0; z < depth; z++) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const currentState = this.currentGrid.get(x, y, z);
          
          // Count neighbors using 3D Moore neighborhood
          const { aliveNeighbors, corruptedNeighbors } = count3DMooreNeighbors(
            (nx, ny, nz) => this.currentGrid.get(nx, ny, nz),
            x,
            y,
            z
          );

          // Apply CA rule to get next state
          const nextState = this.rule.getNextState(
            currentState,
            aliveNeighbors,
            corruptedNeighbors
          );

          this.nextGrid.set(x, y, z, nextState);
        }
      }
    }

    // Swap buffers
    this.swapBuffers();
    this.tickCount++;
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
