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
  minSpeedLevel: number;
  maxSpeedLevel: number;
  maxTicksPerSecond: number;
}

/**
 * Default time manipulation configuration
 */
export const DEFAULT_TIME_CONFIG: TimeManipulationConfig = {
  slowMultiplier: 2.0,
  fastMultiplier: 0.25,
  maxHistorySteps: 10,
  minSpeedLevel: 1,
  maxSpeedLevel: 10,
  maxTicksPerSecond: 50,
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
  private speedLevel: number = 1;

  constructor(
    simulator: CASimulator,
    baseUpdateInterval: number,
    config: Partial<TimeManipulationConfig> = {}
  ) {
    this.simulator = simulator;
    this.baseUpdateInterval = baseUpdateInterval;
    this.config = { ...DEFAULT_TIME_CONFIG, ...config };
    this.speedLevel = 1;
    this.currentUpdateInterval = this.calcIntervalForLevel(this.speedLevel);
  }

  /**
   * Set time mode
   */
  public setMode(mode: TimeMode): void {
    this.mode = mode;

    switch (mode) {
      case TimeMode.Normal:
        this.currentUpdateInterval = this.calcIntervalForLevel(this.speedLevel);
        console.log(`Time: NORMAL (speed ${this.speedLevel})`);
        break;
      case TimeMode.Slow:
        this.currentUpdateInterval = this.calcIntervalForLevel(this.speedLevel);
        console.log(`Time: SLOW (speed ${this.speedLevel})`);
        break;
      case TimeMode.Fast:
        this.currentUpdateInterval = this.calcIntervalForLevel(this.speedLevel);
        console.log(`Time: FAST (speed ${this.speedLevel})`);
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
   * Calculate update interval for a given speed level.
   * Level 1 = baseUpdateInterval, level maxSpeedLevel = 1000/maxTicksPerSecond ms.
   */
  private calcIntervalForLevel(level: number): number {
    const minInterval = 1000 / this.config.maxTicksPerSecond; // e.g. 20ms for 50 ticks/sec
    const maxInterval = this.baseUpdateInterval; // e.g. 2000ms
    const range = this.config.maxSpeedLevel - this.config.minSpeedLevel; // 9
    if (range <= 0) return maxInterval;
    const t = (level - this.config.minSpeedLevel) / range; // 0..1
    // Exponential interpolation for more natural speed curve
    return maxInterval * Math.pow(minInterval / maxInterval, t);
  }

  /**
   * Get current update interval
   */
  public getUpdateInterval(): number {
    return this.currentUpdateInterval;
  }

  /**
   * Get current speed level (1 to maxSpeedLevel)
   */
  public getSpeedLevel(): number {
    return this.speedLevel;
  }

  /**
   * Get max speed level
   */
  public getMaxSpeedLevel(): number {
    return this.config.maxSpeedLevel;
  }

  /**
   * Set speed level directly (clamped to valid range)
   */
  public setSpeedLevel(level: number): void {
    this.speedLevel = Math.max(this.config.minSpeedLevel, Math.min(this.config.maxSpeedLevel, level));
    if (this.mode !== TimeMode.Paused) {
      this.currentUpdateInterval = this.calcIntervalForLevel(this.speedLevel);
      console.log(`Speed level: ${this.speedLevel}/${this.config.maxSpeedLevel} (${Math.round(1000 / this.currentUpdateInterval)} ticks/sec)`);
    }
  }

  /**
   * Get current speed multiplier
   */
  public getSpeed(): number {
    if (this.mode === TimeMode.Paused) return 0.0;
    return this.baseUpdateInterval / this.currentUpdateInterval;
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
      this.mode = TimeMode.Normal;
      this.currentUpdateInterval = this.calcIntervalForLevel(this.speedLevel);
      console.log(`Time: RESUMED (speed ${this.speedLevel})`);
    } else {
      this.setMode(TimeMode.Paused);
    }
  }

  /**
   * Speed up time (increase speed level by 1)
   */
  public speedUp(): void {
    if (this.mode === TimeMode.Paused) {
      this.mode = TimeMode.Normal;
    }
    if (this.speedLevel < this.config.maxSpeedLevel) {
      this.setSpeedLevel(this.speedLevel + 1);
    } else {
      console.log('Time: Already at maximum speed');
    }
  }

  /**
   * Slow down time (decrease speed level by 1)
   */
  public slowDown(): void {
    if (this.speedLevel > this.config.minSpeedLevel) {
      this.setSpeedLevel(this.speedLevel - 1);
    } else {
      this.setMode(TimeMode.Paused);
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
