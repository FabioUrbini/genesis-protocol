/**
 * UITheme.ts
 * Glassmorphism UI theme with accessibility support
 */

export class UITheme {
  private static instance: UITheme;
  private styleElement: HTMLStyleElement | null = null;
  private highContrast: boolean = false;
  private uiScale: number = 1.0;
  private colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' = 'none';

  private constructor() {
    this.applyGlassmorphismStyles();
  }

  static getInstance(): UITheme {
    if (!UITheme.instance) {
      UITheme.instance = new UITheme();
    }
    return UITheme.instance;
  }

  private applyGlassmorphismStyles(): void {
    if (document.getElementById('glassmorphism-theme')) return;

    this.styleElement = document.createElement('style');
    this.styleElement.id = 'glassmorphism-theme';
    this.styleElement.textContent = `
      /* Glassmorphism Theme */
      :root {
        --glass-bg: rgba(255, 255, 255, 0.1);
        --glass-border: rgba(255, 255, 255, 0.2);
        --glass-shadow: rgba(0, 0, 0, 0.1);
        --primary-color: #50e3c2;
        --primary-glow: rgba(80, 227, 194, 0.3);
        --danger-color: #e74c3c;
        --success-color: #2ecc71;
        --warning-color: #f39c12;
        --ui-scale: 1.0;
      }

      /* Glass Panel Base */
      .glass-panel {
        background: rgba(20, 20, 30, 0.7);
        backdrop-filter: blur(20px) saturate(180%);
        -webkit-backdrop-filter: blur(20px) saturate(180%);
        border: 1px solid var(--glass-border);
        border-radius: calc(12px * var(--ui-scale));
        box-shadow: 0 8px 32px var(--glass-shadow);
      }

      .glass-panel-light {
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(15px) saturate(150%);
        -webkit-backdrop-filter: blur(15px) saturate(150%);
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: calc(10px * var(--ui-scale));
      }

      /* Glass Button */
      .glass-button {
        background: rgba(80, 227, 194, 0.2);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid rgba(80, 227, 194, 0.5);
        border-radius: calc(8px * var(--ui-scale));
        color: var(--primary-color);
        padding: calc(10px * var(--ui-scale)) calc(20px * var(--ui-scale));
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: calc(14px * var(--ui-scale));
        font-weight: 600;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      }

      .glass-button:hover {
        background: rgba(80, 227, 194, 0.3);
        box-shadow: 0 4px 20px var(--primary-glow);
        transform: translateY(-2px);
      }

      .glass-button:active {
        transform: translateY(0);
      }

      .glass-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
      }

      /* Glass Input */
      .glass-input {
        background: rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: calc(8px * var(--ui-scale));
        color: #fff;
        padding: calc(10px * var(--ui-scale)) calc(15px * var(--ui-scale));
        font-size: calc(14px * var(--ui-scale));
        outline: none;
        transition: all 0.3s ease;
      }

      .glass-input:focus {
        border-color: var(--primary-color);
        box-shadow: 0 0 15px var(--primary-glow);
      }

      /* Glass Card */
      .glass-card {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: calc(10px * var(--ui-scale));
        padding: calc(15px * var(--ui-scale));
        transition: all 0.3s ease;
      }

      .glass-card:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(80, 227, 194, 0.3);
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
      }

      /* Glow Effects */
      .glow-primary {
        box-shadow: 0 0 20px var(--primary-glow);
        animation: pulseGlow 2s ease-in-out infinite;
      }

      @keyframes pulseGlow {
        0%, 100% {
          box-shadow: 0 0 20px var(--primary-glow);
        }
        50% {
          box-shadow: 0 0 30px var(--primary-glow), 0 0 40px var(--primary-glow);
        }
      }

      /* Frosted Glass Overlay */
      .frosted-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        z-index: 999;
      }

      /* Smooth Transitions */
      .smooth-transition {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      /* Focus States for Accessibility */
      *:focus-visible {
        outline: 2px solid var(--primary-color);
        outline-offset: 2px;
      }

      /* Reduced Motion */
      @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }

      /* Screen Reader Only */
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border-width: 0;
      }

      /* Skip to Main Content */
      .skip-to-main {
        position: absolute;
        top: -40px;
        left: 0;
        background: var(--primary-color);
        color: #000;
        padding: 8px;
        text-decoration: none;
        z-index: 10000;
      }

      .skip-to-main:focus {
        top: 0;
      }

      /* High Contrast Mode */
      body.high-contrast {
        --glass-bg: rgba(0, 0, 0, 0.95);
        --glass-border: rgba(255, 255, 255, 0.9);
        --primary-color: #00ff00;
      }

      body.high-contrast * {
        border-width: 2px !important;
      }

      body.high-contrast .glass-panel,
      body.high-contrast .glass-button,
      body.high-contrast .glass-card {
        background: rgba(0, 0, 0, 0.95);
        border: 2px solid #ffffff;
      }

      /* Color Blind Modes */
      body.protanopia {
        filter: url(#protanopia-filter);
      }

      body.deuteranopia {
        filter: url(#deuteranopia-filter);
      }

      body.tritanopia {
        filter: url(#tritanopia-filter);
      }

      /* Holographic Effect */
      .holographic {
        position: relative;
        overflow: hidden;
      }

      .holographic::before {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: linear-gradient(
          45deg,
          rgba(255, 255, 255, 0) 0%,
          rgba(255, 255, 255, 0.1) 50%,
          rgba(255, 255, 255, 0) 100%
        );
        animation: holographicShine 3s ease-in-out infinite;
        pointer-events: none;
      }

      @keyframes holographicShine {
        0% {
          transform: translateX(-100%) translateY(-100%) rotate(45deg);
        }
        100% {
          transform: translateX(100%) translateY(100%) rotate(45deg);
        }
      }

      /* Neon Text */
      .neon-text {
        color: var(--primary-color);
        text-shadow:
          0 0 10px var(--primary-glow),
          0 0 20px var(--primary-glow),
          0 0 30px var(--primary-glow);
        animation: neonPulse 1.5s ease-in-out infinite alternate;
      }

      @keyframes neonPulse {
        from {
          text-shadow:
            0 0 10px var(--primary-glow),
            0 0 20px var(--primary-glow),
            0 0 30px var(--primary-glow);
        }
        to {
          text-shadow:
            0 0 20px var(--primary-glow),
            0 0 30px var(--primary-glow),
            0 0 40px var(--primary-glow);
        }
      }

      /* Progress Bar */
      .glass-progress-bar {
        width: 100%;
        height: calc(8px * var(--ui-scale));
        background: rgba(0, 0, 0, 0.3);
        border-radius: calc(4px * var(--ui-scale));
        overflow: hidden;
        backdrop-filter: blur(5px);
      }

      .glass-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--primary-color), #3498db);
        border-radius: calc(4px * var(--ui-scale));
        transition: width 0.3s ease;
        box-shadow: 0 0 10px var(--primary-glow);
      }

      /* Tooltip */
      .glass-tooltip {
        position: absolute;
        background: rgba(0, 0, 0, 0.9);
        backdrop-filter: blur(10px);
        border: 1px solid var(--primary-color);
        border-radius: calc(6px * var(--ui-scale));
        padding: calc(8px * var(--ui-scale)) calc(12px * var(--ui-scale));
        color: #fff;
        font-size: calc(12px * var(--ui-scale));
        pointer-events: none;
        z-index: 10000;
        white-space: nowrap;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
      }

      /* Badge */
      .glass-badge {
        display: inline-block;
        background: rgba(80, 227, 194, 0.3);
        backdrop-filter: blur(5px);
        border: 1px solid var(--primary-color);
        border-radius: calc(12px * var(--ui-scale));
        padding: calc(4px * var(--ui-scale)) calc(10px * var(--ui-scale));
        color: var(--primary-color);
        font-size: calc(11px * var(--ui-scale));
        font-weight: bold;
      }

      /* Scrollbar Styling */
      .glass-scrollbar::-webkit-scrollbar {
        width: calc(8px * var(--ui-scale));
      }

      .glass-scrollbar::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.2);
        border-radius: calc(4px * var(--ui-scale));
      }

      .glass-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(80, 227, 194, 0.5);
        border-radius: calc(4px * var(--ui-scale));
      }

      .glass-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(80, 227, 194, 0.7);
      }
    `;

    document.head.appendChild(this.styleElement);
  }

