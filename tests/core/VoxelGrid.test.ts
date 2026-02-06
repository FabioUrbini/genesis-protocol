import { describe, it, expect, beforeEach } from 'vitest';
import { VoxelGrid } from '../../src/core/VoxelGrid';
import { VoxelState } from '../../src/core/VoxelState';

describe('VoxelGrid', () => {
  let grid: VoxelGrid;
  const width = 10;
  const height = 10;
  const depth = 10;

  beforeEach(() => {
    grid = new VoxelGrid(width, height, depth);
  });

  describe('constructor', () => {
    it('should create a grid with correct dimensions', () => {
      expect(grid.width).toBe(width);
      expect(grid.height).toBe(height);
      expect(grid.depth).toBe(depth);
    });

    it('should initialize all voxels to Dead state', () => {
      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          for (let z = 0; z < depth; z++) {
            expect(grid.get(x, y, z)).toBe(VoxelState.Dead);
          }
        }
      }
    });

    it('should allocate correct data array size', () => {
      expect(grid.data.length).toBe(width * height * depth);
    });
  });

  describe('get', () => {
    it('should return Dead for valid coordinates', () => {
      expect(grid.get(0, 0, 0)).toBe(VoxelState.Dead);
      expect(grid.get(5, 5, 5)).toBe(VoxelState.Dead);
      expect(grid.get(9, 9, 9)).toBe(VoxelState.Dead);
    });

    it('should return Dead for out-of-bounds coordinates', () => {
      expect(grid.get(-1, 0, 0)).toBe(VoxelState.Dead);
      expect(grid.get(0, -1, 0)).toBe(VoxelState.Dead);
      expect(grid.get(0, 0, -1)).toBe(VoxelState.Dead);
      expect(grid.get(10, 0, 0)).toBe(VoxelState.Dead);
      expect(grid.get(0, 10, 0)).toBe(VoxelState.Dead);
      expect(grid.get(0, 0, 10)).toBe(VoxelState.Dead);
    });
  });

  describe('set', () => {
    it('should set voxel state at valid coordinates', () => {
      grid.set(5, 5, 5, VoxelState.Alive);
      expect(grid.get(5, 5, 5)).toBe(VoxelState.Alive);

      grid.set(0, 0, 0, VoxelState.Energized);
      expect(grid.get(0, 0, 0)).toBe(VoxelState.Energized);

      grid.set(9, 9, 9, VoxelState.Crystallized);
      expect(grid.get(9, 9, 9)).toBe(VoxelState.Crystallized);
    });

    it('should not crash when setting out-of-bounds coordinates', () => {
      expect(() => grid.set(-1, 0, 0, VoxelState.Alive)).not.toThrow();
      expect(() => grid.set(0, -1, 0, VoxelState.Alive)).not.toThrow();
      expect(() => grid.set(0, 0, -1, VoxelState.Alive)).not.toThrow();
      expect(() => grid.set(10, 0, 0, VoxelState.Alive)).not.toThrow();
      expect(() => grid.set(0, 10, 0, VoxelState.Alive)).not.toThrow();
      expect(() => grid.set(0, 0, 10, VoxelState.Alive)).not.toThrow();
    });

    it('should handle all voxel states', () => {
      grid.set(0, 0, 0, VoxelState.Dead);
      expect(grid.get(0, 0, 0)).toBe(VoxelState.Dead);

      grid.set(0, 0, 0, VoxelState.Alive);
      expect(grid.get(0, 0, 0)).toBe(VoxelState.Alive);

      grid.set(0, 0, 0, VoxelState.Energized);
      expect(grid.get(0, 0, 0)).toBe(VoxelState.Energized);

      grid.set(0, 0, 0, VoxelState.Crystallized);
      expect(grid.get(0, 0, 0)).toBe(VoxelState.Crystallized);

      grid.set(0, 0, 0, VoxelState.Corrupted);
      expect(grid.get(0, 0, 0)).toBe(VoxelState.Corrupted);
    });
  });

  describe('fill', () => {
    it('should fill entire grid with specified state', () => {
      grid.fill(VoxelState.Alive);

      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          for (let z = 0; z < depth; z++) {
            expect(grid.get(x, y, z)).toBe(VoxelState.Alive);
          }
        }
      }
    });

    it('should overwrite previous states', () => {
      grid.set(5, 5, 5, VoxelState.Energized);
      grid.fill(VoxelState.Crystallized);
      expect(grid.get(5, 5, 5)).toBe(VoxelState.Crystallized);
    });
  });

  describe('clear', () => {
    it('should reset all voxels to Dead state', () => {
      // Set some voxels to different states
      grid.set(0, 0, 0, VoxelState.Alive);
      grid.set(5, 5, 5, VoxelState.Energized);
      grid.set(9, 9, 9, VoxelState.Crystallized);

      // Clear grid
      grid.clear();

      // Verify all voxels are Dead
      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          for (let z = 0; z < depth; z++) {
            expect(grid.get(x, y, z)).toBe(VoxelState.Dead);
          }
        }
      }
    });
  });

  describe('clone', () => {
    it('should create an independent copy of the grid', () => {
      grid.set(5, 5, 5, VoxelState.Alive);
      const cloned = grid.clone();

      expect(cloned.get(5, 5, 5)).toBe(VoxelState.Alive);
      expect(cloned.width).toBe(grid.width);
      expect(cloned.height).toBe(grid.height);
      expect(cloned.depth).toBe(grid.depth);
    });

    it('should not affect original when modifying clone', () => {
      grid.set(5, 5, 5, VoxelState.Alive);
      const cloned = grid.clone();

      cloned.set(5, 5, 5, VoxelState.Energized);

      expect(grid.get(5, 5, 5)).toBe(VoxelState.Alive);
      expect(cloned.get(5, 5, 5)).toBe(VoxelState.Energized);
    });
  });

  describe('3D indexing', () => {
    it('should correctly map 3D coordinates to 1D array', () => {
      // Test corner cases
      grid.set(0, 0, 0, VoxelState.Alive);
      expect(grid.get(0, 0, 0)).toBe(VoxelState.Alive);

      grid.set(width - 1, height - 1, depth - 1, VoxelState.Energized);
      expect(grid.get(width - 1, height - 1, depth - 1)).toBe(VoxelState.Energized);

      // Test that different coordinates don't collide
      grid.set(1, 0, 0, VoxelState.Crystallized);
      grid.set(0, 1, 0, VoxelState.Corrupted);
      grid.set(0, 0, 1, VoxelState.Alive);

      expect(grid.get(1, 0, 0)).toBe(VoxelState.Crystallized);
      expect(grid.get(0, 1, 0)).toBe(VoxelState.Corrupted);
      expect(grid.get(0, 0, 1)).toBe(VoxelState.Alive);
    });
  });

  describe('edge cases', () => {
    it('should handle 1x1x1 grid', () => {
      const smallGrid = new VoxelGrid(1, 1, 1);
      smallGrid.set(0, 0, 0, VoxelState.Alive);
      expect(smallGrid.get(0, 0, 0)).toBe(VoxelState.Alive);
    });

    it('should handle large grids', () => {
      const largeGrid = new VoxelGrid(100, 100, 100);
      largeGrid.set(50, 50, 50, VoxelState.Alive);
      expect(largeGrid.get(50, 50, 50)).toBe(VoxelState.Alive);
      expect(largeGrid.data.length).toBe(100 * 100 * 100);
    });

    it('should handle non-cubic grids', () => {
      const rectGrid = new VoxelGrid(5, 10, 15);
      rectGrid.set(4, 9, 14, VoxelState.Alive);
      expect(rectGrid.get(4, 9, 14)).toBe(VoxelState.Alive);
    });
  });
});
