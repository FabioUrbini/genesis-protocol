# Genesis Protocol
## 3D Cellular Automaton Survival Game

---

## 🎮 Core Concept

A survival/exploration game where the entire 3D voxel world evolves using modified Game of Life rules. You're a "Navigator" exploring procedurally-generated cellular automaton dimensions, harvesting resources, avoiding hostile patterns, and manipulating the living world itself.

**Elevator Pitch:** *"A visually stunning cellular automaton experience where reality pulses with life - play instantly, no login required."*

### 🚀 Instant Play
- **Zero Friction Start** - Click and play immediately, no account creation
- **Browser-Based** - Works on any modern device with WebGL2
- **Progressive Complexity** - Learn as you play, tutorials integrated into gameplay
- **Session Save** - Local storage preserves progress without authentication

---

## 🌍 The Living World

### 3D Cellular Automaton Rules (Modified Conway's Life)

#### Voxel States
- **Dead** - Empty space (void)
- **Alive** - Solid matter (basic blocks)
- **Energized** - Glowing, dangerous, high-energy state
- **Crystallized** - Stable, harvestable resource
- **Corrupted** - Spreading chaos, destructive

#### Evolution Rules

```
Per voxel, per simulation tick:
- Neighbors = 26 surrounding voxels (3D Moore neighborhood)
- Survive: 4-7 living neighbors → Stay alive
- Birth: 5-6 living neighbors → Dead becomes alive
- Energize: 8+ living neighbors → Becomes energized
- Crystallize: 2-3 living neighbors → Becomes stable crystallized
- Corrupt: Adjacent to corrupted + <3 neighbors → Spreads corruption
```

### World Dynamics

- Entire world updates every **2-5 seconds** (configurable speed)
- Chunks evolve independently for performance
- Players can **manipulate time** in local bubble
- Different **biomes** have unique rule sets
- Some patterns are **stable** (Still Life), others **oscillate** or **move** (gliders)

---

## 🎯 Gameplay Loop

### 1. Exploration Phase
- Navigate through shifting 3D structures
- Identify stable patterns (platforms, bridges)
- Predict collapses and emergent structures
- Find "Still Life" zones (safe havens)
- Discover rare formations and dimensional rifts

### 2. Resource Harvesting

| Resource Type | Source | Use |
|--------------|--------|-----|
| **Crystallized Voxels** | Stable patterns | Building materials |
| **Energy Cores** | Dense living clusters | Power tools/abilities |
| **Pattern Seeds** | Captured formations | Spawn saved patterns |
| **Temporal Shards** | Time anomalies | Slow down world evolution |
| **Rule Fragments** | Dimension rifts | Craft custom CA rules |

### 3. World Manipulation Tools

#### Seed Placement
Drop individual voxels or small patterns to create formations:
- **Gliders** - Moving patterns that traverse space
- **Oscillators** - Repeating patterns for defense
- **Still Life** - Stable platforms and structures
- **Guns** - Spawn continuous streams of gliders

#### Rule Injectors
Temporarily change cellular automaton rules in a radius:
- Increase birth rate (rapid growth)
- Increase death rate (decay zones)
- Create stable zones
- Reverse evolution

#### Time Manipulation
- **Slow Bubble** - Reduce update frequency in radius
- **Fast Forward** - Speed up evolution to see future state
- **Pause Zone** - Freeze patterns temporarily
- **Rewind** - (Limited use) Restore previous world state

#### Pattern Library
- Capture interesting formations you discover
- Save and name custom patterns
- Spawn saved patterns like placing blueprints
- Share patterns with other players (export/import)

### 4. Survival Challenges

#### Environmental Hazards
- **Structural Collapse** - Ground beneath you dissolves
- **Hostile Patterns** - 3D gliders that chase players
- **Corruption Spread** - Chaotic patterns destroy resources
- **Energy Drain** - Depletes over time in unstable zones
- **Temporal Storms** - Rapid evolution events

#### Survival Mechanics
- **Oxygen/Energy Bar** - Drains over time
- **Replenish in Safe Zones** - Still Life formations restore energy
- **Temporal Anchors** - Set respawn points in stable areas
- **Environmental Suit Upgrades** - Extend survival time

### 5. Base Building

#### Finding Stability
- Identify or create "Still Life" formations
- Build on naturally stable patterns
- Use Pattern Seeds to grow stable foundations

#### Protection Systems
- **Barrier Shields** - Resist cellular evolution
- **Stabilizer Nodes** - Prevent changes in radius
- **Automated Harvesters** - CA patterns that mine resources
- **Portal Gates** - Travel to other CA dimensions

#### Base Upgrades
- Expand stable zone radius
- Add resource storage
- Build crafting stations
- Create dimension portals

---

## 🎨 Visual Design Philosophy

**NOT Minecraft** - Genesis Protocol features a modern, artistic visual identity that sets it apart from voxel games with basic graphics.

### Core Visual Principles

1. **Organic Geometry** - Voxels are NOT basic cubes
   - Rounded edges with smooth normal interpolation
   - Procedural surface deformation and noise
   - Marching cubes variant for organic shapes
   - Dynamic LOD morphing between detail levels

2. **Living Materials** - Every surface breathes
   - Subsurface scattering for translucent materials
   - Real-time procedural textures (no tiling visible)
   - Energy flow visualized through animated patterns
   - PBR materials with metallic, roughness, emissive maps

3. **Cinematic Lighting**
   - Global illumination approximation
   - Volumetric lighting and god rays
   - Dynamic ambient occlusion
   - HDR rendering with adaptive exposure
   - Color grading and film-like post-processing

---

### Visual Theme: **Cosmic Bioluminescence**

A fusion of organic beauty and cosmic mystery - NOT flat, NOT pixelated, NOT basic.

