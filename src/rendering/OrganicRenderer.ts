import * as THREE from 'three';
import { VoxelGrid } from '../core/VoxelGrid';
import { VoxelState } from '../core/VoxelState';
import { createGalaxyBackground } from './SpaceBackground';

/**
 * Material colors for different voxel states (organic style)
 */
const ORGANIC_COLORS: Record<VoxelState, THREE.Color> = {
  [VoxelState.Dead]: new THREE.Color(0x000000),
  [VoxelState.Alive]: new THREE.Color(0x4a90e2),       // Blue
  [VoxelState.Energized]: new THREE.Color(0xff6b35),   // Orange
  [VoxelState.Crystallized]: new THREE.Color(0x50e3c2), // Cyan
  [VoxelState.Corrupted]: new THREE.Color(0xe74c3c),   // Red
};

/**
 * Emissive intensity for organic materials
 */
const ORGANIC_EMISSIVE: Record<VoxelState, number> = {
  [VoxelState.Dead]: 0,
  [VoxelState.Alive]: 0.05,
  [VoxelState.Energized]: 0.25,
  [VoxelState.Crystallized]: 0.1,
  [VoxelState.Corrupted]: 0.15,
};

/**
 * Marching Cubes lookup tables
 */
const EDGE_TABLE = [
  0x0, 0x109, 0x203, 0x30a, 0x406, 0x50f, 0x605, 0x70c,
  0x80c, 0x905, 0xa0f, 0xb06, 0xc0a, 0xd03, 0xe09, 0xf00,
  0x190, 0x99, 0x393, 0x29a, 0x596, 0x49f, 0x795, 0x69c,
  0x99c, 0x895, 0xb9f, 0xa96, 0xd9a, 0xc93, 0xf99, 0xe90,
  0x230, 0x339, 0x33, 0x13a, 0x636, 0x73f, 0x435, 0x53c,
  0xa3c, 0xb35, 0x83f, 0x936, 0xe3a, 0xf33, 0xc39, 0xd30,
  0x3a0, 0x2a9, 0x1a3, 0xaa, 0x7a6, 0x6af, 0x5a5, 0x4ac,
  0xbac, 0xaa5, 0x9af, 0x8a6, 0xfaa, 0xea3, 0xda9, 0xca0,
  0x460, 0x569, 0x663, 0x76a, 0x66, 0x16f, 0x265, 0x36c,
  0xc6c, 0xd65, 0xe6f, 0xf66, 0x86a, 0x963, 0xa69, 0xb60,
  0x5f0, 0x4f9, 0x7f3, 0x6fa, 0x1f6, 0xff, 0x3f5, 0x2fc,
  0xdfc, 0xcf5, 0xfff, 0xef6, 0x9fa, 0x8f3, 0xbf9, 0xaf0,
  0x650, 0x759, 0x453, 0x55a, 0x256, 0x35f, 0x55, 0x15c,
  0xe5c, 0xf55, 0xc5f, 0xd56, 0xa5a, 0xb53, 0x859, 0x950,
  0x7c0, 0x6c9, 0x5c3, 0x4ca, 0x3c6, 0x2cf, 0x1c5, 0xcc,
  0xfcc, 0xec5, 0xdcf, 0xcc6, 0xbca, 0xac3, 0x9c9, 0x8c0,
  0x8c0, 0x9c9, 0xac3, 0xbca, 0xcc6, 0xdcf, 0xec5, 0xfcc,
  0xcc, 0x1c5, 0x2cf, 0x3c6, 0x4ca, 0x5c3, 0x6c9, 0x7c0,
  0x950, 0x859, 0xb53, 0xa5a, 0xd56, 0xc5f, 0xf55, 0xe5c,
  0x15c, 0x55, 0x35f, 0x256, 0x55a, 0x453, 0x759, 0x650,
  0xaf0, 0xbf9, 0x8f3, 0x9fa, 0xef6, 0xfff, 0xcf5, 0xdfc,
  0x2fc, 0x3f5, 0xff, 0x1f6, 0x6fa, 0x7f3, 0x4f9, 0x5f0,
  0xb60, 0xa69, 0x963, 0x86a, 0xf66, 0xe6f, 0xd65, 0xc6c,
  0x36c, 0x265, 0x16f, 0x66, 0x76a, 0x663, 0x569, 0x460,
  0xca0, 0xda9, 0xea3, 0xfaa, 0x8a6, 0x9af, 0xaa5, 0xbac,
  0x4ac, 0x5a5, 0x6af, 0x7a6, 0xaa, 0x1a3, 0x2a9, 0x3a0,
  0xd30, 0xc39, 0xf33, 0xe3a, 0x936, 0x83f, 0xb35, 0xa3c,
  0x53c, 0x435, 0x73f, 0x636, 0x13a, 0x33, 0x339, 0x230,
  0xe90, 0xf99, 0xc93, 0xd9a, 0xa96, 0xb9f, 0x895, 0x99c,
  0x69c, 0x795, 0x49f, 0x596, 0x29a, 0x393, 0x99, 0x190,
  0xf00, 0xe09, 0xd03, 0xc0a, 0xb06, 0xa0f, 0x905, 0x80c,
  0x70c, 0x605, 0x50f, 0x406, 0x30a, 0x203, 0x109, 0x0
];

