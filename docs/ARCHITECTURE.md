# Genesis Protocol - Architecture

## Overview

Genesis Protocol is a 3D cellular automaton survival game built with TypeScript and Three.js, running in the browser with WebGL2.

**Key Design Principles:**
- **Instant Play** - No login required, click and play immediately
- **Modern Graphics** - Cinematic visuals, NOT basic Minecraft-style cubes
- **Reactive UX** - Every interaction provides satisfying visual feedback

---

## Core Architecture

```typescript
// Current Implementation (Game class)
class Game {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  
  // Implemented Systems
  simulator: CASimulator;        // CA simulation engine
  voxelRenderer: VoxelRenderer;  // Instanced voxel rendering
  player: Player;                // First-person player with physics
}

// Planned Extensions
class GenesisProtocol extends Game {
  worldManager: WorldManager;    // Chunk loading/unloading
  inventory: InventorySystem;    // Resource collection
  patterns: PatternLibrary;      // Pattern save/load
  timeControl: TimeManipulation; // Time manipulation tools
}
```

---

## System Components

### 1. Cellular Automaton Engine (`CASimulator`)

The heart of the game - simulates 3D Game of Life rules across the voxel world.

**Current Implementation:**
- 3D Moore neighborhood (26 neighbors per voxel)
- Modified Conway's Life rules with multiple voxel states
- Double buffering for simulation updates
- Still Life detection to optimize stable patterns
- Configurable update interval (0.5-5 seconds)

**Planned Enhancements:**
- Web Worker parallelization for performance
- Dirty region tracking to skip unchanged areas

**Voxel States:**
- Dead (empty space)
- Alive (solid matter)
- Energized (high-energy, dangerous)
- Crystallized (stable, harvestable)
- Corrupted (spreading chaos)

### 2. Voxel Grid (`VoxelGrid`)

Efficient 3D data structure for storing world state.

**Current Implementation:**
- Flat `Uint8Array` for cache locality (8 bits per voxel)
- 3D-to-1D index conversion: `x + y * width + z * width * height`
- Clone and copy operations
- Boundary checking with safe defaults
- forEach iteration over all voxels

**Planned Enhancements:**
- RLE compression for network sync and storage
- Progressive loading from IndexedDB

**Chunk System:**
- 32³ voxels per chunk (optimal for meshing)
- Independent chunk evolution (planned)

### 3. Rendering System (`VoxelRenderer`)

**Current Implementation:**
- Three.js WebGL renderer
- Instanced rendering for voxels (InstancedMesh)
- Color-coded materials per voxel state with emissive properties
- Three-point lighting (ambient, directional, point)
- Fog and atmospheric effects

**Planned Enhancements (Modern deferred rendering pipeline):**

*NOT Minecraft Graphics:*
- Organic geometry with smooth normal interpolation
- Marching cubes variant for non-blocky shapes
- PBR materials (metallic, roughness, emissive)
- Subsurface scattering for translucent voxels

*Rendering Pipeline:*
- G-Buffer pass (albedo, normal, material, emission)
- SSAO (Screen Space Ambient Occlusion)
- Volumetric lighting and god rays
- HDR rendering with adaptive exposure
- Unreal-style bloom with artistic thresholds
- Color grading via LUT
- Film grain and chromatic aberration (subtle)
- FXAA anti-aliasing

*Optimization Techniques:*
- Greedy meshing (combine adjacent voxels)
- Frustum culling (visible chunks only)
- Occlusion culling (skip interior voxels)
- LOD morphing for distant chunks

### 4. Physics System (`PlayerPhysics`)

Custom voxel-based physics for player movement.

**Current Implementation:**
- AABB collision detection with voxel world
- Gravity and jumping mechanics
- Energy/oxygen depletion system
- Safe zone regeneration near crystallized voxels
- Death and respawn mechanics
- First-person movement (WASD + mouse look)
- Sprint mechanic with increased energy drain

### 5. World Manager (`WorldManager`) - Planned

Manages chunk loading, unloading, and dimension transitions.

**Planned Features:**
- View distance of 8 chunks (~256³ visible voxels)
- Chunk streaming from IndexedDB
- Biome generation with unique rule sets
- Dimension rift mechanics

---

## Project Structure

### Current Implementation

