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

### ✅ Completed (Phase 2 - Playable Game)

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

4. **Physics System** ⭐ NEW
   - `PlayerPhysics` class with AABB collision detection
   - Voxel-based collision with the world
   - Gravity and jumping mechanics
   - Energy/oxygen depletion system
   - Safe zone regeneration (near crystallized voxels)
   - Death and respawn mechanics

5. **Player System** ⭐ NEW
   - First-person player entity
   - WASD movement controls
   - Mouse look with pointer lock
   - Sprint and jump mechanics
   - Energy and oxygen survival mechanics
   - Smooth camera controls

6. **Rendering System**
   - Three.js-based `VoxelRenderer`
   - Instanced rendering for performance
   - Color-coded voxel states with emissive materials
   - Three-point lighting (ambient, directional, point)
   - Fog and atmospheric effects

7. **Game Loop**
   - Main `Game` class orchestrating all systems
   - Delta time-based physics updates
   - Player update integration
   - Configurable CA update interval (default: 2 seconds)
   - FPS counter
   - Automatic respawn on death

8. **User Interface** ⭐ ENHANCED
   - Loading screen with smooth transitions
   - Instructions overlay with controls
   - Real-time stats display (FPS, position, CA tick)
   - Energy bar with visual indicator
   - Oxygen bar with visual indicator
   - Pointer lock instructions
   - Help text overlay
   - Keyboard shortcuts:
     - `W A S D` - Move
     - `Space` - Jump
     - `Shift` - Sprint
     - `Mouse` - Look around
     - `R` - Reset simulation
     - `1 2 3` - CA speed (slow/normal/fast)
     - `ESC` - Release mouse

9. **Web Workers** ⭐ NEW
   - `CAWorker` for parallel CA computation
   - `WorkerPool` for managing multiple workers
   - `CASimulatorWorker` wrapper for easy integration
   - Message passing infrastructure
   - Transferable objects for performance

10. **Unit Tests** ⭐ NEW
    - Comprehensive tests for `VoxelGrid`
    - Comprehensive tests for `CASimulator`
    - Test coverage for core systems
    - Vitest test framework configured

### 🔄 Future Enhancements

- Integrate Web Workers into main game loop
- Greedy meshing algorithm for better rendering performance
- Inventory system for resource collection
- Pattern library (save/load formations)
- Time manipulation tools
- Multiple biomes with different rule sets
- Procedural world generation
- Resource harvesting mechanics
- Advanced rendering (PBR, deferred rendering, post-processing)
- Frustum and occlusion culling

## 🏗️ Architecture

For detailed architecture documentation, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

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
