import { VoxelGrid } from '../core/VoxelGrid';
import { VoxelState } from '../core/VoxelState';
import { Vector3 } from 'three';

/**
 * Biome types with unique characteristics
 */
export enum BiomeType {
  CrystalCaves = 'crystal_caves',
  ChaosWastes = 'chaos_wastes',
  StillGardens = 'still_gardens',
  ThePulse = 'the_pulse',
  GliderStorms = 'glider_storms',
  VoidTears = 'void_tears',
  QuantumFoam = 'quantum_foam'
}

/**
 * Biome configuration with unique CA rules and visual properties
 */
export interface BiomeConfig {
  type: BiomeType;
  name: string;
  description: string;
  caRules: {
    birthMin: number;
    birthMax: number;
    surviveMin: number;
    surviveMax: number;
  };
  density: number; // 0-1, initial voxel density
  energyChance: number; // 0-1, chance of energized voxels
  crystallizedChance: number; // 0-1, chance of crystallized voxels
  colors: {
    primary: number; // color hex
    secondary: number;
    accent: number;
  };
}

/**
 * Noise generator using Simplex-like algorithm
 */
class NoiseGenerator {
  private seed: number;
  private perm: number[];

  constructor(seed: number = Math.random()) {
    this.seed = seed;
    this.perm = this.generatePermutation();
  }

  private generatePermutation(): number[] {
    const p = [];
    for (let i = 0; i < 256; i++) {
      p[i] = i;
    }

    // Fisher-Yates shuffle with seed
    let rng = this.seed;
    for (let i = 255; i > 0; i--) {
      rng = (rng * 9301 + 49297) % 233280;
      const j = Math.floor((rng / 233280) * (i + 1));
      [p[i], p[j]] = [p[j]!, p[i]!];
    }

    // Duplicate for overflow handling
    return [...p, ...p];
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number, z: number): number {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  /**
   * 3D Perlin noise
   */
  public noise3D(x: number, y: number, z: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;

    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);

    const u = this.fade(x);
    const v = this.fade(y);
    const w = this.fade(z);

    const A = this.perm[X]! + Y;
    const AA = this.perm[A]! + Z;
    const AB = this.perm[A + 1]! + Z;
    const B = this.perm[X + 1]! + Y;
    const BA = this.perm[B]! + Z;
    const BB = this.perm[B + 1]! + Z;

    return this.lerp(w,
      this.lerp(v,
        this.lerp(u, this.grad(this.perm[AA]!, x, y, z),
                     this.grad(this.perm[BA]!, x - 1, y, z)),
        this.lerp(u, this.grad(this.perm[AB]!, x, y - 1, z),
                     this.grad(this.perm[BB]!, x - 1, y - 1, z))),
      this.lerp(v,
        this.lerp(u, this.grad(this.perm[AA + 1]!, x, y, z - 1),
                     this.grad(this.perm[BA + 1]!, x - 1, y, z - 1)),
        this.lerp(u, this.grad(this.perm[AB + 1]!, x, y - 1, z - 1),
                     this.grad(this.perm[BB + 1]!, x - 1, y - 1, z - 1)))
    );
  }

  /**
   * Fractal Brownian Motion (multi-octave noise)
   */
  public fbm(x: number, y: number, z: number, octaves: number = 4): number {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      value += this.noise3D(x * frequency, y * frequency, z * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }

    return value / maxValue;
  }
}

/**
 * Biome configurations
 */
