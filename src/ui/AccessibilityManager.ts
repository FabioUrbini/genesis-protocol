/**
 * AccessibilityManager.ts
 * Comprehensive accessibility features manager
 */

import { UITheme } from './UITheme';

export interface AccessibilitySettings {
  highContrast: boolean;
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  uiScale: number;
  reduceMotion: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  captions: boolean;
  audioDescriptions: boolean;
}

export class AccessibilityManager {
  private settings: AccessibilitySettings;
  private theme: UITheme;
  private liveRegion: HTMLElement | null = null;

  constructor() {
    this.theme = UITheme.getInstance();
    this.settings = this.loadSettings();
    this.init();
  }

  private loadSettings(): AccessibilitySettings {
    const stored = localStorage.getItem('genesis-accessibility-settings');
    return stored ? JSON.parse(stored) : {
      highContrast: false,
      colorBlindMode: 'none',
      uiScale: 1.0,
      reduceMotion: false,
      screenReader: false,
      keyboardNavigation: true,
      captions: false,
      audioDescriptions: false
    };
  }

  private saveSettings(): void {
    localStorage.setItem('genesis-accessibility-settings', JSON.stringify(this.settings));
  }

  private init(): void {
    this.applySettings();
    this.createLiveRegion();
    this.setupKeyboardNavigation();
    this.detectSystemPreferences();
  }

  /**
   * Create ARIA live region for screen reader announcements
   */
  private createLiveRegion(): void {
    this.liveRegion = document.createElement('div');
    this.liveRegion.setAttribute('role', 'status');
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.setAttribute('aria-atomic', 'true');
    this.liveRegion.className = 'sr-only';
    document.body.appendChild(this.liveRegion);
  }

  /**
   * Announce message to screen readers
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.liveRegion || !this.settings.screenReader) return;

    this.liveRegion.setAttribute('aria-live', priority);
    this.liveRegion.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      if (this.liveRegion) {
        this.liveRegion.textContent = '';
      }
    }, 1000);
  }

  /**
   * Setup keyboard navigation
   */
  private setupKeyboardNavigation(): void {
    if (!this.settings.keyboardNavigation) return;

    document.addEventListener('keydown', (e) => {
      // Tab navigation enhancement
      if (e.key === 'Tab') {
        this.updateFocusableElements();
      }

      // Escape key handling
      if (e.key === 'Escape') {
        this.handleEscape();
      }

      // Arrow key navigation for custom controls
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        this.handleArrowKey(e);
      }
    });

