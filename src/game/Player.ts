import { Vector3, Mesh, BoxGeometry, MeshStandardMaterial, Scene, PerspectiveCamera, Euler } from 'three';
import { PlayerPhysics, PlayerPhysicsConfig } from '../physics/PlayerPhysics';
import { VoxelGrid } from '../core/VoxelGrid';

/**
 * Input state for player controls
 */
export interface PlayerInput {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  sprint: boolean;
  up: boolean;      // For fly mode (Space)
  down: boolean;    // For fly mode (Ctrl)
  mouseMovementX: number;
  mouseMovementY: number;
}

/**
 * Player configuration
 */
export interface PlayerConfig {
  mouseSensitivity: number;
  maxPitch: number;
  showPlayerMesh: boolean;
  flySpeed: number;
  flySprintMultiplier: number;
  physicsConfig?: Partial<PlayerPhysicsConfig>;
}

/**
 * Default player configuration
 */
export const DEFAULT_PLAYER_CONFIG: PlayerConfig = {
  mouseSensitivity: 0.002,
  maxPitch: Math.PI / 2 - 0.1,
  showPlayerMesh: false, // Hide in first-person
  flySpeed: 15.0,
  flySprintMultiplier: 3.0,
};

/**
 * Player entity with physics, controls, and visual representation
 */
export class Player {
  private physics: PlayerPhysics;
  private camera: PerspectiveCamera;
  private mesh: Mesh | null = null;
  private scene: Scene;
  private config: PlayerConfig;
  
  // Camera rotation
  private yaw: number = 0;
  private pitch: number = 0;
  
