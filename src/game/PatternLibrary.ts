import { VoxelGrid } from '../core/VoxelGrid';
import { VoxelState } from '../core/VoxelState';

/**
 * A saved pattern that can be placed in the world
 */
export interface Pattern {
  name: string;
  description: string;
  width: number;
  height: number;
  depth: number;
  data: Uint8Array;
  created: number;
}

/**
 * Pattern category for organization
 */
export enum PatternCategory {
  StillLife = 'still_life',
  Oscillator = 'oscillator',
  Spaceship = 'spaceship',
  Gun = 'gun',
  Custom = 'custom',
}

/**
 * Pattern Library System
 * Save, load, and spawn voxel patterns
 */
export class PatternLibrary {
  private patterns: Map<string, Pattern> = new Map();
  private categories: Map<PatternCategory, Set<string>> = new Map();

  constructor() {
    // Initialize categories
    for (const category of Object.values(PatternCategory)) {
      this.categories.set(category as PatternCategory, new Set());
    }
  }

  /**
   * Capture a region of the grid as a pattern
   */
  public capturePattern(
    grid: VoxelGrid,
    startX: number,
    startY: number,
    startZ: number,
    width: number,
    height: number,
    depth: number,
    name: string,
    description: string = '',
    category: PatternCategory = PatternCategory.Custom
  ): Pattern {
    const data = new Uint8Array(width * height * depth);
    let index = 0;

    for (let z = 0; z < depth; z++) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const gridX = startX + x;
          const gridY = startY + y;
          const gridZ = startZ + z;

          if (gridX >= 0 && gridX < grid.width &&
              gridY >= 0 && gridY < grid.height &&
              gridZ >= 0 && gridZ < grid.depth) {
            data[index] = grid.get(gridX, gridY, gridZ);
          } else {
            data[index] = VoxelState.Dead;
          }
          index++;
        }
      }
    }

    const pattern: Pattern = {
      name,
      description,
      width,
      height,
      depth,
      data,
      created: Date.now(),
    };

    this.savePattern(pattern, category);
    return pattern;
  }

  /**
   * Spawn a pattern at a specific location
   */
  public spawnPattern(
    pattern: Pattern,
    grid: VoxelGrid,
    startX: number,
    startY: number,
    startZ: number,
    replace: boolean = false
  ): boolean {
    let index = 0;
    let voxelsPlaced = 0;

    for (let z = 0; z < pattern.depth; z++) {
      for (let y = 0; y < pattern.height; y++) {
        for (let x = 0; x < pattern.width; x++) {
          const gridX = startX + x;
          const gridY = startY + y;
          const gridZ = startZ + z;

          if (gridX >= 0 && gridX < grid.width &&
              gridY >= 0 && gridY < grid.height &&
              gridZ >= 0 && gridZ < grid.depth) {

            const voxelState = pattern.data[index];

            // Only place if not dead or if replacing
            if (voxelState !== undefined && (voxelState !== VoxelState.Dead || replace)) {
              const currentState = grid.get(gridX, gridY, gridZ);

              // Only place if space is empty or we're replacing
              if (replace || currentState === VoxelState.Dead) {
                grid.set(gridX, gridY, gridZ, voxelState);
                voxelsPlaced++;
              }
            }
          }

          index++;
        }
      }
    }

    console.log(`Spawned pattern "${pattern.name}" (${voxelsPlaced} voxels)`);
    return voxelsPlaced > 0;
  }

  /**
   * Save a pattern to the library
   */
  public savePattern(pattern: Pattern, category: PatternCategory = PatternCategory.Custom): void {
    this.patterns.set(pattern.name, pattern);
    this.categories.get(category)?.add(pattern.name);
    console.log(`Saved pattern "${pattern.name}" to category ${category}`);
  }

  /**
   * Load a pattern by name
   */
  public loadPattern(name: string): Pattern | undefined {
    return this.patterns.get(name);
  }

  /**
   * Delete a pattern by name
   */
  public deletePattern(name: string): boolean {
    if (this.patterns.has(name)) {
      this.patterns.delete(name);

      // Remove from all categories
      for (const categorySet of this.categories.values()) {
        categorySet.delete(name);
      }

      console.log(`Deleted pattern "${name}"`);
      return true;
    }
    return false;
  }

  /**
   * Get all pattern names in a category
   */
  public getPatternsByCategory(category: PatternCategory): string[] {
    return Array.from(this.categories.get(category) || []);
  }

  /**
   * Get all pattern names
   */
  public getAllPatternNames(): string[] {
    return Array.from(this.patterns.keys());
  }

  /**
   * Get pattern count
   */
  public getPatternCount(): number {
    return this.patterns.size;
  }

  /**
   * Export pattern to JSON string
   */
  public exportPattern(name: string): string | null {
    const pattern = this.patterns.get(name);
    if (!pattern) return null;

    const exportData = {
      ...pattern,
      data: Array.from(pattern.data),
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import pattern from JSON string
   */
  public importPattern(jsonString: string, category: PatternCategory = PatternCategory.Custom): Pattern | null {
    try {
      const importData = JSON.parse(jsonString);
      const pattern: Pattern = {
        ...importData,
        data: new Uint8Array(importData.data),
      };

      this.savePattern(pattern, category);
      return pattern;
    } catch (error) {
      console.error('Failed to import pattern:', error);
      return null;
    }
  }

  /**
   * Export all patterns to JSON
   */
  public exportAll(): string {
    const exportData: any = {
      patterns: [],
      categories: {},
    };

    // Export patterns
    for (const [_name, pattern] of this.patterns) {
      exportData.patterns.push({
        ...pattern,
        data: Array.from(pattern.data),
      });
    }

    // Export category mappings
    for (const [category, patternSet] of this.categories) {
      exportData.categories[category] = Array.from(patternSet);
    }

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import all patterns from JSON
   */
  public importAll(jsonString: string): boolean {
    try {
      const importData = JSON.parse(jsonString);

      // Clear existing patterns
      this.patterns.clear();
      for (const categorySet of this.categories.values()) {
        categorySet.clear();
      }

      // Import patterns
      for (const patternData of importData.patterns) {
        const pattern: Pattern = {
          ...patternData,
          data: new Uint8Array(patternData.data),
        };
        this.patterns.set(pattern.name, pattern);
      }

      // Import category mappings
      for (const [category, patternNames] of Object.entries(importData.categories)) {
        const categorySet = this.categories.get(category as PatternCategory);
        if (categorySet) {
          for (const name of patternNames as string[]) {
            categorySet.add(name);
          }
        }
      }

      console.log(`Imported ${this.patterns.size} patterns`);
      return true;
    } catch (error) {
      console.error('Failed to import patterns:', error);
      return false;
    }
  }

  /**
   * Save to localStorage
   */
  public saveToLocalStorage(): void {
    try {
      const data = this.exportAll();
      localStorage.setItem('genesis_protocol_patterns', data);
      console.log('Saved patterns to localStorage');
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  /**
   * Load from localStorage
   */
  public loadFromLocalStorage(): boolean {
    try {
      const data = localStorage.getItem('genesis_protocol_patterns');
      if (data) {
        return this.importAll(data);
      }
      return false;
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return false;
    }
  }
}
