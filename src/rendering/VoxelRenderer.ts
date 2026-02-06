import * as THREE from 'three';
import { VoxelGrid } from '../core/VoxelGrid';
import { VoxelState } from '../core/VoxelState';

/**
 * Material colors for different voxel states
 */
const VOXEL_COLORS: Record<VoxelState, number> = {
  [VoxelState.Dead]: 0x000000,        // Black (invisible)
  [VoxelState.Alive]: 0x4a90e2,       // Blue
  [VoxelState.Energized]: 0xff6b35,   // Orange (glowing)
  [VoxelState.Crystallized]: 0x50e3c2, // Cyan (stable)
  [VoxelState.Corrupted]: 0xe74c3c,   // Red (dangerous)
};

/**
 * Emissive intensity for glowing voxels
 */
const EMISSIVE_INTENSITY: Record<VoxelState, number> = {
  [VoxelState.Dead]: 0,
  [VoxelState.Alive]: 0,
  [VoxelState.Energized]: 0.5,
  [VoxelState.Crystallized]: 0.2,
  [VoxelState.Corrupted]: 0.3,
};

/**
 * Basic voxel renderer using Three.js
 * Uses instanced rendering for performance
 */
export class VoxelRenderer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private instancedMeshes: Map<VoxelState, THREE.InstancedMesh>;
  private voxelSize: number;

  constructor(canvas: HTMLCanvasElement, voxelSize = 1) {
    this.voxelSize = voxelSize;
    
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a0a);
    this.scene.fog = new THREE.Fog(0x0a0a0a, 50, 200);

    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(30, 30, 30);
    this.camera.lookAt(0, 0, 0);

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Add lighting
    this.setupLighting();

    // Initialize instanced meshes
    this.instancedMeshes = new Map();

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());
  }

  /**
   * Setup scene lighting
   */
  private setupLighting(): void {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    this.scene.add(ambientLight);

    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    // Point light for dramatic effect
    const pointLight = new THREE.PointLight(0x4a90e2, 0.5, 100);
    pointLight.position.set(0, 20, 0);
    this.scene.add(pointLight);
  }

  /**
   * Render voxel grid using instanced rendering
   */
  public renderGrid(grid: VoxelGrid): void {
    // Clear previous instances
    this.clearInstances();

    // Count voxels per state
    const counts = new Map<VoxelState, number>();
    grid.forEach((_x, _y, _z, state) => {
      if (state !== VoxelState.Dead) {
        counts.set(state, (counts.get(state) ?? 0) + 1);
      }
    });

    // Create instanced meshes for each state
    const geometry = new THREE.BoxGeometry(this.voxelSize, this.voxelSize, this.voxelSize);
    
    for (const [state, count] of counts) {
      if (count === 0) continue;

      const material = new THREE.MeshStandardMaterial({
        color: VOXEL_COLORS[state],
        emissive: VOXEL_COLORS[state],
        emissiveIntensity: EMISSIVE_INTENSITY[state],
        metalness: 0.3,
        roughness: 0.7,
      });

      const mesh = new THREE.InstancedMesh(geometry, material, count);
      this.instancedMeshes.set(state, mesh);
      this.scene.add(mesh);
    }

    // Set instance transforms
    const indices = new Map<VoxelState, number>();
    const matrix = new THREE.Matrix4();

    grid.forEach((x, y, z, state) => {
      if (state === VoxelState.Dead) return;

      const mesh = this.instancedMeshes.get(state);
      if (!mesh) return;

      const index = indices.get(state) ?? 0;
      indices.set(state, index + 1);

      // Center the grid around origin
      const offsetX = (grid.width * this.voxelSize) / 2;
      const offsetY = (grid.height * this.voxelSize) / 2;
      const offsetZ = (grid.depth * this.voxelSize) / 2;

      matrix.setPosition(
        x * this.voxelSize - offsetX,
        y * this.voxelSize - offsetY,
        z * this.voxelSize - offsetZ
      );

      mesh.setMatrixAt(index, matrix);
    });

    // Update instance matrices
    for (const mesh of this.instancedMeshes.values()) {
      mesh.instanceMatrix.needsUpdate = true;
    }
  }

  /**
   * Clear all instanced meshes
   */
  private clearInstances(): void {
    for (const mesh of this.instancedMeshes.values()) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(m => m.dispose());
      } else {
        mesh.material.dispose();
      }
    }
    this.instancedMeshes.clear();
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
    this.clearInstances();
    this.renderer.dispose();
    window.removeEventListener('resize', () => this.onWindowResize());
  }
}