```
Palette:
  Primary:    Deep space blacks (#0a0a12) to nebula purples (#2d1b4e)
  Accents:    Bioluminescent cyan (#00f5d4), plasma pink (#f72585), energy gold (#ffd60a)
  Gradients:  Everything shifts subtly - no flat colors

Voxel Rendering:
  - Smooth normals, NOT hard edges
  - Fresnel rim lighting on all surfaces
  - Energy veins that pulse through structures
  - Crystalline refractions for Crystallized voxels
  - Corruption appears as reality glitching/tearing

Atmosphere:
  - Volumetric fog with color gradients
  - Particle fields: floating embers, spores, energy wisps
  - Depth of field for cinematic focus
  - Motion blur on fast-moving patterns

Effects:
  - Bloom with artistic thresholds
  - Chromatic aberration near dimensional rifts
  - Screen-space reflections
  - Film grain (subtle) for cinematic feel
```

### Advanced Rendering Pipeline

```typescript
// Modern deferred rendering with post-processing
class RenderPipeline {
  // G-Buffer pass
  gBuffer: {
    albedo: THREE.WebGLRenderTarget;
    normal: THREE.WebGLRenderTarget;
    material: THREE.WebGLRenderTarget;  // metallic, roughness, ao
    emission: THREE.WebGLRenderTarget;
  };
  
  // Post-processing stack
  composer: EffectComposer;
  
  setupPostProcessing() {
    // SSAO - Screen Space Ambient Occlusion
    this.composer.addPass(new SSAOPass(this.scene, this.camera));
    
    // Bloom with custom thresholds per material
    this.composer.addPass(new UnrealBloomPass({
      threshold: 0.6,
      strength: 1.5,
      radius: 0.8
    }));
    
    // Volumetric lighting
    this.composer.addPass(new VolumetricLightPass());
    
    // Color grading LUT
    this.composer.addPass(new LUTPass(this.colorGradingLUT));
    
    // Film effects
    this.composer.addPass(new FilmPass(0.15, 0.025, 648, false));
    
    // FXAA anti-aliasing
    this.composer.addPass(new FXAAPass());
  }
}
```

### Reactive Visual Feedback

Every interaction provides instant, satisfying feedback:

| Action | Visual Response |
|--------|----------------|
| Voxel placement | Ripple effect + particle burst |
| Pattern birth | Soft glow expansion + particles coalescing |
| Pattern death | Dissolve into particles + energy release |
| Time manipulation | World-wide color shift + time distortion effect |
| Damage taken | Screen shake + chromatic aberration pulse |
| Energy low | Vignette darkening + desaturation |
| Dimension rift | Reality tearing VFX + inverted colors at edges |

### Shader Showcase

```glsl
// Fragment shader - organic glowing voxels
uniform float time;
uniform vec3 energyColor;
uniform float energyLevel;
uniform sampler2D noiseTexture;

varying vec3 vWorldPosition;
varying vec3 vNormal;
varying float vEnergy;

void main() {
    // Procedural noise for organic feel
    vec2 noiseUV = vWorldPosition.xy * 0.1 + time * 0.05;
    float noise = texture2D(noiseTexture, noiseUV).r;
    
    // Fresnel rim lighting
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 3.0);
    
    // Pulsing energy veins
    float veinPattern = sin(vWorldPosition.x * 10.0 + time * 2.0) * 
                        sin(vWorldPosition.y * 10.0 + time * 1.5) * 0.5 + 0.5;
    veinPattern = smoothstep(0.4, 0.6, veinPattern + noise * 0.3);
    
    // Subsurface scattering approximation
    float sss = pow(max(dot(-viewDir, vNormal), 0.0), 2.0) * 0.3;
    
    // Combine for final color
    vec3 baseColor = mix(vec3(0.05, 0.02, 0.1), energyColor, vEnergy * 0.5);
    vec3 rimColor = energyColor * fresnel * (0.5 + vEnergy * 0.5);
    vec3 veinColor = energyColor * veinPattern * vEnergy * 0.8;
    vec3 sssColor = energyColor * sss * vEnergy;
    
    vec3 finalColor = baseColor + rimColor + veinColor + sssColor;
    
    // HDR output for bloom
    float emissive = (fresnel + veinPattern * vEnergy) * 2.0;
    
    gl_FragColor = vec4(finalColor * (1.0 + emissive), 1.0);
}
```

### UI/UX Design

**Modern, Minimal, Reactive**

- **Glassmorphism** - Frosted glass panels with blur
- **Micro-animations** - Everything responds to interaction
- **Contextual HUD** - Elements appear when needed, fade when not
- **Accessibility** - High contrast mode, colorblind options, scalable UI
- **Touch-friendly** - Large hit targets, gesture support for mobile

---

## 🛠️ Technical Implementation

### Architecture Overview

```typescript
// Core Game Architecture
class GenesisProtocol {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  
  // Core Systems
  caSimulator: CASimulator;      // Web Workers for CA
  voxelRenderer: VoxelRenderer;  // Greedy meshing
  physics: PlayerPhysics;        // Collision detection
  worldManager: WorldManager;    // Chunk loading/unloading
  
  // Game Systems
  inventory: InventorySystem;
  patterns: PatternLibrary;
  timeControl: TimeManipulation;
  
  async gameLoop(deltaTime: number) {
    // Physics update (60 FPS)
    this.physics.update(deltaTime);
    
    // CA update (configurable rate)
    if (this.shouldUpdateCA()) {
      await this.caSimulator.stepSimulation();
      this.voxelRenderer.updateMeshes();
    }
    
    // Render (60 FPS)
    this.renderer.render(this.scene, this.camera);
  }
}
```

### Cellular Automaton Engine

