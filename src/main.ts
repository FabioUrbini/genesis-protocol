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
      // Note: We'll need to add pause/resume methods to Game class
      // For now, this is a placeholder
      break;
    case '1':
      // Slow CA updates (5 seconds)
      game.setCAUpdateInterval(5000);
      console.warn('CA update interval: 5s');
      break;
    case '2':
      // Normal CA updates (2 seconds)
      game.setCAUpdateInterval(2000);
      console.warn('CA update interval: 2s');
      break;
    case '3':
      // Fast CA updates (500ms)
      game.setCAUpdateInterval(500);
      console.warn('CA update interval: 0.5s');
      break;
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
