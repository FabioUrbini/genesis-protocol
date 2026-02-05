# Genesis Protocol - Architecture

## Overview

Genesis Protocol is a 3D cellular automaton survival game built with TypeScript and Three.js, running in the browser with WebGL2.

---

## Core Architecture

```typescript
class GenesisProtocol {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  
  // Core Systems
  caSimulator: CASimulator;      // Web Workers for CA computation
  voxelRenderer: VoxelRenderer;  // Greedy meshing for performance
  physics: PlayerPhysics;        // Voxel-based collision detection
  worldManager: WorldManager;    // Chunk loading/unloading
  
  // Game Systems
  inventory: InventorySystem;
  patterns: PatternLibrary;
  timeControl: TimeManipulation;
}
```

---

## System Components

### 1. Cellular Automaton Engine (`CASimulator`)

The heart of the game - simulates 3D Game of Life rules across the voxel world.

**Key Features:**
- 3D Moore neighborhood (26 neighbors per voxel)
- Modified Conway's Life rules with multiple voxel states
- Web Worker parallelization for performance
- Dirty region tracking to skip unchanged areas
- Still Life detection to optimize stable patterns

**Voxel States:**
- Dead (empty space)
- Alive (solid matter)
- Energized (high-energy, dangerous)
- Crystallized (stable, harvestable)
- Corrupted (spreading chaos)

### 2. Voxel Grid (`VoxelGrid`)

Efficient 3D data structure for storing world state.

**Implementation:**
- Flat `Uint8Array` for cache locality (8 bits per voxel)
- 3D-to-1D index conversion: `x + y * width + z * width * height`
- RLE compression for network sync and storage
- Double buffering for simulation updates

**Chunk System:**
- 32³ voxels per chunk (optimal for meshing)
- Independent chunk evolution
- Progressive loading from IndexedDB

### 3. Rendering System (`VoxelRenderer`)

Three.js-based renderer with custom shaders.

**Techniques:**
- Greedy meshing algorithm (combines adjacent voxels into larger quads)
- Custom vertex/fragment shaders for glow effects
- Frustum culling (only render visible chunks)
- Occlusion culling (skip interior voxels)
- LOD system for distant chunks

**Shader Features:**
- Energy-based edge glow
- Pulse effects for energized voxels
- Fresnel effect
- Ambient occlusion approximation

### 4. Physics System (`PlayerPhysics`)

Custom voxel-based physics for player movement.

**Features:**
- Collision detection with voxel world
- Gravity and jumping
- Energy/oxygen system
- Death and respawn mechanics

### 5. World Manager (`WorldManager`)

Manages chunk loading, unloading, and dimension transitions.

**Features:**
- View distance of 8 chunks (~256³ visible voxels)
- Chunk streaming from IndexedDB
- Biome generation with unique rule sets
- Dimension rift mechanics

---

## Project Structure

```
genesis-protocol/
├── src/
│   ├── core/                    # CA Engine
│   │   ├── CellularAutomaton.ts
│   │   ├── VoxelGrid.ts
│   │   ├── CARule.ts
│   │   └── Pattern.ts
│   ├── rendering/               # Graphics
│   │   ├── VoxelRenderer.ts
│   │   ├── ChunkManager.ts
│   │   ├── shaders/
│   │   │   ├── voxel.vert.glsl
│   │   │   └── voxel.frag.glsl
│   │   └── effects/
│   ├── game/                    # Game Logic
│   │   ├── Player.ts
│   │   ├── World.ts
│   │   ├── GameMode.ts
│   │   └── ProgressionSystem.ts
│   ├── physics/                 # Physics
│   │   ├── Collision.ts
│   │   └── Movement.ts
│   ├── ui/                      # User Interface
│   │   ├── HUD.ts
│   │   ├── Inventory.ts
│   │   └── PatternLibrary.ts
│   ├── workers/                 # Web Workers
│   │   └── ca-worker.ts
│   └── main.ts
├── public/
│   ├── assets/
│   ├── textures/
│   └── sounds/
├── tests/
│   ├── core/
│   └── rendering/
└── docs/
    ├── ARCHITECTURE.md
    ├── API.md
    └── PATTERNS.md
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
| Storage | IndexedDB |
| Networking | WebSocket (multiplayer) |

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
