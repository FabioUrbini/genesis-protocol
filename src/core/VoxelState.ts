/**
 * Voxel states for the 3D cellular automaton
 */
export enum VoxelState {
  Dead = 0,        // Empty space (void)
  Alive = 1,       // Solid matter (basic blocks)
  Energized = 2,   // Glowing, dangerous, high-energy state
  Crystallized = 3, // Stable, harvestable resource
  Corrupted = 4,   // Spreading chaos, destructive
}

/**
 * Type guard to check if a value is a valid VoxelState
 */
export function isValidVoxelState(value: number): value is VoxelState {
  return value >= VoxelState.Dead && value <= VoxelState.Corrupted;
}

/**
 * Get the name of a voxel state
 */
export function getVoxelStateName(state: VoxelState): string {
  switch (state) {
    case VoxelState.Dead:
      return 'Dead';
    case VoxelState.Alive:
      return 'Alive';
    case VoxelState.Energized:
      return 'Energized';
    case VoxelState.Crystallized:
      return 'Crystallized';
    case VoxelState.Corrupted:
      return 'Corrupted';
  }
}

/**
 * Check if a voxel state is solid (blocks movement)
 */
export function isSolidVoxel(state: VoxelState): boolean {
  return state !== VoxelState.Dead;
}

/**
 * Check if a voxel state is alive (counts as living neighbor)
 */
export function isAliveVoxel(state: VoxelState): boolean {
  return state === VoxelState.Alive || 
         state === VoxelState.Energized || 
         state === VoxelState.Corrupted;
}
