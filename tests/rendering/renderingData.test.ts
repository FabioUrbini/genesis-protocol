import { describe, expect, it } from 'vitest';
import { VoxelGrid } from '../../src/core/VoxelGrid';
import { VoxelState } from '../../src/core/VoxelState';
import { countRenderableVoxelStates, fillPointCloudBuffers, type RgbColor } from '../../src/rendering/renderingData';

const TEST_COLORS: Record<VoxelState, RgbColor> = {
  [VoxelState.Dead]: { r: 0, g: 0, b: 0 },
  [VoxelState.Alive]: { r: 1, g: 0, b: 0 },
  [VoxelState.Energized]: { r: 0, g: 1, b: 0 },
  [VoxelState.Crystallized]: { r: 0, g: 0, b: 1 },
  [VoxelState.Corrupted]: { r: 1, g: 1, b: 0 },
};

describe('renderingData', () => {
  describe('countRenderableVoxelStates', () => {
    it('counts every non-dead voxel state and resets reused buffers', () => {
      const counts = new Uint32Array(VoxelState.Corrupted + 1);
      counts.fill(99);

      const result = countRenderableVoxelStates(
        Uint8Array.from([
          VoxelState.Dead,
          VoxelState.Alive,
          VoxelState.Energized,
          VoxelState.Energized,
          VoxelState.Crystallized,
          VoxelState.Corrupted,
        ]),
        counts
      );

      expect(result).toBe(counts);
      expect(Array.from(counts)).toEqual([0, 1, 2, 1, 1]);
    });
  });

  describe('fillPointCloudBuffers', () => {
    it('writes positions and colors for renderable voxels in grid scan order', () => {
      const grid = new VoxelGrid(2, 2, 2);
      grid.set(1, 0, 0, VoxelState.Alive);
      grid.set(0, 1, 0, VoxelState.Energized);
      grid.set(1, 1, 1, VoxelState.Corrupted);

      const positions = new Float32Array(12);
      const colors = new Float32Array(12);

      const count = fillPointCloudBuffers(grid, 2, TEST_COLORS, positions, colors);

      expect(count).toBe(3);
      expect(Array.from(positions.slice(0, count * 3))).toEqual([
        0, -2, -2,
        -2, 0, -2,
        0, 0, 0,
      ]);
      expect(Array.from(colors.slice(0, count * 3))).toEqual([
        1, 0, 0,
        0, 1, 0,
        1, 1, 0,
      ]);
    });
  });
});