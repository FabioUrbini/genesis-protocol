# Genesis Protocol

A 3D Cellular Automaton Survival Game built with TypeScript and Three.js.

## 🎮 Overview

Genesis Protocol is a browser-based game where the entire 3D voxel world evolves using modified Conway's Game of Life rules. Watch as patterns emerge, evolve, and interact in real-time 3D space.

## 🚀 Quick Start

### Prerequisites

- Node.js 18.0.0 or higher
- npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

This will start the Vite development server at `http://localhost:3000` and automatically open your browser.

### Build for Production

```bash
npm run build
```

### Run Tests

```bash
npm test
```

## 🎯 Current Implementation Status

### ✅ Completed (Phase 1 - MVP Foundation)

1. **Project Setup**
   - TypeScript with strict mode
   - Vite build system
   - ESLint configuration
   - Project structure (src/core, src/rendering, src/game, src/physics, src/ui, src/workers)

2. **Core Data Structures**
   - `VoxelState` enum (Dead, Alive, Energized, Crystallized, Corrupted)
   - `VoxelGrid` class with Uint8Array-based 3D storage
   - `Chunk` class (32³ voxels per chunk)
   - Efficient 3D-to-1D index conversion

3. **Cellular Automaton Engine**
   - `CASimulator` with double buffering
   - 3D Moore neighborhood (26 neighbors)
   - Modified Conway's Life rules:
     - Birth: 5-6 living neighbors
     - Survive: 4-7 living neighbors
     - Energize: 8+ living neighbors
     - Crystallize: 2-3 living neighbors
     - Corruption spread mechanics
   - Still Life detection for optimization

4. **Rendering System**
   - Three.js-based `VoxelRenderer`
   - Instanced rendering for performance
   - Color-coded voxel states with emissive materials
   - Three-point lighting (ambient, directional, point)
   - Fog and atmospheric effects

5. **Camera Controls**
   - OrbitControls wrapper
   - Mouse navigation (rotate, pan, zoom)
   - Smooth damping

6. **Game Loop**
   - Main `Game` class orchestrating all systems
   - Configurable CA update interval (default: 2 seconds)
   - FPS counter
   - UI updates (position, tick count)

7. **User Interface**
   - Loading screen
   - Real-time stats display (FPS, position, CA tick)
   - Keyboard shortcuts:
     - `R` - Reset simulation
     - `1` - Slow CA updates (5 seconds)
     - `2` - Normal CA updates (2 seconds)
     - `3` - Fast CA updates (0.5 seconds)

### 🔄 In Progress / Future Enhancements

- Web Workers for parallel CA computation
- Greedy meshing algorithm for better performance
- Player physics and collision detection
- Inventory system
- Pattern library (save/load formations)
- Time manipulation tools
- Multiple biomes with different rule sets
- Procedural world generation
- Resource harvesting mechanics
- Survival mechanics (energy/oxygen)

## 🏗️ Architecture

```
src/
├── core/           # CA engine, voxel data structures
│   ├── VoxelState.ts
│   ├── VoxelGrid.ts
│   ├── Chunk.ts
│   ├── CARule.ts
│   └── CASimulator.ts
├── rendering/      # Three.js rendering, shaders
│   ├── VoxelRenderer.ts
│   └── CameraControls.ts
├── game/           # Game logic, player, progression
│   └── Game.ts
├── physics/        # Collision, movement (planned)
├── ui/             # HUD, inventory, menus (planned)
├── workers/        # Web Workers for parallel computation (planned)
└── main.ts         # Entry point
```

## 🎨 Voxel States

- **Dead** (Black) - Empty space
- **Alive** (Blue) - Solid matter
- **Energized** (Orange) - High-energy, glowing state
- **Crystallized** (Cyan) - Stable, harvestable resource
- **Corrupted** (Red) - Spreading chaos, destructive

## 📝 Development Notes

- Uses TypeScript strict mode for type safety
- Follows coding standards defined in `docs/CODING_STANDARDS.md`
- Architecture documented in `docs/ARCHITECTURE.md`
- Game design detailed in `genesis_protocol_game_design.md`

## 🐛 Known Issues

- None currently (initial implementation)

## 📄 License

See project documentation for license information.
