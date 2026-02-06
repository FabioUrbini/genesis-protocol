# Genesis Protocol

A 3D Cellular Automaton Survival Game built with TypeScript and Three.js.

## 🎮 Overview

Genesis Protocol is a browser-based game where the entire 3D voxel world evolves using modified Conway's Game of Life rules. Watch as patterns emerge, evolve, and interact in real-time 3D space.

**✨ NEW: Organic Metaball Rendering** - No more blocky cubes! The world now renders with smooth, blob-like organic shapes using Marching Cubes algorithm. Toggle between cube and organic rendering with `M` key.

**🚀 Fly Mode** - Press `F` to toggle noclip flying for easy exploration of the living world.

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

### ✅ Completed (Phase 5 - Player Interaction & World Manipulation)

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

3. **Cellular Automaton Engine** ⭐ OPTIMIZED
   - `CASimulator` with double buffering
   - 3D Moore neighborhood (26 neighbors)
   - Modified Conway's Life rules:
     - Birth: 5-6 living neighbors
     - Survive: 4-7 living neighbors
     - Energize: 8+ living neighbors
     - Crystallize: 2-3 living neighbors
     - Corruption spread mechanics
   - Still Life detection for optimization
   - **Dirty Region Tracking** - Only updates changed areas (8x8x8 regions)
   - **Web Worker Integration** - CA simulation runs off main thread

4. **Physics System** ⭐ NEW
   - `PlayerPhysics` class with AABB collision detection
   - Voxel-based collision with the world
   - Gravity and jumping mechanics
   - Energy/oxygen depletion system
   - Safe zone regeneration (near crystallized voxels)
   - Death and respawn mechanics

5. **Player System** ⭐ FULLY INTERACTIVE
   - First-person player entity
   - WASD movement controls
   - Mouse look with pointer lock
   - Sprint and jump mechanics
   - Energy and oxygen survival mechanics
   - **Fly Mode (F key)** - Noclip flying for easy exploration
   - **God Mode (G key)** - Disable energy/oxygen drain
   - **Voxel Placement/Removal** - Left/right click to modify world
   - **Raycasting System** - Accurate voxel targeting
   - **Voxel Type Selection** - Number keys 1-4 to select voxel type
   - **Middle Click** - Pick voxel type from world
   - Smooth camera controls

6. **Rendering System** ⭐ OVERHAULED & OPTIMIZED
   - **Dual Render Modes:**
     - `VoxelRenderer` - **Greedy Meshing** algorithm for optimal cube rendering
     - `OrganicRenderer` - Smooth metaball/blob rendering using Marching Cubes
   - **Post-Processing Effects:**
     - Bloom with Unreal-style glow
     - Vignette for cinematic effect
     - FXAA anti-aliasing
     - HDR tone mapping (ACES Filmic)
   - **Frustum Culling** - Only renders visible meshes
   - Color-coded voxel states with emissive materials
   - Enhanced lighting setup (ambient, directional, rim, point lights)
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
     - **Movement:**
       - `W A S D` - Move
       - `Space` - Jump / Fly Up
       - `Ctrl` - Fly Down
       - `Shift` - Sprint / Fly Fast
       - `Mouse` - Look around
     - **Modes:**
       - `F` - Toggle Fly Mode (noclip)
       - `G` - Toggle God Mode
       - `M` - Toggle Render Mode (cube/organic)
     - **World Interaction:**
       - `Left Click` - Remove voxel
       - `Right Click` - Place voxel
       - `Middle Click` - Pick voxel type
       - `1` - Select Alive (Blue)
       - `2` - Select Energized (Orange)
       - `3` - Select Crystallized (Cyan)
       - `4` - Select Corrupted (Red)
     - **Time Control:**
       - `P` - Pause/Unpause
       - `[` - Slow down time
       - `]` - Speed up time
       - `,` - Rewind (undo last step)
       - `.` - Step forward (when paused)
     - **Effects:**
       - `B` - Toggle Bloom
       - `V` - Toggle Vignette
     - **Simulation:**
       - `R` - Reset simulation
       - `ESC` - Release mouse

9. **Web Workers** ⭐ NEW & INTEGRATED
   - `CAWorker` for parallel CA computation
   - `WorkerPool` for managing multiple workers
   - `CASimulatorWorker` wrapper for easy integration
   - **Integrated into Game Loop** - Non-blocking CA updates
   - Message passing infrastructure
   - Transferable objects for performance

10. **Unit Tests** ⭐ NEW
    - Comprehensive tests for `VoxelGrid`
    - Comprehensive tests for `CASimulator`
    - Test coverage for core systems
    - Vitest test framework configured

11. **Time Manipulation** ⭐ NEW
    - Pause/unpause simulation (P key)
    - Speed controls ([ to slow down, ] to speed up)
    - Rewind functionality (comma key) - undo last 10 steps
    - Step forward when paused (period key)
    - History system for time travel
    - Multiple time modes: Normal, Slow, Fast, Paused

12. **Pattern Library** ⭐ NEW
    - Save custom voxel patterns
    - Load and spawn saved patterns
    - Export/import patterns to JSON
    - LocalStorage persistence
    - Pattern categories (Still Life, Oscillators, Spaceships, etc.)
    - 13 predefined patterns included
    - Capture regions of the world as patterns

13. **Pattern Seeds** ⭐ NEW
    - Predefined 3D Game of Life patterns
    - Still Life: Block, Tube, Pyramid, Platform, Tower
    - Oscillators: Blinker 3D, Pulsar
    - Spaceships: Glider 3D, Lightweight Spaceship 3D
    - Special: Energy Core, Crystal Cluster, Corruption Seed
    - Random Cluster for experimentation

### 🔄 Future Enhancements

- Occlusion culling for interior voxels
- LOD system for distant chunks
- Inventory system for resource collection
- Rule Injectors for temporary CA modifications
- Stabilizer Nodes to prevent evolution
- Multiple biomes with different rule sets
- Procedural world generation
- Chunk streaming system
- Resource harvesting mechanics
- Advanced rendering (PBR, deferred rendering)
- Frustum and occlusion culling
- Sphere-based organic rendering option
- Chromatic aberration effect toggle

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