  // Input state
  private input: PlayerInput = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    sprint: false,
    up: false,
    down: false,
    mouseMovementX: 0,
    mouseMovementY: 0,
  };

  // Fly mode state
  private flyMode: boolean = false;
  private godMode: boolean = false;
  private flyPosition: Vector3 = new Vector3();

  // Pointer lock state
  private isPointerLocked: boolean = false;

  constructor(
    scene: Scene,
    camera: PerspectiveCamera,
    voxelGrid: VoxelGrid,
    spawnPosition: Vector3,
    config: Partial<PlayerConfig> = {}
  ) {
    this.scene = scene;
    this.camera = camera;
    this.config = { ...DEFAULT_PLAYER_CONFIG, ...config };
    
    // Initialize physics
    this.physics = new PlayerPhysics(voxelGrid, spawnPosition, config.physicsConfig);
    
    // Create player mesh (for third-person view or debugging)
    if (this.config.showPlayerMesh) {
      this.createPlayerMesh();
    }
    
    // Set initial camera position
    this.updateCameraPosition();
    
    // Setup input handlers
    this.setupInputHandlers();
  }

  /**
   * Create visual representation of player
   */
  private createPlayerMesh(): void {
    const geometry = new BoxGeometry(0.6, 1.8, 0.6);
    const material = new MeshStandardMaterial({
      color: 0x00ff00,
      metalness: 0.3,
      roughness: 0.7,
    });
    
    this.mesh = new Mesh(geometry, material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.scene.add(this.mesh);
  }

  /**
   * Setup keyboard and mouse input handlers
   */
  private setupInputHandlers(): void {
    // Keyboard input
    document.addEventListener('keydown', this.onKeyDown.bind(this));
    document.addEventListener('keyup', this.onKeyUp.bind(this));
    
    // Mouse input (pointer lock)
    document.addEventListener('click', this.requestPointerLock.bind(this));
    document.addEventListener('pointerlockchange', this.onPointerLockChange.bind(this));
    document.addEventListener('mousemove', this.onMouseMove.bind(this));
  }

  /**
   * Handle keydown events
   */
  private onKeyDown(event: KeyboardEvent): void {
    switch (event.code) {
      case 'KeyW':
        this.input.forward = true;
        break;
      case 'KeyS':
        this.input.backward = true;
        break;
      case 'KeyA':
        this.input.left = true;
        break;
      case 'KeyD':
        this.input.right = true;
        break;
      case 'Space':
        this.input.jump = true;
        this.input.up = true;
        event.preventDefault();
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.input.sprint = true;
        break;
      case 'ControlLeft':
      case 'ControlRight':
        this.input.down = true;
        break;
      case 'KeyF':
        this.toggleFlyMode();
        break;
      case 'KeyG':
        this.toggleGodMode();
        break;
    }
  }

  /**
   * Handle keyup events
   */
  private onKeyUp(event: KeyboardEvent): void {
    switch (event.code) {
      case 'KeyW':
        this.input.forward = false;
        break;
      case 'KeyS':
        this.input.backward = false;
        break;
      case 'KeyA':
        this.input.left = false;
        break;
      case 'KeyD':
        this.input.right = false;
        break;
      case 'Space':
        this.input.jump = false;
        this.input.up = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.input.sprint = false;
        break;
      case 'ControlLeft':
      case 'ControlRight':
        this.input.down = false;
        break;
    }
  }

  /**
   * Request pointer lock for mouse control
   */
  private requestPointerLock(): void {
    if (!this.isPointerLocked) {
      document.body.requestPointerLock();
    }
  }

  /**
   * Handle pointer lock change
   */
  private onPointerLockChange(): void {
    this.isPointerLocked = document.pointerLockElement === document.body;
  }

  /**
   * Handle mouse movement
   */
  private onMouseMove(event: MouseEvent): void {
    if (!this.isPointerLocked) {
      return;
    }

    this.input.mouseMovementX = event.movementX;
    this.input.mouseMovementY = event.movementY;
  }

  /**
   * Toggle fly mode (noclip)
   */
  private toggleFlyMode(): void {
    this.flyMode = !this.flyMode;
    if (this.flyMode) {
      // Enter fly mode - save current position
      this.flyPosition.copy(this.physics.getPosition());
      this.flyPosition.y += 1.6; // Eye height
      console.warn('Fly mode: ON (Press F to toggle)');
    } else {
      // Exit fly mode - restore to physics
      this.physics.setPosition(this.flyPosition.clone().setY(this.flyPosition.y - 1.6));
      console.warn('Fly mode: OFF');
    }
  }

  /**
   * Toggle god mode (no energy/oxygen drain)
   */
  private toggleGodMode(): void {
    this.godMode = !this.godMode;
    this.physics.setGodMode(this.godMode);
    console.warn(`God mode: ${this.godMode ? 'ON' : 'OFF'}`);
  }

  /**
   * Update player state
   */
  public update(deltaTime: number): void {
    // Update camera rotation from mouse input
    this.updateCameraRotation();
    
    if (this.flyMode) {
      // Fly mode - free camera movement, no collision
      this.updateFlyMode(deltaTime);
    } else {
      // Normal mode - physics-based movement
      // Calculate movement direction based on camera orientation
      const moveInput = this.calculateMoveInput();
      
      // Update physics
      this.physics.update(deltaTime, moveInput, this.input.jump, this.input.sprint);
      
      // Update camera position
      this.updateCameraPosition();
      
      // Update player mesh position (if visible)
      if (this.mesh) {
        const position = this.physics.getPosition();
        this.mesh.position.copy(position);
      }
    }
    
    // Reset mouse movement
    this.input.mouseMovementX = 0;
    this.input.mouseMovementY = 0;
  }

  /**
   * Update fly mode movement (noclip)
   */
  private updateFlyMode(deltaTime: number): void {
    const speed = this.config.flySpeed * (this.input.sprint ? this.config.flySprintMultiplier : 1.0);
    
    // Get camera direction vectors
    const forward = new Vector3(0, 0, -1).applyEuler(new Euler(this.pitch, this.yaw, 0, 'YXZ'));
    const right = new Vector3(1, 0, 0).applyEuler(new Euler(0, this.yaw, 0, 'YXZ'));
    const up = new Vector3(0, 1, 0);
    
    // Calculate movement
    const movement = new Vector3();
    
    if (this.input.forward) movement.add(forward);
    if (this.input.backward) movement.sub(forward);
    if (this.input.right) movement.add(right);
    if (this.input.left) movement.sub(right);
    if (this.input.up) movement.add(up);
    if (this.input.down) movement.sub(up);
    
    if (movement.lengthSq() > 0) {
      movement.normalize().multiplyScalar(speed * deltaTime);
      this.flyPosition.add(movement);
    }
    
    // Update camera position directly
    this.camera.position.copy(this.flyPosition);
  }

  /**
   * Update camera rotation from mouse input
   */
  private updateCameraRotation(): void {
    // Update yaw (horizontal rotation)
    this.yaw -= this.input.mouseMovementX * this.config.mouseSensitivity;
    
    // Update pitch (vertical rotation)
    this.pitch -= this.input.mouseMovementY * this.config.mouseSensitivity;
    this.pitch = Math.max(-this.config.maxPitch, Math.min(this.config.maxPitch, this.pitch));
    
    // Apply rotation to camera
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  }

  /**
   * Calculate movement input vector based on camera orientation
   */
  private calculateMoveInput(): Vector3 {
    const moveInput = new Vector3(0, 0, 0);
    
    // Get camera forward and right vectors (ignore Y component for horizontal movement)
    const forward = new Vector3(0, 0, -1).applyEuler(new Euler(0, this.yaw, 0, 'YXZ'));
    const right = new Vector3(1, 0, 0).applyEuler(new Euler(0, this.yaw, 0, 'YXZ'));
    
    // Apply input
    if (this.input.forward) {
      moveInput.add(forward);
    }
    if (this.input.backward) {
      moveInput.sub(forward);
    }
    if (this.input.right) {
      moveInput.add(right);
    }
    if (this.input.left) {
      moveInput.sub(right);
    }
    
    return moveInput;
  }

  /**
   * Update camera position to follow player
   */
  private updateCameraPosition(): void {
    const position = this.physics.getPosition();
    
    // Position camera at player's eye level (slightly below top of head)
    const eyeHeight = 1.6;
    this.camera.position.set(
      position.x,
      position.y + eyeHeight,
      position.z
    );
  }

  /**
   * Get player position
   */
  public getPosition(): Vector3 {
    return this.physics.getPosition();
  }

  /**
   * Get player state
   */
  public getState() {
    return this.physics.getState();
  }

  /**
   * Respawn player
   */
  public respawn(): void {
    this.physics.respawn();
    this.updateCameraPosition();
  }

  /**
   * Set player position
   */
  public setPosition(position: Vector3): void {
    this.physics.setPosition(position);
    this.updateCameraPosition();
  }

  /**
   * Add energy to player
   */
  public addEnergy(amount: number): void {
    this.physics.addEnergy(amount);
  }

  /**
   * Add oxygen to player
   */
  public addOxygen(amount: number): void {
    this.physics.addOxygen(amount);
  }

  /**
   * Check if player is alive
   */
  public isAlive(): boolean {
    // In god mode or fly mode, player is always "alive" for game loop purposes
    if (this.godMode || this.flyMode) return true;
    return this.physics.isAlive();
  }

  /**
   * Check if player is in fly mode
   */
  public isFlyMode(): boolean {
    return this.flyMode;
  }

  /**
   * Check if player is in god mode
   */
  public isGodMode(): boolean {
    return this.godMode;
  }

  /**
   * Get camera reference
   */
  public getCamera(): PerspectiveCamera {
    return this.camera;
  }

  /**
   * Release pointer lock
   */
  public releasePointerLock(): void {
    if (this.isPointerLocked) {
      document.exitPointerLock();
    }
  }

  /**
   * Check if pointer is locked
   */
  public isPointerLockedState(): boolean {
    return this.isPointerLocked;
  }

  /**
   * Cleanup resources
   */
  public dispose(): void {
    // Remove event listeners
    document.removeEventListener('keydown', this.onKeyDown.bind(this));
    document.removeEventListener('keyup', this.onKeyUp.bind(this));
    document.removeEventListener('click', this.requestPointerLock.bind(this));
    document.removeEventListener('pointerlockchange', this.onPointerLockChange.bind(this));
    document.removeEventListener('mousemove', this.onMouseMove.bind(this));
    
    // Remove mesh from scene
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      (this.mesh.material as MeshStandardMaterial).dispose();
    }
    
    // Release pointer lock
    this.releasePointerLock();
  }
}
