import { VoxelState } from './VoxelState';
import { Pattern, PatternCategory } from '../game/PatternLibrary';

/**
 * Predefined 3D Game of Life patterns
 * Based on classic Conway's Life patterns adapted to 3D
 */

/**
 * Helper to create a pattern from a 3D array
 */
function createPattern(
  name: string,
  description: string,
  voxels: VoxelState[][][],
  category: PatternCategory = PatternCategory.Custom
): Pattern {
  const depth = voxels.length;
  const height = voxels[0]?.length || 0;
  const width = voxels[0]?.[0]?.length || 0;

  const data = new Uint8Array(width * height * depth);
  let index = 0;

  for (let z = 0; z < depth; z++) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        data[index++] = voxels[z]?.[y]?.[x] || VoxelState.Dead;
      }
    }
  }

  return {
    name,
    description,
    width,
    height,
    depth,
    data,
    created: Date.now(),
  };
}

const A = VoxelState.Alive;
const D = VoxelState.Dead;
const E = VoxelState.Energized;
const C = VoxelState.Crystallized;
const R = VoxelState.Corrupted;

/**
 * Still Life Patterns (stable, don't change)
 */

export const BLOCK: Pattern = createPattern(
  'Block',
  'Simple 2x2x2 cube - most basic still life',
  [
    [
      [A, A],
      [A, A],
    ],
    [
      [A, A],
      [A, A],
    ],
  ],
  PatternCategory.StillLife
);

export const TUBE: Pattern = createPattern(
  'Tube',
  'Hollow tube structure - stable',
  [
    [
      [A, A, A],
      [A, D, A],
      [A, A, A],
    ],
    [
      [A, A, A],
      [A, D, A],
      [A, A, A],
    ],
    [
      [A, A, A],
      [A, D, A],
      [A, A, A],
    ],
  ],
  PatternCategory.StillLife
);

export const PYRAMID: Pattern = createPattern(
  'Pyramid',
  'Stable pyramid structure',
  [
    [
      [D, D, D],
      [D, A, D],
      [D, D, D],
    ],
    [
      [D, A, D],
      [A, A, A],
      [D, A, D],
    ],
    [
      [A, A, A],
      [A, A, A],
      [A, A, A],
    ],
  ],
  PatternCategory.StillLife
);

/**
 * Oscillators (repeat after N steps)
 */

export const BLINKER_3D: Pattern = createPattern(
  'Blinker 3D',
  'Oscillates between vertical and horizontal',
  [
    [
      [D, D, D],
      [D, A, D],
      [D, D, D],
    ],
    [
      [D, A, D],
      [A, A, A],
      [D, A, D],
    ],
    [
      [D, D, D],
      [D, A, D],
      [D, D, D],
    ],
  ],
  PatternCategory.Oscillator
);

export const PULSAR: Pattern = createPattern(
  'Pulsar',
  'Expands and contracts periodically',
  [
    [
      [D, A, A, A, D],
      [A, D, D, D, A],
      [A, D, D, D, A],
      [A, D, D, D, A],
      [D, A, A, A, D],
    ],
    [
      [A, D, D, D, A],
      [D, D, D, D, D],
      [D, D, A, D, D],
      [D, D, D, D, D],
      [A, D, D, D, A],
    ],
    [
      [D, A, A, A, D],
      [A, D, D, D, A],
      [A, D, D, D, A],
      [A, D, D, D, A],
      [D, A, A, A, D],
    ],
  ],
  PatternCategory.Oscillator
);

/**
 * Spaceships (move through space)
 */

export const GLIDER_3D: Pattern = createPattern(
  'Glider 3D',
  'Simple spaceship that moves diagonally',
  [
    [
      [D, A, D],
      [D, D, A],
      [A, A, A],
    ],
    [
      [D, D, D],
      [D, A, D],
      [D, A, D],
    ],
    [
      [D, D, D],
      [D, D, D],
      [D, D, D],
    ],
  ],
  PatternCategory.Spaceship
);

export const LIGHTWEIGHT_SPACESHIP_3D: Pattern = createPattern(
  'Lightweight Spaceship 3D',
  'Larger spaceship with predictable movement',
  [
    [
      [D, A, A, A, D],
      [A, D, D, D, A],
      [D, D, D, D, A],
      [A, D, D, A, D],
      [D, D, D, D, D],
    ],
    [
      [D, D, A, D, D],
      [A, D, D, D, D],
      [D, D, D, D, A],
      [D, D, D, D, D],
      [D, D, D, D, D],
    ],
    [
      [D, D, D, D, D],
      [D, D, D, D, D],
      [D, D, D, D, D],
      [D, D, D, D, D],
      [D, D, D, D, D],
    ],
  ],
  PatternCategory.Spaceship
);

