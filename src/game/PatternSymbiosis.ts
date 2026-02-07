import { Vector3 } from 'three';
import type { VoxelGrid } from '../core/VoxelGrid';

export interface SymbioticRelationship {
    id: string;
    pattern1: string;
    pattern2: string;
    type: SymbiosisType;
    strength: number; // 0-1
    effectRadius: number;
    discovered: boolean;
    discoveredAt?: number;
}

export enum SymbiosisType {
    MUTUALISTIC = 'mutualistic', // Both benefit
    COMMENSALISTIC = 'commensalistic', // One benefits, other neutral
    PARASITIC = 'parasitic', // One benefits, other harmed
    COMPETITIVE = 'competitive', // Both compete
    SYNERGISTIC = 'synergistic' // Create something new together
}

export interface PatternCluster {
    patterns: Map<string, Vector3[]>; // pattern type -> positions
    center: Vector3;
    radius: number;
    activeRelationships: SymbioticRelationship[];
}

export class PatternSymbiosis {
    private relationships: Map<string, SymbioticRelationship> = new Map();
    private activeClusters: PatternCluster[] = [];
    private detectionRadius: number = 10;
    // Removed unused: _minPatternProximity
    private enabled: boolean = true;

    constructor() {
        this.initializeRelationships();
    }

    private initializeRelationships(): void {
        const relationships: SymbioticRelationship[] = [
            // Mutualistic relationships
            {
                id: 'glider_beacon',
                pattern1: 'glider',
                pattern2: 'beacon',
                type: SymbiosisType.MUTUALISTIC,
                strength: 0.7,
                effectRadius: 8,
                discovered: false
            },
            {
                id: 'block_beehive',
                pattern1: 'block',
                pattern2: 'beehive',
                type: SymbiosisType.MUTUALISTIC,
                strength: 0.5,
                effectRadius: 5,
                discovered: false
            },
            {
                id: 'pulsar_oscillator',
                pattern1: 'pulsar',
                pattern2: 'blinker',
                type: SymbiosisType.SYNERGISTIC,
                strength: 0.8,
                effectRadius: 12,
                discovered: false
            },

            // Competitive relationships
            {
                id: 'glider_lwss',
                pattern1: 'glider',
                pattern2: 'lightweight_spaceship',
                type: SymbiosisType.COMPETITIVE,
                strength: 0.6,
                effectRadius: 10,
                discovered: false
            },

            // Parasitic relationships
            {
                id: 'gun_stilllife',
                pattern1: 'gosper_glider_gun',
                pattern2: 'block',
                type: SymbiosisType.PARASITIC,
                strength: 0.9,
                effectRadius: 15,
                discovered: false
            },

            // Synergistic relationships
            {
                id: 'energy_crystal',
                pattern1: 'energy_core',
                pattern2: 'crystal_cluster',
                type: SymbiosisType.SYNERGISTIC,
                strength: 1.0,
                effectRadius: 15,
                discovered: false
            }
        ];

        relationships.forEach(rel => this.relationships.set(rel.id, rel));
    }

    /**
     * Detect pattern clusters and active relationships
     */
    detectClusters(_grid: VoxelGrid, patternPositions: Map<string, Vector3[]>): void {
        if (!this.enabled || patternPositions.size === 0) {
            this.activeClusters = [];
            return;
        }

        const clusters: PatternCluster[] = [];

        // Find all unique pattern pairs within detection radius
        const patternTypes = Array.from(patternPositions.keys());

        for (let i = 0; i < patternTypes.length; i++) {
            for (let j = i; j < patternTypes.length; j++) {
                const pattern1 = patternTypes[i];
                const pattern2 = patternTypes[j];

                const positions1 = patternPositions.get(pattern1!);
                const positions2 = patternPositions.get(pattern2!);

                // Check each position pair
                for (const pos1 of positions1 || []) {
                    for (const pos2 of positions2 || []) {
                        const distance = pos1.distanceTo(pos2);

                        if (distance > 0 && distance <= this.detectionRadius) {
                            // Found proximity - check for known relationships
                            const activeRels = this.findActiveRelationships(pattern1!, pattern2!);

                            if (activeRels.length > 0) {
                                // Create or update cluster
                                const center = new Vector3()
                                    .addVectors(pos1, pos2)
                                    .multiplyScalar(0.5);

                                const cluster: PatternCluster = {
                                    patterns: new Map([
                                        [pattern1!, [pos1]],
                                        [pattern2!, [pos2]]
                                    ]),
                                    center,
                                    radius: distance / 2,
                                    activeRelationships: activeRels
                                };

                                clusters.push(cluster);

                                // Mark relationships as discovered
                                activeRels.forEach(rel => {
                                    if (!rel.discovered) {
                                        rel.discovered = true;
                                        rel.discoveredAt = Date.now();
                                        console.log(`🤝 Symbiotic relationship discovered: ${rel.pattern1} + ${rel.pattern2} (${rel.type})`);
                                    }
                                });
                            }
                        }
                    }
                }
            }
        }

        this.activeClusters = clusters;
    }

