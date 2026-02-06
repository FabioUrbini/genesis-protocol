/**
 * SettingsMenu.ts
 * Comprehensive settings menu for graphics, controls, and accessibility
 */

export interface GraphicsSettings {
  renderMode: 'cubes' | 'organic';
  enableBloom: boolean;
  enableSSAO: boolean;
  enableDOF: boolean;
  enableMotionBlur: boolean;
  enableGodRays: boolean;
  enableParticles: boolean;
  enableGreedyMeshing: boolean;
  enableFrustumCulling: boolean;
  particleLimit: number;
  shadowQuality: 'low' | 'medium' | 'high' | 'ultra';
  viewDistance: number;
}

export interface ControlSettings {
  mouseSensitivity: number;
  invertY: boolean;
  sprintToggle: boolean;
  flySpeed: number;
  walkSpeed: number;
}

export interface AccessibilitySettings {
  highContrast: boolean;
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  uiScale: number;
  reduceMotion: boolean;
  screenReader: boolean;
}

export interface GameSettings {
  caSpeed: number;
  enableDirtyTracking: boolean;
  enableWebWorkers: boolean;
  autoSave: boolean;
  showFPS: boolean;
  showCoordinates: boolean;
}

export class SettingsMenu {
  private container: HTMLElement | null = null;
  private isVisible: boolean = false;
  private graphics: GraphicsSettings;
  private controls: ControlSettings;
  private accessibility: AccessibilitySettings;
  private game: GameSettings;
  private callbacks: Map<string, (value: any) => void> = new Map();

  constructor() {
    this.graphics = this.loadGraphicsSettings();
    this.controls = this.loadControlSettings();
    this.accessibility = this.loadAccessibilitySettings();
    this.game = this.loadGameSettings();
    this.createUI();
  }

  private loadGraphicsSettings(): GraphicsSettings {
    const stored = localStorage.getItem('genesis-graphics-settings');
    return stored ? JSON.parse(stored) : {
      renderMode: 'cubes',
      enableBloom: true,
      enableSSAO: true,
      enableDOF: false,
      enableMotionBlur: false,
      enableGodRays: true,
      enableParticles: true,
      enableGreedyMeshing: true,
      enableFrustumCulling: true,
      particleLimit: 10000,
      shadowQuality: 'medium',
      viewDistance: 100
    };
  }

  private loadControlSettings(): ControlSettings {
    const stored = localStorage.getItem('genesis-control-settings');
    return stored ? JSON.parse(stored) : {
      mouseSensitivity: 0.5,
      invertY: false,
      sprintToggle: false,
      flySpeed: 20,
      walkSpeed: 10
    };
  }

  private loadAccessibilitySettings(): AccessibilitySettings {
    const stored = localStorage.getItem('genesis-accessibility-settings');
    return stored ? JSON.parse(stored) : {
      highContrast: false,
      colorBlindMode: 'none',
      uiScale: 1.0,
      reduceMotion: false,
      screenReader: false
    };
  }

  private loadGameSettings(): GameSettings {
    const stored = localStorage.getItem('genesis-game-settings');
    return stored ? JSON.parse(stored) : {
      caSpeed: 2,
      enableDirtyTracking: true,
      enableWebWorkers: true,
      autoSave: true,
      showFPS: true,
      showCoordinates: true
    };
  }

  private saveAllSettings(): void {
    localStorage.setItem('genesis-graphics-settings', JSON.stringify(this.graphics));
    localStorage.setItem('genesis-control-settings', JSON.stringify(this.controls));
    localStorage.setItem('genesis-accessibility-settings', JSON.stringify(this.accessibility));
    localStorage.setItem('genesis-game-settings', JSON.stringify(this.game));
  }

