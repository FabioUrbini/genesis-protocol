import { CASimulator } from '../core/CASimulator';

/**
 * Time manipulation mode
 */
export enum TimeMode {
  Normal = 'normal',
  Slow = 'slow',
  Fast = 'fast',
  Paused = 'paused'
}

/**
 * Configuration for time manipulation
 */
export interface TimeManipulationConfig {
  slowMultiplier: number;
  fastMultiplier: number;
  maxHistorySteps: number;
}

/**
 * Default time manipulation configuration
 */
export const DEFAULT_TIME_CONFIG: TimeManipulationConfig = {
  slowMultiplier: 2.0,
  fastMultiplier: 0.25,
  maxHistorySteps: 10,
};

/**
 * Grid snapshot for history/rewind
 */
interface GridSnapshot {
  data: Uint8Array;
  tick: number;
}

/**
 * Time Manipulation System
 * Controls CA simulation speed, pause, and rewind
 */
export class TimeManipulation {
  private simulator: CASimulator;
  private mode: TimeMode = TimeMode.Normal;
  private config: TimeManipulationConfig;
  private history: GridSnapshot[] = [];
  private baseUpdateInterval: number;
  private currentUpdateInterval: number;

  constructor(
    simulator: CASimulator,
    baseUpdateInterval: number,
    config: Partial<TimeManipulationConfig> = {}
  ) {
    this.simulator = simulator;
    this.baseUpdateInterval = baseUpdateInterval;
    this.currentUpdateInterval = baseUpdateInterval;
    this.config = { ...DEFAULT_TIME_CONFIG, ...config };
  }

  /**
   * Set time mode
   */
  public setMode(mode: TimeMode): void {
    this.mode = mode;

    switch (mode) {
      case TimeMode.Normal:
        this.currentUpdateInterval = this.baseUpdateInterval;
        console.log('Time: NORMAL');
        break;
      case TimeMode.Slow:
        this.currentUpdateInterval = this.baseUpdateInterval * this.config.slowMultiplier;
        console.log('Time: SLOW');
        break;
      case TimeMode.Fast:
        this.currentUpdateInterval = this.baseUpdateInterval * this.config.fastMultiplier;
        console.log('Time: FAST');
        break;
      case TimeMode.Paused:
        console.log('Time: PAUSED');
        break;
    }
  }

  /**
   * Get current time mode
   */
  public getMode(): TimeMode {
    return this.mode;
  }

  /**
   * Get current update interval
   */
  public getUpdateInterval(): number {
    return this.currentUpdateInterval;
  }

  /**
   * Get current speed multiplier
   */
  public getSpeed(): number {
    switch (this.mode) {
      case TimeMode.Normal:
        return 1.0;
      case TimeMode.Slow:
        return 1.0 / this.config.slowMultiplier;
      case TimeMode.Fast:
        return 1.0 / this.config.fastMultiplier;
      case TimeMode.Paused:
        return 0.0;
      default:
        return 1.0;
    }
  }

  /**
   * Set time speed multiplier (1.0 = normal, 0.5 = slow, 2.0 = fast)
   */
  public setSpeed(speed: number): void {
    if (speed <= 0) {
      this.setMode(TimeMode.Paused);
    } else if (speed < 0.8) {
      this.setMode(TimeMode.Slow);
    } else if (speed > 1.5) {
      this.setMode(TimeMode.Fast);
    } else {
      this.setMode(TimeMode.Normal);
    }
  }

  /**
   * Check if simulation is paused
   */
  public isPaused(): boolean {
    return this.mode === TimeMode.Paused;
  }

  /**
   * Pause the simulation
   */
  public pause(): void {
    this.setMode(TimeMode.Paused);
  }

  /**
   * Resume the simulation
   */
  public resume(): void {
    if (this.mode === TimeMode.Paused) {
      this.setMode(TimeMode.Normal);
    }
  }

  /**
   * Toggle pause
   */
  public togglePause(): void {
    if (this.mode === TimeMode.Paused) {
      this.setMode(TimeMode.Normal);
    } else {
      this.setMode(TimeMode.Paused);
    }
  }

  /**
   * Speed up time
   */
  public speedUp(): void {
    switch (this.mode) {
      case TimeMode.Slow:
        this.setMode(TimeMode.Normal);
        break;
      case TimeMode.Normal:
        this.setMode(TimeMode.Fast);
        break;
      case TimeMode.Fast:
        // Already at max speed
        console.log('Time: Already at maximum speed');
        break;
      case TimeMode.Paused:
        this.setMode(TimeMode.Normal);
        break;
    }
  }

  /**
   * Slow down time
   */
  public slowDown(): void {
    switch (this.mode) {
      case TimeMode.Fast:
        this.setMode(TimeMode.Normal);
        break;
      case TimeMode.Normal:
        this.setMode(TimeMode.Slow);
        break;
      case TimeMode.Slow:
        this.setMode(TimeMode.Paused);
        break;
      case TimeMode.Paused:
        // Already paused
        console.log('Time: Already paused');
        break;
    }
  }

  /**
   * Save current grid state to history
   */
  public saveSnapshot(): void {
    const grid = this.simulator.getGrid();
    const snapshot: GridSnapshot = {
      data: new Uint8Array(grid.getData()),
      tick: this.simulator.getTick(),
    };

    this.history.push(snapshot);

    // Limit history size
    if (this.history.length > this.config.maxHistorySteps) {
      this.history.shift();
    }
  }

  /**
   * Rewind to previous state
   */
  public rewind(): boolean {
    if (this.history.length === 0) {
      console.log('Time: No history to rewind to');
      return false;
    }

    const snapshot = this.history.pop()!;
    const grid = this.simulator.getGrid();
    grid.getData().set(snapshot.data);

    console.log(`Time: Rewound to tick ${snapshot.tick}`);
    return true;
  }

  /**
   * Clear history
   */
  public clearHistory(): void {
    this.history = [];
    console.log('Time: History cleared');
  }

  /**
   * Get history size
   */
  public getHistorySize(): number {
    return this.history.length;
  }

  /**
   * Get max history size
   */
  public getMaxHistorySize(): number {
    return this.config.maxHistorySteps;
  }

  /**
   * Step simulation forward by one tick (manual step when paused)
   */
  public stepForward(): void {
    if (this.mode === TimeMode.Paused) {
      this.saveSnapshot();
      this.simulator.step();
      console.log('Time: Stepped forward one tick');
    }
  }

  /**
   * Fast forward multiple steps
   */
  public fastForward(steps: number): void {
    const originalMode = this.mode;
    this.saveSnapshot();

    console.log(`Time: Fast forwarding ${steps} steps...`);
    for (let i = 0; i < steps; i++) {
      this.simulator.step();
    }

    this.setMode(originalMode);
    console.log('Time: Fast forward complete');
  }
}
