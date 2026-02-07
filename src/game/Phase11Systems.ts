/**
 * Phase 11 Creative Features - Consolidated Implementation
 * This file contains all remaining Phase 11 creative systems
 */

import { Vector3, Color, Camera } from 'three';
import type { VoxelGrid } from '../core/VoxelGrid';

// ============================================================================
// Living Constellations - Sky Patterns
// ============================================================================

export interface Constellation {
    id: string;
    name: string;
    pattern: Vector3[];
    brightness: number;
    discovered: boolean;
    story?: string;
}

export class LivingConstellations {
    private constellations: Map<string, Constellation> = new Map();

    constructor() {
        this.initializeConstellations();
    }

    private initializeConstellations(): void {
        this.constellations.set('glider_path', {
            id: 'glider_path',
            name: 'The Eternal Traveler',
            pattern: this.createGliderConstellation(),
            brightness: 0.8,
            discovered: false,
            story: 'A cosmic glider that has traveled since the beginning of time'
        });

        this.constellations.set('pulsar_heart', {
            id: 'pulsar_heart',
            name: 'The Beating Heart',
            pattern: this.createPulsarConstellation(),
            brightness: 1.0,
            discovered: false,
            story: 'The heartbeat of the universe itself'
        });
    }

    private createGliderConstellation(): Vector3[] {
        // Create a giant glider pattern in the sky
        return [
            new Vector3(0, 0, 0),
            new Vector3(1, 0, 1),
            new Vector3(2, 0, -1),
            new Vector3(2, 0, 0),
            new Vector3(2, 0, 1)
        ].map(v => v.multiplyScalar(10));
    }

    private createPulsarConstellation(): Vector3[] {
        const points: Vector3[] = [];
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            points.push(new Vector3(
                Math.cos(angle) * 15,
                Math.sin(angle) * 15,
                0
            ));
        }
        return points;
    }

    discoverConstellation(id: string): boolean {
        const constellation = this.constellations.get(id);
        if (constellation && !constellation.discovered) {
            constellation.discovered = true;
            console.log(`⭐ Constellation discovered: ${constellation.name}`);
            return true;
        }
        return false;
    }

    getVisibleConstellations(): Constellation[] {
        return Array.from(this.constellations.values()).filter(c => c.discovered);
    }

    setEnabled(_enabled: boolean): void {
        // Method preserved for API compatibility
    }
}

// ============================================================================
// Quantum Voxel States - Superposition & Entanglement
// ============================================================================

export interface QuantumVoxel {
    position: Vector3;
    states: number[]; // Possible states
    probabilities: number[]; // Probability for each state
    entangledWith?: Vector3[]; // Positions of entangled voxels
    collapsed: boolean;
}

export class QuantumVoxelStates {
    private quantumVoxels: Map<string, QuantumVoxel> = new Map();

    createSuperposition(position: Vector3, possibleStates: number[]): void {
        const probabilities = possibleStates.map(() => 1 / possibleStates.length);

        const quantum: QuantumVoxel = {
            position: position.clone(),
            states: possibleStates,
            probabilities,
            collapsed: false
        };

        this.quantumVoxels.set(this.positionKey(position), quantum);
    }

    entangle(pos1: Vector3, pos2: Vector3): void {
        const key1 = this.positionKey(pos1);
        const key2 = this.positionKey(pos2);

        const q1 = this.quantumVoxels.get(key1);
        const q2 = this.quantumVoxels.get(key2);

        if (q1 && q2) {
            q1.entangledWith = q1.entangledWith || [];
            q2.entangledWith = q2.entangledWith || [];
            q1.entangledWith.push(pos2);
            q2.entangledWith.push(pos1);

            console.log(`🔗 Quantum entanglement created between voxels`);
        }
    }

    collapse(position: Vector3, grid: VoxelGrid): number {
        const key = this.positionKey(position);
        const quantum = this.quantumVoxels.get(key);

        if (!quantum || quantum.collapsed) {
            return grid.get(Math.floor(position.x), Math.floor(position.y), Math.floor(position.z));
        }

        // Collapse to one state based on probabilities
        const rand = Math.random();
        let cumulative = 0;
        let collapsedState = quantum.states[0];

        // quantum.probabilities should always be defined
        if (quantum.probabilities) {
            for (let i = 0; i < quantum.probabilities.length; i++) {
                const probability = quantum.probabilities[i];
                if (probability !== undefined) {
                    cumulative += probability;
                    if (rand < cumulative) {
                        collapsedState = quantum.states[i];
                        break;
                    }
                }
            }
        }

        quantum.collapsed = true;
        if (collapsedState !== undefined) {
            grid.set(Math.floor(position.x), Math.floor(position.y), Math.floor(position.z), collapsedState);
        }

        // Collapse entangled voxels
        if (quantum.entangledWith) {
            quantum.entangledWith.forEach(entangledPos => {
                this.collapse(entangledPos, grid);
            });
        }

        console.log(`⚛️ Quantum voxel collapsed to state: ${collapsedState}`);

        return collapsedState !== undefined ? collapsedState : 0;
    }