const TRI_TABLE = [
  [-1],
  [0, 8, 3, -1],
  [0, 1, 9, -1],
  [1, 8, 3, 9, 8, 1, -1],
  [1, 2, 10, -1],
  [0, 8, 3, 1, 2, 10, -1],
  [9, 2, 10, 0, 2, 9, -1],
  [2, 8, 3, 2, 10, 8, 10, 9, 8, -1],
  [3, 11, 2, -1],
  [0, 11, 2, 8, 11, 0, -1],
  [1, 9, 0, 2, 3, 11, -1],
  [1, 11, 2, 1, 9, 11, 9, 8, 11, -1],
  [3, 10, 1, 11, 10, 3, -1],
  [0, 10, 1, 0, 8, 10, 8, 11, 10, -1],
  [3, 9, 0, 3, 11, 9, 11, 10, 9, -1],
  [9, 8, 10, 10, 8, 11, -1],
  [4, 7, 8, -1],
  [4, 3, 0, 7, 3, 4, -1],
  [0, 1, 9, 8, 4, 7, -1],
  [4, 1, 9, 4, 7, 1, 7, 3, 1, -1],
  [1, 2, 10, 8, 4, 7, -1],
  [3, 4, 7, 3, 0, 4, 1, 2, 10, -1],
  [9, 2, 10, 9, 0, 2, 8, 4, 7, -1],
  [2, 10, 9, 2, 9, 7, 2, 7, 3, 7, 9, 4, -1],
  [8, 4, 7, 3, 11, 2, -1],
  [11, 4, 7, 11, 2, 4, 2, 0, 4, -1],
  [9, 0, 1, 8, 4, 7, 2, 3, 11, -1],
  [4, 7, 11, 9, 4, 11, 9, 11, 2, 9, 2, 1, -1],
  [3, 10, 1, 3, 11, 10, 7, 8, 4, -1],
  [1, 11, 10, 1, 4, 11, 1, 0, 4, 7, 11, 4, -1],
  [4, 7, 8, 9, 0, 11, 9, 11, 10, 11, 0, 3, -1],
  [4, 7, 11, 4, 11, 9, 9, 11, 10, -1],
  [9, 5, 4, -1],
  [9, 5, 4, 0, 8, 3, -1],
  [0, 5, 4, 1, 5, 0, -1],
  [8, 5, 4, 8, 3, 5, 3, 1, 5, -1],
  [1, 2, 10, 9, 5, 4, -1],
  [3, 0, 8, 1, 2, 10, 4, 9, 5, -1],
  [5, 2, 10, 5, 4, 2, 4, 0, 2, -1],
  [2, 10, 5, 3, 2, 5, 3, 5, 4, 3, 4, 8, -1],
  [9, 5, 4, 2, 3, 11, -1],
  [0, 11, 2, 0, 8, 11, 4, 9, 5, -1],
  [0, 5, 4, 0, 1, 5, 2, 3, 11, -1],
  [2, 1, 5, 2, 5, 8, 2, 8, 11, 4, 8, 5, -1],
  [10, 3, 11, 10, 1, 3, 9, 5, 4, -1],
  [4, 9, 5, 0, 8, 1, 8, 10, 1, 8, 11, 10, -1],
  [5, 4, 0, 5, 0, 11, 5, 11, 10, 11, 0, 3, -1],
  [5, 4, 8, 5, 8, 10, 10, 8, 11, -1],
  [9, 7, 8, 5, 7, 9, -1],
  [9, 3, 0, 9, 5, 3, 5, 7, 3, -1],
  [0, 7, 8, 0, 1, 7, 1, 5, 7, -1],
  [1, 5, 3, 3, 5, 7, -1],
  [9, 7, 8, 9, 5, 7, 10, 1, 2, -1],
  [10, 1, 2, 9, 5, 0, 5, 3, 0, 5, 7, 3, -1],
  [8, 0, 2, 8, 2, 5, 8, 5, 7, 10, 5, 2, -1],
  [2, 10, 5, 2, 5, 3, 3, 5, 7, -1],
  [7, 9, 5, 7, 8, 9, 3, 11, 2, -1],
  [9, 5, 7, 9, 7, 2, 9, 2, 0, 2, 7, 11, -1],
  [2, 3, 11, 0, 1, 8, 1, 7, 8, 1, 5, 7, -1],
  [11, 2, 1, 11, 1, 7, 7, 1, 5, -1],
  [9, 5, 8, 8, 5, 7, 10, 1, 3, 10, 3, 11, -1],
  [5, 7, 0, 5, 0, 9, 7, 11, 0, 1, 0, 10, 11, 10, 0, -1],
  [11, 10, 0, 11, 0, 3, 10, 5, 0, 8, 0, 7, 5, 7, 0, -1],
  [11, 10, 5, 7, 11, 5, -1],
  [10, 6, 5, -1],
  [0, 8, 3, 5, 10, 6, -1],
  [9, 0, 1, 5, 10, 6, -1],
  [1, 8, 3, 1, 9, 8, 5, 10, 6, -1],
  [1, 6, 5, 2, 6, 1, -1],
  [1, 6, 5, 1, 2, 6, 3, 0, 8, -1],
  [9, 6, 5, 9, 0, 6, 0, 2, 6, -1],
  [5, 9, 8, 5, 8, 2, 5, 2, 6, 3, 2, 8, -1],
  [2, 3, 11, 10, 6, 5, -1],
  [11, 0, 8, 11, 2, 0, 10, 6, 5, -1],
  [0, 1, 9, 2, 3, 11, 5, 10, 6, -1],
  [5, 10, 6, 1, 9, 2, 9, 11, 2, 9, 8, 11, -1],
  [6, 3, 11, 6, 5, 3, 5, 1, 3, -1],
  [0, 8, 11, 0, 11, 5, 0, 5, 1, 5, 11, 6, -1],
  [3, 11, 6, 0, 3, 6, 0, 6, 5, 0, 5, 9, -1],
  [6, 5, 9, 6, 9, 11, 11, 9, 8, -1],
  [5, 10, 6, 4, 7, 8, -1],
  [4, 3, 0, 4, 7, 3, 6, 5, 10, -1],
  [1, 9, 0, 5, 10, 6, 8, 4, 7, -1],
  [10, 6, 5, 1, 9, 7, 1, 7, 3, 7, 9, 4, -1],
  [6, 1, 2, 6, 5, 1, 4, 7, 8, -1],
  [1, 2, 5, 5, 2, 6, 3, 0, 4, 3, 4, 7, -1],
  [8, 4, 7, 9, 0, 5, 0, 6, 5, 0, 2, 6, -1],
  [7, 3, 9, 7, 9, 4, 3, 2, 9, 5, 9, 6, 2, 6, 9, -1],
  [3, 11, 2, 7, 8, 4, 10, 6, 5, -1],
  [5, 10, 6, 4, 7, 2, 4, 2, 0, 2, 7, 11, -1],
  [0, 1, 9, 4, 7, 8, 2, 3, 11, 5, 10, 6, -1],
  [9, 2, 1, 9, 11, 2, 9, 4, 11, 7, 11, 4, 5, 10, 6, -1],
  [8, 4, 7, 3, 11, 5, 3, 5, 1, 5, 11, 6, -1],
  [5, 1, 11, 5, 11, 6, 1, 0, 11, 7, 11, 4, 0, 4, 11, -1],
  [0, 5, 9, 0, 6, 5, 0, 3, 6, 11, 6, 3, 8, 4, 7, -1],
  [6, 5, 9, 6, 9, 11, 4, 7, 9, 7, 11, 9, -1],
  [10, 4, 9, 6, 4, 10, -1],
  [4, 10, 6, 4, 9, 10, 0, 8, 3, -1],
  [10, 0, 1, 10, 6, 0, 6, 4, 0, -1],
  [8, 3, 1, 8, 1, 6, 8, 6, 4, 6, 1, 10, -1],
  [1, 4, 9, 1, 2, 4, 2, 6, 4, -1],
  [3, 0, 8, 1, 2, 9, 2, 4, 9, 2, 6, 4, -1],
  [0, 2, 4, 4, 2, 6, -1],
  [8, 3, 2, 8, 2, 4, 4, 2, 6, -1],
  [10, 4, 9, 10, 6, 4, 11, 2, 3, -1],
  [0, 8, 2, 2, 8, 11, 4, 9, 10, 4, 10, 6, -1],
  [3, 11, 2, 0, 1, 6, 0, 6, 4, 6, 1, 10, -1],
  [6, 4, 1, 6, 1, 10, 4, 8, 1, 2, 1, 11, 8, 11, 1, -1],
  [9, 6, 4, 9, 3, 6, 9, 1, 3, 11, 6, 3, -1],
  [8, 11, 1, 8, 1, 0, 11, 6, 1, 9, 1, 4, 6, 4, 1, -1],
  [3, 11, 6, 3, 6, 0, 0, 6, 4, -1],
  [6, 4, 8, 11, 6, 8, -1],
  [7, 10, 6, 7, 8, 10, 8, 9, 10, -1],
  [0, 7, 3, 0, 10, 7, 0, 9, 10, 6, 7, 10, -1],
  [10, 6, 7, 1, 10, 7, 1, 7, 8, 1, 8, 0, -1],
  [10, 6, 7, 10, 7, 1, 1, 7, 3, -1],
  [1, 2, 6, 1, 6, 8, 1, 8, 9, 8, 6, 7, -1],
  [2, 6, 9, 2, 9, 1, 6, 7, 9, 0, 9, 3, 7, 3, 9, -1],
  [7, 8, 0, 7, 0, 6, 6, 0, 2, -1],
  [7, 3, 2, 6, 7, 2, -1],
  [2, 3, 11, 10, 6, 8, 10, 8, 9, 8, 6, 7, -1],
  [2, 0, 7, 2, 7, 11, 0, 9, 7, 6, 7, 10, 9, 10, 7, -1],
  [1, 8, 0, 1, 7, 8, 1, 10, 7, 6, 7, 10, 2, 3, 11, -1],
  [11, 2, 1, 11, 1, 7, 10, 6, 1, 6, 7, 1, -1],
  [8, 9, 6, 8, 6, 7, 9, 1, 6, 11, 6, 3, 1, 3, 6, -1],
  [0, 9, 1, 11, 6, 7, -1],
  [7, 8, 0, 7, 0, 6, 3, 11, 0, 11, 6, 0, -1],
  [7, 11, 6, -1],
  [7, 6, 11, -1],
  [3, 0, 8, 11, 7, 6, -1],
  [0, 1, 9, 11, 7, 6, -1],
  [8, 1, 9, 8, 3, 1, 11, 7, 6, -1],
  [10, 1, 2, 6, 11, 7, -1],
  [1, 2, 10, 3, 0, 8, 6, 11, 7, -1],
  [2, 9, 0, 2, 10, 9, 6, 11, 7, -1],
  [6, 11, 7, 2, 10, 3, 10, 8, 3, 10, 9, 8, -1],
  [7, 2, 3, 6, 2, 7, -1],
  [7, 0, 8, 7, 6, 0, 6, 2, 0, -1],
  [2, 7, 6, 2, 3, 7, 0, 1, 9, -1],
  [1, 6, 2, 1, 8, 6, 1, 9, 8, 8, 7, 6, -1],
  [10, 7, 6, 10, 1, 7, 1, 3, 7, -1],
  [10, 7, 6, 1, 7, 10, 1, 8, 7, 1, 0, 8, -1],
  [0, 3, 7, 0, 7, 10, 0, 10, 9, 6, 10, 7, -1],
  [7, 6, 10, 7, 10, 8, 8, 10, 9, -1],
  [6, 8, 4, 11, 8, 6, -1],
  [3, 6, 11, 3, 0, 6, 0, 4, 6, -1],
  [8, 6, 11, 8, 4, 6, 9, 0, 1, -1],
  [9, 4, 6, 9, 6, 3, 9, 3, 1, 11, 3, 6, -1],
  [6, 8, 4, 6, 11, 8, 2, 10, 1, -1],
  [1, 2, 10, 3, 0, 11, 0, 6, 11, 0, 4, 6, -1],
  [4, 11, 8, 4, 6, 11, 0, 2, 9, 2, 10, 9, -1],
  [10, 9, 3, 10, 3, 2, 9, 4, 3, 11, 3, 6, 4, 6, 3, -1],
  [8, 2, 3, 8, 4, 2, 4, 6, 2, -1],
  [0, 4, 2, 4, 6, 2, -1],
  [1, 9, 0, 2, 3, 4, 2, 4, 6, 4, 3, 8, -1],
  [1, 9, 4, 1, 4, 2, 2, 4, 6, -1],
  [8, 1, 3, 8, 6, 1, 8, 4, 6, 6, 10, 1, -1],
  [10, 1, 0, 10, 0, 6, 6, 0, 4, -1],
  [4, 6, 3, 4, 3, 8, 6, 10, 3, 0, 3, 9, 10, 9, 3, -1],
  [10, 9, 4, 6, 10, 4, -1],
  [4, 9, 5, 7, 6, 11, -1],
  [0, 8, 3, 4, 9, 5, 11, 7, 6, -1],
  [5, 0, 1, 5, 4, 0, 7, 6, 11, -1],
  [11, 7, 6, 8, 3, 4, 3, 5, 4, 3, 1, 5, -1],
  [9, 5, 4, 10, 1, 2, 7, 6, 11, -1],
  [6, 11, 7, 1, 2, 10, 0, 8, 3, 4, 9, 5, -1],
  [7, 6, 11, 5, 4, 10, 4, 2, 10, 4, 0, 2, -1],
  [3, 4, 8, 3, 5, 4, 3, 2, 5, 10, 5, 2, 11, 7, 6, -1],
  [7, 2, 3, 7, 6, 2, 5, 4, 9, -1],
  [9, 5, 4, 0, 8, 6, 0, 6, 2, 6, 8, 7, -1],
  [3, 6, 2, 3, 7, 6, 1, 5, 0, 5, 4, 0, -1],
  [6, 2, 8, 6, 8, 7, 2, 1, 8, 4, 8, 5, 1, 5, 8, -1],
  [9, 5, 4, 10, 1, 6, 1, 7, 6, 1, 3, 7, -1],
  [1, 6, 10, 1, 7, 6, 1, 0, 7, 8, 7, 0, 9, 5, 4, -1],
  [4, 0, 10, 4, 10, 5, 0, 3, 10, 6, 10, 7, 3, 7, 10, -1],
  [7, 6, 10, 7, 10, 8, 5, 4, 10, 4, 8, 10, -1],
  [6, 9, 5, 6, 11, 9, 11, 8, 9, -1],
  [3, 6, 11, 0, 6, 3, 0, 5, 6, 0, 9, 5, -1],
  [0, 11, 8, 0, 5, 11, 0, 1, 5, 5, 6, 11, -1],
  [6, 11, 3, 6, 3, 5, 5, 3, 1, -1],
  [1, 2, 10, 9, 5, 11, 9, 11, 8, 11, 5, 6, -1],
  [0, 11, 3, 0, 6, 11, 0, 9, 6, 5, 6, 9, 1, 2, 10, -1],
  [11, 8, 5, 11, 5, 6, 8, 0, 5, 10, 5, 2, 0, 2, 5, -1],
  [6, 11, 3, 6, 3, 5, 2, 10, 3, 10, 5, 3, -1],
  [5, 8, 9, 5, 2, 8, 5, 6, 2, 3, 8, 2, -1],
  [9, 5, 6, 9, 6, 0, 0, 6, 2, -1],
  [1, 5, 8, 1, 8, 0, 5, 6, 8, 3, 8, 2, 6, 2, 8, -1],
  [1, 5, 6, 2, 1, 6, -1],
  [1, 3, 6, 1, 6, 10, 3, 8, 6, 5, 6, 9, 8, 9, 6, -1],
  [10, 1, 0, 10, 0, 6, 9, 5, 0, 5, 6, 0, -1],
  [0, 3, 8, 5, 6, 10, -1],
  [10, 5, 6, -1],
  [11, 5, 10, 7, 5, 11, -1],
  [11, 5, 10, 11, 7, 5, 8, 3, 0, -1],
  [5, 11, 7, 5, 10, 11, 1, 9, 0, -1],
  [10, 7, 5, 10, 11, 7, 9, 8, 1, 8, 3, 1, -1],
  [11, 1, 2, 11, 7, 1, 7, 5, 1, -1],
  [0, 8, 3, 1, 2, 7, 1, 7, 5, 7, 2, 11, -1],
  [9, 7, 5, 9, 2, 7, 9, 0, 2, 2, 11, 7, -1],
  [7, 5, 2, 7, 2, 11, 5, 9, 2, 3, 2, 8, 9, 8, 2, -1],
  [2, 5, 10, 2, 3, 5, 3, 7, 5, -1],
  [8, 2, 0, 8, 5, 2, 8, 7, 5, 10, 2, 5, -1],
  [9, 0, 1, 5, 10, 3, 5, 3, 7, 3, 10, 2, -1],
  [9, 8, 2, 9, 2, 1, 8, 7, 2, 10, 2, 5, 7, 5, 2, -1],
  [1, 3, 5, 3, 7, 5, -1],
  [0, 8, 7, 0, 7, 1, 1, 7, 5, -1],
  [9, 0, 3, 9, 3, 5, 5, 3, 7, -1],
  [9, 8, 7, 5, 9, 7, -1],
  [5, 8, 4, 5, 10, 8, 10, 11, 8, -1],
  [5, 0, 4, 5, 11, 0, 5, 10, 11, 11, 3, 0, -1],
  [0, 1, 9, 8, 4, 10, 8, 10, 11, 10, 4, 5, -1],
  [10, 11, 4, 10, 4, 5, 11, 3, 4, 9, 4, 1, 3, 1, 4, -1],
  [2, 5, 1, 2, 8, 5, 2, 11, 8, 4, 5, 8, -1],
  [0, 4, 11, 0, 11, 3, 4, 5, 11, 2, 11, 1, 5, 1, 11, -1],
  [0, 2, 5, 0, 5, 9, 2, 11, 5, 4, 5, 8, 11, 8, 5, -1],
  [9, 4, 5, 2, 11, 3, -1],
  [2, 5, 10, 3, 5, 2, 3, 4, 5, 3, 8, 4, -1],
  [5, 10, 2, 5, 2, 4, 4, 2, 0, -1],
  [3, 10, 2, 3, 5, 10, 3, 8, 5, 4, 5, 8, 0, 1, 9, -1],
  [5, 10, 2, 5, 2, 4, 1, 9, 2, 9, 4, 2, -1],
  [8, 4, 5, 8, 5, 3, 3, 5, 1, -1],
  [0, 4, 5, 1, 0, 5, -1],
  [8, 4, 5, 8, 5, 3, 9, 0, 5, 0, 3, 5, -1],
  [9, 4, 5, -1],
  [4, 11, 7, 4, 9, 11, 9, 10, 11, -1],
  [0, 8, 3, 4, 9, 7, 9, 11, 7, 9, 10, 11, -1],
  [1, 10, 11, 1, 11, 4, 1, 4, 0, 7, 4, 11, -1],
  [3, 1, 4, 3, 4, 8, 1, 10, 4, 7, 4, 11, 10, 11, 4, -1],
  [4, 11, 7, 9, 11, 4, 9, 2, 11, 9, 1, 2, -1],
  [9, 7, 4, 9, 11, 7, 9, 1, 11, 2, 11, 1, 0, 8, 3, -1],
  [11, 7, 4, 11, 4, 2, 2, 4, 0, -1],
  [11, 7, 4, 11, 4, 2, 8, 3, 4, 3, 2, 4, -1],
  [2, 9, 10, 2, 7, 9, 2, 3, 7, 7, 4, 9, -1],
  [9, 10, 7, 9, 7, 4, 10, 2, 7, 8, 7, 0, 2, 0, 7, -1],
  [3, 7, 10, 3, 10, 2, 7, 4, 10, 1, 10, 0, 4, 0, 10, -1],
  [1, 10, 2, 8, 7, 4, -1],
  [4, 9, 1, 4, 1, 7, 7, 1, 3, -1],
  [4, 9, 1, 4, 1, 7, 0, 8, 1, 8, 7, 1, -1],
  [4, 0, 3, 7, 4, 3, -1],
  [4, 8, 7, -1],
  [9, 10, 8, 10, 11, 8, -1],
  [3, 0, 9, 3, 9, 11, 11, 9, 10, -1],
  [0, 1, 10, 0, 10, 8, 8, 10, 11, -1],
  [3, 1, 10, 11, 3, 10, -1],
  [1, 2, 11, 1, 11, 9, 9, 11, 8, -1],
  [3, 0, 9, 3, 9, 11, 1, 2, 9, 2, 11, 9, -1],
  [0, 2, 11, 8, 0, 11, -1],
  [3, 2, 11, -1],
  [2, 3, 8, 2, 8, 10, 10, 8, 9, -1],
  [9, 10, 2, 0, 9, 2, -1],
  [2, 3, 8, 2, 8, 10, 0, 1, 8, 1, 10, 8, -1],
  [1, 10, 2, -1],
  [1, 3, 8, 9, 1, 8, -1],
  [0, 9, 1, -1],
  [0, 3, 8, -1],
  [-1]
];

