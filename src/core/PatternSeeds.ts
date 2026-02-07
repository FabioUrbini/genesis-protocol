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
  _category: PatternCategory = PatternCategory.Custom
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
  'Most common still life - simple 2x2 square',
  [
    [
      [D, D, D, D],
      [D, A, A, D],
      [D, A, A, D],
      [D, D, D, D],
    ],
  ],
  PatternCategory.StillLife
);

export const BEEHIVE: Pattern = createPattern(
  'Beehive',
  'Second most common still life - hexagonal pattern',
  [
    [
      [D, D, D, D, D, D],
      [D, D, A, A, D, D],
      [D, A, D, D, A, D],
      [D, D, A, A, D, D],
      [D, D, D, D, D, D],
    ],
  ],
  PatternCategory.StillLife
);

export const LOAF: Pattern = createPattern(
  'Loaf',
  'Third most common still life - discovered by Conway',
  [
    [
      [D, D, D, D, D, D],
      [D, D, A, A, D, D],
      [D, A, D, D, A, D],
      [D, D, A, D, A, D],
      [D, D, D, A, D, D],
      [D, D, D, D, D, D],
    ],
  ],
  PatternCategory.StillLife
);

export const BOAT: Pattern = createPattern(
  'Boat',
  'Fourth most common still life - small and stable',
  [
    [
      [D, D, D, D, D],
      [D, A, A, D, D],
      [D, A, D, A, D],
      [D, D, A, D, D],
      [D, D, D, D, D],
    ],
  ],
  PatternCategory.StillLife
);

export const TUB: Pattern = createPattern(
  'Tub',
  'Fifth most common still life - minimal stable pattern',
  [
    [
      [D, D, D, D, D],
      [D, D, A, D, D],
      [D, A, D, A, D],
      [D, D, A, D, D],
      [D, D, D, D, D],
    ],
  ],
  PatternCategory.StillLife
);

export const BLOCK_3D: Pattern = createPattern(
  'Block 3D',
  '3D cube version - simple 2x2x2 cube',
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

export const BLINKER: Pattern = createPattern(
  'Blinker',
  'Classic period-2 oscillator - simplest oscillating pattern',
  [
    [
      [D, D, D, D, D],
      [D, A, A, A, D],
      [D, D, D, D, D],
    ],
  ],
  PatternCategory.Oscillator
);

export const TOAD: Pattern = createPattern(
  'Toad',
  'Period-2 oscillator discovered by Simon Norton in 1970',
  [
    [
      [D, D, D, D, D, D],
      [D, D, D, A, D, D],
      [D, A, D, D, A, D],
      [D, A, D, D, A, D],
      [D, D, A, D, D, D],
      [D, D, D, D, D, D],
    ],
  ],
  PatternCategory.Oscillator
);

export const BEACON: Pattern = createPattern(
  'Beacon',
  'Period-2 oscillator - two blocks alternating',
  [
    [
      [D, D, D, D, D, D],
      [D, A, A, D, D, D],
      [D, A, D, D, D, D],
      [D, D, D, D, A, D],
      [D, D, D, A, A, D],
      [D, D, D, D, D, D],
    ],
  ],
  PatternCategory.Oscillator
);

export const BLINKER_3D: Pattern = createPattern(
  'Blinker 3D',
  '3D adaptation - oscillates in three dimensions',
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
  'Most common period-3 oscillator - discovered in 1970',
  [
    [
      [D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D],
      [D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D],
      [D, D, D, D, A, A, A, D, D, D, A, A, A, D, D, D, D],
      [D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D],
      [D, D, A, D, D, D, D, A, D, A, D, D, D, D, A, D, D],
      [D, D, A, D, D, D, D, A, D, A, D, D, D, D, A, D, D],
      [D, D, A, D, D, D, D, A, D, A, D, D, D, D, A, D, D],
      [D, D, D, D, A, A, A, D, D, D, A, A, A, D, D, D, D],
      [D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D],
      [D, D, D, D, A, A, A, D, D, D, A, A, A, D, D, D, D],
      [D, D, A, D, D, D, D, A, D, A, D, D, D, D, A, D, D],
      [D, D, A, D, D, D, D, A, D, A, D, D, D, D, A, D, D],
      [D, D, A, D, D, D, D, A, D, A, D, D, D, D, A, D, D],
      [D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D],
      [D, D, D, D, A, A, A, D, D, D, A, A, A, D, D, D, D],
      [D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D],
      [D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D],
    ],
  ],
  PatternCategory.Oscillator
);

export const PENTADECATHLON: Pattern = createPattern(
  'Pentadecathlon',
  'Period-15 oscillator - discovered by John Conway',
  [
    [
      [D, D, D, D, D, D, D, D, D, D, D],
      [D, D, D, D, D, A, D, D, D, D, D],
      [D, D, D, D, D, A, D, D, D, D, D],
      [D, D, D, D, A, D, A, D, D, D, D],
      [D, D, D, D, D, A, D, D, D, D, D],
      [D, D, D, D, D, A, D, D, D, D, D],
      [D, D, D, D, D, A, D, D, D, D, D],
      [D, D, D, D, D, A, D, D, D, D, D],
      [D, D, D, D, A, D, A, D, D, D, D],
      [D, D, D, D, D, A, D, D, D, D, D],
      [D, D, D, D, D, A, D, D, D, D, D],
      [D, D, D, D, D, D, D, D, D, D, D],
    ],
  ],
  PatternCategory.Oscillator
);

export const PULSAR_3D: Pattern = createPattern(
  'Pulsar 3D',
  '3D adaptation - expands and contracts in three dimensions',
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

export const GLIDER: Pattern = createPattern(
  'Glider',
  'Most famous pattern - discovered by Richard Guy in 1970, moves diagonally',
  [
    [
      [D, D, D, D, D],
      [D, D, A, D, D],
      [D, D, D, A, D],
      [D, A, A, A, D],
      [D, D, D, D, D],
    ],
  ],
  PatternCategory.Spaceship
);

export const GLIDER_3D: Pattern = createPattern(
  'Glider 3D',
  '3D adaptation - moves through space in three dimensions',
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

export const LIGHTWEIGHT_SPACESHIP: Pattern = createPattern(
  'Lightweight Spaceship (LWSS)',
  'Discovered by John Conway - second spaceship ever found',
  [
    [
      [D, D, D, D, D, D, D],
      [D, D, A, D, D, A, D],
      [D, A, D, D, D, D, D],
      [D, A, D, D, D, A, D],
      [D, A, A, A, A, D, D],
      [D, D, D, D, D, D, D],
    ],
  ],
  PatternCategory.Spaceship
);

export const LIGHTWEIGHT_SPACESHIP_3D: Pattern = createPattern(
  'Lightweight Spaceship 3D',
  '3D adaptation of LWSS with predictable movement',
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
  // Classic Still Life (2D Conway patterns)
  BLOCK,
  BEEHIVE,
  LOAF,
  BOAT,
  TUB,

  // 3D Still Life
  BLOCK_3D,
  TUBE,
  PYRAMID,
  PLATFORM,
  TOWER,

  // Classic Oscillators (2D Conway patterns)
  BLINKER,
  TOAD,
  BEACON,
  PULSAR,
  PENTADECATHLON,

  // 3D Oscillators
  BLINKER_3D,
  PULSAR_3D,

  // Classic Spaceships (2D Conway patterns)
  GLIDER,
  LIGHTWEIGHT_SPACESHIP,

  // 3D Spaceships
  GLIDER_3D,
  LIGHTWEIGHT_SPACESHIP_3D,

  // Special Energy Patterns
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
