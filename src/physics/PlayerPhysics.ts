import { Vector3 } from 'three';
import { VoxelGrid } from '../core/VoxelGrid';
import { VoxelState } from '../core/VoxelState';

/**
 * Player physics configuration
 */
export interface PlayerPhysicsConfig {
  gravity: number;
  jumpForce: number;
  moveSpeed: number;
  sprintMultiplier: number;
  friction: number;
  airResistance: number;
  playerHeight: number;
  playerRadius: number;
  energyDepletionRate: number;
  oxygenDepletionRate: number;
  maxEnergy: number;
  maxOxygen: number;
}

/**
 * Default physics configuration
 */
export const DEFAULT_PHYSICS_CONFIG: PlayerPhysicsConfig = {
  gravity: -20.0,
  jumpForce: 8.0,
  moveSpeed: 10.0,  // Faster, smoother movement
  sprintMultiplier: 2.0,  // More pronounced sprint
  friction: 0.95,  // Less friction for smoother gliding
  airResistance: 0.99,  // Less air resistance for floaty feel
  playerHeight: 1.8,
  playerRadius: 0.3,
  energyDepletionRate: 1.0, // per second
  oxygenDepletionRate: 0.5, // per second
  maxEnergy: 100.0,
  maxOxygen: 100.0,
};

/**
 * Player state
 */
export interface PlayerState {
  position: Vector3;
  velocity: Vector3;
  energy: number;
  oxygen: number;
  isGrounded: boolean;
  isAlive: boolean;
  isSprinting: boolean;
}

/**
 * AABB (Axis-Aligned Bounding Box) for collision detection
 */
interface AABB {
  min: Vector3;
  max: Vector3;
}

/**
 * PlayerPhysics handles player movement, collision detection, and survival mechanics
 */
export class PlayerPhysics {
  private config: PlayerPhysicsConfig;
  private state: PlayerState;
  private voxelGrid: VoxelGrid;
  private spawnPosition: Vector3;
  // Grid offset for converting world coordinates to grid coordinates
  // World is centered at (0,0,0) but grid data is at (0 to gridSize-1)
  private gridOffset: Vector3;
  // God mode - no energy/oxygen drain
  private godMode: boolean = false;

  constructor(voxelGrid: VoxelGrid, spawnPosition: Vector3, config: Partial<PlayerPhysicsConfig> = {}) {
    this.config = { ...DEFAULT_PHYSICS_CONFIG, ...config };
    this.voxelGrid = voxelGrid;
    this.spawnPosition = spawnPosition.clone();
    // Calculate grid offset (half of grid size in each dimension)
    this.gridOffset = new Vector3(
      voxelGrid.width / 2,
      voxelGrid.height / 2,
      voxelGrid.depth / 2
    );

    // Initialize player state
    this.state = {
      position: spawnPosition.clone(),
      velocity: new Vector3(0, 0, 0),
      energy: this.config.maxEnergy,
      oxygen: this.config.maxOxygen,
      isGrounded: false,
      isAlive: true,
      isSprinting: false,
    };
  }

  /**
   * Update physics simulation
   */
  public update(deltaTime: number, moveInput: Vector3, jump: boolean, sprint: boolean): void {
    if (!this.state.isAlive) {
      return;
    }

    // Update sprint state
    this.state.isSprinting = sprint && this.state.energy > 0;

    // Apply movement input
    this.applyMovement(moveInput, deltaTime);

    // Apply jump
    if (jump && this.state.isGrounded) {
      this.state.velocity.y = this.config.jumpForce;
      this.state.isGrounded = false;
    }

    // Apply gravity
    this.state.velocity.y += this.config.gravity * deltaTime;

    // Apply friction/air resistance
    const resistance = this.state.isGrounded ? this.config.friction : this.config.airResistance;
    this.state.velocity.x *= resistance;
    this.state.velocity.z *= resistance;

    // Update position with collision detection
    this.updatePositionWithCollision(deltaTime);

    // Update survival mechanics
    this.updateSurvivalMechanics(deltaTime);

    // Check for death
    if (this.state.energy <= 0 || this.state.oxygen <= 0) {
      this.die();
    }
  }