```typescript
interface VoxelState {
  alive: boolean;
  energy: number;      // 0-255
  type: VoxelType;     // Dead/Alive/Energized/Crystallized/Corrupted
  age: number;         // Cycles alive
  neighbors: number;   // Cached for performance
}

class CellularAutomaton3D {
  private grid: VoxelGrid;
  private rules: CARule;
  
  // Count living neighbors in 3D (26 neighbors)
  private countNeighbors(x: number, y: number, z: number): number {
    let count = 0;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          if (dx === 0 && dy === 0 && dz === 0) continue;
          
          const nx = x + dx, ny = y + dy, nz = z + dz;
          if (this.grid.isAlive(nx, ny, nz)) count++;
        }
      }
    }
    return count;
  }
  
  // Apply CA rules
  public step(): void {
    const nextGrid = this.grid.clone();
    
    this.grid.forEach((x, y, z, voxel) => {
      const neighbors = this.countNeighbors(x, y, z);
      
      if (voxel.alive) {
        // Survival rule
        const survives = neighbors >= 4 && neighbors <= 7;
        nextGrid.setAlive(x, y, z, survives);
        
        if (survives) {
          // Energy state based on neighbors
          if (neighbors >= 8) {
            nextGrid.setType(x, y, z, VoxelType.Energized);
          } else if (neighbors >= 2 && neighbors <= 3) {
            nextGrid.setType(x, y, z, VoxelType.Crystallized);
          }
        }
      } else {
        // Birth rule
        const births = neighbors >= 5 && neighbors <= 6;
        nextGrid.setAlive(x, y, z, births);
      }
      
      // Corruption spread
      if (this.hasCorruptedNeighbor(x, y, z) && neighbors < 3) {
        nextGrid.setType(x, y, z, VoxelType.Corrupted);
      }
    });
    
    this.grid = nextGrid;
  }
  
  // Spawn classic patterns
  public spawnGlider(x: number, y: number, z: number): void {
    const pattern = PATTERNS.glider3D;
    this.grid.setPattern(x, y, z, pattern);
  }
  
  public spawnOscillator(x: number, y: number, z: number): void {
    const pattern = PATTERNS.blinker3D;
    this.grid.setPattern(x, y, z, pattern);
  }
}
```

### Voxel Data Structure

```typescript
// Efficient 3D voxel storage
class VoxelGrid {
  // Flat array for cache locality
  private data: Uint8Array;  // 8 bits per voxel state
  private width: number;
  private height: number;
  private depth: number;
  
  constructor(width: number, height: number, depth: number) {
    this.width = width;
    this.height = height;
    this.depth = depth;
    this.data = new Uint8Array(width * height * depth);
  }
  
  // Convert 3D coords to 1D index
  private getIndex(x: number, y: number, z: number): number {
    return x + y * this.width + z * this.width * this.height;
  }
  
  get(x: number, y: number, z: number): VoxelState {
    const index = this.getIndex(x, y, z);
    return this.decodeVoxel(this.data[index]);
  }
  
  set(x: number, y: number, z: number, state: VoxelState): void {
    const index = this.getIndex(x, y, z);
    this.data[index] = this.encodeVoxel(state);
  }
  
  // RLE compression for network sync
  compress(): CompressedChunk {
    const runs: Array<{value: number, count: number}> = [];
    let current = this.data[0];
    let count = 1;
    
    for (let i = 1; i < this.data.length; i++) {
      if (this.data[i] === current) {
        count++;
      } else {
        runs.push({value: current, count});
        current = this.data[i];
        count = 1;
      }
    }
    runs.push({value: current, count});
    
    return {width: this.width, height: this.height, depth: this.depth, runs};
  }
}
```

### Rendering System

```typescript
// Voxel renderer with greedy meshing
class VoxelRenderer {
  private meshes: Map<string, THREE.Mesh>;
  private material: THREE.ShaderMaterial;
  
  constructor() {
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        energyColor: { value: new THREE.Color(0x00ffff) },
        baseColor: { value: new THREE.Color(0x3366ff) },
      },
      vertexShader: VOXEL_VERTEX_SHADER,
      fragmentShader: VOXEL_FRAGMENT_SHADER,
    });
  }
  
  // Generate mesh from voxel grid using greedy meshing
  generateMesh(grid: VoxelGrid): THREE.Mesh {
    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const normals: number[] = [];
    const colors: number[] = [];
    const energies: number[] = [];
    
    // Greedy meshing algorithm
    // Combines adjacent voxels of same type into larger quads
    for (let axis = 0; axis < 3; axis++) {
      // Sweep through each axis
      const u = (axis + 1) % 3;
      const v = (axis + 2) % 3;
      
      const dims = [grid.width, grid.height, grid.depth];
      const mask: (VoxelState | null)[] = new Array(dims[u] * dims[v]);
      
      for (let d = 0; d < dims[axis]; d++) {
        // Build mask for this slice
        this.buildMask(grid, axis, d, mask, dims);
        
        // Generate quads from mask
        this.generateQuadsFromMask(
          mask, dims, axis, d,
          positions, normals, colors, energies
        );
      }
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('energy', new THREE.Float32BufferAttribute(energies, 1));
    
    return new THREE.Mesh(geometry, this.material);
  }
  
  // Update specific chunks that changed
  updateChunk(chunkId: string, grid: VoxelGrid): void {
    const mesh = this.generateMesh(grid);
    
    if (this.meshes.has(chunkId)) {
      const oldMesh = this.meshes.get(chunkId)!;
      oldMesh.geometry.dispose();
      oldMesh.parent?.remove(oldMesh);
    }
    
    this.meshes.set(chunkId, mesh);
  }
}
```

### Shader Code