```
genesis-protocol/
├── src/
│   ├── core/                    # CA Engine
│   │   ├── VoxelState.ts        # Voxel state enum
│   │   ├── VoxelGrid.ts         # 3D voxel storage (Uint8Array)
│   │   ├── Chunk.ts             # 32³ voxel chunk
│   │   ├── CARule.ts            # CA rule interface + DefaultCARule
│   │   └── CASimulator.ts       # CA simulation with double buffering
│   ├── rendering/               # Graphics
│   │   ├── VoxelRenderer.ts     # Three.js instanced rendering
│   │   └── CameraControls.ts    # OrbitControls wrapper
│   ├── game/                    # Game Logic
│   │   ├── Game.ts              # Main game class
│   │   └── Player.ts            # First-person player entity
│   ├── physics/                 # Physics
│   │   └── PlayerPhysics.ts     # AABB collision, gravity, survival
│   ├── ui/                      # User Interface (HTML/CSS)
│   ├── workers/                 # Web Workers
│   │   ├── CAWorker.ts          # Parallel CA computation
│   │   └── WorkerPool.ts        # Worker management
│   └── main.ts                  # Entry point
├── tests/
│   └── core/                    # Unit tests
│       ├── VoxelGrid.test.ts
│       └── CASimulator.test.ts
├── docs/
│   ├── ARCHITECTURE.md
│   └── CODING_STANDARDS.md
├── index.html                   # Main HTML with UI
└── vite.config.ts               # Build configuration
```

### Planned Extensions

```
src/
├── rendering/
│   ├── ChunkManager.ts          # Chunk loading/unloading
│   ├── shaders/                 # Custom GLSL shaders
│   └── effects/                 # Post-processing effects
├── game/
│   ├── WorldManager.ts          # Biome management
│   ├── InventorySystem.ts       # Resource collection
│   ├── PatternLibrary.ts        # Pattern save/load
│   └── TimeManipulation.ts      # Time control tools
└── ui/
    ├── HUD.ts                   # In-game HUD
    ├── Inventory.ts             # Inventory display
    └── Menu.ts                  # Settings, pause menu
```

---

## Technology Stack

| Component | Technology |
|-----------|------------|
| Runtime | Browser (WebGL2) |
| Language | TypeScript |
| Rendering | Three.js |
| Physics | Custom (voxel-based) |
| Audio | Web Audio API |
| Storage | IndexedDB (no login needed) |
| Networking | WebSocket (optional multiplayer) |
| Post-processing | Three.js EffectComposer |

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Frame Rate | 60 FPS (locked) |
| CA Update Rate | 0.5-2 Hz (configurable) |
| Chunk Size | 32³ voxels |
| View Distance | 8 chunks |
| Memory Usage | <2GB |
| Load Time | <5s |
| Network Latency | <100ms |

---

## Optimization Techniques

1. **Greedy Meshing** - Combine adjacent voxels into larger quads
2. **Frustum Culling** - Only render visible chunks
3. **Occlusion Culling** - Skip interior voxels
4. **LOD System** - Lower resolution for distant chunks
5. **Sparse Voxel Octree** - Memory-efficient storage
6. **Web Workers** - Parallel CA computation
7. **Dirty Region Tracking** - Only update changed areas
8. **Still Life Detection** - Skip stable pattern updates
9. **Chunk Streaming** - Progressive loading from IndexedDB
10. **GPU Compute Shaders** - Accelerate CA evolution

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      Game Loop (60 FPS)                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │   Physics   │───▶│  CA Update   │───▶│   Render     │   │
│  │  (60 FPS)   │    │ (0.5-2 Hz)   │    │  (60 FPS)    │   │
│  └─────────────┘    └──────────────┘    └──────────────┘   │
│         │                  │                   │            │
│         ▼                  ▼                   ▼            │
│  ┌─────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │   Player    │    │  VoxelGrid   │    │    Scene     │   │
│  │   State     │    │   Update     │    │   Meshes     │   │
│  └─────────────┘    └──────────────┘    └──────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Future Architecture Enhancements

- **WebGPU** - Next-gen graphics API for improved performance
- **WASM Compute** - Faster CA simulation using WebAssembly
- **Ray Tracing** - Enhanced visual quality
- **Networked Physics** - Multiplayer interactions
- **Cloud Save Sync** - Cross-device progression