  /**
   * Apply movement input to velocity
   */
  private applyMovement(moveInput: Vector3, deltaTime: number): void {
    if (moveInput.lengthSq() === 0) {
      return;
    }

    const speed = this.config.moveSpeed * (this.state.isSprinting ? this.config.sprintMultiplier : 1.0);
    const acceleration = moveInput.normalize().multiplyScalar(speed);

    this.state.velocity.x += acceleration.x * deltaTime;
    this.state.velocity.z += acceleration.z * deltaTime;

    // Clamp horizontal velocity
    const horizontalSpeed = Math.sqrt(this.state.velocity.x ** 2 + this.state.velocity.z ** 2);
    const maxSpeed = speed * 2;
    if (horizontalSpeed > maxSpeed) {
      const scale = maxSpeed / horizontalSpeed;
      this.state.velocity.x *= scale;
      this.state.velocity.z *= scale;
    }
  }

  /**
   * Update position with voxel-based collision detection
   */
  private updatePositionWithCollision(deltaTime: number): void {
    const displacement = this.state.velocity.clone().multiplyScalar(deltaTime);

    // Test each axis separately for better collision response
    this.state.isGrounded = false;

    // X-axis
    const testPosX = this.state.position.clone();
    testPosX.x += displacement.x;
    if (this.checkCollision(testPosX)) {
      this.state.velocity.x = 0;
    } else {
      this.state.position.x = testPosX.x;
    }

    // Y-axis
    const testPosY = this.state.position.clone();
    testPosY.y += displacement.y;
    if (this.checkCollision(testPosY)) {
      if (this.state.velocity.y < 0) {
        this.state.isGrounded = true;
      }
      this.state.velocity.y = 0;
    } else {
      this.state.position.y = testPosY.y;
    }

    // Z-axis
    const testPosZ = this.state.position.clone();
    testPosZ.z += displacement.z;
    if (this.checkCollision(testPosZ)) {
      this.state.velocity.z = 0;
    } else {
      this.state.position.z = testPosZ.z;
    }
  }

  /**
   * Convert world position to grid position
   */
  private worldToGrid(worldPos: Vector3): Vector3 {
    return new Vector3(
      worldPos.x + this.gridOffset.x,
      worldPos.y + this.gridOffset.y,
      worldPos.z + this.gridOffset.z
    );
  }

