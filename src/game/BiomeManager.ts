import { CARule } from '../core/CARule';
import { BiomeType, BiomeConfig, WorldManager } from './WorldManager';
import { Vector3 } from 'three';

/**
 * Biome-specific CA rule
 */
export class BiomeRule extends CARule {
  private biomeConfig: BiomeConfig;

  constructor(biomeConfig: BiomeConfig) {
    super();
    this.biomeConfig = biomeConfig;
  }

  /**
   * Apply biome-specific rules
   */
  public shouldBeBorn(aliveNeighbors: number): boolean {
    return aliveNeighbors >= this.biomeConfig.caRules.birthMin &&
           aliveNeighbors <= this.biomeConfig.caRules.birthMax;
  }

  public shouldSurvive(aliveNeighbors: number): boolean {
    return aliveNeighbors >= this.biomeConfig.caRules.surviveMin &&
           aliveNeighbors <= this.biomeConfig.caRules.surviveMax;
  }

  public getBiomeConfig(): BiomeConfig {
    return this.biomeConfig;
  }
}

/**
 * BiomeManager - Manages biome-specific CA rules and transitions
 */
export class BiomeManager {
  private worldManager: WorldManager;
  private biomeRules: Map<BiomeType, BiomeRule>;
  private currentBiome: BiomeType;

  constructor(worldManager: WorldManager) {
    this.worldManager = worldManager;
    this.biomeRules = new Map();
    this.currentBiome = BiomeType.CrystalCaves;

    // Initialize all biome rules
    for (const biomeType of Object.values(BiomeType)) {
      const config = worldManager.getBiomeConfig(biomeType);
      this.biomeRules.set(biomeType, new BiomeRule(config));
    }
  }

  /**
   * Get CA rule for a specific biome
   */
  public getBiomeRule(biomeType: BiomeType): BiomeRule {
    return this.biomeRules.get(biomeType)!;
  }

  /**
   * Get current active biome
   */
  public getCurrentBiome(): BiomeType {
    return this.currentBiome;
  }

  /**
   * Set current active biome
   */
  public setCurrentBiome(biomeType: BiomeType): void {
    this.currentBiome = biomeType;
    console.log(`Biome changed to: ${this.worldManager.getBiomeConfig(biomeType).name}`);
  }

  /**
   * Update current biome based on position
   */
  public updateBiomeAtPosition(position: Vector3): void {
    const biome = this.worldManager.getDominantBiome(
      position.x,
      position.y,
      position.z,
      8
    );

    if (biome !== this.currentBiome) {
      this.setCurrentBiome(biome);
    }
  }

  /**
   * Get all biome types
   */
  public getAllBiomes(): BiomeType[] {
    return Array.from(this.biomeRules.keys());
  }

  /**
   * Get biome info
   */
  public getBiomeInfo(biomeType: BiomeType): BiomeConfig {
    return this.worldManager.getBiomeConfig(biomeType);
  }

  /**
   * Get biome at position
   */
  public getBiomeAtPosition(position: Vector3): BiomeType {
    return this.worldManager.getBiomeAtPosition(
      position.x,
      position.y,
      position.z
    );
  }
}
