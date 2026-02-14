import * as THREE from 'three';
import { VoxelGrid } from '../core/VoxelGrid';
import { VoxelState } from '../core/VoxelState';
import { createGalaxyBackground } from './SpaceBackground';

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
  [VoxelState.Energized]: 0.15,
  [VoxelState.Crystallized]: 0.05,
  [VoxelState.Corrupted]: 0.1,
};

/**
 * Pre-cached THREE.Color objects for lightweight rendering (avoids per-voxel allocation)
 */
const CACHED_COLORS: Record<VoxelState, THREE.Color> = {
  [VoxelState.Dead]: new THREE.Color(VOXEL_COLORS[VoxelState.Dead]),
  [VoxelState.Alive]: new THREE.Color(VOXEL_COLORS[VoxelState.Alive]),
  [VoxelState.Energized]: new THREE.Color(VOXEL_COLORS[VoxelState.Energized]),
  [VoxelState.Crystallized]: new THREE.Color(VOXEL_COLORS[VoxelState.Crystallized]),
  [VoxelState.Corrupted]: new THREE.Color(VOXEL_COLORS[VoxelState.Corrupted]),
};

/**
 * Face direction for greedy meshing (unused but kept for future reference)
 */
// enum _FaceDirection {
//   PosX = 0,
//   NegX = 1,
//   PosY = 2,
//   NegY = 3,
//   PosZ = 4,
//   NegZ = 5,
// }

/**
 * Basic voxel renderer using Three.js
 * Uses greedy meshing for optimized rendering
 */
