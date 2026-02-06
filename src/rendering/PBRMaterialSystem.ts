/**
 * Enhanced PBR Material System
 * Provides advanced physically-based rendering materials with proper texture maps
 */

import * as THREE from 'three';
import { VoxelState } from '../core/VoxelState';

/**
 * PBR Material configuration
 */
export interface PBRMaterialConfig {
  // Base properties
  color?: THREE.Color;
  metalness?: number;
  roughness?: number;

  // Emissive properties
  emissive?: THREE.Color;
  emissiveIntensity?: number;

  // Texture maps (optional)
  map?: THREE.Texture;
  normalMap?: THREE.Texture;
  roughnessMap?: THREE.Texture;
  metalnessMap?: THREE.Texture;
  emissiveMap?: THREE.Texture;
  aoMap?: THREE.Texture;
  displacementMap?: THREE.Texture;

  // Advanced properties
  envMapIntensity?: number;
  clearcoat?: number;
  clearcoatRoughness?: number;
  sheen?: number;
  sheenRoughness?: number;
  sheenColor?: THREE.Color;
  transmission?: number;
  thickness?: number;
  ior?: number;
  specularIntensity?: number;
  specularColor?: THREE.Color;
}

/**
 * Predefined PBR materials for each voxel state
 */
const VOXEL_PBR_CONFIGS: Record<VoxelState, PBRMaterialConfig> = {
  [VoxelState.Dead]: {
    color: new THREE.Color(0x1a1a1a),
    metalness: 0.0,
    roughness: 1.0,
    emissive: new THREE.Color(0x000000),
    emissiveIntensity: 0.0,
  },
  [VoxelState.Alive]: {
    color: new THREE.Color(0x4a90e2),
    metalness: 0.2,
    roughness: 0.6,
    emissive: new THREE.Color(0x2a60b2),
    emissiveIntensity: 0.15,
    clearcoat: 0.3,
    clearcoatRoughness: 0.4,
    envMapIntensity: 1.2,
  },
  [VoxelState.Energized]: {
    color: new THREE.Color(0xff6b35),
    metalness: 0.7,
    roughness: 0.3,
    emissive: new THREE.Color(0xff6b35),
    emissiveIntensity: 0.9,
    clearcoat: 0.8,
    clearcoatRoughness: 0.2,
    envMapIntensity: 1.5,
  },
  [VoxelState.Crystallized]: {
    color: new THREE.Color(0x50e3c2),
    metalness: 0.1,
    roughness: 0.1,
    emissive: new THREE.Color(0x30c3a2),
    emissiveIntensity: 0.5,
    transmission: 0.9,
    thickness: 0.5,
    ior: 1.5,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    specularIntensity: 1.0,
    specularColor: new THREE.Color(0xffffff),
  },
  [VoxelState.Corrupted]: {
    color: new THREE.Color(0xe74c3c),
    metalness: 0.5,
    roughness: 0.7,
    emissive: new THREE.Color(0xc0392b),
    emissiveIntensity: 0.6,
    sheen: 0.8,
    sheenRoughness: 0.5,
    sheenColor: new THREE.Color(0xff0000),
    envMapIntensity: 1.0,
  },
};

/**
 * PBR Material System Manager
 */
export class PBRMaterialSystem {
  private materials: Map<VoxelState, THREE.MeshPhysicalMaterial> = new Map();
  private envMap: THREE.CubeTexture | null = null;

  constructor(envMap?: THREE.CubeTexture) {
    this.envMap = envMap || null;
    this.initializeMaterials();
  }

  /**
   * Initialize all voxel state materials
   */
  private initializeMaterials(): void {
    for (const state of Object.values(VoxelState)) {
      if (typeof state === 'number') {
        const config = VOXEL_PBR_CONFIGS[state as VoxelState];
        const material = this.createPBRMaterial(config);
        this.materials.set(state as VoxelState, material);
      }
    }
  }

  /**
   * Create a PBR material from configuration
   */
  public createPBRMaterial(config: PBRMaterialConfig): THREE.MeshPhysicalMaterial {
    const material = new THREE.MeshPhysicalMaterial({
      // Base properties
      color: config.color || new THREE.Color(0xffffff),
      metalness: config.metalness ?? 0.5,
      roughness: config.roughness ?? 0.5,

      // Emissive
      emissive: config.emissive || new THREE.Color(0x000000),
      emissiveIntensity: config.emissiveIntensity ?? 0.0,

      // Texture maps
      map: config.map || null,
      normalMap: config.normalMap || null,
      roughnessMap: config.roughnessMap || null,
      metalnessMap: config.metalnessMap || null,
      emissiveMap: config.emissiveMap || null,
      aoMap: config.aoMap || null,
      displacementMap: config.displacementMap || null,

      // Environment
      envMap: this.envMap,
      envMapIntensity: config.envMapIntensity ?? 1.0,

      // Clearcoat (glossy layer)
      clearcoat: config.clearcoat ?? 0.0,
      clearcoatRoughness: config.clearcoatRoughness ?? 0.0,

      // Sheen (fabric-like)
      sheen: config.sheen ?? 0.0,
      sheenRoughness: config.sheenRoughness ?? 1.0,
      sheenColor: config.sheenColor || new THREE.Color(0xffffff),

      // Transmission (glass-like)
      transmission: config.transmission ?? 0.0,
      thickness: config.thickness ?? 0.0,
      ior: config.ior ?? 1.5,

      // Specular
      specularIntensity: config.specularIntensity ?? 1.0,
      specularColor: config.specularColor || new THREE.Color(0xffffff),

      // Other
      side: THREE.DoubleSide,
    });

    return material;
  }