const BIOME_CONFIGS: Map<BiomeType, BiomeConfig> = new Map([
  [BiomeType.CrystalCaves, {
    type: BiomeType.CrystalCaves,
    name: 'Crystal Caves',
    description: 'Slow-growing crystalline structures with stable formations',
    caRules: { birthMin: 4, birthMax: 5, surviveMin: 5, surviveMax: 7 },
    density: 0.25,
    energyChance: 0.15,
    crystallizedChance: 0.3,
    colors: { primary: 0x4a9eff, secondary: 0x87ceeb, accent: 0xffffff }
  }],
  [BiomeType.ChaosWastes, {
    type: BiomeType.ChaosWastes,
    name: 'Chaos Wastes',
    description: 'Rapidly evolving chaotic patterns with unpredictable behavior',
    caRules: { birthMin: 2, birthMax: 4, surviveMin: 3, surviveMax: 5 },
    density: 0.4,
    energyChance: 0.25,
    crystallizedChance: 0.05,
    colors: { primary: 0xff4444, secondary: 0xff8800, accent: 0xffff00 }
  }],
  [BiomeType.StillGardens, {
    type: BiomeType.StillGardens,
    name: 'Still Gardens',
    description: 'Peaceful oscillating patterns in near-equilibrium',
    caRules: { birthMin: 3, birthMax: 3, surviveMin: 6, surviveMax: 8 },
    density: 0.15,
    energyChance: 0.05,
    crystallizedChance: 0.4,
    colors: { primary: 0x44ff88, secondary: 0x88ffaa, accent: 0xccffee }
  }],
  [BiomeType.ThePulse, {
    type: BiomeType.ThePulse,
    name: 'The Pulse',
    description: 'Rhythmic waves of life energy pulsing through space',
    caRules: { birthMin: 3, birthMax: 4, surviveMin: 4, surviveMax: 6 },
    density: 0.3,
    energyChance: 0.35,
    crystallizedChance: 0.1,
    colors: { primary: 0xff00ff, secondary: 0xaa00ff, accent: 0xff88ff }
  }],
  [BiomeType.GliderStorms, {
    type: BiomeType.GliderStorms,
    name: 'Glider Storms',
    description: 'Dense regions of mobile patterns racing through void',
    caRules: { birthMin: 3, birthMax: 3, surviveMin: 2, surviveMax: 3 },
    density: 0.2,
    energyChance: 0.2,
    crystallizedChance: 0.05,
    colors: { primary: 0xffaa00, secondary: 0xffcc44, accent: 0xffff88 }
  }],
  [BiomeType.VoidTears, {
    type: BiomeType.VoidTears,
    name: 'Void Tears',
    description: 'Sparse pockets of life in vast emptiness',
    caRules: { birthMin: 5, birthMax: 6, surviveMin: 6, surviveMax: 8 },
    density: 0.08,
    energyChance: 0.1,
    crystallizedChance: 0.2,
    colors: { primary: 0x220044, secondary: 0x440088, accent: 0x8800ff }
  }],
  [BiomeType.QuantumFoam, {
    type: BiomeType.QuantumFoam,
    name: 'Quantum Foam',
    description: 'Constantly flickering patterns at the edge of stability',
    caRules: { birthMin: 2, birthMax: 5, surviveMin: 2, surviveMax: 6 },
    density: 0.35,
    energyChance: 0.3,
    crystallizedChance: 0.15,
    colors: { primary: 0x00ffff, secondary: 0x00ff88, accent: 0x88ffff }
  }]
]);

/**
 * WorldManager - Handles procedural world generation with biomes
 */
export class WorldManager {
  private seed: number;
  private noise: NoiseGenerator;
  private biomeScale: number = 0.05; // Scale for biome noise (larger = bigger biomes)

  constructor(seed?: number) {
    this.seed = seed ?? Math.random() * 1000000;
    this.noise = new NoiseGenerator(this.seed);
  }

  /**
   * Get biome type at world position using noise
   */
  public getBiomeAtPosition(x: number, y: number, z: number): BiomeType {
    // Use 3D noise to determine biome
    const noiseValue = this.noise.fbm(
      x * this.biomeScale,
      y * this.biomeScale,
      z * this.biomeScale,
      3
    );

    // Secondary noise for variation
    const variation = this.noise.noise3D(
      x * this.biomeScale * 2,
      y * this.biomeScale * 2,
      z * this.biomeScale * 2
    );

    // Map noise to biome types
    const biomes = Array.from(BIOME_CONFIGS.keys());
    const index = Math.floor(((noiseValue + variation * 0.3 + 1) / 2) * biomes.length);
    return biomes[Math.min(index, biomes.length - 1)]!;
  }

  /**
   * Get biome configuration
   */
  public getBiomeConfig(biome: BiomeType): BiomeConfig {
    return BIOME_CONFIGS.get(biome)!;
  }

