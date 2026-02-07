import { CASimulator } from '../core/CASimulator';
import { VoxelState } from '../core/VoxelState';
import { VoxelRenderer } from '../rendering/VoxelRenderer';
import { OrganicRenderer, RenderMode } from '../rendering/OrganicRenderer';
import { PostProcessingManager } from '../rendering/PostProcessing';
import { Player } from './Player';
import { CASimulatorWorker } from '../workers/WorkerPool';
import { TimeManipulation } from './TimeManipulation';
import { Vector3 } from 'three';
import { GameMode, GameModeType, SurvivalMode, ExplorerMode, ArchitectMode, PuzzleMode } from './GameMode';
import { ProgressionSystem } from './ProgressionSystem';
import { AchievementSystem } from './AchievementSystem';
import { PatternCodex } from './PatternCodex';
import { SaveSystem } from './SaveSystem';
import { LeaderboardSystem } from './LeaderboardSystem';

/**
 * Render style for the game
 */
export enum RenderStyle {
  Cubes = 'cubes',
  Organic = 'organic'
}

/**
 * Main game class - orchestrates CA simulation and rendering
 */
export class Game {
  private simulator: CASimulator;
  private workerSimulator: CASimulatorWorker | null = null;
  private useWorkers: boolean = true;
  private cubeRenderer: VoxelRenderer;
  private organicRenderer: OrganicRenderer;
  private postProcessing: PostProcessingManager | null = null;
  public player: Player;
  private isRunning: boolean;
  private lastCAUpdateTime: number;
  private lastFrameTime: number;
  private caUpdateInterval: number; // milliseconds between CA updates
  private fps: number;
  private frameCount: number;
  private fpsUpdateTime: number;
  private renderStyle: RenderStyle = RenderStyle.Organic;
  private usePostProcessing: boolean = true;
  private isCAStepInProgress: boolean = false;
  private caSimulationEnabled: boolean = true; // CA simulation runs in background
  private caRenderingEnabled: boolean = false; // Visual updates start disabled
  public timeManipulation: TimeManipulation;

  // Phase 10: Game Modes & Progression Systems
  public gameMode: GameMode | null = null;
  public progressionSystem: ProgressionSystem;
  public achievementSystem: AchievementSystem;
  public patternCodex: PatternCodex;
  public saveSystem: SaveSystem;
  public leaderboardSystem: LeaderboardSystem;
  public patternLibrary: any = null; // Will be set from external systems
  public baseBuilding: any = null; // Will be set from external systems
  public worldManager: any = null; // Will be set from external systems
  public biomeManager: any = null; // Will be set from external systems
  private totalPlayTime: number = 0;
  private sessionStartTime: number = 0;