    /**
     * Find relationships between two patterns
     */
    private findActiveRelationships(pattern1: string, pattern2: string): SymbioticRelationship[] {
        return Array.from(this.relationships.values()).filter(rel =>
            (rel.pattern1 === pattern1 && rel.pattern2 === pattern2) ||
            (rel.pattern1 === pattern2 && rel.pattern2 === pattern1)
        );
    }

    /**
     * Apply symbiotic effects to the grid
     */
    applySymbioticEffects(grid: VoxelGrid): void {
        if (!this.enabled || this.activeClusters.length === 0) return;

        this.activeClusters.forEach(cluster => {
            cluster.activeRelationships.forEach(relationship => {
                this.applyRelationshipEffect(grid, cluster, relationship);
            });
        });
    }

    /**
     * Apply a specific relationship effect
     */
    private applyRelationshipEffect(
        grid: VoxelGrid,
        cluster: PatternCluster,
        relationship: SymbioticRelationship
    ): void {
        const center = cluster.center;
        const radius = relationship.effectRadius;

        switch (relationship.type) {
            case SymbiosisType.MUTUALISTIC:
                // Both patterns become more stable (less likely to die)
                this.stabilizeArea(grid, center, radius, relationship.strength);
                break;

            case SymbiosisType.SYNERGISTIC:
                // Create new pattern elements at the boundary
                this.createSynergyVoxels(grid, center, radius, relationship.strength);
                break;

            case SymbiosisType.COMPETITIVE:
                // Increase volatility in the area
                this.increaseVolatility(grid, center, radius, relationship.strength);
                break;

            case SymbiosisType.PARASITIC:
                // One pattern drains energy from the other
                this.applyParasiticDrain(grid, cluster, relationship);
                break;

            case SymbiosisType.COMMENSALISTIC:
                // One pattern grows slightly faster
                this.boostGrowth(grid, center, radius, relationship.strength * 0.5);
                break;
        }
    }

    /**
     * Stabilize voxels in an area
     */
    private stabilizeArea(grid: VoxelGrid, center: Vector3, radius: number, strength: number): void {
        const minX = Math.max(0, Math.floor(center.x - radius));
        const maxX = Math.min(grid.width - 1, Math.ceil(center.x + radius));
        const minY = Math.max(0, Math.floor(center.y - radius));
        const maxY = Math.min(grid.height - 1, Math.ceil(center.y + radius));
        const minZ = Math.max(0, Math.floor(center.z - radius));
        const maxZ = Math.min(grid.depth - 1, Math.ceil(center.z + radius));

        for (let z = minZ; z <= maxZ; z++) {
            for (let y = minY; y <= maxY; y++) {
                for (let x = minX; x <= maxX; x++) {
                    const pos = new Vector3(x, y, z);
                    const dist = pos.distanceTo(center);

                    if (dist <= radius) {
                        const voxel = grid.get(x, y, z);
                        if (voxel > 0 && Math.random() < strength * 0.1) {
                            // Small chance to upgrade to energized state
                            grid.set(x, y, z, Math.min(voxel + 1, 3));
                        }
                    }
                }
            }
        }
    }

    /**
     * Create synergy voxels at cluster boundary
     */
    private createSynergyVoxels(grid: VoxelGrid, center: Vector3, radius: number, strength: number): void {
        // Create voxels in a ring at the edge of the effect radius
        const angleStep = Math.PI / 8;
        const rings = 2;

        for (let ring = 0; ring < rings; ring++) {
            const ringRadius = radius * (0.7 + ring * 0.15);

            for (let angle = 0; angle < Math.PI * 2; angle += angleStep) {
                for (let phi = 0; phi < Math.PI; phi += angleStep) {
                    if (Math.random() > strength) continue;

                    const x = Math.round(center.x + ringRadius * Math.sin(phi) * Math.cos(angle));
                    const y = Math.round(center.y + ringRadius * Math.sin(phi) * Math.sin(angle));
                    const z = Math.round(center.z + ringRadius * Math.cos(phi));

                    if (x >= 0 && x < grid.width &&
                        y >= 0 && y < grid.height &&
                        z >= 0 && z < grid.depth) {
                        if (grid.get(x, y, z) === 0) {
                            grid.set(x, y, z, 2); // Energized state
                        }
                    }
                }
            }
        }
    }