    // Focus visible enhancement
    document.addEventListener('mousedown', () => {
      document.body.classList.add('using-mouse');
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.remove('using-mouse');
      }
    });
  }

  /**
   * Update list of focusable elements
   */
  private updateFocusableElements(): void {
    // Updates focus tracking - focusable elements are queried dynamically elsewhere
  }

  /**
   * Handle escape key
   */
  private handleEscape(): void {
    // Close modals, menus, etc.
    const modals = document.querySelectorAll('[role="dialog"]:not(.hidden)');
    modals.forEach(modal => {
      const closeBtn = modal.querySelector('[data-close]') as HTMLElement;
      if (closeBtn) {
        closeBtn.click();
      }
    });

    this.announce('Closed', 'polite');
  }

  /**
   * Handle arrow key navigation
   */
  private handleArrowKey(e: KeyboardEvent): void {
    const activeElement = document.activeElement as HTMLElement;
    if (!activeElement) return;

    // Check if element is part of a custom control group
    const controlGroup = activeElement.closest('[role="radiogroup"], [role="menu"], [role="listbox"]');
    if (!controlGroup) return;

    e.preventDefault();

    const items = Array.from(controlGroup.querySelectorAll('[role="radio"], [role="menuitem"], [role="option"]')) as HTMLElement[];
    const currentIndex = items.indexOf(activeElement);

    let newIndex = currentIndex;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      newIndex = (currentIndex + 1) % items.length;
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      newIndex = (currentIndex - 1 + items.length) % items.length;
    }

    items[newIndex]?.focus();
  }

  /**
   * Detect system preferences
   */
  private detectSystemPreferences(): void {
    // Detect prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion && !this.settings.reduceMotion) {
      this.setReduceMotion(true);
    }

    // Detect prefers-contrast
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    if (prefersHighContrast && !this.settings.highContrast) {
      this.setHighContrast(true);
    }

    // Listen for changes
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      this.setReduceMotion(e.matches);
    });

    window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
      this.setHighContrast(e.matches);
    });
  }

  /**
   * Apply all settings
   */
  private applySettings(): void {
    this.theme.setHighContrast(this.settings.highContrast);
    this.theme.setColorBlindMode(this.settings.colorBlindMode);
    this.theme.setUIScale(this.settings.uiScale);
    this.theme.setReduceMotion(this.settings.reduceMotion);
  }

  /**
   * Set high contrast mode
   */
  setHighContrast(enabled: boolean): void {
    this.settings.highContrast = enabled;
    this.theme.setHighContrast(enabled);
    this.saveSettings();
    this.announce(`High contrast ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Set color blind mode
   */
  setColorBlindMode(mode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia'): void {
    this.settings.colorBlindMode = mode;
    this.theme.setColorBlindMode(mode);
    this.saveSettings();

    const modeNames = {
      none: 'None',
      protanopia: 'Protanopia',
      deuteranopia: 'Deuteranopia',
      tritanopia: 'Tritanopia'
    };
    this.announce(`Color blind mode set to ${modeNames[mode]}`);
  }

  /**
   * Set UI scale
   */
  setUIScale(scale: number): void {
    this.settings.uiScale = Math.max(0.8, Math.min(1.5, scale));
    this.theme.setUIScale(this.settings.uiScale);
    this.saveSettings();
    this.announce(`UI scale set to ${Math.round(this.settings.uiScale * 100)}%`);
  }

  /**
   * Set reduce motion
   */
  setReduceMotion(reduce: boolean): void {
    this.settings.reduceMotion = reduce;
    this.theme.setReduceMotion(reduce);
    this.saveSettings();
    this.announce(`Reduced motion ${reduce ? 'enabled' : 'disabled'}`);
  }

  /**
   * Set screen reader mode
   */
  setScreenReader(enabled: boolean): void {
    this.settings.screenReader = enabled;
    this.saveSettings();

    if (enabled) {
      document.body.setAttribute('aria-live', 'polite');
      this.announce('Screen reader support enabled');
    } else {
      document.body.removeAttribute('aria-live');
    }
  }

  /**
   * Set keyboard navigation
   */
  setKeyboardNavigation(enabled: boolean): void {
    this.settings.keyboardNavigation = enabled;
    this.saveSettings();
    this.announce(`Keyboard navigation ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Add skip link
   */
  addSkipLink(targetId: string, label: string = 'Skip to main content'): void {
    const skipLink = document.createElement('a');
    skipLink.href = `#${targetId}`;
    skipLink.className = 'skip-to-main';
    skipLink.textContent = label;
    document.body.insertBefore(skipLink, document.body.firstChild);
  }

  /**
   * Make element focusable and add ARIA label
   */
  makeAccessible(element: HTMLElement, label: string, role?: string): void {
    if (!element.hasAttribute('tabindex')) {
      element.setAttribute('tabindex', '0');
    }
    element.setAttribute('aria-label', label);
    if (role) {
      element.setAttribute('role', role);
    }
  }

  /**
   * Create accessible button
   */
  createAccessibleButton(label: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = label;
    button.setAttribute('aria-label', label);
    button.className = 'glass-button';
    button.addEventListener('click', onClick);
    return button;
  }

  /**
   * Set focus trap (for modals)
   */
  setFocusTrap(container: HTMLElement, active: boolean): void {
    if (active) {
      const focusableElements = container.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ) as NodeListOf<HTMLElement>;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      const trapFocus = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      };

      container.addEventListener('keydown', trapFocus);
      firstElement?.focus();
    }
  }

  /**
   * Get current settings
   */
  getSettings(): AccessibilitySettings {
    return { ...this.settings };
  }

  /**
   * Update settings
   */
  updateSettings(settings: Partial<AccessibilitySettings>): void {
    this.settings = { ...this.settings, ...settings };
    this.applySettings();
    this.saveSettings();
  }

  /**
   * Reset to defaults
   */
  reset(): void {
    this.settings = {
      highContrast: false,
      colorBlindMode: 'none',
      uiScale: 1.0,
      reduceMotion: false,
      screenReader: false,
      keyboardNavigation: true,
      captions: false,
      audioDescriptions: false
    };
    this.applySettings();
    this.saveSettings();
    this.announce('Accessibility settings reset to defaults');
  }

  /**
   * Dispose
   */
  dispose(): void {
    if (this.liveRegion) {
      this.liveRegion.remove();
    }
  }
}
