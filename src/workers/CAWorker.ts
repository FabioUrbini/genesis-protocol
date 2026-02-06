import { VoxelGrid } from '../core/VoxelGrid';
import { VoxelState } from '../core/VoxelState';
import { CARule, DefaultCARule } from '../core/CARule';

/**
 * Message types for worker communication
 */
export enum WorkerMessageType {
  INIT = 'INIT',
  STEP = 'STEP',
  STEP_COMPLETE = 'STEP_COMPLETE',
  GET_GRID = 'GET_GRID',
  GRID_DATA = 'GRID_DATA',
  SET_RULE = 'SET_RULE',
}

/**
 * Worker message interface
 */
export interface WorkerMessage {
  type: WorkerMessageType;
  data?: any;
}

/**
 * CA Worker state
 */
class CAWorkerState {
  private grid: VoxelGrid | null = null;
  private nextGrid: VoxelGrid | null = null;
  private rule: CARule = new DefaultCARule();
  private tick: number = 0;

  /**
   * Initialize worker with grid dimensions
   */
  public init(width: number, height: number, depth: number): void {
    this.grid = new VoxelGrid(width, height, depth);
    this.nextGrid = new VoxelGrid(width, height, depth);
    this.tick = 0;
  }

  /**
   * Set grid data from main thread
   */
  public setGridData(data: Uint8Array): void {
    if (!this.grid) {
      throw new Error('Worker not initialized');
    }
    this.grid.getData().set(data);
  }

  /**
   * Perform one CA simulation step
   */
  public step(): Uint8Array {
    if (!this.grid || !this.nextGrid) {
      throw new Error('Worker not initialized');
    }

    const { width, height, depth } = this.grid;

    // Apply CA rules to each voxel
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        for (let z = 0; z < depth; z++) {
          const currentState = this.grid.get(x, y, z);
          const { aliveNeighbors, corruptedNeighbors } = this.countNeighbors(x, y, z);
          const newState = this.rule.getNextState(currentState, aliveNeighbors, corruptedNeighbors);
          this.nextGrid.set(x, y, z, newState);
        }
      }
    }

    // Swap grids (double buffering)
    const temp = this.grid;
    this.grid = this.nextGrid;
    this.nextGrid = temp;

    this.tick++;

    // Return grid data
    return new Uint8Array(this.grid.getData());
  }

  /**
   * Count living neighbors in 3D Moore neighborhood (26 neighbors)
   */
  private countNeighbors(x: number, y: number, z: number): { aliveNeighbors: number; corruptedNeighbors: number } {
    if (!this.grid) {
      throw new Error('Worker not initialized');
    }

    let aliveNeighbors = 0;
    let corruptedNeighbors = 0;

    // Check all 26 neighbors (3x3x3 cube minus center)
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          // Skip center voxel
          if (dx === 0 && dy === 0 && dz === 0) continue;

          const nx = x + dx;
          const ny = y + dy;
          const nz = z + dz;

          const state = this.grid.get(nx, ny, nz);
          
          // Count alive voxels (Alive, Energized, Crystallized)
          if (state === VoxelState.Alive || state === VoxelState.Energized || state === VoxelState.Crystallized) {
            aliveNeighbors++;
          }
          
          // Count corrupted voxels
          if (state === VoxelState.Corrupted) {
            corruptedNeighbors++;
          }
        }
      }
    }

    return { aliveNeighbors, corruptedNeighbors };
  }

  /**
   * Get current grid data
   */
  public getGridData(): Uint8Array {
    if (!this.grid) {
      throw new Error('Worker not initialized');
    }
    return new Uint8Array(this.grid.getData());
  }

  /**
   * Get current tick
   */
  public getTick(): number {
    return this.tick;
  }
}

// Worker global state
const workerState = new CAWorkerState();

/**
 * Handle messages from main thread
 */
self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, data } = event.data;

  try {
    switch (type) {
      case WorkerMessageType.INIT:
        workerState.init(data.width, data.height, data.depth);
        if (data.gridData) {
          workerState.setGridData(data.gridData);
        }
        self.postMessage({
          type: WorkerMessageType.INIT,
          data: { success: true },
        });
        break;

      case WorkerMessageType.STEP:
        const gridData = workerState.step();
        self.postMessage({
          type: WorkerMessageType.STEP_COMPLETE,
          data: {
            gridData,
            tick: workerState.getTick(),
          },
        }, { transfer: [gridData.buffer] }); // Transfer ownership for performance
        break;

      case WorkerMessageType.GET_GRID:
        const currentGridData = workerState.getGridData();
        self.postMessage({
          type: WorkerMessageType.GRID_DATA,
          data: {
            gridData: currentGridData,
            tick: workerState.getTick(),
          },
        }, { transfer: [currentGridData.buffer] });
        break;

      default:
        console.error('Unknown worker message type:', type);
    }
  } catch (error) {
    console.error('Worker error:', error);
    self.postMessage({
      type: 'ERROR',
      data: { error: error instanceof Error ? error.message : 'Unknown error' },
    });
  }
};

// Export for TypeScript (not used in worker context)
export {};
