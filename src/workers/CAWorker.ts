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

  // Reusable neighbor result to avoid allocations
  private neighborResult = { aliveNeighbors: 0, corruptedNeighbors: 0 };

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
   * Optimized with raw array access and no per-voxel allocations
   */
  public step(): Uint8Array {
    if (!this.grid || !this.nextGrid) {
      throw new Error('Worker not initialized');
    }

    const width = this.grid.width;
    const height = this.grid.height;
    const depth = this.grid.depth;
    const currentData = this.grid.getData();
    const nextData = this.nextGrid.getData();
    const wh = width * height;

    // Apply CA rules to each voxel
    for (let z = 0; z < depth; z++) {
      const zOff = z * wh;
      for (let y = 0; y < height; y++) {
        const yzOff = zOff + y * width;
        for (let x = 0; x < width; x++) {
          const idx = yzOff + x;
          const currentState = currentData[idx] as VoxelState;

          // Inline neighbor counting to avoid object allocation
          this.countNeighborsInline(currentData, x, y, z, width, height, depth, wh);
          
          const newState = this.rule.getNextState(
            currentState, 
            this.neighborResult.aliveNeighbors, 
            this.neighborResult.corruptedNeighbors
          );
          
          nextData[idx] = newState;
        }
      }
    }

    // Swap grids (double buffering)
    const temp = this.grid;
    this.grid = this.nextGrid;
    this.nextGrid = temp;

    this.tick++;

    // Return a copy of the grid data (cannot transfer internal buffer easily without breaking future steps)
    // Using subarray and set to ensure we return a fresh buffer for transferring
    const resultData = new Uint8Array(this.grid.getData().length);
    resultData.set(this.grid.getData());
    return resultData;
  }

  /**
   * Count neighbors using raw array access and no allocations
   */
  private countNeighborsInline(
    data: Uint8Array,
    x: number, y: number, z: number,
    w: number, h: number, d: number,
    wh: number
  ): void {
    let alive = 0;
    let corrupted = 0;

    const xMin = x > 0 ? x - 1 : 0;
    const xMax = x < w - 1 ? x + 1 : w - 1;
    const yMin = y > 0 ? y - 1 : 0;
    const yMax = y < h - 1 ? y + 1 : h - 1;
    const zMin = z > 0 ? z - 1 : 0;
    const zMax = z < d - 1 ? z + 1 : d - 1;

    for (let nz = zMin; nz <= zMax; nz++) {
      const zOff = nz * wh;
      for (let ny = yMin; ny <= yMax; ny++) {
        const yzOff = zOff + ny * w;
        for (let nx = xMin; nx <= xMax; nx++) {
          if (nx === x && ny === y && nz === z) continue;

          const state = data[yzOff + nx];

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
   * Get current grid data
   */
  public getGridData(): Uint8Array {
    if (!this.grid) {
      throw new Error('Worker not initialized');
    }
    const data = new Uint8Array(this.grid.getData().length);
    data.set(this.grid.getData());
    return data;
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