```glsl
// Vertex Shader
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vColor;
varying float vEnergy;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vPosition = position;
  vColor = color;
  vEnergy = energy;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

// Fragment Shader
uniform float time;
uniform vec3 energyColor;
uniform vec3 baseColor;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vColor;
varying float vEnergy;

void main() {
  // Base color from vertex
  vec3 color = vColor;
  
  // Edge glow based on energy
  vec3 viewDir = normalize(cameraPosition - vPosition);
  float edgeFactor = 1.0 - abs(dot(vNormal, viewDir));
  edgeFactor = pow(edgeFactor, 3.0);
  
  // Pulse effect for energized voxels
  float pulse = sin(time * 2.0 + vPosition.x * 0.1) * 0.5 + 0.5;
  vec3 glow = mix(color, energyColor, vEnergy * edgeFactor * pulse);
  
  // Fresnel effect
  float fresnel = pow(1.0 - dot(vNormal, viewDir), 3.0);
  vec3 finalColor = mix(glow, energyColor, fresnel * vEnergy * 0.3);
  
  // Add some ambient occlusion approximation
  float ao = 0.5 + 0.5 * vNormal.y;
  finalColor *= ao;
  
  gl_FragColor = vec4(finalColor, 1.0);
}
```

### Performance Optimization

```typescript
class CASimulator {
  private workers: Worker[];
  private dirtyRegions: Set<Region>;
  
  constructor(workerCount: number = 4) {
    this.workers = Array(workerCount)
      .fill(null)
      .map(() => new Worker('ca-worker.js'));
  }
  
  // Only update "active" regions (near changes)
  async updateChunk(chunk: Chunk): Promise<Chunk> {
    const dirtyRegions = this.detectDirtyRegions(chunk);
    
    // Parallel update using Workers
    const updates = dirtyRegions.map((region, i) => {
      const worker = this.workers[i % this.workers.length];
      return this.updateRegion(worker, region);
    });
    
    await Promise.all(updates);
    return chunk;
  }
  
  // Detect stable patterns to skip updates
  detectStillLife(chunk: Chunk): StablePattern[] {
    const stable: StablePattern[] = [];
    
    // Hash pattern states over several iterations
    const hashes = new Map<string, number>();
    
    for (const region of chunk.regions) {
      const hash = this.hashRegion(region);
      const count = hashes.get(hash) || 0;
      hashes.set(hash, count + 1);
      
      // If pattern hasn't changed for N iterations, mark stable
      if (count > 10) {
        stable.push({region, pattern: region.getPattern()});
      }
    }
    
    return stable;
  }
  
  // Spatial optimization - only update near players or changes
  detectDirtyRegions(chunk: Chunk): Region[] {
    const dirty: Region[] = [];
    
    for (const region of chunk.regions) {
      // Skip if stable and no players nearby
      if (region.isStable && !this.hasNearbyPlayer(region)) {
        continue;
      }
      
      // Skip if hasn't changed in last N frames
      if (region.unchangedFrames > 100) {
        continue;
      }
      
      dirty.push(region);
    }
    
    return dirty;
  }
}
```

---

## 🎮 Game Modes

### 1. Survival Mode
**Objective:** Survive as long as possible in an evolving dimension

- Start in a collapsing dimension with limited resources
- Find or create stable zones before oxygen depletes
- Build base in Still Life formation
- Survive increasingly chaotic evolution waves
- **Win Condition:** Stabilize 1000+ voxels for 100 cycles

**Progression:**
- Wave 1-5: Slow evolution, gentle patterns
- Wave 6-10: Faster evolution, gliders appear
- Wave 11-15: Multiple biomes, corruption zones
- Wave 16-20: Extreme chaos, temporal storms
- Wave 21+: Legendary difficulty, dimension collapse

### 2. Explorer Mode
**Objective:** Discover and catalog rare CA patterns

- Free exploration across multiple dimensions
- Discover different rule sets and biomes
- Find legendary formations (Gosper Gun, Puffers, etc.)
- Complete pattern encyclopedia
- **Progression:** Unlock pattern library entries

**Discoverable Patterns:**
- **Still Life:** Block, Beehive, Loaf, Boat, Tub
- **Oscillators:** Blinker, Toad, Beacon, Pulsar
- **Spaceships:** Glider, Lightweight Spaceship (LWSS)
- **Guns:** Gosper Glider Gun, various puffers
- **Exotic:** Methuselahs, gardens of Eden, breeders

### 3. Architect Mode
**Objective:** Design and share complex stable structures

- Sandbox mode with full time control (pause/rewind)
- Design complex stable structures and patterns
- Test pattern interactions
- Share creations via pattern export codes
- **Challenge:** Create specific pattern behaviors

**Building Challenges:**
- Create a glider gun
- Build a stable castle
- Design an oscillating tower
- Create a pattern that generates resources
- Build a defensive perimeter against corruption

### 4. Pattern Wars (Competitive)
**Objective:** Dominate the CA space

- 2-4 players in shared CA world
- Each player places patterns to compete for space
- Gliders can destroy opponent patterns
- Last player with living patterns wins
- **Strategy:** Balance offense (gliders) and defense (oscillators)

**Gameplay:**
- Turn-based pattern placement
- Real-time CA evolution between turns
- Limited pattern budget per turn
- Capture opponent's stable zones
- Special abilities (rule changes, time manipulation)

### 5. Puzzle Mode
**Objective:** "Fix" broken dimensions using limited resources

- Start with specific pattern configuration
- Achieve goal state within move/time limit
- Limited voxels and pattern seeds
- **Example Puzzles:**
  - Create bridge to exit using only 50 voxels
  - Stabilize chaotic dimension
  - Redirect glider stream to activate portal
  - Create specific pattern from initial state

**Puzzle Types:**
- **Bridge Building:** Connect two platforms
- **Pattern Matching:** Create target formation
- **Stabilization:** Stop all evolution
- **Redirection:** Guide gliders to targets
- **Optimization:** Minimize voxels used