    private positionKey(pos: Vector3): string {
        return `${Math.floor(pos.x)},${Math.floor(pos.y)},${Math.floor(pos.z)}`;
    }

    setEnabled(_enabled: boolean): void {
        // Method preserved for API compatibility
    }
}

// ============================================================================
// Dream Sequences - Surreal Dimension
// ============================================================================

export class DreamSequences {
    private inDream: boolean = false;
    private dreamIntensity: number = 0;
    private dreamDuration: number = 30000; // 30 seconds
    private dreamStartTime: number = 0;

    enterDream(): void {
        this.inDream = true;
        this.dreamIntensity = 0;
        this.dreamStartTime = Date.now();
        console.log(`💭 Entering dream sequence...`);
    }

    exitDream(): void {
        this.inDream = false;
        this.dreamIntensity = 0;
        console.log(`💭 Exiting dream sequence...`);
    }

    update(_deltaTime: number): void {
        if (!this.inDream) return;

        const elapsed = Date.now() - this.dreamStartTime;

        // Fade in for first quarter, fade out for last quarter
        if (elapsed < this.dreamDuration / 4) {
            this.dreamIntensity = elapsed / (this.dreamDuration / 4);
        } else if (elapsed > (this.dreamDuration * 3 / 4)) {
            const remaining = this.dreamDuration - elapsed;
            this.dreamIntensity = remaining / (this.dreamDuration / 4);
        } else {
            this.dreamIntensity = 1.0;
        }

        // Auto-exit after duration
        if (elapsed >= this.dreamDuration) {
            this.exitDream();
        }
    }

    isInDream(): boolean {
        return this.inDream;
    }

    getDreamIntensity(): number {
        return this.dreamIntensity;
    }

    getDreamEffects(): {
        caSpeedMultiplier: number;
        colorShift: number;
        motionBlur: number;
    } {
        return {
            caSpeedMultiplier: 0.3 + this.dreamIntensity * 0.4,
            colorShift: this.dreamIntensity * 0.5,
            motionBlur: this.dreamIntensity * 0.05
        };
    }
}

// ============================================================================
// Pattern Archaeology - Ancient Fossils & Ruins
// ============================================================================

export interface Fossil {
    id: string;
    name: string;
    age: number; // in game ticks
    position: Vector3;
    patternData: Uint8Array;
    boundingBox: { min: Vector3; max: Vector3 };
    discovered: boolean;
    lore: string;
}

export class PatternArchaeology {
    private fossils: Map<string, Fossil> = new Map();
    // Removed unused: _fossilizationAge

    createFossil(
        name: string,
        position: Vector3,
        patternData: Uint8Array,
        boundingBox: { min: Vector3; max: Vector3 },
        lore: string
    ): void {
        const fossil: Fossil = {
            id: `fossil_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name,
            age: 0,
            position: position.clone(),
            patternData,
            boundingBox,
            discovered: false,
            lore
        };

        this.fossils.set(fossil.id, fossil);
    }

    discoverFossil(id: string): boolean {
        const fossil = this.fossils.get(id);
        if (fossil && !fossil.discovered) {
            fossil.discovered = true;
            console.log(`🏛️ Ancient pattern discovered: ${fossil.name}`);
            console.log(`   "${fossil.lore}"`);
            return true;
        }
        return false;
    }

    getDiscoveredFossils(): Fossil[] {
        return Array.from(this.fossils.values()).filter(f => f.discovered);
    }

    ageFossils(ticks: number): void {
        this.fossils.forEach(fossil => {
            fossil.age += ticks;
        });
    }
}

// ============================================================================
// Reality Ripples - Persistent Player Impact
// ============================================================================

export interface RealityRipple {
    id: string;
    position: Vector3;
    type: 'creation' | 'destruction' | 'transformation';
    intensity: number;
    radius: number;
    timestamp: number;
    playerAction: string;
}

export class RealityRipples {
    private ripples: Map<string, RealityRipple> = new Map();
    private maxRipples: number = 50;
    private fadeRate: number = 0.0001; // per millisecond

    createRipple(position: Vector3, type: RealityRipple['type'], playerAction: string, intensity: number = 1.0): void {
        // Remove oldest if at capacity
        if (this.ripples.size >= this.maxRipples) {
            const oldest = Array.from(this.ripples.entries())
                .sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
            if (oldest) this.ripples.delete(oldest[0]);
        }

        const ripple: RealityRipple = {
            id: `ripple_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            position: position.clone(),
            type,
            intensity,
            radius: 5 + intensity * 5,
            timestamp: Date.now(),
            playerAction
        };

        this.ripples.set(ripple.id, ripple);
        console.log(`🌊 Reality ripple created: ${type} (${playerAction})`);
    }