  constructor(canvas: HTMLCanvasElement, gridSize = 32, caUpdateInterval = 2000) {
    // Initialize CA simulator (main thread fallback)
    this.simulator = new CASimulator(gridSize, gridSize, gridSize);

    // Initialize both renderers
    this.cubeRenderer = new VoxelRenderer(canvas, 1);
    this.organicRenderer = new OrganicRenderer(canvas, 1);

    // Initialize with a test pattern
    this.initializeTestPattern();

    // Initialize Web Worker simulator
    if (this.useWorkers) {
      this.initializeWorkerSimulator(gridSize);
    }

    // Initialize time manipulation
    this.timeManipulation = new TimeManipulation(this.simulator, caUpdateInterval);

    // Initialize Phase 10 systems
    this.progressionSystem = new ProgressionSystem();
    this.achievementSystem = new AchievementSystem();
    this.patternCodex = new PatternCodex();
    this.saveSystem = new SaveSystem();
    this.leaderboardSystem = new LeaderboardSystem();

    // Setup progression system listeners
    this.setupProgressionListeners();

    // Get active renderer (organic by default)
    const activeRenderer = this.getActiveRenderer();
    
    // Render initial grid state (so voxels are visible before first CA update)
    activeRenderer.renderGrid(this.simulator.getGrid());

    // Initialize post-processing (for organic renderer)
    if (this.renderStyle === RenderStyle.Organic) {
      this.postProcessing = new PostProcessingManager(
        this.organicRenderer.getRenderer(),
        this.organicRenderer.getScene(),
        this.organicRenderer.getCamera()
      );
    }

    // Initialize player at spawn position (far from center for overview)
    // Note: World is centered at origin (0,0,0) for rendering, but grid data
    // is at grid coordinates (0 to gridSize-1). Spawn far away for overview.
    const spawnPosition = new Vector3(
      50,   // Far to the side
      40,   // High above the world
      50    // Far from center
    );
    this.player = new Player(
      activeRenderer.getScene(),
      activeRenderer.getCamera(),
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

    // Setup keyboard shortcuts for render and time controls
    this.setupRenderControls();
    this.setupTimeControls();
  }

  /**
   * Get the currently active renderer
   */
  private getActiveRenderer(): VoxelRenderer | OrganicRenderer {
    return this.renderStyle === RenderStyle.Organic ? this.organicRenderer : this.cubeRenderer;
  }

  /**
   * Setup keyboard controls for rendering options
   */
  private setupRenderControls(): void {
    document.addEventListener('keydown', (event) => {
      switch (event.key.toLowerCase()) {
        case 'm':
          // Toggle render mode (cubes/organic)
          this.toggleRenderStyle();
          break;
        case 'b':
          // Toggle bloom
          this.toggleBloom();
          break;
        case 'v':
          // Toggle vignette
          this.toggleVignette();
          break;
        case 't':
          // Toggle CA simulation
          this.toggleCASimulation();
          break;
      }
    });
  }

  /**
   * Toggle CA rendering (simulation always runs, this controls visual updates)
   */
  public toggleCASimulation(): void {
    this.caRenderingEnabled = !this.caRenderingEnabled;
    console.log(`CA Rendering: ${this.caRenderingEnabled ? 'ENABLED' : 'DISABLED'}`);

    // When enabling rendering, force immediate render of current state
    if (this.caRenderingEnabled) {
      const activeRenderer = this.getActiveRenderer();
      activeRenderer.renderGrid(this.simulator.getGrid());
    }

    this.updateUI();
  }

  /**
   * Setup keyboard controls for time manipulation
   */
  private setupTimeControls(): void {
    document.addEventListener('keydown', (event) => {
      switch (event.key) {
        case 'p':
        case 'P':
          // Pause/Unpause
          this.timeManipulation.togglePause();
          break;
        case '[':
          // Slow down time
          this.timeManipulation.slowDown();
          this.caUpdateInterval = this.timeManipulation.getUpdateInterval();
          break;
        case ']':
          // Speed up time
          this.timeManipulation.speedUp();
          this.caUpdateInterval = this.timeManipulation.getUpdateInterval();
          break;
        case ',':
          // Rewind one step
          if (this.timeManipulation.rewind()) {
            this.getActiveRenderer().renderGrid(this.simulator.getGrid());
          }
          break;
        case '.':
          // Step forward one tick (when paused)
          this.timeManipulation.stepForward();
          this.getActiveRenderer().renderGrid(this.simulator.getGrid());
          break;
      }
    });
  }

  /**
   * Setup listeners for progression system
   */
  private setupProgressionListeners(): void {
    // Listen for level ups
    this.progressionSystem.on('levelUp', (level: number) => {
      console.log(`🎉 LEVEL UP! You are now level ${level}`);
      // TODO: Show UI notification
    });

    // Listen for unlocks
    this.progressionSystem.on('unlocked', (unlock: any) => {
      console.log(`🔓 Unlocked: ${unlock.name}`);
      // TODO: Show UI notification
    });

    // Listen for achievements
    this.achievementSystem.on('unlocked', (achievement: any) => {
      console.log(`🏆 Achievement: ${achievement.name}`);
      this.progressionSystem.addXP(achievement.xpReward);
      // TODO: Show UI notification
    });

    // Listen for pattern discoveries
    this.patternCodex.on('discovered', (pattern: any) => {
      console.log(`📖 Pattern Discovered: ${pattern.name}`);
      this.achievementSystem.trackPatternDiscovered();
      this.progressionSystem.addXP(pattern.rarity === 'legendary' ? 100 : 25);
      // TODO: Show UI notification
    });
  }

  /**
   * Start a game mode
   */
  public startGameMode(type: GameModeType): void {
    if (this.gameMode) {
      this.gameMode.end();
    }

    switch (type) {
      case GameModeType.SURVIVAL:
        this.gameMode = new SurvivalMode(this, this.player);
        break;
      case GameModeType.EXPLORER:
        this.gameMode = new ExplorerMode(this, this.player);
        break;
      case GameModeType.ARCHITECT:
        this.gameMode = new ArchitectMode(this, this.player);
        break;
      case GameModeType.PUZZLE:
        this.gameMode = new PuzzleMode(this, this.player);
        break;
    }

    this.gameMode.start();
    console.log(`🎮 Started ${this.gameMode.config.name}`);
  }

  /**
   * End current game mode
   */
  public endGameMode(): void {
    if (this.gameMode) {
      this.gameMode.end();
      this.gameMode = null;
      console.log('🎮 Game mode ended');
    }
  }

  /**
   * Get total play time in milliseconds
   */
  public getTotalPlayTime(): number {
    const sessionTime = this.sessionStartTime > 0 ? (Date.now() - this.sessionStartTime) : 0;
    return this.totalPlayTime + sessionTime;
  }

  /**
   * Toggle between cube and organic render styles
   */
  public toggleRenderStyle(): void {
    this.renderStyle = this.renderStyle === RenderStyle.Cubes 
      ? RenderStyle.Organic 
      : RenderStyle.Cubes;
    
    console.warn(`Render style: ${this.renderStyle}`);
    
    // Re-render with new style
    const activeRenderer = this.getActiveRenderer();
    activeRenderer.renderGrid(this.simulator.getGrid());

    // Update post-processing for new renderer
    if (this.renderStyle === RenderStyle.Organic && this.usePostProcessing) {
      if (!this.postProcessing) {
        this.postProcessing = new PostProcessingManager(
          this.organicRenderer.getRenderer(),
          this.organicRenderer.getScene(),
          this.organicRenderer.getCamera()
        );
      } else {
        this.postProcessing.updateScene(this.organicRenderer.getScene());
        this.postProcessing.updateCamera(this.organicRenderer.getCamera());
      }
    }

    this.updateUI();
  }

  /**
   * Toggle bloom effect
   */
  public toggleBloom(): void {
    if (this.postProcessing) {
      const config = this.postProcessing.getConfig();
      this.postProcessing.setBloomEnabled(!config.bloomEnabled);
      console.warn(`Bloom: ${!config.bloomEnabled ? 'ON' : 'OFF'}`);
    }
  }

  /**
   * Toggle vignette effect
   */
  public toggleVignette(): void {
    if (this.postProcessing) {
      const config = this.postProcessing.getConfig();
      this.postProcessing.setVignetteEnabled(!config.vignetteEnabled);
      console.warn(`Vignette: ${!config.vignetteEnabled ? 'ON' : 'OFF'}`);
    }
  }

  /**
   * Set organic render mode (metaballs or spheres)
   */
  public setOrganicRenderMode(mode: RenderMode): void {
    this.organicRenderer.setRenderMode(mode);
    if (this.renderStyle === RenderStyle.Organic) {
      this.organicRenderer.renderGrid(this.simulator.getGrid());
    }
    console.warn(`Organic mode: ${mode}`);
  }

  /**
   * Initialize Web Worker simulator
   */
  private async initializeWorkerSimulator(gridSize: number): Promise<void> {
    try {
      this.workerSimulator = new CASimulatorWorker(gridSize, gridSize, gridSize);
      await this.workerSimulator.init(this.simulator.getGrid().getData());
      console.log('Web Worker CA simulator initialized');
    } catch (error) {
      console.error('Failed to initialize Web Worker simulator:', error);
      this.useWorkers = false;
    }
  }

  /**
   * Initialize with a test pattern for demonstration
   */
  private initializeTestPattern(): void {
    // Create random clusters throughout the grid for varied gameplay
    this.simulator.fillPattern((x, y, z) => {
      // Random density per region
      const regionX = Math.floor(x / 5);
      const regionY = Math.floor(y / 5);
      const regionZ = Math.floor(z / 5);
      const regionSeed = (regionX * 73856093) ^ (regionY * 19349663) ^ (regionZ * 83492791);
      const regionRandom = Math.abs(Math.sin(regionSeed)) * 1000 % 1;

      // Create multiple random clusters
      if (regionRandom > 0.85) {
        // Dense core
        if (Math.random() < 0.4) {
          return VoxelState.Alive;
        }

        // Scattered energized voxels
        if (Math.random() < 0.1) {
          return VoxelState.Energized;
        }

        // Occasional crystallized
        if (Math.random() < 0.05) {
          return VoxelState.Crystallized;
        }
      }

      // Random sparse alive voxels everywhere
      if (Math.random() < 0.02) {
        return VoxelState.Alive;
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
    this.sessionStartTime = Date.now();

    // Track first steps achievement
    this.achievementSystem.unlock('first_steps');

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

    // Update CA simulation at fixed interval (only if enabled and not paused)
    if (this.caSimulationEnabled &&
        currentTime - this.lastCAUpdateTime >= this.caUpdateInterval &&
        !this.isCAStepInProgress &&
        !this.timeManipulation.isPaused()) {

      this.isCAStepInProgress = true;
      this.lastCAUpdateTime = currentTime;

      // Save snapshot for rewind functionality
      this.timeManipulation.saveSnapshot();

      if (this.useWorkers && this.workerSimulator) {
        // Use Web Worker for CA simulation (async, non-blocking)
        this.workerSimulator.step().then((gridData) => {
          // Update main thread grid with worker result
          this.simulator.getGrid().getData().set(gridData);

          // Only re-render if rendering is enabled (shows snapshots when toggled)
          if (this.caRenderingEnabled) {
            const activeRenderer = this.getActiveRenderer();
            activeRenderer.renderGrid(this.simulator.getGrid());
          }

          this.isCAStepInProgress = false;
          this.updateUI();
        }).catch((error) => {
          console.error('Worker CA step failed:', error);
          this.isCAStepInProgress = false;
        });
      } else {
        // Fallback to main thread simulation
        this.simulator.step();

        // Only re-render if rendering is enabled (shows snapshots when toggled)
        if (this.caRenderingEnabled) {
          const activeRenderer = this.getActiveRenderer();
          activeRenderer.renderGrid(this.simulator.getGrid());
        }

        this.isCAStepInProgress = false;
        this.updateUI();
      }
    }

    // Update player (physics, input, camera)
    this.player.update(deltaTime);

    // Update game mode
    if (this.gameMode && this.gameMode.isActive) {
      this.gameMode.update(deltaTime);
    }

    // Track achievements
    this.trackPlayerAchievements(deltaTime);

    // Check if player died and respawn
    if (!this.player.isAlive()) {
      if (this.gameMode) {
        this.gameMode.onPlayerDeath();
      }
      this.player.respawn();
    }

    // Render scene with or without post-processing
    if (this.renderStyle === RenderStyle.Organic && this.usePostProcessing && this.postProcessing) {
      this.postProcessing.render();
    } else {
      this.getActiveRenderer().render();
    }

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

    // Update CA rendering status (simulation always runs in background)
    const caStatusElement = document.getElementById('ca-status');
    if (caStatusElement) {
      caStatusElement.textContent = this.caRenderingEnabled ? 'ANIMATING' : 'PAUSED';
      caStatusElement.style.color = this.caRenderingEnabled ? '#50e3c2' : '#ff6b35';
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
   * Get current renderer
   */
  public getRenderer(): VoxelRenderer | OrganicRenderer {
    return this.getActiveRenderer();
  }

  /**
   * Get render style
   */
  public getRenderStyle(): RenderStyle {
    return this.renderStyle;
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
    this.getActiveRenderer().renderGrid(this.simulator.getGrid());
    this.lastCAUpdateTime = performance.now();
    this.player.respawn();
  }

  /**
   * Track player achievements during gameplay
   */
  private trackPlayerAchievements(_deltaTime: number): void {
    // Track survival time
    const playTimeSeconds = this.getTotalPlayTime() / 1000;
    this.achievementSystem.trackSurvivalTime(playTimeSeconds);

    // Track near-death experience
    if (this.player.environmentalSuit) {
      const energy = this.player.environmentalSuit.getCurrentEnergy();
      const maxEnergy = this.player.environmentalSuit.getMaxEnergy();
      if (energy > 0 && energy / maxEnergy < 0.05) {
        this.achievementSystem.unlock('near_death');
      }
    }
  }

  /**
   * Quick save the game
   */
  public async quickSave(): Promise<void> {
    try {
      await this.saveSystem.quickSave(
        this,
        this.progressionSystem,
        this.achievementSystem,
        this.patternCodex,
        this.gameMode
      );
      console.log('⚡ Quick save completed');
    } catch (error) {
      console.error('Quick save failed:', error);
    }
  }

  /**
   * Quick load the game
   */
  public async quickLoad(): Promise<void> {
    try {
      await this.saveSystem.quickLoad(
        this,
        this.progressionSystem,
        this.achievementSystem,
        this.patternCodex,
        this.gameMode
      );
      console.log('⚡ Quick load completed');
    } catch (error) {
      console.error('Quick load failed:', error);
    }
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    this.stop();
    this.cubeRenderer.dispose();
    this.organicRenderer.dispose();
    if (this.postProcessing) {
      this.postProcessing.dispose();
    }
    if (this.workerSimulator) {
      this.workerSimulator.terminate();
    }
    this.player.dispose();
  }

  /**
   * Toggle Web Workers on/off
   */
  public toggleWorkers(): void {
    this.useWorkers = !this.useWorkers;
    console.log(`Web Workers: ${this.useWorkers ? 'ON' : 'OFF'}`);
  }

  /**
   * Get worker status
   */
  public isUsingWorkers(): boolean {
    return this.useWorkers && this.workerSimulator !== null;
  }
}
