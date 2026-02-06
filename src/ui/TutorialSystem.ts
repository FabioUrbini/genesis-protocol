/**
 * TutorialSystem.ts
 * Interactive tutorial and onboarding system
 */

export interface TutorialStep {
  id: string;
  title: string;
  message: string;
  target?: string; // CSS selector for highlighting
  action?: 'click' | 'keypress' | 'move' | 'auto';
  key?: string; // For keypress actions
  duration?: number; // For auto-advance (ms)
  onComplete?: () => void;
}

export class TutorialSystem {
  private container: HTMLElement | null = null;
  private overlay: HTMLElement | null = null;
  private isActive: boolean = false;
  private currentStepIndex: number = 0;
  private steps: TutorialStep[] = [];
  private completedTutorials: Set<string> = new Set();
  private onCompleteCallback?: () => void;

  constructor() {
    this.loadProgress();
    this.createUI();
    this.setupDefaultTutorial();
  }

  private loadProgress(): void {
    const stored = localStorage.getItem('genesis-tutorial-progress');
    if (stored) {
      this.completedTutorials = new Set(JSON.parse(stored));
    }
  }

  private saveProgress(): void {
    localStorage.setItem('genesis-tutorial-progress', JSON.stringify([...this.completedTutorials]));
  }

  private createUI(): void {
    // Overlay for highlighting
    this.overlay = document.createElement('div');
    this.overlay.id = 'tutorial-overlay';
    this.overlay.className = 'tutorial-overlay hidden';

    // Tutorial container
    this.container = document.createElement('div');
    this.container.id = 'tutorial-container';
    this.container.className = 'tutorial-container hidden';
    this.container.innerHTML = `
      <div class="tutorial-box">
        <div class="tutorial-header">
          <span class="tutorial-step">Step <span id="tutorial-current">1</span>/<span id="tutorial-total">1</span></span>
          <button class="tutorial-skip" id="tutorial-skip">Skip Tutorial</button>
        </div>
        <h3 class="tutorial-title" id="tutorial-title"></h3>
        <p class="tutorial-message" id="tutorial-message"></p>
        <div class="tutorial-progress-bar">
          <div class="tutorial-progress-fill" id="tutorial-progress"></div>
        </div>
        <div class="tutorial-actions">
          <button class="tutorial-btn" id="tutorial-prev">Previous</button>
          <button class="tutorial-btn primary" id="tutorial-next">Next</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.overlay);
    document.body.appendChild(this.container);

    this.applyStyles();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const skipBtn = document.getElementById('tutorial-skip');
    if (skipBtn) {
      skipBtn.addEventListener('click', () => this.skip());
    }

    const prevBtn = document.getElementById('tutorial-prev');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.previousStep());
    }

    const nextBtn = document.getElementById('tutorial-next');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.nextStep());
    }

    // Listen for actions
    document.addEventListener('keydown', (e) => {
      if (!this.isActive) return;
      const step = this.steps[this.currentStepIndex];
      if (step && step.action === 'keypress' && e.key === step.key) {
        this.nextStep();
      }
    });

    document.addEventListener('click', (e) => {
      if (!this.isActive) return;
      const step = this.steps[this.currentStepIndex];
      if (step && step.action === 'click' && step.target) {
        const target = document.querySelector(step.target);
        if (target && target.contains(e.target as Node)) {
          this.nextStep();
        }
      }
    });
  }

  private setupDefaultTutorial(): void {
    this.steps = [
      {
        id: 'welcome',
        title: 'Welcome to Genesis Protocol',
        message: 'A 3D world governed by cellular automaton rules. Let\'s learn the basics!',
        action: 'auto',
        duration: 3000
      },
      {
        id: 'movement',
        title: 'Movement Controls',
        message: 'Use WASD to move, Space to jump, and mouse to look around. Try moving now!',
        action: 'move'
      },
      {
        id: 'fly-mode',
        title: 'Fly Mode',
        message: 'Press F to toggle fly mode for unrestricted movement. Perfect for exploration!',
        action: 'keypress',
        key: 'f'
      },
      {
        id: 'voxel-interaction',
        title: 'Voxel Interaction',
        message: 'Left-click to remove voxels, Right-click to place them. Middle-click to pick a voxel type.',
        action: 'auto',
        duration: 4000
      },
      {
        id: 'time-control',
        title: 'Time Manipulation',
        message: 'Control the simulation: P to pause, [ and ] to adjust speed, comma to rewind.',
        action: 'auto',
        duration: 4000
      },
      {
        id: 'inventory',
        title: 'Inventory System',
        message: 'Press I to open your inventory. Collect resources by breaking voxels.',
        action: 'keypress',
        key: 'i'
      },
      {
        id: 'patterns',
        title: 'Pattern Library',
        message: 'Press L to open the pattern library. Save and spawn complex CA patterns!',
        action: 'auto',
        duration: 3000
      },
      {
        id: 'energy',
        title: 'Energy & Oxygen',
        message: 'Watch your energy and oxygen levels. Find cyan crystallized voxels to restore them!',
        action: 'auto',
        duration: 4000
      },
      {
        id: 'complete',
        title: 'You\'re Ready!',
        message: 'Explore biomes, build structures, and manipulate time. Press ESC anytime to access settings. Have fun!',
        action: 'auto',
        duration: 3000
      }
    ];
  }

  start(tutorialId: string = 'default', onComplete?: () => void): void {
    if (this.completedTutorials.has(tutorialId) && !this.shouldRepeat(tutorialId)) {
      return;
    }

    this.isActive = true;
    this.currentStepIndex = 0;
    this.onCompleteCallback = onComplete;

    this.show();
    this.showStep(0);
  }

  private show(): void {
    if (this.container) {
      this.container.classList.remove('hidden');
    }
    if (this.overlay) {
      this.overlay.classList.remove('hidden');
    }
  }

  private hide(): void {
    if (this.container) {
      this.container.classList.add('hidden');
    }
    if (this.overlay) {
      this.overlay.classList.add('hidden');
    }
    this.isActive = false;
  }

  private showStep(index: number): void {
    if (index < 0 || index >= this.steps.length) return;

    const step = this.steps[index];
    this.currentStepIndex = index;

    // Update UI
    const title = document.getElementById('tutorial-title');
    const message = document.getElementById('tutorial-message');
    const current = document.getElementById('tutorial-current');
    const total = document.getElementById('tutorial-total');
    const progress = document.getElementById('tutorial-progress');
    const prevBtn = document.getElementById('tutorial-prev');
    const nextBtn = document.getElementById('tutorial-next');

    if (title) title.textContent = step.title;
    if (message) message.textContent = step.message;
    if (current) current.textContent = (index + 1).toString();
    if (total) total.textContent = this.steps.length.toString();
    if (progress) {
      const percentage = ((index + 1) / this.steps.length) * 100;
      progress.style.width = percentage + '%';
    }

    // Update button states
    if (prevBtn) {
      prevBtn.style.display = index > 0 ? 'block' : 'none';
    }
    if (nextBtn) {
      if (step.action && step.action !== 'auto') {
        nextBtn.textContent = this.getActionText(step.action, step.key);
        nextBtn.disabled = true;
        nextBtn.style.opacity = '0.5';
      } else {
        nextBtn.textContent = index === this.steps.length - 1 ? 'Finish' : 'Next';
        nextBtn.disabled = false;
        nextBtn.style.opacity = '1';
      }
    }

    // Highlight target if specified
    if (step.target) {
      this.highlightElement(step.target);
    } else {
      this.clearHighlight();
    }

    // Auto-advance if specified
    if (step.action === 'auto' && step.duration) {
      setTimeout(() => {
        if (this.currentStepIndex === index) {
          this.nextStep();
        }
      }, step.duration);
    }
  }

  private getActionText(action: string, key?: string): string {
    switch (action) {
      case 'keypress':
        return `Press ${key?.toUpperCase()}`;
      case 'click':
        return 'Click highlighted element';
      case 'move':
        return 'Move around to continue';
      default:
        return 'Complete action';
    }
  }

  private highlightElement(selector: string): void {
    this.clearHighlight();
    const element = document.querySelector(selector);
    if (element) {
      element.classList.add('tutorial-highlight');
    }
  }

  private clearHighlight(): void {
    const highlighted = document.querySelectorAll('.tutorial-highlight');
    highlighted.forEach(el => el.classList.remove('tutorial-highlight'));
  }

  nextStep(): void {
    const step = this.steps[this.currentStepIndex];
    if (step.onComplete) {
      step.onComplete();
    }

    if (this.currentStepIndex < this.steps.length - 1) {
      this.showStep(this.currentStepIndex + 1);
    } else {
      this.complete();
    }
  }

  previousStep(): void {
    if (this.currentStepIndex > 0) {
      this.showStep(this.currentStepIndex - 1);
    }
  }

  skip(): void {
    if (confirm('Skip the tutorial? You can restart it from the settings menu.')) {
      this.complete(true);
    }
  }

  private complete(skipped: boolean = false): void {
    if (!skipped) {
      this.completedTutorials.add('default');
      this.saveProgress();
    }

    this.hide();
    this.clearHighlight();

    if (this.onCompleteCallback) {
      this.onCompleteCallback();
    }
  }

  private shouldRepeat(tutorialId: string): boolean {
    // Could implement logic to check if user wants to repeat
    return false;
  }

  reset(): void {
    this.completedTutorials.clear();
    this.saveProgress();
  }

  hasCompletedTutorial(tutorialId: string): boolean {
    return this.completedTutorials.has(tutorialId);
  }

  private applyStyles(): void {
    if (document.getElementById('tutorial-styles')) return;

    const style = document.createElement('style');
    style.id = 'tutorial-styles';
    style.textContent = `
      .tutorial-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.7);
        z-index: 999;
        pointer-events: none;
      }

      .tutorial-overlay.hidden {
        display: none;
      }

      .tutorial-container {
        position: fixed;
        bottom: 40px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1001;
        pointer-events: auto;
      }

      .tutorial-container.hidden {
        display: none;
      }

      .tutorial-box {
        background: rgba(20, 20, 30, 0.98);
        border: 2px solid rgba(80, 227, 194, 0.5);
        border-radius: 12px;
        padding: 25px;
        min-width: 500px;
        max-width: 600px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
        animation: tutorialSlideUp 0.4s ease-out;
      }

      @keyframes tutorialSlideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .tutorial-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
      }

      .tutorial-step {
        color: rgba(80, 227, 194, 0.8);
        font-size: 14px;
        font-weight: bold;
      }

      .tutorial-skip {
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.6);
        font-size: 12px;
        cursor: pointer;
        transition: color 0.2s;
      }

      .tutorial-skip:hover {
        color: #fff;
      }

      .tutorial-title {
        color: #50e3c2;
        font-size: 22px;
        margin: 0 0 15px 0;
      }

      .tutorial-message {
        color: #fff;
        font-size: 16px;
        line-height: 1.6;
        margin: 0 0 20px 0;
      }

      .tutorial-progress-bar {
        height: 4px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 2px;
        margin-bottom: 20px;
        overflow: hidden;
      }

      .tutorial-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #50e3c2, #3498db);
        transition: width 0.3s ease;
      }

      .tutorial-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
      }

      .tutorial-btn {
        background: rgba(80, 227, 194, 0.2);
        border: 1px solid rgba(80, 227, 194, 0.5);
        color: #50e3c2;
        padding: 10px 20px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 14px;
        font-weight: bold;
      }

      .tutorial-btn:hover:not(:disabled) {
        background: rgba(80, 227, 194, 0.3);
        transform: translateY(-1px);
      }

      .tutorial-btn:disabled {
        cursor: not-allowed;
      }

      .tutorial-btn.primary {
        background: rgba(80, 227, 194, 0.4);
      }

      .tutorial-highlight {
        position: relative;
        z-index: 1000;
        box-shadow: 0 0 0 4px rgba(80, 227, 194, 0.5), 0 0 20px rgba(80, 227, 194, 0.3);
        animation: tutorialPulse 2s infinite;
      }

      @keyframes tutorialPulse {
        0%, 100% {
          box-shadow: 0 0 0 4px rgba(80, 227, 194, 0.5), 0 0 20px rgba(80, 227, 194, 0.3);
        }
        50% {
          box-shadow: 0 0 0 8px rgba(80, 227, 194, 0.3), 0 0 30px rgba(80, 227, 194, 0.5);
        }
      }
    `;
    document.head.appendChild(style);
  }

  dispose(): void {
    if (this.container) {
      this.container.remove();
    }
    if (this.overlay) {
      this.overlay.remove();
    }
  }
}
