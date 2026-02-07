import { Game } from './game/Game';

/**
 * Main entry point for Genesis Protocol
 */

// Get canvas element
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
if (!canvas) {
  throw new Error('Canvas element not found');
}

// Get UI elements
const loadingElement = document.getElementById('loading');
const uiElement = document.getElementById('ui');

// Initialize game
let game: Game | null = null;

async function init(): Promise<void> {
  try {
    console.warn('Initializing Genesis Protocol...');

    // Create game instance
    // Grid size: 32x32x32 voxels
    // CA update interval: 2000ms (2 seconds)
    game = new Game(canvas, 32, 2000);

    // Hide loading screen
    if (loadingElement) {
      loadingElement.classList.add('hidden');
    }

    // Show UI
    if (uiElement) {
      uiElement.classList.remove('hidden');
    }

    // Start game loop
    game.start();

    console.warn('Genesis Protocol initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Genesis Protocol:', error);
    if (loadingElement) {
      loadingElement.innerHTML = `
        <div>Genesis Protocol</div>
        <div style="font-size: 16px; margin-top: 10px; color: #e74c3c;">
          Error: ${error instanceof Error ? error.message : 'Unknown error'}
        </div>
      `;
    }
  }
}

// Handle page visibility change (pause when tab is hidden)
document.addEventListener('visibilitychange', () => {
  if (!game) return;

  if (document.hidden) {
    game.stop();
  } else {
    game.start();
  }
});

// Handle keyboard shortcuts
document.addEventListener('keydown', (event) => {
  if (!game) return;

  switch (event.key.toLowerCase()) {
    case 'r':
      // Reset simulation
      game.reset();
      console.warn('Simulation reset');
      break;
    case ' ':
      // Toggle pause (space bar)
      event.preventDefault();
      game.timeManipulation.togglePause();
      game.setCAUpdateInterval(game.timeManipulation.getUpdateInterval());
      break;
    case 'z':
      // Toggle reverse (rewind ticks at current speed)
      game.timeManipulation.toggleReverse();
      game.setCAUpdateInterval(game.timeManipulation.getUpdateInterval());
      break;
    case '1':
    case '2':
    case '3':
    case '4':
    case '5':
    case '6':
    case '7':
    case '8':
    case '9':
    case '0': {
      // Set speed level directly: 1-9 map to levels 1-9, 0 maps to level 10
      const level = event.key === '0' ? 10 : parseInt(event.key);
      game.timeManipulation.setSpeedLevel(level);
      game.setCAUpdateInterval(game.timeManipulation.getUpdateInterval());
      console.warn(`Speed level: ${level}/10`);
      break;
    }
  }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (game) {
    game.dispose();
  }
});

// Start initialization
init().catch(console.error);
