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
  private lastSnapshotRenderTime: number; // Track when we last rendered a snapshot
  private lastFrameTime: number;
  private caUpdateInterval: number; // milliseconds between CA updates
  private fps: number;
  private frameCount: number;
  private fpsUpdateTime: number;
  private renderStyle: RenderStyle = RenderStyle.Organic;
  private usePostProcessing: boolean = true;
  private isCAStepInProgress: boolean = false;

  // Separate controls for simulation and rendering
  private caSimulationEnabled: boolean = true; // CA simulation runs in background (always on by default)
  private caStatusUpdatesEnabled: boolean = false; // Status changes visible (press T to toggle) - OFF by default
  private caAnimationsEnabled: boolean = false; // Smooth animations (press N to toggle, expensive)
  private gridNeedsRender: boolean = true; // Flag if grid changed and needs re-render
  private lastGridSize: number = 0; // Track grid size for expansion detection

  private uiUpdateScheduled: boolean = false; // Throttle UI updates
  public timeManipulation: TimeManipulation;

  // Cached DOM elements for performance
  private uiElements = {
    fps: null as HTMLElement | null,
    tick: null as HTMLElement | null,
    position: null as HTMLElement | null,
    energy: null as HTMLElement | null,
    oxygen: null as HTMLElement | null,
    caStatus: null as HTMLElement | null,
    caStatusAlways: null as HTMLElement | null,
    tickAlways: null as HTMLElement | null,
    simulationStatus: null as HTMLElement | null,
  };

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
    this.lastSnapshotRenderTime = 0;
    this.lastFrameTime = 0;
    this.caUpdateInterval = caUpdateInterval;
    this.lastGridSize = gridSize;
    this.fps = 0;
    this.frameCount = 0;
    this.fpsUpdateTime = 0;

    // Setup keyboard shortcuts for render and time controls
    this.setupRenderControls();
    this.setupTimeControls();

    // Cache DOM elements for performance
    this.cacheUIElements();
  }

  /**
   * Cache DOM elements on initialization to avoid repeated queries
   */
  private cacheUIElements(): void {
    this.uiElements.fps = document.getElementById('fps');
    this.uiElements.tick = document.getElementById('tick');
    this.uiElements.position = document.getElementById('position');
    this.uiElements.energy = document.getElementById('energy');
    this.uiElements.oxygen = document.getElementById('oxygen');
    this.uiElements.caStatus = document.getElementById('ca-status');
    this.uiElements.caStatusAlways = document.getElementById('ca-status-always');
    this.uiElements.tickAlways = document.getElementById('tick-always');
    this.uiElements.simulationStatus = document.getElementById('simulation-status');
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
        case 't':
          // Toggle status updates (show/hide CA changes)
          this.toggleStatusUpdates();
          break;
        case 'n':
          // Toggle smooth animations (expensive)
          this.toggleAnimations();
          break;
      }
    });
  }

  /**
   * Toggle status updates (show/hide CA state changes without animations)
   * Press T to toggle - simulation runs in background, this shows snapshots
   */
  public toggleStatusUpdates(): void {
    this.caStatusUpdatesEnabled = !this.caStatusUpdatesEnabled;
    console.log(`CA Status Updates: ${this.caStatusUpdatesEnabled ? 'ENABLED' : 'DISABLED'}`);

    // When enabling status updates, immediately render current state snapshot
    if (this.caStatusUpdatesEnabled) {
      const activeRenderer = this.getActiveRenderer();
      activeRenderer.renderGrid(this.simulator.getGrid());
      this.gridNeedsRender = false; // Clear flag since we just rendered
      this.lastSnapshotRenderTime = performance.now();
    }

    this.scheduleUIUpdate();
  }

  /**
   * Toggle smooth animations (press N to toggle)
   * Uses lightweight point rendering for smooth updates
   */
  public toggleAnimations(): void {
    this.caAnimationsEnabled = !this.caAnimationsEnabled;
    console.log(`CA Animations: ${this.caAnimationsEnabled ? 'ENABLED (Lightweight mode)' : 'DISABLED'}`);

    // If animations disabled, switch back to full quality and render snapshot
    if (!this.caAnimationsEnabled) {
      if (this.renderStyle === RenderStyle.Cubes) {
        this.cubeRenderer.setLightweightMode(false);
      }
      const activeRenderer = this.getActiveRenderer();
      activeRenderer.renderGrid(this.simulator.getGrid());
      this.gridNeedsRender = false;
      this.lastSnapshotRenderTime = performance.now();
    }

    this.scheduleUIUpdate();
  }

  /**
   * @deprecated Use toggleStatusUpdates() or toggleAnimations() instead
   */
  public toggleCASimulation(): void {
    this.toggleStatusUpdates();
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

    this.scheduleUIUpdate();
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
      this.scheduleUIUpdate();
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

          // Check for map expansion
          this.checkGridExpansion();

          // Mark that grid has changed
          this.gridNeedsRender = true;

          this.isCAStepInProgress = false;
          this.scheduleUIUpdate();
        }).catch((error) => {
          console.error('Worker CA step failed:', error);
          this.isCAStepInProgress = false;
        });
      } else {
        // Fallback to main thread simulation
        this.simulator.step();

        // Check for map expansion
        this.checkGridExpansion();

        // Mark that grid has changed
        this.gridNeedsRender = true;

        this.isCAStepInProgress = false;
        this.scheduleUIUpdate();
      }
    }

    // Handle CA visualization based on mode
    if (this.caStatusUpdatesEnabled) {
      if (this.caAnimationsEnabled) {
        // Animations mode - lightweight point rendering at 10 FPS (100ms intervals)
        if (currentTime - this.lastSnapshotRenderTime >= 100) {
          // Enable lightweight mode for cube renderer (points instead of meshes)
          if (this.renderStyle === RenderStyle.Cubes) {
            this.cubeRenderer.setLightweightMode(true);
          }

          const activeRenderer = this.getActiveRenderer();
          activeRenderer.renderGrid(this.simulator.getGrid());
          this.lastSnapshotRenderTime = currentTime;
        }
      } else if (this.gridNeedsRender) {
        // Snapshot mode - full quality render when CA changes (500ms minimum)
        if (currentTime - this.lastSnapshotRenderTime >= 500) {
          // Disable lightweight mode for high-quality snapshots
          if (this.renderStyle === RenderStyle.Cubes) {
            this.cubeRenderer.setLightweightMode(false);
          }

          const activeRenderer = this.getActiveRenderer();
          activeRenderer.renderGrid(this.simulator.getGrid());
          this.lastSnapshotRenderTime = currentTime;
          this.gridNeedsRender = false; // Clear flag after rendering
        }
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
   * Schedule UI update (throttled to avoid blocking)
   */
  private scheduleUIUpdate(): void {
    if (this.uiUpdateScheduled) return;

    this.uiUpdateScheduled = true;
    requestAnimationFrame(() => {
      this.updateUI();
      this.uiUpdateScheduled = false;
    });
  }

  /**
   * Update UI elements (called via requestAnimationFrame for smoothness)
   */
  private updateUI(): void {
    // Use cached DOM elements for performance

    // Update FPS
    if (this.uiElements.fps) {
      this.uiElements.fps.textContent = this.fps.toString();
    }

    // Update CA tick
    const tick = this.simulator.getTick().toString();
    if (this.uiElements.tick) {
      this.uiElements.tick.textContent = tick;
    }

    // Update player position (only if changed significantly to avoid unnecessary reflows)
    if (this.uiElements.position) {
      const pos = this.player.getPosition();
      const posText = `${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}`;
      if (this.uiElements.position.textContent !== posText) {
        this.uiElements.position.textContent = posText;
      }
    }

    // Update player energy and oxygen (batch state access)
    const state = this.player.getState();
    if (this.uiElements.energy) {
      this.uiElements.energy.textContent = state.energy.toFixed(0);
    }
    if (this.uiElements.oxygen) {
      this.uiElements.oxygen.textContent = state.oxygen.toFixed(0);
    }

    // Update CA status display (two separate toggles)
    let statusText = 'OFF';
    let statusColor = '#888';

    if (this.caStatusUpdatesEnabled && this.caAnimationsEnabled) {
      statusText = 'ANIMATED (10 FPS)';
      statusColor = '#50e3c2'; // Cyan for lightweight animation
    } else if (this.caStatusUpdatesEnabled) {
      statusText = 'SNAPSHOTS (2/sec)';
      statusColor = '#4a90e2'; // Blue for snapshot mode
    }

    if (this.uiElements.caStatus) {
      this.uiElements.caStatus.textContent = statusText;
      this.uiElements.caStatus.style.color = statusColor;
    }

    // Update always-visible simulation status
    if (this.uiElements.caStatusAlways) {
      this.uiElements.caStatusAlways.textContent = statusText;
      this.uiElements.caStatusAlways.style.color = statusColor;
    }

    if (this.uiElements.tickAlways) {
      this.uiElements.tickAlways.textContent = tick;
    }
  }

  /**
   * Check if the grid has expanded and re-sync all dependent systems
   */
  private checkGridExpansion(): void {
    const expanded = this.simulator.checkAndExpand();
    if (!expanded) return;

    const { width } = this.simulator.getGridSize();
    if (width === this.lastGridSize) return;
    this.lastGridSize = width;

    // Update player's voxel grid reference
    this.player.updateGrid(this.simulator.getGrid());

    // Re-initialize worker simulator with new grid size
    if (this.useWorkers && this.workerSimulator) {
      this.workerSimulator.terminate();
      this.workerSimulator = null;
      this.initializeWorkerSimulator(width);
    }

    // Force a full re-render on next frame
    this.gridNeedsRender = true;
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
