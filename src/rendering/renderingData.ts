import { VoxelGrid } from '../core/VoxelGrid';
import { VoxelState } from '../core/VoxelState';

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export const RENDERABLE_STATES = [
  VoxelState.Alive,
  VoxelState.Energized,
  VoxelState.Crystallized,
  VoxelState.Corrupted,
] as const;

export function countRenderableVoxelStates(
  data: Uint8Array,
  counts: Uint32Array = new Uint32Array(VoxelState.Corrupted + 1)
): Uint32Array {
  counts.fill(0);

  for (let i = 0; i < data.length; i++) {
    const state = data[i] as VoxelState;
    if (state !== VoxelState.Dead) {
      counts[state] = (counts[state] ?? 0) + 1;
    }
  }

  return counts;
}

export function getRenderableVoxelCount(counts: Uint32Array): number {
  let total = 0;

  for (const state of RENDERABLE_STATES) {
    total += counts[state] ?? 0;
  }

  return total;
}

export function fillPointCloudBuffers(
  grid: VoxelGrid,
  voxelSize: number,
  colorLookup: Record<VoxelState, RgbColor>,
  positions: Float32Array,
  colors: Float32Array
): number {
  const { width, height, depth } = grid;
  const data = grid.getData();
  const wh = width * height;
  const offsetX = (width * voxelSize) / 2;
  const offsetY = (height * voxelSize) / 2;
  const offsetZ = (depth * voxelSize) / 2;

  let index = 0;

  for (let z = 0; z < depth; z++) {
    const zOff = z * wh;

    for (let y = 0; y < height; y++) {
      const yzOff = zOff + y * width;

      for (let x = 0; x < width; x++) {
        const state = data[yzOff + x] as VoxelState;
        if (state === VoxelState.Dead) continue;

        const baseIndex = index * 3;
        positions[baseIndex] = x * voxelSize - offsetX;
        positions[baseIndex + 1] = y * voxelSize - offsetY;
        positions[baseIndex + 2] = z * voxelSize - offsetZ;

        const color = colorLookup[state];
        colors[baseIndex] = color.r;
        colors[baseIndex + 1] = color.g;
        colors[baseIndex + 2] = color.b;

        index++;
      }
    }
  }

  return index;
}