/**
 * Rendering mode for organic renderer
 */
export enum RenderMode {
  Metaballs = 'metaballs',
  Spheres = 'spheres',
  Mixed = 'mixed'
}

/**
 * OrganicRenderer - Creates smooth, blob-like geometry from voxel data
 * Uses Marching Cubes algorithm for isosurface extraction
 */
export class OrganicRenderer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private organicMeshes: THREE.Mesh[] = [];
  private voxelSize: number;
  private renderMode: RenderMode = RenderMode.Spheres;
  private blobRadius: number = 0.8; // Influence radius for metaballs
  private resolution: number = 1; // Marching cubes resolution multiplier
  private cachedSphereGeometry: THREE.SphereGeometry | null = null;
  private cachedMaterials: Map<VoxelState, THREE.MeshStandardMaterial> = new Map();

  constructor(canvas: HTMLCanvasElement, voxelSize = 1) {
    this.voxelSize = voxelSize;

    // Create scene with galaxy background
    this.scene = new THREE.Scene();
    this.scene.background = createGalaxyBackground();
    this.scene.fog = new THREE.FogExp2(0x0b1020, 0.008);  // Subtle atmospheric fog

    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(30, 30, 30);
    this.camera.lookAt(0, 0, 0);

    // Create renderer with HDR
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.9;

    // Add lighting
    this.setupLighting();

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());
  }

  /**
   * Setup scene lighting for organic look
   */
  private setupLighting(): void {
    // Warm ambient light for pleasant atmosphere
    const ambientLight = new THREE.AmbientLight(0xcce0ff, 0.6);
    this.scene.add(ambientLight);

    // Main directional light (slightly warm)
    const mainLight = new THREE.DirectionalLight(0xffffee, 1.0);
    mainLight.position.set(50, 100, 50);
    mainLight.castShadow = true;
    this.scene.add(mainLight);

    // Blue accent rim light for depth
    const rimLight = new THREE.DirectionalLight(0x88bbff, 0.3);
    rimLight.position.set(-50, 50, -50);
    this.scene.add(rimLight);

    // Subtle fill light from below
    const fillLight = new THREE.PointLight(0xff8844, 0.15, 200);
    fillLight.position.set(0, -30, 0);
    this.scene.add(fillLight);

    // Subtle point lights for gentle glow effect
    const glowLight1 = new THREE.PointLight(0xff6b35, 0.3, 50);
    glowLight1.position.set(0, 15, 0);
    this.scene.add(glowLight1);

    const glowLight2 = new THREE.PointLight(0x50e3c2, 0.25, 50);
    glowLight2.position.set(10, 5, -10);
    this.scene.add(glowLight2);
  }

  /**
   * Render voxel grid using organic/metaball style
   */
  public renderGrid(grid: VoxelGrid): void {
    // Clear previous meshes
    this.clearMeshes();

    if (this.renderMode === RenderMode.Spheres) {
      this.renderSpheres(grid);
    } else {
      this.renderMetaballs(grid);
    }
  }

  /**
   * Render using sphere instancing (simpler organic look)
   */
  private renderSpheres(grid: VoxelGrid): void {
    // Count voxels per state
    const voxelsByState = new Map<VoxelState, Array<{ x: number; y: number; z: number }>>();

    grid.forEach((x, y, z, state) => {
      if (state !== VoxelState.Dead) {
        if (!voxelsByState.has(state)) {
          voxelsByState.set(state, []);
        }
        voxelsByState.get(state)!.push({ x, y, z });
      }
    });

    // Reuse cached sphere geometry (reduced polygon count for performance)
    if (!this.cachedSphereGeometry) {
      this.cachedSphereGeometry = new THREE.SphereGeometry(this.voxelSize * 0.55, 8, 6);
    }

    for (const [state, positions] of voxelsByState) {
      if (positions.length === 0) continue;

      // Reuse cached materials
      if (!this.cachedMaterials.has(state)) {
        this.cachedMaterials.set(state, new THREE.MeshStandardMaterial({
          color: ORGANIC_COLORS[state],
          emissive: ORGANIC_COLORS[state],
          emissiveIntensity: ORGANIC_EMISSIVE[state],
          metalness: 0.2,
          roughness: 0.4,
          transparent: state === VoxelState.Energized || state === VoxelState.Crystallized,
          opacity: state === VoxelState.Energized ? 0.9 : 1.0,
        }));
      }

      const instancedMesh = new THREE.InstancedMesh(
        this.cachedSphereGeometry,
        this.cachedMaterials.get(state)!,
        positions.length
      );

      const matrix = new THREE.Matrix4();
      const offsetX = (grid.width * this.voxelSize) / 2;
      const offsetY = (grid.height * this.voxelSize) / 2;
      const offsetZ = (grid.depth * this.voxelSize) / 2;

      positions.forEach((pos, index) => {
        matrix.makeScale(1, 1, 1);
        matrix.setPosition(
          pos.x * this.voxelSize - offsetX,
          pos.y * this.voxelSize - offsetY,
          pos.z * this.voxelSize - offsetZ
        );
        instancedMesh.setMatrixAt(index, matrix);
      });

      instancedMesh.instanceMatrix.needsUpdate = true;
      this.scene.add(instancedMesh);
      this.organicMeshes.push(instancedMesh as unknown as THREE.Mesh);
    }
  }

  /**
   * Render using marching cubes for smooth blob surfaces
   */
  private renderMetaballs(grid: VoxelGrid): void {
    // Group voxels by state for separate meshes
    const voxelsByState = new Map<VoxelState, Array<{ x: number; y: number; z: number }>>();

    grid.forEach((x, y, z, state) => {
      if (state !== VoxelState.Dead) {
        if (!voxelsByState.has(state)) {
          voxelsByState.set(state, []);
        }
        voxelsByState.get(state)!.push({ x, y, z });
      }
    });

    // Generate metaball mesh for each state
    for (const [state, positions] of voxelsByState) {
      if (positions.length === 0) continue;

      const geometry = this.generateMetaballGeometry(grid, positions);
      const posAttr = geometry.attributes.position;
      if (!posAttr || posAttr.count === 0) continue;

      const material = new THREE.MeshStandardMaterial({
        color: ORGANIC_COLORS[state],
        emissive: ORGANIC_COLORS[state],
        emissiveIntensity: ORGANIC_EMISSIVE[state],
        metalness: 0.3,
        roughness: 0.4,
        side: THREE.DoubleSide,
        flatShading: false,
      });

      const mesh = new THREE.Mesh(geometry, material);
      this.scene.add(mesh);
      this.organicMeshes.push(mesh);
    }
  }

  /**
   * Generate metaball geometry using marching cubes
   * Uses voxel-centric splatting: iterate voxels and splat influence into nearby cells
   * This is O(voxelCount × localRadius³) instead of O(mcGrid³ × voxelCount)
   */
  private generateMetaballGeometry(
    grid: VoxelGrid,
    voxelPositions: Array<{ x: number; y: number; z: number }>
  ): THREE.BufferGeometry {
    const resolution = this.resolution;
    const blobRadius = this.blobRadius;
    const threshold = 1.0;

    // Calculate bounds with padding
    const padding = 2;
    const stepSize = this.voxelSize / resolution;

    // Grid dimensions for marching cubes
    const mcWidth = Math.ceil((grid.width + padding * 2) * resolution);
    const mcHeight = Math.ceil((grid.height + padding * 2) * resolution);
    const mcDepth = Math.ceil((grid.depth + padding * 2) * resolution);

    // Scalar field
    const scalarField = new Float32Array(mcWidth * mcHeight * mcDepth);

    // Voxel-centric splatting: for each voxel, splat its influence into nearby MC cells
    const radius = blobRadius * this.voxelSize;
    const radiusSq = radius * radius;
    const influenceRadius = radius * 2; // cutoff at radius*2 (where distSq < radiusSq*4)
    const influenceCells = Math.ceil(influenceRadius * resolution / this.voxelSize);

    for (const voxel of voxelPositions) {
      // Convert voxel position to MC grid coordinates
      const vcx = (voxel.x + padding) * resolution;
      const vcy = (voxel.y + padding) * resolution;
      const vcz = (voxel.z + padding) * resolution;

      const minX = Math.max(0, Math.floor(vcx - influenceCells));
      const maxX = Math.min(mcWidth - 1, Math.ceil(vcx + influenceCells));
      const minY = Math.max(0, Math.floor(vcy - influenceCells));
      const maxY = Math.min(mcHeight - 1, Math.ceil(vcy + influenceCells));
      const minZ = Math.max(0, Math.floor(vcz - influenceCells));
      const maxZ = Math.min(mcDepth - 1, Math.ceil(vcz + influenceCells));

      const voxelWorldX = voxel.x * this.voxelSize;
      const voxelWorldY = voxel.y * this.voxelSize;
      const voxelWorldZ = voxel.z * this.voxelSize;

      for (let z = minZ; z <= maxZ; z++) {
        const worldZ = (z / resolution - padding) * this.voxelSize;
        const dz = worldZ - voxelWorldZ;
        const dzSq = dz * dz;
        if (dzSq >= radiusSq * 4) continue;

        const zOff = z * mcWidth * mcHeight;
        for (let y = minY; y <= maxY; y++) {
          const worldY = (y / resolution - padding) * this.voxelSize;
          const dy = worldY - voxelWorldY;
          const dySq = dy * dy;
          if (dzSq + dySq >= radiusSq * 4) continue;

          const yzOff = zOff + y * mcWidth;
          for (let x = minX; x <= maxX; x++) {
            const worldX = (x / resolution - padding) * this.voxelSize;
            const dx = worldX - voxelWorldX;
            const distSq = dx * dx + dySq + dzSq;

            if (distSq < radiusSq * 4) {
              const idx = yzOff + x;
              scalarField[idx] = (scalarField[idx] ?? 0) + Math.exp(-distSq / radiusSq);
            }
          }
        }
      }
    }

    // Run marching cubes
    const vertices: number[] = [];
    const normals: number[] = [];

    const offsetX = (grid.width * this.voxelSize) / 2;
    const offsetY = (grid.height * this.voxelSize) / 2;
    const offsetZ = (grid.depth * this.voxelSize) / 2;

    for (let z = 0; z < mcDepth - 1; z++) {
      for (let y = 0; y < mcHeight - 1; y++) {
        for (let x = 0; x < mcWidth - 1; x++) {
          // Early exit: skip cubes where all corners are zero (no metaball influence)
          const idx000 = x + y * mcWidth + z * mcWidth * mcHeight;
          const idx100 = idx000 + 1;
          const idx010 = idx000 + mcWidth;
          const idx110 = idx010 + 1;
          const idx001 = idx000 + mcWidth * mcHeight;
          const idx101 = idx001 + 1;
          const idx011 = idx001 + mcWidth;
          const idx111 = idx011 + 1;
          if (scalarField[idx000] === 0 && scalarField[idx100] === 0 &&
              scalarField[idx010] === 0 && scalarField[idx110] === 0 &&
              scalarField[idx001] === 0 && scalarField[idx101] === 0 &&
              scalarField[idx011] === 0 && scalarField[idx111] === 0) {
            continue;
          }
          this.marchCube(
            x, y, z,
            mcWidth, mcHeight,
            scalarField,
            threshold,
            stepSize,
            padding,
            offsetX, offsetY, offsetZ,
            vertices, normals
          );
        }
      }
    }

    // Create geometry
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.computeVertexNormals();

    return geometry;
  }

  /**
   * Process a single cube in marching cubes
   */
  private marchCube(
    x: number, y: number, z: number,
    width: number, height: number,
    field: Float32Array,
    threshold: number,
    stepSize: number,
    padding: number,
    offsetX: number, offsetY: number, offsetZ: number,
    vertices: number[], normals: number[]
  ): void {
    // Get field values at cube corners
    const values: number[] = [
      field[x + y * width + z * width * height] ?? 0,
      field[(x + 1) + y * width + z * width * height] ?? 0,
      field[(x + 1) + y * width + (z + 1) * width * height] ?? 0,
      field[x + y * width + (z + 1) * width * height] ?? 0,
      field[x + (y + 1) * width + z * width * height] ?? 0,
      field[(x + 1) + (y + 1) * width + z * width * height] ?? 0,
      field[(x + 1) + (y + 1) * width + (z + 1) * width * height] ?? 0,
      field[x + (y + 1) * width + (z + 1) * width * height] ?? 0,
    ];

    // Calculate cube index
    let cubeIndex = 0;
    if (values[0]! > threshold) cubeIndex |= 1;
    if (values[1]! > threshold) cubeIndex |= 2;
    if (values[2]! > threshold) cubeIndex |= 4;
    if (values[3]! > threshold) cubeIndex |= 8;
    if (values[4]! > threshold) cubeIndex |= 16;
    if (values[5]! > threshold) cubeIndex |= 32;
    if (values[6]! > threshold) cubeIndex |= 64;
    if (values[7]! > threshold) cubeIndex |= 128;

    // Skip if entirely inside or outside
    const edgeFlags = EDGE_TABLE[cubeIndex];
    if (edgeFlags === undefined || edgeFlags === 0) return;

    // Cube corner positions
    const corners: Array<[number, number, number]> = [
      [x, y, z],
      [x + 1, y, z],
      [x + 1, y, z + 1],
      [x, y, z + 1],
      [x, y + 1, z],
      [x + 1, y + 1, z],
      [x + 1, y + 1, z + 1],
      [x, y + 1, z + 1],
    ];

    // Calculate interpolated vertices on edges
    const edgeVertices: Array<[number, number, number] | undefined> = new Array(12);

    for (let i = 0; i < 12; i++) {
      if (edgeFlags & (1 << i)) {
        const edgeVerts = this.getEdgeVertices(i);
        const v1 = edgeVerts[0];
        const v2 = edgeVerts[1];
        const p1 = corners[v1]!;
        const p2 = corners[v2]!;
        const val1 = values[v1]!;
        const val2 = values[v2]!;

        const denom = val2 - val1;
        const t = denom !== 0 ? (threshold - val1) / denom : 0.5;

        edgeVertices[i] = [
          (p1[0] + t * (p2[0] - p1[0])) * stepSize - padding * stepSize - offsetX,
          (p1[1] + t * (p2[1] - p1[1])) * stepSize - padding * stepSize - offsetY,
          (p1[2] + t * (p2[2] - p1[2])) * stepSize - padding * stepSize - offsetZ,
        ];
      }
    }

    // Generate triangles
    const triangles = TRI_TABLE[cubeIndex];
    if (!triangles) return;
    
    for (let i = 0; i < triangles.length; i += 3) {
      const idx0 = triangles[i];
      const idx1 = triangles[i + 1];
      const idx2 = triangles[i + 2];
      
      if (idx0 === undefined || idx1 === undefined || idx2 === undefined) break;
      if (idx0 === -1 || idx1 === -1 || idx2 === -1) break;

      const v0 = edgeVertices[idx0];
      const v1 = edgeVertices[idx1];
      const v2 = edgeVertices[idx2];

      if (v0 && v1 && v2) {
        vertices.push(v0[0], v0[1], v0[2], v1[0], v1[1], v1[2], v2[0], v2[1], v2[2]);

        // Calculate face normal
        const e1x = v1[0] - v0[0];
        const e1y = v1[1] - v0[1];
        const e1z = v1[2] - v0[2];
        const e2x = v2[0] - v0[0];
        const e2y = v2[1] - v0[1];
        const e2z = v2[2] - v0[2];
        
        let nx = e1y * e2z - e1z * e2y;
        let ny = e1z * e2x - e1x * e2z;
        let nz = e1x * e2y - e1y * e2x;
        
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
        if (len > 0) {
          nx /= len;
          ny /= len;
          nz /= len;
        }

        normals.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
      }
    }
  }

  /**
   * Get vertex indices for an edge
   */
  private getEdgeVertices(edge: number): [number, number] {
    const edgeToVertices: [number, number][] = [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [4, 5], [5, 6], [6, 7], [7, 4],
      [0, 4], [1, 5], [2, 6], [3, 7],
    ];
    return edgeToVertices[edge] ?? [0, 1];
  }

  /**
   * Clear all organic meshes
   */
  private clearMeshes(): void {
    for (const mesh of this.organicMeshes) {
      this.scene.remove(mesh);
      // Only dispose geometry that isn't our cached sphere geometry
      if (mesh.geometry !== this.cachedSphereGeometry) {
        mesh.geometry.dispose();
      }
      // Don't dispose cached materials - they are reused
      if (!this.cachedMaterials.has(mesh.userData.state)) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(m => m.dispose());
        } else {
          (mesh.material as THREE.Material).dispose();
        }
      }
    }
    this.organicMeshes = [];
  }

  /**
   * Set rendering mode
   */
  public setRenderMode(mode: RenderMode): void {
    this.renderMode = mode;
  }

  /**
   * Get current render mode
   */
  public getRenderMode(): RenderMode {
    return this.renderMode;
  }

  /**
   * Render the scene
   */
  public render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Get camera for external control
   */
  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  /**
   * Get scene for external modifications
   */
  public getScene(): THREE.Scene {
    return this.scene;
  }

  /**
   * Get renderer for post-processing
   */
  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  /**
   * Handle window resize
   */
  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    this.clearMeshes();
    this.renderer.dispose();
    window.removeEventListener('resize', () => this.onWindowResize());
  }
}
