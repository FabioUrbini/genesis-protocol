import { VoxelState, isAliveVoxel } from './VoxelState';

/**
 * Cellular Automaton rule interface
 */
export interface CARule {
  /**
   * Calculate next state for a voxel based on current state and neighbor count
   * @param currentState Current voxel state
   * @param aliveNeighbors Number of alive neighbors (26 max in 3D Moore neighborhood)
   * @param corruptedNeighbors Number of corrupted neighbors
   * @returns Next voxel state
   */
  getNextState(
    currentState: VoxelState,
    aliveNeighbors: number,
    corruptedNeighbors: number
  ): VoxelState;
}

/**
 * Default Genesis Protocol CA rules (Modified Conway's Life for 3D)
 * 
 * Rules per voxel, per simulation tick:
 * - Neighbors = 26 surrounding voxels (3D Moore neighborhood)
 * - Survive: 4-7 living neighbors → Stay alive
 * - Birth: 5-6 living neighbors → Dead becomes alive
 * - Energize: 8+ living neighbors → Becomes energized
 * - Crystallize: 2-3 living neighbors → Becomes stable crystallized
 * - Corrupt: Adjacent to corrupted + <3 neighbors → Spreads corruption
 */
export class DefaultCARule implements CARule {
  public getNextState(
    currentState: VoxelState,
    aliveNeighbors: number,
    corruptedNeighbors: number
  ): VoxelState {
    // Corruption spreads to vulnerable voxels
    if (corruptedNeighbors > 0 && aliveNeighbors < 3) {
      return VoxelState.Corrupted;
    }

    // Current state is Dead
    if (currentState === VoxelState.Dead) {
      // Birth: 5-6 living neighbors
      if (aliveNeighbors >= 5 && aliveNeighbors <= 6) {
        return VoxelState.Alive;
      }
      return VoxelState.Dead;
    }

    // Current state is Alive
    if (currentState === VoxelState.Alive) {
      // Energize: 8+ living neighbors (overcrowding creates energy)
      if (aliveNeighbors >= 8) {
        return VoxelState.Energized;
      }
      // Crystallize: 2-3 living neighbors (stable formation)
      if (aliveNeighbors >= 2 && aliveNeighbors <= 3) {
        return VoxelState.Crystallized;
      }
      // Survive: 4-7 living neighbors
      if (aliveNeighbors >= 4 && aliveNeighbors <= 7) {
        return VoxelState.Alive;
      }
      // Die: too few or too many neighbors
      return VoxelState.Dead;
    }

    // Current state is Energized
    if (currentState === VoxelState.Energized) {
      // Energized voxels decay to Alive if not enough neighbors
      if (aliveNeighbors < 6) {
        return VoxelState.Alive;
      }
      // Stay energized with high neighbor count
      if (aliveNeighbors >= 6) {
        return VoxelState.Energized;
      }
      return VoxelState.Dead;
    }

    // Current state is Crystallized (stable, hard to change)
    if (currentState === VoxelState.Crystallized) {
      // Crystallized is very stable, only dies with very few neighbors
      if (aliveNeighbors < 1) {
        return VoxelState.Dead;
      }
      // Can become energized with extreme overcrowding
      if (aliveNeighbors >= 10) {
        return VoxelState.Energized;
      }
      return VoxelState.Crystallized;
    }

    // Current state is Corrupted
    if (currentState === VoxelState.Corrupted) {
      // Corruption dies out if isolated
      if (aliveNeighbors < 2 && corruptedNeighbors === 0) {
        return VoxelState.Dead;
      }
      // Corruption persists
      return VoxelState.Corrupted;
    }

    return currentState;
  }
}

/**
 * Neighbor counting helper for 3D Moore neighborhood (26 neighbors)
 */
export function count3DMooreNeighbors(
  getVoxel: (x: number, y: number, z: number) => VoxelState,
  x: number,
  y: number,
  z: number
): { aliveNeighbors: number; corruptedNeighbors: number } {
  let aliveNeighbors = 0;
  let corruptedNeighbors = 0;

  // Check all 26 neighbors in 3D Moore neighborhood
  for (let dz = -1; dz <= 1; dz++) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        // Skip center voxel
        if (dx === 0 && dy === 0 && dz === 0) {
          continue;
        }

        const neighborState = getVoxel(x + dx, y + dy, z + dz);
        
        if (isAliveVoxel(neighborState)) {
          aliveNeighbors++;
        }
        
        if (neighborState === VoxelState.Corrupted) {
          corruptedNeighbors++;
        }
      }
    }
  }

  return { aliveNeighbors, corruptedNeighbors };
}