  /**
   * Get material for a voxel state
   */
  public getMaterial(state: VoxelState): THREE.MeshPhysicalMaterial {
    const material = this.materials.get(state);
    if (!material) {
      throw new Error(`Material not found for voxel state: ${state}`);
    }
    return material;
  }

  /**
   * Update material for a voxel state
   */
  public updateMaterial(state: VoxelState, config: Partial<PBRMaterialConfig>): void {
    const material = this.materials.get(state);
    if (!material) return;

    // Update properties
    if (config.color) material.color.copy(config.color);
    if (config.metalness !== undefined) material.metalness = config.metalness;
    if (config.roughness !== undefined) material.roughness = config.roughness;
    if (config.emissive) material.emissive.copy(config.emissive);
    if (config.emissiveIntensity !== undefined) material.emissiveIntensity = config.emissiveIntensity;
    if (config.envMapIntensity !== undefined) material.envMapIntensity = config.envMapIntensity;
    if (config.clearcoat !== undefined) material.clearcoat = config.clearcoat;
    if (config.clearcoatRoughness !== undefined) material.clearcoatRoughness = config.clearcoatRoughness;
    if (config.sheen !== undefined) material.sheen = config.sheen;
    if (config.sheenRoughness !== undefined) material.sheenRoughness = config.sheenRoughness;
    if (config.sheenColor) material.sheenColor.copy(config.sheenColor);
    if (config.transmission !== undefined) material.transmission = config.transmission;
    if (config.thickness !== undefined) material.thickness = config.thickness;
    if (config.ior !== undefined) material.ior = config.ior;
    if (config.specularIntensity !== undefined) material.specularIntensity = config.specularIntensity;
    if (config.specularColor) material.specularColor.copy(config.specularColor);

    // Update texture maps
    if (config.map !== undefined) material.map = config.map;
    if (config.normalMap !== undefined) material.normalMap = config.normalMap;
    if (config.roughnessMap !== undefined) material.roughnessMap = config.roughnessMap;
    if (config.metalnessMap !== undefined) material.metalnessMap = config.metalnessMap;
    if (config.emissiveMap !== undefined) material.emissiveMap = config.emissiveMap;
    if (config.aoMap !== undefined) material.aoMap = config.aoMap;
    if (config.displacementMap !== undefined) material.displacementMap = config.displacementMap;

    material.needsUpdate = true;
  }

  /**
   * Set environment map for all materials
   */
  public setEnvironmentMap(envMap: THREE.CubeTexture): void {
    this.envMap = envMap;
    this.materials.forEach((material) => {
      material.envMap = envMap;
      material.needsUpdate = true;
    });
  }

  /**
   * Generate procedural noise texture for detail
   */
  public generateNoiseTexture(width: number = 512, height: number = 512): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }

    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    // Simple noise generation
    for (let i = 0; i < data.length; i += 4) {
      const value = Math.random() * 255;
      data[i] = value;     // R
      data[i + 1] = value; // G
      data[i + 2] = value; // B
      data[i + 3] = 255;   // A
    }

    ctx.putImageData(imageData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.needsUpdate = true;

    return texture;
  }

  /**
   * Generate normal map from height map
   */
  public generateNormalMap(
    heightMap: THREE.Texture,
    strength: number = 1.0
  ): THREE.Texture {
    // This is a simplified version - in production you'd want a more sophisticated algorithm
    const canvas = document.createElement('canvas');
    const size = 512;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }

    // For now, just create a flat normal map
    // In a real implementation, you'd sample the height map and calculate normals
    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      data[i] = 128;     // R (X normal)
      data[i + 1] = 128; // G (Y normal)
      data[i + 2] = 255; // B (Z normal - pointing up)
      data[i + 3] = 255; // A
    }

    ctx.putImageData(imageData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.needsUpdate = true;

    return texture;
  }

  /**
   * Dispose all materials
   */
  public dispose(): void {
    this.materials.forEach((material) => {
      material.dispose();
    });
    this.materials.clear();
  }

  /**
   * Get all materials
   */
  public getAllMaterials(): Map<VoxelState, THREE.MeshPhysicalMaterial> {
    return this.materials;
  }
}