  /**
   * Enable high contrast mode
   */
  setHighContrast(enabled: boolean): void {
    this.highContrast = enabled;
    if (enabled) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  }

  /**
   * Set UI scale
   */
  setUIScale(scale: number): void {
    this.uiScale = Math.max(0.8, Math.min(1.5, scale));
    document.documentElement.style.setProperty('--ui-scale', this.uiScale.toString());
  }

  /**
   * Set color blind mode
   */
  setColorBlindMode(mode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia'): void {
    // Remove all color blind classes
    document.body.classList.remove('protanopia', 'deuteranopia', 'tritanopia');

    this.colorBlindMode = mode;
    if (mode !== 'none') {
      document.body.classList.add(mode);
      this.ensureColorBlindFilters();
    }
  }

  /**
   * Ensure SVG filters for color blindness exist
   */
  private ensureColorBlindFilters(): void {
    if (document.getElementById('colorblind-filters')) return;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'colorblind-filters';
    svg.style.position = 'absolute';
    svg.style.width = '0';
    svg.style.height = '0';

    svg.innerHTML = `
      <defs>
        <!-- Protanopia (Red-blind) -->
        <filter id="protanopia-filter">
          <feColorMatrix type="matrix" values="
            0.567, 0.433, 0.000, 0, 0
            0.558, 0.442, 0.000, 0, 0
            0.000, 0.242, 0.758, 0, 0
            0, 0, 0, 1, 0"/>
        </filter>

        <!-- Deuteranopia (Green-blind) -->
        <filter id="deuteranopia-filter">
          <feColorMatrix type="matrix" values="
            0.625, 0.375, 0.000, 0, 0
            0.700, 0.300, 0.000, 0, 0
            0.000, 0.300, 0.700, 0, 0
            0, 0, 0, 1, 0"/>
        </filter>

        <!-- Tritanopia (Blue-blind) -->
        <filter id="tritanopia-filter">
          <feColorMatrix type="matrix" values="
            0.950, 0.050, 0.000, 0, 0
            0.000, 0.433, 0.567, 0, 0
            0.000, 0.475, 0.525, 0, 0
            0, 0, 0, 1, 0"/>
        </filter>
      </defs>
    `;

    document.body.appendChild(svg);
  }

  /**
   * Apply reduce motion preference
   */
  setReduceMotion(reduce: boolean): void {
    if (reduce) {
      document.documentElement.style.setProperty('--animation-speed', '0.01ms');
    } else {
      document.documentElement.style.removeProperty('--animation-speed');
    }
  }

  /**
   * Get current theme settings
   */
  getSettings() {
    return {
      highContrast: this.highContrast,
      uiScale: this.uiScale,
      colorBlindMode: this.colorBlindMode
    };
  }

  /**
   * Dispose
   */
  dispose(): void {
    if (this.styleElement) {
      this.styleElement.remove();
    }
  }
}