/**
 * Energy Patterns (using Energized voxels)
 */

export const ENERGY_CORE: Pattern = createPattern(
  'Energy Core',
  'Pulsing energy center with crystallized shell',
  [
    [
      [C, C, C],
      [C, D, C],
      [C, C, C],
    ],
    [
      [C, D, C],
      [D, E, D],
      [C, D, C],
    ],
    [
      [C, C, C],
      [C, D, C],
      [C, C, C],
    ],
  ],
  PatternCategory.Custom
);

export const CORRUPTION_SEED: Pattern = createPattern(
  'Corruption Seed',
  'Spreads corruption - use with caution!',
  [
    [
      [D, A, D],
      [A, R, A],
      [D, A, D],
    ],
    [
      [A, R, A],
      [R, R, R],
      [A, R, A],
    ],
    [
      [D, A, D],
      [A, R, A],
      [D, A, D],
    ],
  ],
  PatternCategory.Custom
);

/**
 * Useful Structures
 */

export const PLATFORM: Pattern = createPattern(
  'Platform',
  'Stable flat platform for building',
  [
    [
      [A, A, A, A, A],
      [A, A, A, A, A],
      [A, A, A, A, A],
      [A, A, A, A, A],
      [A, A, A, A, A],
    ],
  ],
  PatternCategory.StillLife
);

export const TOWER: Pattern = createPattern(
  'Tower',
  'Tall stable structure',
  [
    [
      [A, A, A],
      [A, D, A],
      [A, A, A],
    ],
    [
      [A, A, A],
      [A, D, A],
      [A, A, A],
    ],
    [
      [A, A, A],
      [A, D, A],
      [A, A, A],
    ],
    [
      [A, A, A],
      [A, D, A],
      [A, A, A],
    ],
    [
      [A, A, A],
      [A, A, A],
      [A, A, A],
    ],
  ],
  PatternCategory.StillLife
);

export const CRYSTAL_CLUSTER: Pattern = createPattern(
  'Crystal Cluster',
  'Group of crystallized voxels - safe zone',
  [
    [
      [D, C, D],
      [C, C, C],
      [D, C, D],
    ],
    [
      [C, C, C],
      [C, C, C],
      [C, C, C],
    ],
    [
      [D, C, D],
      [C, C, C],
      [D, C, D],
    ],
  ],
  PatternCategory.Custom
);

/**
 * Random/Chaos Patterns
 */

export const RANDOM_CLUSTER: Pattern = createPattern(
  'Random Cluster',
  'Random pattern that evolves unpredictably',
  [
    [
      [A, D, A, D, A],
      [D, A, A, D, D],
      [A, A, D, A, A],
      [D, D, A, A, D],
      [A, D, D, A, A],
    ],
    [
      [D, A, D, A, D],
      [A, D, A, D, A],
      [D, A, A, A, D],
      [A, D, A, D, A],
      [D, A, D, A, D],
    ],
    [
      [A, D, A, D, A],
      [D, A, A, D, D],
      [A, A, D, A, A],
      [D, D, A, A, D],
      [A, D, D, A, A],
    ],
  ],
  PatternCategory.Custom
);

/**
 * All predefined patterns
 */
export const PREDEFINED_PATTERNS: Pattern[] = [
  // Still Life
  BLOCK,
  TUBE,
  PYRAMID,
  PLATFORM,
  TOWER,

  // Oscillators
  BLINKER_3D,
  PULSAR,

  // Spaceships
  GLIDER_3D,
  LIGHTWEIGHT_SPACESHIP_3D,

  // Special
  ENERGY_CORE,
  CORRUPTION_SEED,
  CRYSTAL_CLUSTER,
  RANDOM_CLUSTER,
];

/**
 * Get pattern by name
 */
export function getPatternByName(name: string): Pattern | undefined {
  return PREDEFINED_PATTERNS.find(p => p.name === name);
}

/**
 * Get all pattern names
 */
export function getAllPatternNames(): string[] {
  return PREDEFINED_PATTERNS.map(p => p.name);
}