  /**
   * Generate world for a chunk/grid
   */
  public generateWorld(grid: VoxelGrid, offsetX: number = 0, offsetY: number = 0, offsetZ: number = 0): void {
    const width = grid.width;
    const height = grid.height;
    const depth = grid.depth;

    // Track biome distribution for debugging
    const biomeCount = new Map<BiomeType, number>();

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        for (let z = 0; z < depth; z++) {
          // Get world position
          const worldX = x + offsetX;
          const worldY = y + offsetY;
          const worldZ = z + offsetZ;

          // Determine biome
          const biomeType = this.getBiomeAtPosition(worldX, worldY, worldZ);
          const biome = this.getBiomeConfig(biomeType);

          // Count biomes
          biomeCount.set(biomeType, (biomeCount.get(biomeType) || 0) + 1);

          // Generate voxel based on biome density and noise
          const densityNoise = this.noise.fbm(
            worldX * 0.1,
            worldY * 0.1,
            worldZ * 0.1,
            4
          );

          // Should this voxel be alive?
          if (densityNoise > (0.5 - biome.density / 2)) {
            // Determine voxel state
            const rand = Math.random();

            if (rand < biome.crystallizedChance) {
              grid.set(x, y, z, VoxelState.Crystallized);
            } else if (rand < biome.crystallizedChance + biome.energyChance) {
              grid.set(x, y, z, VoxelState.Energized);
            } else {
              grid.set(x, y, z, VoxelState.Alive);
            }
          } else {
            grid.set(x, y, z, VoxelState.Dead);
          }
        }
      }
    }

    // Log biome distribution
    console.log('World generated with biomes:', Object.fromEntries(biomeCount));
  }

  /**
   * Get dominant biome in a region (for applying CA rules)
   */
  public getDominantBiome(
    centerX: number,
    centerY: number,
    centerZ: number,
    radius: number = 8
  ): BiomeType {
    const biomeCount = new Map<BiomeType, number>();

    // Sample points in region
    const _samples = 27; // 3x3x3 grid
    const step = (radius * 2) / 3;

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const x = centerX + dx * step;
          const y = centerY + dy * step;
          const z = centerZ + dz * step;

          const biome = this.getBiomeAtPosition(x, y, z);
          biomeCount.set(biome, (biomeCount.get(biome) || 0) + 1);
        }
      }
    }

    // Find most common biome
    let maxCount = 0;
    let dominantBiome = BiomeType.CrystalCaves;

    for (const [biome, count] of biomeCount) {
      if (count > maxCount) {
        maxCount = count;
        dominantBiome = biome;
      }
    }

    return dominantBiome;
  }

  /**
   * Get seed for reproducibility
   */
  public getSeed(): number {
    return this.seed;
  }

  /**
   * Create a flat terrain layer (for testing)
   */
  public generateFlatTerrain(grid: VoxelGrid, thickness: number = 3): void {
    const width = grid.width;
    const height = grid.height;
    const depth = grid.depth;

    for (let x = 0; x < width; x++) {
      for (let z = 0; z < depth; z++) {
        for (let y = 0; y < thickness && y < height; y++) {
          const rand = Math.random();
          if (rand < 0.7) {
            grid.set(x, y, z, VoxelState.Crystallized);
          } else if (rand < 0.85) {
            grid.set(x, y, z, VoxelState.Alive);
          } else {
            grid.set(x, y, z, VoxelState.Energized);
          }
        }
      }
    }
  }

  /**
   * Add scattered features to world (geodes, ruins, etc.)
   */
  public addFeatures(grid: VoxelGrid, _offsetX: number = 0, _offsetY: number = 0, _offsetZ: number = 0): void {
    const width = grid.width;
    const height = grid.height;
    const depth = grid.depth;

    // Add occasional crystal geodes
    const numGeodes = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < numGeodes; i++) {
      const gx = Math.floor(Math.random() * width);
      const gy = Math.floor(Math.random() * height);
      const gz = Math.floor(Math.random() * depth);
      const radius = Math.floor(Math.random() * 3) + 2;

      // Create hollow sphere of crystallized voxels
      for (let x = Math.max(0, gx - radius); x < Math.min(width, gx + radius); x++) {
        for (let y = Math.max(0, gy - radius); y < Math.min(height, gy + radius); y++) {
          for (let z = Math.max(0, gz - radius); z < Math.min(depth, gz + radius); z++) {
            const dx = x - gx;
            const dy = y - gy;
            const dz = z - gz;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            // Hollow sphere (shell only)
            if (dist >= radius - 1 && dist <= radius) {
              grid.set(x, y, z, VoxelState.Crystallized);
            }
            // Energized core
            else if (dist < 1) {
              grid.set(x, y, z, VoxelState.Energized);
            }
          }
        }
      }
    }
  }
}