    update(deltaTime: number): void {
        const toRemove: string[] = [];
        const deltaMs = deltaTime * 1000;

        this.ripples.forEach((ripple, id) => {
            ripple.intensity -= this.fadeRate * deltaMs;
            if (ripple.intensity <= 0) {
                toRemove.push(id);
            }
        });

        toRemove.forEach(id => this.ripples.delete(id));
    }

    getRipplesNear(position: Vector3, radius: number): RealityRipple[] {
        return Array.from(this.ripples.values()).filter(ripple =>
            ripple.position.distanceTo(position) <= radius + ripple.radius
        );
    }
}

// ============================================================================
// Dimensional Anomalies - Rare Phenomena
// ============================================================================

export enum AnomalyType {
    MOBIUS_CHUNK = 'mobius_chunk',
    FROZEN_TIME = 'frozen_time',
    RULE_INVERSION = 'rule_inversion',
    GRAVITY_WELL = 'gravity_well',
    TIME_DILATION = 'time_dilation',
    MIRROR_DIMENSION = 'mirror_dimension'
}

export interface DimensionalAnomaly {
    id: string;
    type: AnomalyType;
    position: Vector3;
    radius: number;
    active: boolean;
    discovered: boolean;
    rarity: number; // 0-1, how rare
}

export class DimensionalAnomalies {
    private anomalies: Map<string, DimensionalAnomaly> = new Map();
    private spawnChance: number = 0.001; // 0.1% per update

    spawnAnomaly(position: Vector3, type?: AnomalyType): DimensionalAnomaly {
        const anomalyType = type || this.getRandomAnomalyType();

        const anomaly: DimensionalAnomaly = {
            id: `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: anomalyType,
            position: position.clone(),
            radius: 10 + Math.random() * 10,
            active: true,
            discovered: false,
            rarity: this.getAnomalyRarity(anomalyType)
        };

        this.anomalies.set(anomaly.id, anomaly);
        console.log(`🌀 Dimensional anomaly spawned: ${anomalyType}`);

        return anomaly;
    }

    private getRandomAnomalyType(): AnomalyType {
        const types = Object.values(AnomalyType);
        return types[Math.floor(Math.random() * types.length)] as AnomalyType;
    }

    private getAnomalyRarity(type: AnomalyType): number {
        const rarities: { [key: string]: number } = {
            [AnomalyType.FROZEN_TIME]: 0.3,
            [AnomalyType.RULE_INVERSION]: 0.5,
            [AnomalyType.GRAVITY_WELL]: 0.6,
            [AnomalyType.TIME_DILATION]: 0.7,
            [AnomalyType.MOBIUS_CHUNK]: 0.9,
            [AnomalyType.MIRROR_DIMENSION]: 1.0
        };
        return rarities[type] || 0.5;
    }

    trySpawnRandomAnomaly(grid: VoxelGrid): boolean {
        if (Math.random() < this.spawnChance) {
            const pos = new Vector3(
                Math.random() * grid.width,
                Math.random() * grid.height,
                Math.random() * grid.depth
            );
            this.spawnAnomaly(pos);
            return true;
        }
        return false;
    }

    getActiveAnomalies(): DimensionalAnomaly[] {
        return Array.from(this.anomalies.values()).filter(a => a.active);
    }

    discoverAnomaly(id: string): boolean {
        const anomaly = this.anomalies.get(id);
        if (anomaly && !anomaly.discovered) {
            anomaly.discovered = true;
            console.log(`🌀 Anomaly discovered: ${anomaly.type}`);
            return true;
        }
        return false;
    }
}

// ============================================================================
// Pattern Mutations & Evolution (Genetic Algorithm)
// ============================================================================

export interface PatternGenome {
    id: string;
    rules: number[]; // CA rules encoded as numbers
    fitness: number;
    generation: number;
    parentIds: string[];
}

export class PatternEvolution {
    private population: PatternGenome[] = [];
    private populationSize: number = 20;
    private mutationRate: number = 0.1;
    private generation: number = 0;

    initializePopulation(): void {
        this.population = [];
        for (let i = 0; i < this.populationSize; i++) {
            this.population.push(this.createRandomGenome());
        }
    }

    private createRandomGenome(): PatternGenome {
        return {
            id: `genome_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            rules: Array.from({ length: 10 }, () => Math.floor(Math.random() * 256)),
            fitness: 0,
            generation: this.generation,
            parentIds: []
        };
    }