export class VoxelRenderer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private meshes: Map<VoxelState, THREE.Mesh>;
  private voxelSize: number;
  private useGreedyMeshing: boolean = true;
  private useFrustumCulling: boolean = true;
  private frustum: THREE.Frustum;
  private cameraMatrix: THREE.Matrix4;

  // Lightweight point-based rendering for smooth updates
  private pointsMesh: THREE.Points | null = null;
  private pointsGeometry: THREE.BufferGeometry | null = null;
  private pointsPositions: Float32Array | null = null;
  private pointsColors: Float32Array | null = null;
  private pointsSizes: Float32Array | null = null;
  private useLightweightMode: boolean = false;

  constructor(canvas: HTMLCanvasElement, voxelSize = 1) {
    this.voxelSize = voxelSize;

    // Create scene with galaxy background
    this.scene = new THREE.Scene();
    this.scene.background = createGalaxyBackground();
    this.scene.fog = new THREE.Fog(0x0b1020, 80, 250);  // Subtle fog for depth

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

    // Initialize meshes
    this.meshes = new Map();

    // Initialize frustum culling
    this.frustum = new THREE.Frustum();
    this.cameraMatrix = new THREE.Matrix4();

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());
  }

  /**
   * Setup scene lighting
   */
  private setupLighting(): void {
    // Warm ambient light for pleasant atmosphere
    const ambientLight = new THREE.AmbientLight(0xddeeff, 0.5);
    this.scene.add(ambientLight);

    // Main directional light (slightly warm white)
    const directionalLight = new THREE.DirectionalLight(0xffffee, 0.9);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    // Subtle blue accent light from below for depth
    const accentLight = new THREE.PointLight(0x4a90e2, 0.2, 150);
    accentLight.position.set(0, -20, 0);
    this.scene.add(accentLight);

    // Warm rim light for definition
    const rimLight = new THREE.DirectionalLight(0xffaa88, 0.15);
    rimLight.position.set(-50, 20, -50);
    this.scene.add(rimLight);
  }

  /**
   * Enable/disable lightweight rendering mode (points instead of meshes)
   */
  public setLightweightMode(enabled: boolean): void {
    this.useLightweightMode = enabled;
    if (!enabled) {
      // Clean up points mesh when switching back to full rendering
      if (this.pointsMesh) {
        this.scene.remove(this.pointsMesh);
        this.pointsMesh = null;
      }
      if (this.pointsGeometry) {
        this.pointsGeometry.dispose();
        this.pointsGeometry = null;
      }
    }
  }

  /**
   * Render voxel grid using greedy meshing
   */
  public renderGrid(grid: VoxelGrid): void {
    if (this.useLightweightMode) {
      this.renderGridLightweight(grid);
    } else {
      // Clear previous meshes
      this.clearMeshes();

      if (this.useGreedyMeshing) {
        this.renderGridGreedy(grid);
      } else {
        this.renderGridInstanced(grid);
      }
    }
  }

  /**
   * Ultra-fast lightweight rendering using points (for smooth updates)
   */
  private renderGridLightweight(grid: VoxelGrid): void {
    const { width, height, depth } = grid;
    const offsetX = (width * this.voxelSize) / 2;
    const offsetY = (height * this.voxelSize) / 2;
    const offsetZ = (depth * this.voxelSize) / 2;

    // Count alive voxels
    let voxelCount = 0;
    const data = grid.getData();
    for (let i = 0; i < data.length; i++) {
      if (data[i] !== VoxelState.Dead) voxelCount++;
    }

    // Pre-allocate or reuse arrays
    if (!this.pointsPositions || this.pointsPositions.length < voxelCount * 3) {
      this.pointsPositions = new Float32Array(Math.max(voxelCount * 3, 1000 * 3));
      this.pointsColors = new Float32Array(Math.max(voxelCount * 3, 1000 * 3));
      this.pointsSizes = new Float32Array(Math.max(voxelCount, 1000));
    }

    const positions = this.pointsPositions!;
    const colors = this.pointsColors!;
    const sizes = this.pointsSizes!;

    // Fill arrays with voxel data
    let index = 0;
    const wh = width * height;
    for (let z = 0; z < depth; z++) {
      const zOff = z * wh;
      for (let y = 0; y < height; y++) {
        const yzOff = zOff + y * width;
        for (let x = 0; x < width; x++) {
          const state = data[yzOff + x] as VoxelState;
          if (state === VoxelState.Dead) continue;

          const worldX = x * this.voxelSize - offsetX;
          const worldY = y * this.voxelSize - offsetY;
          const worldZ = z * this.voxelSize - offsetZ;

          positions[index * 3] = worldX;
          positions[index * 3 + 1] = worldY;
          positions[index * 3 + 2] = worldZ;

          const color = CACHED_COLORS[state];
          colors[index * 3] = color.r;
          colors[index * 3 + 1] = color.g;
          colors[index * 3 + 2] = color.b;

          sizes[index] = this.voxelSize * 8;

          index++;
        }
      }
    }

    // Update or create geometry
    if (!this.pointsGeometry) {
      this.pointsGeometry = new THREE.BufferGeometry();
      const material = new THREE.PointsMaterial({
        size: this.voxelSize * 8,
        vertexColors: true,
        sizeAttenuation: true,
        transparent: false,
        depthWrite: true,
      });

      this.pointsMesh = new THREE.Points(this.pointsGeometry, material);
      this.scene.add(this.pointsMesh);
    }

    // Set attributes with draws count
    this.pointsGeometry.setAttribute('position', new THREE.BufferAttribute(positions.subarray(0, index * 3), 3));
    this.pointsGeometry.setAttribute('color', new THREE.BufferAttribute(colors.subarray(0, index * 3), 3));
    this.pointsGeometry.setAttribute('size', new THREE.BufferAttribute(sizes.subarray(0, index), 1));

    // We need to tell Three.js that the attributes changed and should be re-uploaded to GPU
    this.pointsGeometry.attributes.position!.needsUpdate = true;
    this.pointsGeometry.attributes.color!.needsUpdate = true;
    this.pointsGeometry.attributes.size!.needsUpdate = true;

    // Set draw range to only render current voxels
    this.pointsGeometry.setDrawRange(0, index);
  }

  /**
   * Render using greedy meshing algorithm
   */
  private renderGridGreedy(grid: VoxelGrid): void {
    const { width, height, depth } = grid;
    const offsetX = (width * this.voxelSize) / 2;
    const offsetY = (height * this.voxelSize) / 2;
    const offsetZ = (depth * this.voxelSize) / 2;

    // Generate meshes for each voxel state
    for (let state = VoxelState.Alive; state <= VoxelState.Corrupted; state++) {
      const geometry = new THREE.BufferGeometry();
      const positions: number[] = [];
      const normals: number[] = [];
      const indices: number[] = [];
      const colors: number[] = [];

      // Process each axis direction for greedy meshing
      for (let d = 0; d < 3; d++) {
        const u = (d + 1) % 3;
        const v = (d + 2) % 3;
        const dims = [width, height, depth];

        const x = [0, 0, 0];
        const q = [0, 0, 0];
        q[d] = 1;

        const mask: (VoxelState | null)[] = new Array(dims[u]! * dims[v]!);

        // Sweep through each layer
        for (x[d] = -1; x[d]! < dims[d]!;) {
          // Build mask
          let n = 0;
          for (x[v] = 0; x[v]! < dims[v]!; x[v]++) {
            for (x[u] = 0; x[u]! < dims[u]!; x[u]++) {
              const currentVoxel = (x[d]! >= 0) ? grid.get(x[0]!, x[1]!, x[2]!) : VoxelState.Dead;
              const nextVoxel = (x[d]! < dims[d]! - 1) ? grid.get(x[0]! + q[0]!, x[1]! + q[1]!, x[2]! + q[2]!) : VoxelState.Dead;

              // Check if we need a face here
              if (currentVoxel === state && nextVoxel !== state) {
                mask[n++] = currentVoxel;
              } else if (nextVoxel === state && currentVoxel !== state) {
                mask[n++] = nextVoxel;
              } else {
                mask[n++] = null;
              }
            }
          }

          x[d]!++;

          // Generate mesh from mask using greedy meshing
          n = 0;
          for (let j = 0; j < dims[v]!; j++) {
            for (let i = 0; i < dims[u]!;) {
              if (mask[n] !== null) {
                // Compute width
                let w = 1;
                while (i + w < dims[u]! && mask[n + w] === mask[n]) {
                  w++;
                }

                // Compute height
                let h = 1;
                let done = false;
                while (j + h < dims[v]!) {
                  for (let k = 0; k < w; k++) {
                    if (mask[n + k + h * dims[u]!] !== mask[n]) {
                      done = true;
                      break;
                    }
                  }
                  if (done) break;
                  h++;
                }

                // Add quad
                x[u] = i;
                x[v] = j;

                const du = [0, 0, 0];
                du[u] = w;
                const dv = [0, 0, 0];
                dv[v] = h;

                this.addQuad(
                  positions,
                  normals,
                  indices,
                  colors,
                  x,
                  du,
                  dv,
                  q,
                  offsetX,
                  offsetY,
                  offsetZ,
                  state
                );

                // Clear mask
                for (let l = 0; l < h; l++) {
                  for (let k = 0; k < w; k++) {
                    mask[n + k + l * dims[u]!] = null;
                  }
                }

                i += w;
                n += w;
              } else {
                i++;
                n++;
              }
            }
          }
        }
      }

      // Create mesh if we have geometry
      if (positions.length > 0) {
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setIndex(indices);
        geometry.computeBoundingSphere();

        const material = new THREE.MeshStandardMaterial({
          color: VOXEL_COLORS[state],
          emissive: VOXEL_COLORS[state],
          emissiveIntensity: EMISSIVE_INTENSITY[state],
          metalness: 0.3,
          roughness: 0.7,
          vertexColors: false,
        });

        const mesh = new THREE.Mesh(geometry, material);
        this.meshes.set(state, mesh);
        this.scene.add(mesh);
      }
    }
  }

  /**
   * Add a quad to the mesh
   */
  private addQuad(
    positions: number[],
    normals: number[],
    indices: number[],
    colors: number[],
    x: number[],
    du: number[],
    dv: number[],
    q: number[],
    offsetX: number,
    offsetY: number,
    offsetZ: number,
    state: VoxelState
  ): void {
    const vertexCount = positions.length / 3;
    const s = this.voxelSize;

    // Calculate vertices
    const v1 = [
      (x[0]! * s) - offsetX,
      (x[1]! * s) - offsetY,
      (x[2]! * s) - offsetZ,
    ];
    const v2 = [
      ((x[0]! + du[0]!) * s) - offsetX,
      ((x[1]! + du[1]!) * s) - offsetY,
      ((x[2]! + du[2]!) * s) - offsetZ,
    ];
    const v3 = [
      ((x[0]! + du[0]! + dv[0]!) * s) - offsetX,
      ((x[1]! + du[1]! + dv[1]!) * s) - offsetY,
      ((x[2]! + du[2]! + dv[2]!) * s) - offsetZ,
    ];
    const v4 = [
      ((x[0]! + dv[0]!) * s) - offsetX,
      ((x[1]! + dv[1]!) * s) - offsetY,
      ((x[2]! + dv[2]!) * s) - offsetZ,
    ];

    // Add positions
    positions.push(...v1, ...v2, ...v3, ...v4);

    // Calculate normal
    const normal = [q[0]!, q[1]!, q[2]!];
    for (let i = 0; i < 4; i++) {
      normals.push(...normal);
    }

    // Add indices (two triangles per quad)
    indices.push(
      vertexCount, vertexCount + 1, vertexCount + 2,
      vertexCount, vertexCount + 2, vertexCount + 3
    );

    // Add colors
    const color = new THREE.Color(VOXEL_COLORS[state]);
    for (let i = 0; i < 4; i++) {
      colors.push(color.r, color.g, color.b);
    }
  }

  /**
   * Fallback: Render using instanced rendering (for comparison)
   */
  private renderGridInstanced(grid: VoxelGrid): void {
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
      this.meshes.set(state, mesh as any); // Store as regular mesh
      this.scene.add(mesh);

      // Set instance transforms
      let index = 0;
      const matrix = new THREE.Matrix4();
      const offsetX = (grid.width * this.voxelSize) / 2;
      const offsetY = (grid.height * this.voxelSize) / 2;
      const offsetZ = (grid.depth * this.voxelSize) / 2;

      grid.forEach((x, y, z, voxelState) => {
        if (voxelState !== state) return;

        matrix.setPosition(
          x * this.voxelSize - offsetX,
          y * this.voxelSize - offsetY,
          z * this.voxelSize - offsetZ
        );

        mesh.setMatrixAt(index++, matrix);
      });

      mesh.instanceMatrix.needsUpdate = true;
    }
  }

  /**
   * Clear all meshes
   */
  private clearMeshes(): void {
    for (const mesh of this.meshes.values()) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(m => m.dispose());
      } else {
        mesh.material.dispose();
      }
    }
    this.meshes.clear();
  }

  /**
   * Toggle greedy meshing on/off
   */
  public toggleGreedyMeshing(): void {
    this.useGreedyMeshing = !this.useGreedyMeshing;
    console.log(`Greedy Meshing: ${this.useGreedyMeshing ? 'ON' : 'OFF'}`);
  }

  /**
   * Get greedy meshing status
   */
  public isUsingGreedyMeshing(): boolean {
    return this.useGreedyMeshing;
  }

  /**
   * Toggle frustum culling on/off
   */
  public toggleFrustumCulling(): void {
    this.useFrustumCulling = !this.useFrustumCulling;
    console.log(`Frustum Culling: ${this.useFrustumCulling ? 'ON' : 'OFF'}`);
  }

  /**
   * Get frustum culling status
   */
  public isUsingFrustumCulling(): boolean {
    return this.useFrustumCulling;
  }

  /**
   * Render the scene
   */
  public render(): void {
    // Update frustum for culling
    if (this.useFrustumCulling) {
      this.camera.updateMatrixWorld();
      this.cameraMatrix.multiplyMatrices(
        this.camera.projectionMatrix,
        this.camera.matrixWorldInverse
      );
      this.frustum.setFromProjectionMatrix(this.cameraMatrix);

      // Apply frustum culling to meshes
      for (const mesh of this.meshes.values()) {
        if (mesh.geometry.boundingSphere) {
          mesh.visible = this.frustum.intersectsSphere(mesh.geometry.boundingSphere);
        }
      }
    } else {
      // Make all meshes visible
      for (const mesh of this.meshes.values()) {
        mesh.visible = true;
      }
    }

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
    this.clearMeshes();
    this.renderer.dispose();
    window.removeEventListener('resize', () => this.onWindowResize());
  }

  /**
   * Get renderer for external use
   */
  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }
}
