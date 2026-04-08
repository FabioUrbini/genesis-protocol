import { Game } from './game/Game';
import { Game2D } from './game/Game2D';

/**
 * Main entry point for Genesis Protocol
 * Supports two world modes:
 *   - '3d'  : 3D voxel world (classic mode)
 *   - '2d'  : 2D big world (2000×2000 cellular automaton)
 */

// Get canvas element
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
if (!canvas) {
  throw new Error('Canvas element not found');
}

// Get UI elements
const loadingElement = document.getElementById('loading');

// Active game instances (only one runs at a time)
let game3D: Game | null = null;
let game2D: Game2D | null = null;

// Currently selected world mode (set by mode selection screen)
let selectedMode: '3d' | '2d' = '3d';

// ─── Mode Selection ──────────────────────────────────────────────────────────

/**
 * Wire up the mode selection buttons in the menu screen
 */
function setupModeSelection(): void {
  const btn3D = document.getElementById('mode-btn-3d');
  const btn2D = document.getElementById('mode-btn-2d');
  const modeScreen = document.getElementById('mode-selection');
  const instructions3D = document.getElementById('instructions');
  const instructions2D = document.getElementById('instructions-2d');

  if (!btn3D || !btn2D || !modeScreen) return;

  function selectMode(mode: '3d' | '2d'): void {
    selectedMode = mode;

    // Highlight active button
    btn3D!.classList.toggle('mode-btn-active', mode === '3d');
    btn2D!.classList.toggle('mode-btn-active', mode === '2d');

    // Keep instructions hidden during mode selection — they'll show during gameplay
    if (instructions3D) instructions3D.classList.add('hidden');
    if (instructions2D) instructions2D.classList.add('hidden');
  }

  btn3D.addEventListener('click', () => selectMode('3d'));
  btn2D.addEventListener('click', () => selectMode('2d'));

  // Default: 3D mode selected
  selectMode('3d');

  // Start button
  const startBtn = document.getElementById('start-btn');
  if (startBtn) {
    startBtn.addEventListener('click', async () => {
      modeScreen.classList.add('hidden');
      if (selectedMode === '2d') {
        await init2D();
      } else {
        // 3D mode: show instructions, pointer lock will do the rest
        if (instructions3D) instructions3D.classList.remove('hidden');
        // Click the canvas to trigger pointer lock (3D mode listens for this)
        await init3D();
      }
    });
  }
}

// ─── 3D Mode ────────────────────────────────────────────────────────────────

async function init3D(): Promise<void> {
  try {
    if (loadingElement) {
      loadingElement.classList.remove('hidden');
      loadingElement.innerHTML = `<div>Genesis Protocol</div><div style="font-size:16px;margin-top:10px;">Loading 3D world…</div>`;
    }

    // Grid size: 32x32x32 voxels; CA update interval: 2000ms
    game3D = new Game(canvas, 32, 2000);

    if (loadingElement) loadingElement.classList.add('hidden');

    game3D.start();

    // Keyboard shortcuts for 3D mode
    document.addEventListener('keydown', on3DKeyDown);

    console.warn('Genesis Protocol 3D mode initialized');
  } catch (error) {
    console.error('Failed to initialize 3D mode:', error);
    if (loadingElement) {
      loadingElement.innerHTML = `
        <div>Genesis Protocol</div>
        <div style="font-size:16px;margin-top:10px;color:#e74c3c;">
          Error: ${error instanceof Error ? error.message : 'Unknown error'}
        </div>
      `;
      loadingElement.classList.remove('hidden');
    }
  }
}

function on3DKeyDown(event: KeyboardEvent): void {
  if (!game3D) return;
  switch (event.key.toLowerCase()) {
    case 'r':
      game3D.reset();
      console.warn('Simulation reset');
      break;
    case 'p':
      event.preventDefault();
      game3D.timeManipulation.togglePause();
      game3D.setCAUpdateInterval(game3D.timeManipulation.getUpdateInterval());
      break;
    case 'z':
      game3D.timeManipulation.toggleReverse();
      game3D.setCAUpdateInterval(game3D.timeManipulation.getUpdateInterval());
      break;
    case '1': case '2': case '3': case '4': case '5':
    case '6': case '7': case '8': case '9': case '0': {
      const level = event.key === '0' ? 10 : parseInt(event.key);
      game3D.timeManipulation.setSpeedLevel(level);
      game3D.setCAUpdateInterval(game3D.timeManipulation.getUpdateInterval());
      console.warn(`Speed level: ${level}/10`);
      break;
    }
  }
}

// ─── 2D Mode ────────────────────────────────────────────────────────────────

async function init2D(): Promise<void> {
  try {
    // Switch canvas to 2D context by resizing it
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    // Hide any instruction overlays that may be visible (3D and 2D instruction panels)
    const instructions3D = document.getElementById('instructions');
    const instructions2D = document.getElementById('instructions-2d');
    if (instructions3D) instructions3D.classList.add('hidden');
    if (instructions2D) instructions2D.classList.add('hidden');

    // Show 2D sidebar (contains HUD, legend and help)
    const sidebar2D = document.getElementById('sidebar-2d');
    if (sidebar2D) sidebar2D.classList.remove('hidden');

    game2D = new Game2D(canvas);
    game2D.start();

    console.warn('Genesis Protocol 2D mode initialized');
  } catch (error) {
    console.error('Failed to initialize 2D mode:', error);
    if (loadingElement) {
      loadingElement.innerHTML = `
        <div>Genesis Protocol</div>
        <div style="font-size:16px;margin-top:10px;color:#e74c3c;">
          Error: ${error instanceof Error ? error.message : 'Unknown error'}
        </div>
      `;
      loadingElement.classList.remove('hidden');
    }
  }
}

// ─── Visibility & Cleanup ───────────────────────────────────────────────────

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    game3D?.stop();
    game2D?.stop();
  } else {
    game3D?.start();
    game2D?.start();
  }
});

window.addEventListener('beforeunload', () => {
  game3D?.dispose();
  game2D?.dispose();
});

// ─── Boot ───────────────────────────────────────────────────────────────────

// Show mode selection screen on load; hide loading indicator
if (loadingElement) loadingElement.classList.add('hidden');

const modeScreen = document.getElementById('mode-selection');
if (modeScreen) modeScreen.classList.remove('hidden');

setupModeSelection();