---

## 🧬 Advanced Features

### Pattern Mutations & Evolution

```typescript
interface PatternGene {
  surviveRange: [number, number];  // e.g., [4, 7]
  birthRange: [number, number];    // e.g., [5, 6]
  dimensions: 2 | 3;
  mutationRate: number;
  fitness: number;
}

class EvolutionaryPattern {
  private population: PatternGene[];
  
  // Genetic algorithm for CA rules
  evolve(generations: number): PatternGene {
    for (let gen = 0; gen < generations; gen++) {
      // Evaluate fitness (stability, complexity, beauty)
      this.evaluateFitness();
      
      // Select parents (tournament selection)
      const parents = this.selectParents();
      
      // Crossover
      const offspring = this.crossover(parents);
      
      // Mutation
      this.mutate(offspring);
      
      // Replace population
      this.population = offspring;
    }
    
    return this.getBestPattern();
  }
  
  private evaluateFitness(): void {
    for (const gene of this.population) {
      const world = new CellularAutomaton3D(gene);
      
      // Run simulation
      for (let i = 0; i < 100; i++) {
        world.step();
      }
      
      // Fitness = stability + complexity + aesthetic
      gene.fitness = 
        world.getStabilityScore() * 0.4 +
        world.getComplexityScore() * 0.3 +
        world.getAestheticScore() * 0.3;
    }
  }
  
  private crossover(parents: PatternGene[]): PatternGene[] {
    const offspring: PatternGene[] = [];
    
    for (let i = 0; i < parents.length; i += 2) {
      const parent1 = parents[i];
      const parent2 = parents[i + 1];
      
      // Single-point crossover
      offspring.push({
        surviveRange: parent1.surviveRange,
        birthRange: parent2.birthRange,
        dimensions: Math.random() > 0.5 ? parent1.dimensions : parent2.dimensions,
        mutationRate: (parent1.mutationRate + parent2.mutationRate) / 2,
        fitness: 0,
      });
    }
    
    return offspring;
  }
}
```

### Dimension Rifts & Biomes

**Biome Types:**

| Biome | Rules | Characteristics | Resources |
|-------|-------|-----------------|-----------|
| **Crystal Caves** | High crystallization (2-4 neighbors) | Stable, slow evolution | Abundant crystals |
| **Chaos Wastes** | Rapid birth/death | Violent, unpredictable | Energy cores |
| **Still Gardens** | Strict stability rules | Mostly stable patterns | Pattern seeds |
| **The Pulse** | Pure oscillators | Rhythmic, hypnotic | Temporal shards |
| **Glider Storms** | High birth rate | Moving patterns everywhere | Rare pattern types |
| **Void Tears** | Corruption spreads fast | Dangerous, rewarding | Legendary items |
| **Quantum Foam** | Rules change randomly | Unpredictable physics | Rule fragments |

**Rift Mechanics:**
```typescript
class DimensionRift {
  sourceBiome: Biome;
  targetBiome: Biome;
  position: Vector3;
  
  // Rifts blend rules at boundary
  getRulesAt(distance: number): CARule {
    const blend = Math.min(distance / this.radius, 1.0);
    
    return {
      surviveRange: this.interpolateRange(
        this.sourceBiome.rules.surviveRange,
        this.targetBiome.rules.surviveRange,
        blend
      ),
      birthRange: this.interpolateRange(
        this.sourceBiome.rules.birthRange,
        this.targetBiome.rules.birthRange,
        blend
      ),
    };
  }
  
  // Portal travel
  travel(player: Player): void {
    player.position = this.targetBiome.getSpawnPoint();
    player.dimension = this.targetBiome;
    
    // Apply biome effects
    player.applyEnvironmentalEffects(this.targetBiome);
  }
}
```

### Meta Progression System

**Player Progression:**

```typescript
interface PlayerProgress {
  // Pattern Discovery
  patternsDiscovered: Set<PatternType>;
  patternCodex: PatternLibrary;
  
  // Dimension Exploration
  biomesVisited: Set<BiomeType>;
  dimensionsExplored: number;
  
  // Resources
  timeCrystals: number;
  ruleFragments: Map<RuleType, number>;
  
  // Navigator Upgrades
  upgrades: {
    timeBubbleRadius: number;
    timeBubbleDuration: number;
    movementSpeed: number;
    energyCapacity: number;
    patternSlots: number;
  };
}

class ProgressionSystem {
  // Unlock pattern library entries
  unlockPattern(type: PatternType): void {
    const pattern = PATTERNS[type];
    
    if (!this.player.patternsDiscovered.has(type)) {
      this.player.patternsDiscovered.add(type);
      this.player.patternCodex.add(pattern);
      
      // Grant rewards
      this.grantTimeCrystals(pattern.rarity * 100);
      
      // Check for achievements
      this.checkAchievements();
    }
  }
  
  // Craft custom rules from fragments
  craftRule(fragments: Map<RuleType, number>): CARule {
    const requiredFragments = {
      SURVIVE_LOW: 10,
      SURVIVE_HIGH: 10,
      BIRTH_LOW: 10,
      BIRTH_HIGH: 10,
    };
    
    if (this.hasFragments(fragments, requiredFragments)) {
      const customRule: CARule = {
        surviveRange: [
          fragments.get('SURVIVE_LOW')!,
          fragments.get('SURVIVE_HIGH')!
        ],
        birthRange: [
          fragments.get('BIRTH_LOW')!,
          fragments.get('BIRTH_HIGH')!
        ],
      };
      
      return customRule;
    }
    
    throw new Error('Insufficient fragments');
  }
  
  // Upgrade navigator abilities
  upgradeNavigator(upgrade: keyof PlayerProgress['upgrades']): void {
    const cost = this.getUpgradeCost(upgrade);
    
    if (this.player.timeCrystals >= cost) {
      this.player.timeCrystals -= cost;
      this.player.upgrades[upgrade] += this.getUpgradeIncrement(upgrade);
    }
  }
}
```

