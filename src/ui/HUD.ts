/**
 * HUD.ts
 * Contextual Heads-Up Display that shows/hides based on game state
 */

export interface HUDElements {
  fps: HTMLElement;
  position: HTMLElement;
  tick: HTMLElement;
  energy: HTMLElement;
  energyBar: HTMLElement;
  oxygen: HTMLElement;
  oxygenBar: HTMLElement;
  container: HTMLElement;
}

export interface HUDConfig {
  autoHideDelay?: number; // ms before auto-hiding
  fadeSpeed?: number; // transition speed in ms
  showOnAction?: boolean; // show HUD when player performs action
}

export class HUD {
  private elements: HUDElements;
  private config: HUDConfig;
  private autoHideTimer: number | null = null;
  private isVisible: boolean = false;
  private isPermanentlyVisible: boolean = false;

  constructor(config: HUDConfig = {}) {
    this.config = {
      autoHideDelay: 3000,
      fadeSpeed: 300,
      showOnAction: true,
      ...config
    };

    this.elements = this.getElements();
    this.setupStyles();
  }

  private getElements(): HUDElements {
    return {
      fps: document.getElementById('fps')!,
      position: document.getElementById('position')!,
      tick: document.getElementById('tick')!,
      energy: document.getElementById('energy')!,
      energyBar: document.getElementById('energy-bar')!,
      oxygen: document.getElementById('oxygen')!,
      oxygenBar: document.getElementById('oxygen-bar')!,
      container: document.getElementById('ui')!
    };
  }

  private setupStyles(): void {
    if (!this.elements.container) return;

    this.elements.container.style.transition = `opacity ${this.config.fadeSpeed}ms ease-in-out`;
    this.elements.container.style.opacity = '0';
  }

  /**
   * Show the HUD
   */
  show(permanent: boolean = false): void {
    if (!this.elements.container) return;

    this.isPermanentlyVisible = permanent;
    this.isVisible = true;
    this.elements.container.classList.remove('hidden');
    this.elements.container.style.opacity = '1';

    if (!permanent && this.config.autoHideDelay) {
      this.resetAutoHideTimer();
    }
  }

  /**
   * Hide the HUD
   */
  hide(): void {
    if (!this.elements.container || this.isPermanentlyVisible) return;

    this.isVisible = false;
    this.elements.container.style.opacity = '0';

    setTimeout(() => {
      if (!this.isVisible) {
        this.elements.container.classList.add('hidden');
      }
    }, this.config.fadeSpeed);

    this.clearAutoHideTimer();
  }

  /**
   * Toggle HUD visibility
   */
  toggle(): void {
    if (this.isVisible) {
      this.isPermanentlyVisible = false;
      this.hide();
    } else {
      this.show(true);
    }
  }

  /**
   * Flash the HUD briefly (useful for feedback)
   */
  flash(): void {
    if (!this.config.showOnAction) return;

    this.show();
  }

  /**
   * Update FPS display
   */
  updateFPS(fps: number): void {
    if (this.elements.fps) {
      this.elements.fps.textContent = Math.round(fps).toString();
    }
  }

  /**
   * Update position display
   */
  updatePosition(x: number, y: number, z: number): void {
    if (this.elements.position) {
      this.elements.position.textContent = `${Math.round(x)}, ${Math.round(y)}, ${Math.round(z)}`;
    }
  }

  /**
   * Update CA tick display
   */
  updateTick(tick: number): void {
    if (this.elements.tick) {
      this.elements.tick.textContent = tick.toString();
    }
  }

  /**
   * Update energy display and bar
   */
  updateEnergy(energy: number, maxEnergy: number = 100): void {
    if (this.elements.energy) {
      this.elements.energy.textContent = Math.round(energy).toString();
    }
    if (this.elements.energyBar) {
      const percentage = Math.max(0, Math.min(100, (energy / maxEnergy) * 100));
      this.elements.energyBar.style.width = percentage + '%';

      // Change color based on energy level
      if (percentage < 20) {
        this.elements.energyBar.style.background = 'linear-gradient(90deg, #e74c3c, #c0392b)';
      } else if (percentage < 50) {
        this.elements.energyBar.style.background = 'linear-gradient(90deg, #f39c12, #e67e22)';
      } else {
        this.elements.energyBar.style.background = 'linear-gradient(90deg, #2ecc71, #27ae60)';
      }
    }

    // Flash HUD when energy is low
    if (energy < 20 && energy > 0) {
      this.flash();
    }
  }

  /**
   * Update oxygen display and bar
   */
  updateOxygen(oxygen: number, maxOxygen: number = 100): void {
    if (this.elements.oxygen) {
      this.elements.oxygen.textContent = Math.round(oxygen).toString();
    }
    if (this.elements.oxygenBar) {
      const percentage = Math.max(0, Math.min(100, (oxygen / maxOxygen) * 100));
      this.elements.oxygenBar.style.width = percentage + '%';

      // Change color based on oxygen level
      if (percentage < 20) {
        this.elements.oxygenBar.style.background = 'linear-gradient(90deg, #e74c3c, #c0392b)';
      } else if (percentage < 50) {
        this.elements.oxygenBar.style.background = 'linear-gradient(90deg, #f39c12, #e67e22)';
      } else {
        this.elements.oxygenBar.style.background = 'linear-gradient(90deg, #3498db, #2980b9)';
      }
    }

    // Flash HUD when oxygen is low
    if (oxygen < 20 && oxygen > 0) {
      this.flash();
    }
  }

  /**
   * Reset the auto-hide timer
   */
  private resetAutoHideTimer(): void {
    this.clearAutoHideTimer();

    if (this.config.autoHideDelay && !this.isPermanentlyVisible) {
      this.autoHideTimer = window.setTimeout(() => {
        this.hide();
      }, this.config.autoHideDelay);
    }
  }

  /**
   * Clear the auto-hide timer
   */
  private clearAutoHideTimer(): void {
    if (this.autoHideTimer !== null) {
      clearTimeout(this.autoHideTimer);
      this.autoHideTimer = null;
    }
  }

  /**
   * Check if HUD is currently visible
   */
  isHUDVisible(): boolean {
    return this.isVisible;
  }

  /**
   * Cleanup
   */
  dispose(): void {
    this.clearAutoHideTimer();
  }
}