    /**
     * Increase volatility in competitive areas
     */
    private increaseVolatility(grid: VoxelGrid, center: Vector3, radius: number, strength: number): void {
        const minX = Math.max(0, Math.floor(center.x - radius));
        const maxX = Math.min(grid.width - 1, Math.ceil(center.x + radius));
        const minY = Math.max(0, Math.floor(center.y - radius));
        const maxY = Math.min(grid.height - 1, Math.ceil(center.y + radius));
        const minZ = Math.max(0, Math.floor(center.z - radius));
        const maxZ = Math.min(grid.depth - 1, Math.ceil(center.z + radius));

        for (let z = minZ; z <= maxZ; z++) {
            for (let y = minY; y <= maxY; y++) {
                for (let x = minX; x <= maxX; x++) {
                    const pos = new Vector3(x, y, z);
                    const dist = pos.distanceTo(center);

                    if (dist <= radius && Math.random() < strength * 0.05) {
                        const voxel = grid.get(x, y, z);
                        if (voxel > 0) {
                            // Random state change
                            grid.set(x, y, z, Math.floor(Math.random() * 4));
                        }
                    }
                }
            }
        }
    }

    /**
     * Apply parasitic drain effect
     */
    private applyParasiticDrain(grid: VoxelGrid, cluster: PatternCluster, relationship: SymbioticRelationship): void {
        // Host pattern (pattern2) loses energy, parasite (pattern1) gains
        const hostPositions = cluster.patterns.get(relationship.pattern2) || [];

        hostPositions.forEach(pos => {
            if (Math.random() < relationship.strength * 0.1) {
                const x = Math.floor(pos.x);
                const y = Math.floor(pos.y);
                const z = Math.floor(pos.z);

                const voxel = grid.get(x, y, z);
                if (voxel > 0) {
                    grid.set(x, y, z, Math.max(0, voxel - 1));
                }
            }
        });
    }

    /**
     * Boost growth in commensalistic relationships
     */
    private boostGrowth(grid: VoxelGrid, center: Vector3, radius: number, strength: number): void {
        const candidates: Vector3[] = [];

        // Find empty spaces near the center
        const minX = Math.max(0, Math.floor(center.x - radius));
        const maxX = Math.min(grid.width - 1, Math.ceil(center.x + radius));
        const minY = Math.max(0, Math.floor(center.y - radius));
        const maxY = Math.min(grid.height - 1, Math.ceil(center.y + radius));
        const minZ = Math.max(0, Math.floor(center.z - radius));
        const maxZ = Math.min(grid.depth - 1, Math.ceil(center.z + radius));

        for (let z = minZ; z <= maxZ; z++) {
            for (let y = minY; y <= maxY; y++) {
                for (let x = minX; x <= maxX; x++) {
                    if (grid.get(x, y, z) === 0) {
                        candidates.push(new Vector3(x, y, z));
                    }
                }
            }
        }

        // Spawn new voxels in some empty spaces
        const spawnCount = Math.floor(candidates.length * strength * 0.05);
        for (let i = 0; i < spawnCount; i++) {
            const pos = candidates[Math.floor(Math.random() * candidates.length)];
            if (pos) {
                grid.set(Math.floor(pos.x), Math.floor(pos.y), Math.floor(pos.z), 1);
            }
        }
    }

    /**
     * Get all discovered relationships
     */
    getDiscoveredRelationships(): SymbioticRelationship[] {
        return Array.from(this.relationships.values()).filter(r => r.discovered);
    }

    /**
     * Get active clusters
     */
    getActiveClusters(): PatternCluster[] {
        return this.activeClusters;
    }

    /**
     * Check if a relationship is active
     */
    isRelationshipActive(relationshipId: string): boolean {
        return this.activeClusters.some(cluster =>
            cluster.activeRelationships.some(rel => rel.id === relationshipId)
        );
    }

    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
    }

    isEnabled(): boolean {
        return this.enabled;
    }

    serialize(): any {
        return {
            relationships: Array.from(this.relationships.values()),
            enabled: this.enabled
        };
    }

    deserialize(data: any): void {
        if (data.relationships) {
            this.relationships.clear();
            data.relationships.forEach((rel: SymbioticRelationship) => {
                this.relationships.set(rel.id, rel);
            });
        }

        if (data.enabled !== undefined) {
            this.enabled = data.enabled;
        }
    }
}