---

## 🔧 Technical Stack

### Core Technologies

```json
{
  "runtime": "Browser (WebGL2)",
  "language": "TypeScript",
  "rendering": "Three.js",
  "physics": "Custom (voxel-based)",
  "audio": "Web Audio API",
  "storage": "IndexedDB",
  "networking": "WebSocket (optional multiplayer)"
}
```

### Dependencies

```json
{
  "dependencies": {
    "three": "^0.160.0",
    "typescript": "^5.3.0",
    "@types/three": "^0.160.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "vitest": "^1.0.0",
    "eslint": "^8.56.0",
    "@typescript-eslint/eslint-plugin": "^6.19.0"
  }
}
```

### Project Structure

```
genesis-protocol/
├── src/
│   ├── core/
│   │   ├── CellularAutomaton.ts
│   │   ├── VoxelGrid.ts
│   │   ├── CARule.ts
│   │   └── Pattern.ts
│   ├── rendering/
│   │   ├── VoxelRenderer.ts
│   │   ├── ChunkManager.ts
│   │   ├── shaders/
│   │   │   ├── voxel.vert.glsl
│   │   │   └── voxel.frag.glsl
│   │   └── effects/
│   ├── game/
│   │   ├── Player.ts
│   │   ├── World.ts
│   │   ├── GameMode.ts
│   │   └── ProgressionSystem.ts
│   ├── physics/
│   │   ├── Collision.ts
│   │   └── Movement.ts
│   ├── ui/
│   │   ├── HUD.ts
│   │   ├── Inventory.ts
│   │   └── PatternLibrary.ts
│   ├── workers/
│   │   └── ca-worker.ts
│   └── main.ts
├── public/
│   ├── assets/
│   ├── textures/
│   └── sounds/
├── tests/
│   ├── core/
│   └── rendering/
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API.md
│   └── PATTERNS.md
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

### Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Frame Rate** | 60 FPS | Locked on mid-range GPU |
| **CA Update Rate** | 0.5-2 Hz | Configurable per dimension |
| **Chunk Size** | 32³ voxels | Optimal for meshing |
| **View Distance** | 8 chunks | ~256³ visible voxels |
| **Memory Usage** | <2GB | Full game state |
| **Load Time** | <5s | New dimension |
| **Network Latency** | <100ms | Multiplayer sync |

### Optimization Techniques

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

## 📅 Implementation Roadmap

### Week 1: Core CA Engine
**Goal:** Working 3D cellular automaton

- [x] VoxelGrid data structure
- [x] Basic CA rules implementation
- [x] 3D neighbor counting (26-cell)
- [x] Update loop with double buffering
- [x] Chunk system (32³ chunks)
- [x] Basic cube rendering
- [x] Camera controls (orbit/FPS)

**Deliverable:** Visible 3D Game of Life simulation

### Week 2: Player Mechanics
**Goal:** Interactive gameplay

- [ ] FPS movement controls
- [ ] Collision detection with voxel world
- [ ] Player physics (gravity, jumping)
- [ ] Voxel placement/removal
- [ ] Time manipulation (slow/pause/fast)
- [ ] Energy/oxygen system
- [ ] Death and respawn

**Deliverable:** Playable character in evolving world

### Week 3: Visual Polish
**Goal:** Beautiful, production-quality graphics

- [ ] Greedy meshing algorithm
- [ ] Custom vertex/fragment shaders
- [ ] Glow/bloom post-processing
- [ ] Particle effects (birth/death)
- [ ] Energy state visuals
- [ ] Fog and atmosphere
- [ ] UI/HUD design

**Deliverable:** Visually stunning presentation

### Week 4: Game Systems
**Goal:** Complete gameplay loop

- [ ] Resource gathering system
- [ ] Pattern library (save/load/spawn)
- [ ] Inventory management
- [ ] Survival mechanics (energy drain)
- [ ] Base building (stabilizers)
- [ ] Dimension rifts
- [ ] Basic biome generation

**Deliverable:** Full survival mode playable

### Week 5: Content & Balance
**Goal:** Rich, varied gameplay

- [ ] Multiple biomes with unique rules
- [ ] Pattern discovery system
- [ ] Progression/upgrade system
- [ ] Achievement system
- [ ] Tutorial/onboarding
- [ ] Sound effects and music
- [ ] Game balance testing

**Deliverable:** Polished, replayable game

### Week 6: Polish & Release
**Goal:** Launch-ready product

- [ ] Performance optimization pass
- [ ] Bug fixing
- [ ] Save/load system
- [ ] Settings menu
- [ ] Leaderboards (optional)
- [ ] Documentation
- [ ] Deploy to web

**Deliverable:** Released browser game

---

## 🎯 Success Metrics

### Technical Excellence
- ✅ Clean, well-documented TypeScript code
- ✅ >80% test coverage for core systems
- ✅ 60 FPS on mid-range hardware
- ✅ <5s load time
- ✅ Modular, extensible architecture

### Gameplay Quality
- ✅ 30+ minutes average session time
- ✅ >70% player completion of tutorial
- ✅ Positive player feedback on controls
- ✅ Clear progression path
- ✅ Replayability through randomness

### Visual Impact
- ✅ Unique, memorable art style
- ✅ Smooth animations and effects
- ✅ Readable UI/HUD
- ✅ Consistent visual language
- ✅ Impressive screenshots/videos

---

## ✨ Creative Features

### 🎵 Procedural Soundscape

The world sings based on its state:

```typescript
class AudioReactor {
  // Each CA state produces unique tones
  stateFrequencies: Map<VoxelType, number> = new Map([
    [VoxelType.Alive, 220],      // A3 - organic hum
    [VoxelType.Energized, 440],  // A4 - electric buzz
    [VoxelType.Crystallized, 880], // A5 - crystal chime
    [VoxelType.Corrupted, 110],  // A2 - ominous drone
  ]);
  