    evolveGeneration(): void {
        // Selection
        this.population.sort((a, b) => b.fitness - a.fitness);
        const survivors = this.population.slice(0, Math.floor(this.populationSize / 2));

        // Crossover and mutation
        const offspring: PatternGenome[] = [];
        while (offspring.length + survivors.length < this.populationSize) {
            const parent1 = survivors[Math.floor(Math.random() * survivors.length)]!;
            const parent2 = survivors[Math.floor(Math.random() * survivors.length)]!;
            const child = this.crossover(parent1, parent2);
            this.mutate(child);
            offspring.push(child);
        }

        this.population = [...survivors, ...offspring];
        this.generation++;

        console.log(`🧬 Evolution generation ${this.generation} completed`);
    }

    private crossover(parent1: PatternGenome, parent2: PatternGenome): PatternGenome {
        const _crossoverPoint = Math.floor(Math.random() * parent1.rules.length);
        const childRules = [
            ...parent1.rules.slice(0, _crossoverPoint),
            ...parent2.rules.slice(_crossoverPoint)
        ];

        return {
            id: `genome_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            rules: childRules,
            fitness: 0,
            generation: this.generation + 1,
            parentIds: [parent1.id, parent2.id]
        };
    }

    private mutate(genome: PatternGenome): void {
        genome.rules = genome.rules.map(rule =>
            Math.random() < this.mutationRate
                ? Math.floor(Math.random() * 256)
                : rule
        );
    }

    evaluateFitness(genomeId: string, fitness: number): void {
        const genome = this.population.find(g => g.id === genomeId);
        if (genome) {
            genome.fitness = fitness;
        }
    }

    getBestGenome(): PatternGenome | null {
        if (this.population.length === 0) return null;
        return this.population.reduce((best, current) =>
            current.fitness > best.fitness ? current : best
        );
    }
}

// ============================================================================
// Player Expression - Customization
// ============================================================================

export interface PlayerSignature {
    color: Color;
    trail: boolean;
    trailLength: number;
    trailColor: Color;
    particleEffect?: string;
    nameTag: string;
}

export class PlayerExpression {
    private signature: PlayerSignature;
    private trailPositions: Vector3[] = [];

    constructor() {
        this.signature = {
            color: new Color(0x00ffff),
            trail: false,
            trailLength: 20,
            trailColor: new Color(0x00ffff),
            nameTag: 'Player'
        };
    }

    setColor(color: Color): void {
        this.signature.color = color.clone();
    }

    setTrail(enabled: boolean, color?: Color, length?: number): void {
        this.signature.trail = enabled;
        if (color) this.signature.trailColor = color.clone();
        if (length) this.signature.trailLength = length;
    }

    setNameTag(name: string): void {
        this.signature.nameTag = name;
    }

    updateTrail(playerPosition: Vector3): void {
        if (!this.signature.trail) return;

        this.trailPositions.unshift(playerPosition.clone());
        if (this.trailPositions.length > this.signature.trailLength) {
            this.trailPositions.pop();
        }
    }

    getSignature(): PlayerSignature {
        return { ...this.signature };
    }

    getTrailPositions(): Vector3[] {
        return [...this.trailPositions];
    }
}

// ============================================================================
// Screenshot Mode - Photo Mode
// ============================================================================

export class ScreenshotMode {
    private active: boolean = false;
    private hideUI: boolean = true;
    // Removed unused: _freeCamera and _originalCameraRotation
    private filters: Map<string, number> = new Map();
    private originalCameraPosition?: Vector3;

    activate(camera: Camera): void {
        this.active = true;
        this.originalCameraPosition = camera.position.clone();
        console.log('📷 Screenshot mode activated');
    }

    deactivate(camera: Camera): void {
        this.active = false;
        if (this.originalCameraPosition) {
            camera.position.copy(this.originalCameraPosition);
        }
        console.log('📷 Screenshot mode deactivated');
    }

    takeScreenshot(canvas: HTMLCanvasElement, filename: string = 'genesis_protocol_screenshot.png'): void {
        canvas.toBlob((blob) => {
            if (blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.click();
                URL.revokeObjectURL(url);
                console.log(`📷 Screenshot saved: ${filename}`);
            }
        });
    }

    setFilter(name: string, value: number): void {
        this.filters.set(name, value);
    }

    getFilter(name: string): number {
        return this.filters.get(name) || 0;
    }

    isActive(): boolean {
        return this.active;
    }

    shouldHideUI(): boolean {
        return this.hideUI;
    }

    toggleUI(): void {
        this.hideUI = !this.hideUI;
    }
}
