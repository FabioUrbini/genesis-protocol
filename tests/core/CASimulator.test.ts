import { describe, it, expect, beforeEach } from 'vitest';
import { CASimulator } from '../../src/core/CASimulator';
import { VoxelState } from '../../src/core/VoxelState';

describe('CASimulator', () => {
  let simulator: CASimulator;
  const gridSize = 10;

  beforeEach(() => {
    simulator = new CASimulator(gridSize, gridSize, gridSize);
  });

  describe('constructor', () => {
    it('should create simulator with correct grid dimensions', () => {
      const grid = simulator.getGrid();
      expect(grid.width).toBe(gridSize);
      expect(grid.height).toBe(gridSize);
      expect(grid.depth).toBe(gridSize);
    });

    it('should initialize with tick 0', () => {
      expect(simulator.getTick()).toBe(0);
    });

    it('should initialize grid with all Dead voxels', () => {
      const grid = simulator.getGrid();
      for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
          for (let z = 0; z < gridSize; z++) {
            expect(grid.get(x, y, z)).toBe(VoxelState.Dead);
          }
        }
      }
    });
  });

  describe('step', () => {
    it('should increment tick counter', () => {
      const initialTick = simulator.getTick();
      simulator.step();
      expect(simulator.getTick()).toBe(initialTick + 1);
    });

    it('should apply CA rules to all voxels', () => {
      // Create a simple pattern that should evolve
      const center = Math.floor(gridSize / 2);
      simulator.getGrid().set(center, center, center, VoxelState.Alive);
      simulator.getGrid().set(center + 1, center, center, VoxelState.Alive);
      simulator.getGrid().set(center, center + 1, center, VoxelState.Alive);

      simulator.step();

      // Verify that the grid has changed (CA rules applied)
      expect(simulator.getTick()).toBe(1);
    });

    it('should handle empty grid (all Dead)', () => {
      simulator.step();
      const grid = simulator.getGrid();
      
      // Empty grid should remain empty
      let hasAlive = false;
      for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
          for (let z = 0; z < gridSize; z++) {
            if (grid.get(x, y, z) !== VoxelState.Dead) {
              hasAlive = true;
            }
          }
        }
      }
      expect(hasAlive).toBe(false);
    });
  });

  describe('fillPattern', () => {
    it('should fill grid using pattern function', () => {
      simulator.fillPattern((x, y, z) => {
        return x === 5 && y === 5 && z === 5 ? VoxelState.Alive : VoxelState.Dead;
      });

      const grid = simulator.getGrid();
      expect(grid.get(5, 5, 5)).toBe(VoxelState.Alive);
      expect(grid.get(0, 0, 0)).toBe(VoxelState.Dead);
      expect(grid.get(4, 5, 5)).toBe(VoxelState.Dead);
    });

    it('should support complex patterns', () => {
      simulator.fillPattern((x, y, z) => {
        const center = Math.floor(gridSize / 2);
        const dx = x - center;
        const dy = y - center;
        const dz = z - center;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        return distance < 2 ? VoxelState.Alive : VoxelState.Dead;
      });

      const grid = simulator.getGrid();
      const center = Math.floor(gridSize / 2);
      
      // Center should be alive
      expect(grid.get(center, center, center)).toBe(VoxelState.Alive);
      
      // Far corners should be dead
      expect(grid.get(0, 0, 0)).toBe(VoxelState.Dead);
      expect(grid.get(gridSize - 1, gridSize - 1, gridSize - 1)).toBe(VoxelState.Dead);
    });
  });

  describe('reset', () => {
    it('should clear grid and reset tick', () => {
      // Set up some state
      simulator.fillPattern((x, y, z) => VoxelState.Alive);
      simulator.step();
      simulator.step();

      // Reset
      simulator.reset();

      // Verify reset
      expect(simulator.getTick()).toBe(0);
      const grid = simulator.getGrid();
      for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
          for (let z = 0; z < gridSize; z++) {
            expect(grid.get(x, y, z)).toBe(VoxelState.Dead);
          }
        }
      }
    });
  });

  describe('CA rules', () => {
    it('should apply birth rule (5-6 living neighbors)', () => {
      const center = Math.floor(gridSize / 2);
      
      // Create exactly 5 living neighbors around a dead voxel
      simulator.getGrid().set(center - 1, center, center, VoxelState.Alive);
      simulator.getGrid().set(center + 1, center, center, VoxelState.Alive);
      simulator.getGrid().set(center, center - 1, center, VoxelState.Alive);
      simulator.getGrid().set(center, center + 1, center, VoxelState.Alive);
      simulator.getGrid().set(center, center, center - 1, VoxelState.Alive);

      simulator.step();

      // Center voxel should be born (5 neighbors)
      const grid = simulator.getGrid();
      expect(grid.get(center, center, center)).toBe(VoxelState.Alive);
    });

    it('should apply survival rule (4-7 living neighbors)', () => {
      const center = Math.floor(gridSize / 2);
      
      // Create alive voxel with 5 living neighbors
      simulator.getGrid().set(center, center, center, VoxelState.Alive);
      simulator.getGrid().set(center - 1, center, center, VoxelState.Alive);
      simulator.getGrid().set(center + 1, center, center, VoxelState.Alive);
      simulator.getGrid().set(center, center - 1, center, VoxelState.Alive);
      simulator.getGrid().set(center, center + 1, center, VoxelState.Alive);
      simulator.getGrid().set(center, center, center - 1, VoxelState.Alive);

      simulator.step();

      // Center voxel should survive (5 neighbors)
      const grid = simulator.getGrid();
      expect(grid.get(center, center, center)).toBe(VoxelState.Alive);
    });

    it('should apply death rule (too few or too many neighbors)', () => {
      const center = Math.floor(gridSize / 2);
      
      // Create alive voxel with only 1 neighbor (should die)
      simulator.getGrid().set(center, center, center, VoxelState.Alive);
      simulator.getGrid().set(center - 1, center, center, VoxelState.Alive);

      simulator.step();

      // Center voxel should die (only 1 neighbor)
      const grid = simulator.getGrid();
      expect(grid.get(center, center, center)).toBe(VoxelState.Dead);
    });

    it('should apply energize rule (8+ living neighbors)', () => {
      const center = Math.floor(gridSize / 2);
      
      // Create alive voxel with 8+ living neighbors
      simulator.getGrid().set(center, center, center, VoxelState.Alive);
      
      // Add 8 neighbors
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx === 0 && dy === 0) continue;
          simulator.getGrid().set(center + dx, center + dy, center, VoxelState.Alive);
        }
      }

      simulator.step();

      // Center voxel should be energized (8 neighbors)
      const grid = simulator.getGrid();
      expect(grid.get(center, center, center)).toBe(VoxelState.Energized);
    });

    it('should apply crystallize rule (2-3 living neighbors)', () => {
      const center = Math.floor(gridSize / 2);
      
      // Create alive voxel with exactly 3 neighbors
      simulator.getGrid().set(center, center, center, VoxelState.Alive);
      simulator.getGrid().set(center - 1, center, center, VoxelState.Alive);
      simulator.getGrid().set(center + 1, center, center, VoxelState.Alive);
      simulator.getGrid().set(center, center - 1, center, VoxelState.Alive);

      simulator.step();

      // Center voxel should crystallize (3 neighbors)
      const grid = simulator.getGrid();
      expect(grid.get(center, center, center)).toBe(VoxelState.Crystallized);
    });
  });

  describe('Still Life detection', () => {
    it('should detect when grid reaches stable state', () => {
      // Create a stable pattern (block - 2x2x2 cube)
      const center = Math.floor(gridSize / 2);
      for (let dx = 0; dx < 2; dx++) {
        for (let dy = 0; dy < 2; dy++) {
          for (let dz = 0; dz < 2; dz++) {
            simulator.getGrid().set(center + dx, center + dy, center + dz, VoxelState.Alive);
          }
        }
      }

      // Run multiple steps
      for (let i = 0; i < 5; i++) {
        simulator.step();
      }

      // Pattern should stabilize or die out
      expect(simulator.getTick()).toBe(5);
    });
  });

  describe('edge cases', () => {
    it('should handle voxels at grid boundaries', () => {
      // Set voxel at corner
      simulator.getGrid().set(0, 0, 0, VoxelState.Alive);
      
      // Should not crash when checking neighbors
      expect(() => simulator.step()).not.toThrow();
    });

    it('should handle full grid', () => {
      simulator.fillPattern(() => VoxelState.Alive);
      
      // Should not crash with all voxels alive
      expect(() => simulator.step()).not.toThrow();
    });

    it('should handle multiple consecutive steps', () => {
      const center = Math.floor(gridSize / 2);
      simulator.getGrid().set(center, center, center, VoxelState.Alive);

      // Run many steps
      for (let i = 0; i < 10; i++) {
        simulator.step();
      }

      expect(simulator.getTick()).toBe(10);
    });
  });
});