  // Pattern density creates musical layers
  generateAmbience(chunk: Chunk): AudioNode {
    const density = chunk.getAliveDensity();
    const stability = chunk.getStabilityScore();
    
    // More patterns = richer harmonics
    // More stability = consonant chords
    // Chaos = dissonant textures
  }
}
```

**Audio Features:**
- Birth events trigger ascending arpeggios
- Death cascades create descending waterfalls of notes
- Gliders leave Doppler trails of sound
- Player footsteps resonate with nearby patterns
- Corruption spreads with distorted, warped audio
- Safe zones have warm, peaceful ambience

### 👻 Memory Echoes

Ghosts of past patterns haunt the world:

- **Phantom Patterns** - Semi-transparent echoes of patterns that died, visible only during slow time
- **Memory Crystals** - Harvestable items containing recordings of complex patterns
- **Echo Replay** - Activate to see 30 seconds of pattern history at current location
- **Haunted Zones** - Areas where powerful patterns died leave permanent visual residue
- **Pattern Archaeology** - Dig through layers of echoes to discover ancient formations

```typescript
interface MemoryEcho {
  pattern: PatternSnapshot;
  age: number;           // Cycles since death
  intensity: number;     // Visual opacity (fades over time)
  emotionalCharge: EmotionType;  // Joy, fear, mystery based on pattern type
}
```

### 🧬 Pattern Symbiosis

Patterns that work together create emergent behaviors:

| Symbiosis Type | Components | Result |
|---------------|------------|--------|
| **Guardian Pair** | Oscillator + Still Life | Oscillator protects Still Life from corruption |
| **Harvester Swarm** | 3+ Gliders in formation | Creates resource drops when passing through matter |
| **Resonance Choir** | Multiple oscillators in sync | Amplifies energy production, creates music |
| **Corruption Shield** | Ring of crystallized voxels | Immune to corruption spread |
| **Pattern Garden** | Specific still life arrangement | Slowly "grows" new patterns over time |

**Discovery System:**
- Players must discover symbiosis through experimentation
- Codex entries unlock when new symbiosis observed
- Rare symbiosis combinations grant achievements

### 🌈 Emotional World States

The dimension responds to cumulative events:

```typescript
enum WorldMood {
  TRANQUIL,    // Mostly still life, slow evolution
  ANXIOUS,     // High birth/death rate
  EUPHORIC,    // Many patterns in harmony
  CORRUPTED,   // Corruption spreading
  DREAMING,    // Player in safe zone for extended time
  AWAKENING,   // Post-corruption recovery
}

class WorldEmotions {
  calculateMood(): WorldMood {
    const birth = this.recentBirths / this.recentDeaths;
    const corruption = this.corruptionPercentage;
    const stability = this.stablePatternPercentage;
    
    // Mood affects: color grading, music, particle density, CA speed
  }
}
```

**Visual Mood Indicators:**
- **Tranquil**: Soft blues, slow particles, gentle music
- **Anxious**: Flickering lights, rapid particles, tense music
- **Euphoric**: Rainbow accents, celebration particles, uplifting music
- **Corrupted**: Red/black palette, glitch effects, distorted audio
- **Dreaming**: Pastel colors, floating symbols, ethereal music

### 💫 Living Constellations

At the edge of render distance, massive patterns form constellations:

- **Sky Patterns** - Gigantic still life formations that span chunks, visible as "stars"
- **Constellation Stories** - Each constellation has lore revealed through proximity
- **Navigation Aid** - Constellations help orient in vast worlds
- **Shooting Stars** - Extremely fast gliders crossing the sky
- **Pattern Rain** - Periodic events where small patterns fall from above
- **Eclipse Events** - When massive patterns temporarily block light

### 🎲 Quantum Voxel States

Advanced voxels with probabilistic behavior:

```typescript
interface QuantumVoxel {
  superposition: Map<VoxelType, number>;  // Type -> probability
  entangledWith?: Vector3[];               // Linked voxels
  observedState?: VoxelType;               // Collapsed state
  coherenceTime: number;                   // Ticks until decoherence
}

// Observation (player looking) collapses superposition
// Entangled voxels collapse to complementary states
// Coherent patterns exhibit wave-like interference
```

**Quantum Mechanics:**
- **Superposition Zones** - Voxels exist in multiple states simultaneously (visual shimmer)
- **Entangled Pairs** - Two voxels always opposite states, even at distance
- **Observer Effect** - Looking at quantum zones forces state collapse
- **Quantum Tunneling** - Patterns occasionally pass through barriers
- **Wave Patterns** - Interference creates unique oscillation behaviors

### 🌙 Dream Sequences

When resting in safe zones, enter a dream dimension:

- **Memory Replay** - Revisit patterns you've encountered
- **Pattern Visions** - Hints about undiscovered formations
- **Abstract Landscapes** - Non-Euclidean CA rules create impossible spaces
- **Prophetic Dreams** - Preview upcoming temporal storms or corruption
- **Dream Crafting** - Design patterns in safe sandbox before waking

```typescript
class DreamState {
  // Dreams use relaxed CA rules for more creativity
  dreamRules: CARule = {
    surviveRange: [2, 8],  // Very permissive
    birthRange: [3, 7],
    dimensions: 3,
  };
  
