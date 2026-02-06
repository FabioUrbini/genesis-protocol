import { CASimulator } from '../core/CASimulator';
import { VoxelState } from '../core/VoxelState';
import { VoxelRenderer } from '../rendering/VoxelRenderer';
import { Player } from './Player';
import { Vector3 } from 'three';

/**
 * Main game class - orchestrates CA simulation and rendering
 */
export class Game {
  private simulator: CASimulator;
  private renderer: VoxelRenderer;
  private player: Player;
  private isRunning: boolean;
  private lastCAUpdateTime: number;
  private lastFrameTime: number;
  private caUpdateInterval: number; // milliseconds between CA updates
  private fps: number;
  private frameCount: number;
  private fpsUpdateTime: number;

  constructor(canvas: HTMLCanvasElement, gridSize = 32, caUpdateInterval = 2000) {
    // Initialize CA simulator
    this.simulator = new CASimulator(gridSize, gridSize, gridSize);
    
    // Initialize renderer
    this.renderer = new VoxelRenderer(canvas, 1);
    
    // Initialize with a test pattern
    this.initializeTestPattern();

    // Initialize player at spawn position (above the center of the world)
    const spawnPosition = new Vector3(
      gridSize / 2,
      gridSize / 2 + 5,
      gridSize / 2
    );
    this.player = new Player(
      this.renderer.getScene(),
      this.renderer.getCamera(),
      this.simulator.getGrid(),
      spawnPosition
    );

    // Game state
    this.isRunning = false;
    this.lastCAUpdateTime = 0;
    this.lastFrameTime = 0;
    this.caUpdateInterval = caUpdateInterval;
    this.fps = 0;
    this.frameCount = 0;
    this.fpsUpdateTime = 0;
  }

  /**
   * Initialize with a test pattern for demonstration
   */
  private initializeTestPattern(): void {
    const gridSize = this.simulator.getGrid().width;
    const center = Math.floor(gridSize / 2);

    // Create a 3D glider-like pattern in the center
    this.simulator.fillPattern((x, y, z) => {
      // Create a dense cluster in the center
      const dx = x - center;
      const dy = y - center;
      const dz = z - center;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (distance < 3) {
        return VoxelState.Alive;
      }
      
      // Add some random alive voxels for interesting evolution
      if (distance < 8 && Math.random() < 0.15) {
        return VoxelState.Alive;
      }

      // Add a few energized voxels
      if (distance < 5 && Math.random() < 0.05) {
        return VoxelState.Energized;
      }

      return VoxelState.Dead;
    });
  }

  /**
   * Start the game loop
   */
  public start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastCAUpdateTime = performance.now();
    this.lastFrameTime = performance.now();
    this.fpsUpdateTime = performance.now();
    
    this.gameLoop();
  }

  /**
   * Stop the game loop
   */
  public stop(): void {
    this.isRunning = false;
  }

  /**
   * Main game loop
   */
  private gameLoop(): void {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastFrameTime) / 1000; // Convert to seconds
    this.lastFrameTime = currentTime;

    // Update FPS counter
    this.frameCount++;
    if (currentTime - this.fpsUpdateTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsUpdateTime = currentTime;
      this.updateUI();
    }

    // Update CA simulation at fixed interval
    if (currentTime - this.lastCAUpdateTime >= this.caUpdateInterval) {
      this.simulator.step();
      this.lastCAUpdateTime = currentTime;
      
      // Re-render grid after CA update
      this.renderer.renderGrid(this.simulator.getGrid());
      
      this.updateUI();
    }

    // Update player (physics, input, camera)
    this.player.update(deltaTime);

    // Check if player died and respawn
    if (!this.player.isAlive()) {
      this.player.respawn();
    }

    // Render scene
    this.renderer.render();

    // Continue loop
    requestAnimationFrame(() => this.gameLoop());
  }

  /**
   * Update UI elements
   */
  private updateUI(): void {
    // Update FPS
    const fpsElement = document.getElementById('fps');
    if (fpsElement) {
      fpsElement.textContent = this.fps.toString();
    }

    // Update CA tick
    const tickElement = document.getElementById('tick');
    if (tickElement) {
      tickElement.textContent = this.simulator.getTick().toString();
    }

    // Update player position
    const posElement = document.getElementById('position');
    if (posElement) {
      const pos = this.player.getPosition();
      posElement.textContent = `${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}`;
    }

    // Update player energy
    const energyElement = document.getElementById('energy');
    if (energyElement) {
      const state = this.player.getState();
      energyElement.textContent = state.energy.toFixed(0);
    }

    // Update player oxygen
    const oxygenElement = document.getElementById('oxygen');
    if (oxygenElement) {
      const state = this.player.getState();
      oxygenElement.textContent = state.oxygen.toFixed(0);
    }
  }

  /**
   * Set CA update interval (milliseconds)
   */
  public setCAUpdateInterval(interval: number): void {
    this.caUpdateInterval = Math.max(100, interval); // Minimum 100ms
  }

  /**
   * Get CA simulator
   */
  public getSimulator(): CASimulator {
    return this.simulator;
  }

  /**
   * Get renderer
   */
  public getRenderer(): VoxelRenderer {
    return this.renderer;
  }

  /**
   * Get player
   */
  public getPlayer(): Player {
    return this.player;
  }

  /**
   * Reset simulation
   */
  public reset(): void {
    this.simulator.reset();
    this.initializeTestPattern();
    this.renderer.renderGrid(this.simulator.getGrid());
    this.lastCAUpdateTime = performance.now();
    this.player.respawn();
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    this.stop();
    this.renderer.dispose();
    this.player.dispose();
  }
}