  /**
   * Check collision with voxel world using AABB
   */
  private checkCollision(position: Vector3): boolean {
    const aabb = this.getPlayerAABB(position);

    // Convert AABB to grid coordinates
    const gridMin = this.worldToGrid(aabb.min);
    const gridMax = this.worldToGrid(aabb.max);

    // Check all voxels that could intersect with player AABB
    const minX = Math.floor(gridMin.x);
    const minY = Math.floor(gridMin.y);
    const minZ = Math.floor(gridMin.z);
    const maxX = Math.ceil(gridMax.x);
    const maxY = Math.ceil(gridMax.y);
    const maxZ = Math.ceil(gridMax.z);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          const state = this.voxelGrid.get(x, y, z);
          if (this.isVoxelSolid(state)) {
            // Check AABB intersection (convert grid voxel back to world coords for comparison)
            const worldVoxelX = x - this.gridOffset.x;
            const worldVoxelY = y - this.gridOffset.y;
            const worldVoxelZ = z - this.gridOffset.z;
            if (this.aabbIntersectsVoxel(aabb, worldVoxelX, worldVoxelY, worldVoxelZ)) {
              return true;
            }
          }
        }
      }
    }

    return false;
  }

  /**
   * Get player AABB at given position
   */
  private getPlayerAABB(position: Vector3): AABB {
    const radius = this.config.playerRadius;
    const height = this.config.playerHeight;

    return {
      min: new Vector3(
        position.x - radius,
        position.y,
        position.z - radius
      ),
      max: new Vector3(
        position.x + radius,
        position.y + height,
        position.z + radius
      ),
    };
  }

  /**
   * Check if AABB intersects with voxel at given position
   */
  private aabbIntersectsVoxel(aabb: AABB, voxelX: number, voxelY: number, voxelZ: number): boolean {
    return (
      aabb.min.x < voxelX + 1 &&
      aabb.max.x > voxelX &&
      aabb.min.y < voxelY + 1 &&
      aabb.max.y > voxelY &&
      aabb.min.z < voxelZ + 1 &&
      aabb.max.z > voxelZ
    );
  }

  /**
   * Check if voxel state is solid (blocks movement)
   */
  private isVoxelSolid(state: VoxelState): boolean {
    return state !== VoxelState.Dead;
  }

  /**
   * Update survival mechanics (energy/oxygen depletion)
   */
  private updateSurvivalMechanics(deltaTime: number): void {
    // Skip depletion in god mode, but keep energy/oxygen at max
    if (this.godMode) {
      this.state.energy = this.config.maxEnergy;
      this.state.oxygen = this.config.maxOxygen;
      return;
    }

    // Energy depletion (faster when sprinting)
    const energyDepletion = this.config.energyDepletionRate * deltaTime * (this.state.isSprinting ? 2.0 : 1.0);
    this.state.energy = Math.max(0, this.state.energy - energyDepletion);

    // Oxygen depletion
    const oxygenDepletion = this.config.oxygenDepletionRate * deltaTime;
    this.state.oxygen = Math.max(0, this.state.oxygen - oxygenDepletion);

    // Regenerate in safe zones (Still Life patterns)
    if (this.isInSafeZone()) {
      this.state.energy = Math.min(this.config.maxEnergy, this.state.energy + 5.0 * deltaTime);
      this.state.oxygen = Math.min(this.config.maxOxygen, this.state.oxygen + 10.0 * deltaTime);
    }
  }

  /**
   * Check if player is in a safe zone (near Still Life patterns)
   */
  private isInSafeZone(): boolean {
    // Check for crystallized voxels nearby (safe zones)
    // Convert world position to grid position
    const gridPos = this.worldToGrid(this.state.position);
    const checkRadius = 3;
    const px = Math.floor(gridPos.x);
    const py = Math.floor(gridPos.y);
    const pz = Math.floor(gridPos.z);

    for (let x = px - checkRadius; x <= px + checkRadius; x++) {
      for (let y = py - checkRadius; y <= py + checkRadius; y++) {
        for (let z = pz - checkRadius; z <= pz + checkRadius; z++) {
          if (this.voxelGrid.get(x, y, z) === VoxelState.Crystallized) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Handle player death
   */
  private die(): void {
    this.state.isAlive = false;
    console.warn('Player died!');
  }

  /**
   * Respawn player at spawn position
   */
  public respawn(): void {
    this.state.position.copy(this.spawnPosition);
    this.state.velocity.set(0, 0, 0);
    this.state.energy = this.config.maxEnergy;
    this.state.oxygen = this.config.maxOxygen;
    this.state.isAlive = true;
    this.state.isGrounded = false;
    console.warn('Player respawned');
  }

  /**
   * Get current player state (read-only)
   */
  public getState(): Readonly<PlayerState> {
    return this.state;
  }

  /**
   * Get player position
   */
  public getPosition(): Vector3 {
    return this.state.position.clone();
  }

  /**
   * Set player position (for teleportation, etc.)
   */
  public setPosition(position: Vector3): void {
    this.state.position.copy(position);
    this.state.velocity.set(0, 0, 0);
  }

  /**
   * Add energy to player
   */
  public addEnergy(amount: number): void {
    this.state.energy = Math.min(this.config.maxEnergy, this.state.energy + amount);
  }

  /**
   * Add oxygen to player
   */
  public addOxygen(amount: number): void {
    this.state.oxygen = Math.min(this.config.maxOxygen, this.state.oxygen + amount);
  }

  /**
   * Check if player is alive
   */
  public isAlive(): boolean {
    return this.state.isAlive;
  }

  /**
   * Set god mode (no energy/oxygen drain)
   */
  public setGodMode(enabled: boolean): void {
    this.godMode = enabled;
    if (enabled) {
      // Fill energy and oxygen when entering god mode
      this.state.energy = this.config.maxEnergy;
      this.state.oxygen = this.config.maxOxygen;
    }
  }

  /**
   * Check if god mode is active
   */
  public isGodMode(): boolean {
    return this.godMode;
  }

  /**
   * Update voxel grid reference (e.g., after grid expansion)
   */
  public updateGrid(grid: VoxelGrid): void {
    this.voxelGrid = grid;
    this.gridOffset.set(
      grid.width / 2,
      grid.height / 2,
      grid.depth / 2
    );
  }

  /**
   * Get voxel grid for raycasting
   */
  public getVoxelGrid(): VoxelGrid {
    return this.voxelGrid;
  }
}