  private createUI(): void {
    this.container = document.createElement('div');
    this.container.id = 'settings-menu';
    this.container.className = 'settings-container hidden';
    this.container.innerHTML = `
      <div class="settings-panel">
        <div class="settings-header">
          <h2>Settings</h2>
          <button class="close-btn" id="settings-close">×</button>
        </div>
        <div class="settings-content">
          <div class="settings-tabs">
            <button class="tab-btn active" data-tab="graphics">Graphics</button>
            <button class="tab-btn" data-tab="controls">Controls</button>
            <button class="tab-btn" data-tab="game">Game</button>
            <button class="tab-btn" data-tab="accessibility">Accessibility</button>
          </div>
          <div class="settings-sections">
            <div class="settings-section active" id="settings-graphics"></div>
            <div class="settings-section" id="settings-controls"></div>
            <div class="settings-section" id="settings-game"></div>
            <div class="settings-section" id="settings-accessibility"></div>
          </div>
        </div>
        <div class="settings-footer">
          <button id="settings-reset">Reset to Defaults</button>
          <button id="settings-apply" class="primary">Apply</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.container);
    this.populateSettings();
    this.setupEventListeners();
    this.applyStyles();
  }

  private populateSettings(): void {
    this.populateGraphicsSettings();
    this.populateControlSettings();
    this.populateGameSettings();
    this.populateAccessibilitySettings();
  }

  private populateGraphicsSettings(): void {
    const section = document.getElementById('settings-graphics');
    if (!section) return;

    section.innerHTML = `
      <h3>Rendering</h3>
      <div class="setting-group">
        ${this.createSelect('renderMode', 'Render Mode', [
          { value: 'cubes', label: 'Cubes' },
          { value: 'organic', label: 'Organic (Metaballs)' }
        ], this.graphics.renderMode)}
        ${this.createSlider('viewDistance', 'View Distance', 50, 200, this.graphics.viewDistance, 'units')}
        ${this.createSelect('shadowQuality', 'Shadow Quality', [
          { value: 'low', label: 'Low' },
          { value: 'medium', label: 'Medium' },
          { value: 'high', label: 'High' },
          { value: 'ultra', label: 'Ultra' }
        ], this.graphics.shadowQuality)}
      </div>

      <h3>Post-Processing</h3>
      <div class="setting-group">
        ${this.createToggle('enableBloom', 'Bloom', this.graphics.enableBloom)}
        ${this.createToggle('enableSSAO', 'SSAO', this.graphics.enableSSAO)}
        ${this.createToggle('enableDOF', 'Depth of Field', this.graphics.enableDOF)}
        ${this.createToggle('enableMotionBlur', 'Motion Blur', this.graphics.enableMotionBlur)}
        ${this.createToggle('enableGodRays', 'God Rays', this.graphics.enableGodRays)}
      </div>

      <h3>Performance</h3>
      <div class="setting-group">
        ${this.createToggle('enableGreedyMeshing', 'Greedy Meshing', this.graphics.enableGreedyMeshing)}
        ${this.createToggle('enableFrustumCulling', 'Frustum Culling', this.graphics.enableFrustumCulling)}
        ${this.createToggle('enableParticles', 'Particle Effects', this.graphics.enableParticles)}
        ${this.createSlider('particleLimit', 'Particle Limit', 1000, 20000, this.graphics.particleLimit, 'particles')}
      </div>
    `;
  }

  private populateControlSettings(): void {
    const section = document.getElementById('settings-controls');
    if (!section) return;

    section.innerHTML = `
      <h3>Mouse</h3>
      <div class="setting-group">
        ${this.createSlider('mouseSensitivity', 'Mouse Sensitivity', 0.1, 2.0, this.controls.mouseSensitivity, '', 0.1)}
        ${this.createToggle('invertY', 'Invert Y Axis', this.controls.invertY)}
      </div>

      <h3>Movement</h3>
      <div class="setting-group">
        ${this.createSlider('walkSpeed', 'Walk Speed', 5, 20, this.controls.walkSpeed, 'units/s')}
        ${this.createSlider('flySpeed', 'Fly Speed', 10, 50, this.controls.flySpeed, 'units/s')}
        ${this.createToggle('sprintToggle', 'Sprint Toggle', this.controls.sprintToggle)}
      </div>

      <h3>Key Bindings</h3>
      <div class="setting-group">
        <div class="keybind-info">
          <p>Movement: W A S D</p>
          <p>Jump/Fly Up: Space</p>
          <p>Fly Down: Ctrl</p>
          <p>Sprint: Shift</p>
          <p>Fly Mode: F</p>
          <p>God Mode: G</p>
          <p>Inventory: I</p>
          <p>Pattern Library: L</p>
        </div>
      </div>
    `;
  }

  private populateGameSettings(): void {
    const section = document.getElementById('settings-game');
    if (!section) return;

    section.innerHTML = `
      <h3>Simulation</h3>
      <div class="setting-group">
        ${this.createSlider('caSpeed', 'CA Update Speed', 1, 5, this.game.caSpeed, 'ticks/s')}
        ${this.createToggle('enableDirtyTracking', 'Dirty Region Tracking', this.game.enableDirtyTracking)}
        ${this.createToggle('enableWebWorkers', 'Web Workers', this.game.enableWebWorkers)}
      </div>

      <h3>Interface</h3>
      <div class="setting-group">
        ${this.createToggle('showFPS', 'Show FPS', this.game.showFPS)}
        ${this.createToggle('showCoordinates', 'Show Coordinates', this.game.showCoordinates)}
        ${this.createToggle('autoSave', 'Auto Save', this.game.autoSave)}
      </div>
    `;
  }

  private populateAccessibilitySettings(): void {
    const section = document.getElementById('settings-accessibility');
    if (!section) return;

    section.innerHTML = `
      <h3>Visual</h3>
      <div class="setting-group">
        ${this.createToggle('highContrast', 'High Contrast Mode', this.accessibility.highContrast)}
        ${this.createSelect('colorBlindMode', 'Color Blind Mode', [
          { value: 'none', label: 'None' },
          { value: 'protanopia', label: 'Protanopia (Red-blind)' },
          { value: 'deuteranopia', label: 'Deuteranopia (Green-blind)' },
          { value: 'tritanopia', label: 'Tritanopia (Blue-blind)' }
        ], this.accessibility.colorBlindMode)}
        ${this.createSlider('uiScale', 'UI Scale', 0.8, 1.5, this.accessibility.uiScale, 'x', 0.1)}
      </div>

      <h3>Motion</h3>
      <div class="setting-group">
        ${this.createToggle('reduceMotion', 'Reduce Motion', this.accessibility.reduceMotion)}
      </div>

      <h3>Assistive Technologies</h3>
      <div class="setting-group">
        ${this.createToggle('screenReader', 'Screen Reader Support', this.accessibility.screenReader)}
      </div>
    `;
  }

  private createToggle(key: string, label: string, value: boolean): string {
    return `
      <div class="setting-item">
        <label class="setting-label">${label}</label>
        <label class="toggle-switch">
          <input type="checkbox" data-setting="${key}" ${value ? 'checked' : ''}>
          <span class="toggle-slider"></span>
        </label>
      </div>
    `;
  }

  private createSlider(key: string, label: string, min: number, max: number, value: number, unit: string = '', step: number = 1): string {
    return `
      <div class="setting-item">
        <label class="setting-label">${label}</label>
        <div class="slider-container">
          <input type="range" class="setting-slider" data-setting="${key}"
                 min="${min}" max="${max}" step="${step}" value="${value}">
          <span class="slider-value" data-value="${key}">${value}${unit}</span>
        </div>
      </div>
    `;
  }

  private createSelect(key: string, label: string, options: Array<{value: string, label: string}>, value: string): string {
    return `
      <div class="setting-item">
        <label class="setting-label">${label}</label>
        <select class="setting-select" data-setting="${key}">
          ${options.map(opt => `
            <option value="${opt.value}" ${opt.value === value ? 'selected' : ''}>${opt.label}</option>
          `).join('')}
        </select>
      </div>
    `;
  }

  private setupEventListeners(): void {
    // Close button
    const closeBtn = document.getElementById('settings-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }

    // Tab switching
    const tabBtns = this.container?.querySelectorAll('.tab-btn');
    tabBtns?.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        this.switchTab(tab || 'graphics');
      });
    });

    // Settings inputs
    const checkboxes = this.container?.querySelectorAll('input[type="checkbox"]');
    checkboxes?.forEach(cb => {
      cb.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        const key = target.getAttribute('data-setting');
        if (key) this.updateSetting(key, target.checked);
      });
    });

    const sliders = this.container?.querySelectorAll('input[type="range"]');
    sliders?.forEach(slider => {
      slider.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        const key = target.getAttribute('data-setting');
        const valueSpan = this.container?.querySelector(`[data-value="${key}"]`);
        if (valueSpan) {
          valueSpan.textContent = target.value + (valueSpan.textContent?.match(/[a-z/]+$/i)?.[0] || '');
        }
      });

      slider.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        const key = target.getAttribute('data-setting');
        if (key) this.updateSetting(key, parseFloat(target.value));
      });
    });

    const selects = this.container?.querySelectorAll('select');
    selects?.forEach(select => {
      select.addEventListener('change', (e) => {
        const target = e.target as HTMLSelectElement;
        const key = target.getAttribute('data-setting');
        if (key) this.updateSetting(key, target.value);
      });
    });

    // Reset button
    const resetBtn = document.getElementById('settings-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetToDefaults());
    }

    // Apply button
    const applyBtn = document.getElementById('settings-apply');
    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        this.saveAllSettings();
        this.hide();
      });
    }

    // ESC to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible) {
        this.hide();
      }
    });
  }

  private switchTab(tab: string): void {
    const tabBtns = this.container?.querySelectorAll('.tab-btn');
    const sections = this.container?.querySelectorAll('.settings-section');

    tabBtns?.forEach(btn => {
      if (btn.getAttribute('data-tab') === tab) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    sections?.forEach(section => {
      if (section.id === `settings-${tab}`) {
        section.classList.add('active');
      } else {
        section.classList.remove('active');
      }
    });
  }

  private updateSetting(key: string, value: any): void {
    // Update internal state
    if (key in this.graphics) {
      (this.graphics as any)[key] = value;
    } else if (key in this.controls) {
      (this.controls as any)[key] = value;
    } else if (key in this.accessibility) {
      (this.accessibility as any)[key] = value;
    } else if (key in this.game) {
      (this.game as any)[key] = value;
    }

    // Call registered callback
    const callback = this.callbacks.get(key);
    if (callback) {
      callback(value);
    }
  }

  private resetToDefaults(): void {
    if (!confirm('Reset all settings to defaults?')) return;

    localStorage.removeItem('genesis-graphics-settings');
    localStorage.removeItem('genesis-control-settings');
    localStorage.removeItem('genesis-accessibility-settings');
    localStorage.removeItem('genesis-game-settings');

    this.graphics = this.loadGraphicsSettings();
    this.controls = this.loadControlSettings();
    this.accessibility = this.loadAccessibilitySettings();
    this.game = this.loadGameSettings();

    this.populateSettings();
    this.setupEventListeners();
  }

  private applyStyles(): void {
    if (document.getElementById('settings-styles')) return;

    const style = document.createElement('style');
    style.id = 'settings-styles';
    style.textContent = `
      .settings-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.9);
        backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        opacity: 1;
        transition: opacity 0.3s ease;
      }

      .settings-container.hidden {
        display: none;
        opacity: 0;
      }

      .settings-panel {
        background: rgba(20, 20, 30, 0.95);
        border: 2px solid rgba(80, 227, 194, 0.3);
        border-radius: 12px;
        padding: 20px;
        width: 90%;
        max-width: 800px;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      }

      .settings-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 1px solid rgba(80, 227, 194, 0.2);
      }

      .settings-header h2 {
        color: #50e3c2;
        font-size: 24px;
        margin: 0;
      }

      .settings-content {
        flex: 1;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .settings-tabs {
        display: flex;
        gap: 10px;
        margin-bottom: 20px;
      }

      .tab-btn {
        flex: 1;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #fff;
        padding: 12px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .tab-btn:hover {
        background: rgba(80, 227, 194, 0.2);
      }

      .tab-btn.active {
        background: rgba(80, 227, 194, 0.3);
        border-color: rgba(80, 227, 194, 0.7);
        color: #50e3c2;
        font-weight: bold;
      }

      .settings-sections {
        flex: 1;
        overflow-y: auto;
      }

      .settings-section {
        display: none;
      }

      .settings-section.active {
        display: block;
      }

      .settings-section h3 {
        color: #50e3c2;
        font-size: 18px;
        margin: 20px 0 15px 0;
      }

      .settings-section h3:first-child {
        margin-top: 0;
      }

      .setting-group {
        background: rgba(0, 0, 0, 0.3);
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 15px;
      }

      .setting-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      }

      .setting-item:last-child {
        border-bottom: none;
      }

      .setting-label {
        color: #fff;
        flex: 1;
      }

      .toggle-switch {
        position: relative;
        width: 50px;
        height: 26px;
        cursor: pointer;
      }

      .toggle-switch input {
        display: none;
      }

      .toggle-slider {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 26px;
        transition: 0.3s;
      }

      .toggle-slider:before {
        content: "";
        position: absolute;
        height: 20px;
        width: 20px;
        left: 3px;
        bottom: 3px;
        background: white;
        border-radius: 50%;
        transition: 0.3s;
      }

      .toggle-switch input:checked + .toggle-slider {
        background: #50e3c2;
      }

      .toggle-switch input:checked + .toggle-slider:before {
        transform: translateX(24px);
      }

      .slider-container {
        display: flex;
        align-items: center;
        gap: 15px;
        flex: 1;
        max-width: 300px;
      }

      .setting-slider {
        flex: 1;
        height: 4px;
        border-radius: 2px;
        background: rgba(255, 255, 255, 0.2);
        outline: none;
        -webkit-appearance: none;
      }

      .setting-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 16px;
        height: 16px;
        background: #50e3c2;
        border-radius: 50%;
        cursor: pointer;
      }

      .slider-value {
        color: #50e3c2;
        font-weight: bold;
        min-width: 80px;
        text-align: right;
      }

      .setting-select {
        background: rgba(0, 0, 0, 0.4);
        border: 1px solid rgba(80, 227, 194, 0.5);
        color: #fff;
        padding: 8px 12px;
        border-radius: 6px;
        cursor: pointer;
        min-width: 200px;
      }

      .keybind-info {
        color: rgba(255, 255, 255, 0.8);
        line-height: 1.8;
      }

      .keybind-info p {
        margin: 5px 0;
      }

      .settings-footer {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        padding-top: 15px;
        border-top: 1px solid rgba(80, 227, 194, 0.2);
        margin-top: 20px;
      }

      .settings-footer button {
        background: rgba(80, 227, 194, 0.2);
        border: 1px solid rgba(80, 227, 194, 0.5);
        color: #50e3c2;
        padding: 10px 20px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .settings-footer button:hover {
        background: rgba(80, 227, 194, 0.3);
        transform: translateY(-1px);
      }

      .settings-footer button.primary {
        background: rgba(80, 227, 194, 0.4);
        font-weight: bold;
      }
    `;
    document.head.appendChild(style);
  }

  show(): void {
    if (!this.container) return;
    this.isVisible = true;
    this.container.classList.remove('hidden');
    document.exitPointerLock();
  }

  hide(): void {
    if (!this.container) return;
    this.isVisible = false;
    this.container.classList.add('hidden');
  }

  toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  onSettingChange(key: string, callback: (value: any) => void): void {
    this.callbacks.set(key, callback);
  }

  getGraphicsSettings(): GraphicsSettings {
    return { ...this.graphics };
  }

  getControlSettings(): ControlSettings {
    return { ...this.controls };
  }

  getAccessibilitySettings(): AccessibilitySettings {
    return { ...this.accessibility };
  }

  getGameSettings(): GameSettings {
    return { ...this.game };
  }

  dispose(): void {
    if (this.container) {
      this.container.remove();
    }
  }
}