  // Abstract rendering mode
  renderStyle: 'ethereal' | 'geometric' | 'memories';
}
```

### 🏛️ Pattern Archaeology

Discover ancient civilizations through their CA remnants:

- **Fossil Patterns** - Crystallized formations millions of cycles old
- **Ancient Libraries** - Structures containing pattern seeds from lost navigators
- **Ruins** - Decayed bases with stabilizers still partially functioning
- **Glyphs** - Still life arrangements that form readable symbols
- **Timeline Scans** - Expensive ability to view location's deep history

**Lore System:**
- Each biome has unique archaeological discoveries
- Piecing together findings reveals the history of the CA universe
- Some discoveries unlock legendary patterns or abilities
- Environmental storytelling through pattern arrangements

### 🎭 Pattern Personalities

Recurring patterns develop recognizable behaviors:

```typescript
interface PatternPersonality {
  name: string;            // Player-assigned or generated
  birthLocation: Vector3;
  age: number;
  behavior: BehaviorType;  // Curious, Aggressive, Timid, Protective
  memories: PatternEvent[];
  
  // Patterns "remember" player interactions
  relationshipWithPlayer: number;  // -100 to +100
}
```

**Personality Types:**
- **Curious Gliders** - Follow players at safe distance
- **Aggressive Swarms** - Hunt player patterns
- **Timid Oscillators** - Stop when observed, resume when not
- **Protective Guardians** - Orbit and defend still life formations
- **Playful Patterns** - Respond to player placement with mimicry

### 🌊 Reality Ripples

Player actions create lasting impact:

- **Placement Ripples** - Voxels placed create expanding ring of influence
- **Temporal Wakes** - Time manipulation leaves visible trails
- **Emotional Imprints** - Areas where player died have permanent visual markers
- **Achievement Marks** - Completing challenges leaves celebratory pattern
- **World Memory** - The dimension "remembers" significant player actions

### 🎪 Dimensional Anomalies

Rare encounters with impossible phenomena:

| Anomaly | Effect | Reward |
|---------|--------|--------|
| **Mobius Chunk** | Space loops back on itself | Unique looping patterns |
| **Frozen Time Pocket** | Area where CA doesn't evolve | Preserved ancient patterns |
| **Rule Inversion Zone** | Birth = Death rules | Inverted pattern behaviors |
| **Infinite Density** | More neighbors than possible | Exotic energy crystals |
| **Pattern Singularity** | Self-replicating super-pattern | Legendary codex entry |
| **Reality Tear** | Visible gap in world fabric | Dimension rift access |

### 🎨 Player Expression

Creative tools for personalization:

- **Pattern Signatures** - Create personal symbol that appears in your creations
- **Color Themes** - Customize your energy/glow colors
- **Trail Effects** - Visual trail showing where you've walked
- **Emotes** - Trigger visual effects (celebration particles, etc.)
- **Base Decorations** - Non-functional aesthetic patterns
- **Screenshot Mode** - Hide UI, free camera, filters

---

## 🚀 Future Enhancements

### Phase 2 Features
- **Multiplayer Co-op** - Shared dimensions, collaborative building
- **Async Multiplayer** - Leave messages, share patterns
- **Mobile Support** - Touch controls, performance optimization
- **VR Mode** - Immersive 3D CA exploration
- **Mod Support** - Custom rules, biomes, patterns
- **Steam Workshop** - Share/download player creations

### Advanced Systems
- **Neural Network AI** - Learn optimal pattern strategies
- **Procedural Music** - Generated based on CA state
- **Weather System** - Environmental effects on CA
- **Narrative Mode** - Story-driven CA puzzles
- **Speedrun Mode** - Timed challenges, leaderboards
- **Creative Mode** - Full sandbox with no limits

### Technical Improvements
- **WebGPU** - Next-gen graphics API
- **WASM Compute** - Faster CA simulation
- **Ray Tracing** - Enhanced visual quality
- **Networked Physics** - Multiplayer interactions
- **Save Cloud Sync** - Cross-device progression
- **Replay System** - Record and share gameplay

---

## 📚 Resources & References

### Cellular Automata Theory
- [Conway's Game of Life](https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life)
- [3D Cellular Automata](https://www.conwaylife.com/wiki/3D)
- [LifeWiki Pattern Database](https://www.conwaylife.com/wiki/)
- [Golly Pattern Collection](http://golly.sourceforge.net/)

### Technical References
- [Three.js Documentation](https://threejs.org/docs/)
- [Greedy Meshing Algorithm](https://0fps.net/2012/06/30/meshing-in-a-minecraft-game/)
- [Voxel Rendering Techniques](https://sites.google.com/site/letsmakeavoxelengine/)
- [Web Workers Guide](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)

### Inspiration
- **Games:** Minecraft, No Man's Sky, Baba Is You, The Witness
- **Art:** Tron, Blade Runner, Monument Valley, Superhot
- **Simulations:** Golly, Life in Life, WireWorld

---

## 🤝 Contributing

This is a showcase project, but ideas and improvements are welcome!

### Development Setup
```bash
# Clone repository
git clone https://github.com/yourusername/genesis-protocol.git
cd genesis-protocol

# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build
```

### Code Style
- Use TypeScript strict mode
- Follow ESLint configuration
- Write unit tests for core logic
- Document public APIs
- Use meaningful variable names

---

## 📄 License

MIT License - feel free to learn from and build upon this project!

---

## 🎮 Final Notes

**Genesis Protocol** combines:
- ✅ **Game of Life randomicity** - Emergent, unpredictable behavior
- ✅ **3D voxel world** - Full volumetric cellular automaton
- ✅ **Modern graphics** - Shaders, effects, polished visuals
- ✅ **Deep gameplay** - Survival, exploration, creativity
- ✅ **Technical showcase** - Performance optimization, algorithms, architecture

This game demonstrates advanced software engineering while creating a unique, beautiful, and engaging experience. The cellular automaton foundation provides infinite replayability and emergent gameplay that players have never seen before.

**Start small, iterate fast, and let the patterns emerge!**
