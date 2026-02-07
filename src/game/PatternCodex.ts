import { Vector3 } from 'three';

export interface PatternEntry {
    id: string;
    name: string;
    category: PatternCategory;
    discovered: boolean;
    discoveredAt?: number;
    firstSeenLocation?: Vector3;
    timesSpotted: number;
    description: string;
    behavior: string;
    rarity: PatternRarity;
    properties: PatternProperties;
    lore?: string;
    relatedPatterns?: string[];
}

export enum PatternCategory {
    STILL_LIFE = 'still_life',
    OSCILLATOR = 'oscillator',
    SPACESHIP = 'spaceship',
    GUN = 'gun',
    METHUSELAH = 'methuselah',
    PUFFER = 'puffer',
    EXOTIC = 'exotic',
    CUSTOM = 'custom'
}

export enum PatternRarity {
    COMMON = 'common',
    UNCOMMON = 'uncommon',
    RARE = 'rare',
    EPIC = 'epic',
    LEGENDARY = 'legendary'
}

export interface PatternProperties {
    period?: number; // For oscillators
    speed?: number; // For spaceships
    population: number; // Number of live cells
    stability: number; // 0-1, how stable the pattern is
    lifespan?: number; // For finite patterns
    boundingBox: { width: number; height: number; depth: number };
}

export interface PatternStats {
    totalDiscovered: number;
    totalPatterns: number;
    byCategory: Map<PatternCategory, number>;
    byRarity: Map<PatternRarity, number>;
    completionPercentage: number;
}

export class PatternCodex {
    private patterns: Map<string, PatternEntry> = new Map();
    private listeners: Map<string, Function[]> = new Map();
    private discoveryHistory: Array<{ pattern: string; timestamp: number }> = [];

    constructor() {
        this.initializePatterns();
    }

    private initializePatterns(): void {
        const patterns: PatternEntry[] = [
            // Still Life
            {
                id: 'block',
                name: 'Block',
                category: PatternCategory.STILL_LIFE,
                discovered: false,
                timesSpotted: 0,
                description: 'A stable 2x2 cube of cells',
                behavior: 'Completely static - never changes',
                rarity: PatternRarity.COMMON,
                properties: {
                    population: 8,
                    stability: 1.0,
                    boundingBox: { width: 2, height: 2, depth: 2 }
                },
                lore: 'The most fundamental stable structure. All complexity emerges from simplicity.',
                relatedPatterns: ['beehive', 'boat']
            },
            {
                id: 'beehive',
                name: 'Beehive',
                category: PatternCategory.STILL_LIFE,
                discovered: false,
                timesSpotted: 0,
                description: 'A hexagonal stable pattern',
                behavior: 'Static configuration with hexagonal symmetry',
                rarity: PatternRarity.COMMON,
                properties: {
                    population: 6,
                    stability: 1.0,
                    boundingBox: { width: 3, height: 2, depth: 2 }
                },
                lore: 'Nature loves hexagons. So do cellular automata.',
                relatedPatterns: ['block', 'boat']
            },
            {
                id: 'boat',
                name: 'Boat',
                category: PatternCategory.STILL_LIFE,
                discovered: false,
                timesSpotted: 0,
                description: 'A small stable pattern resembling a boat',
                behavior: 'Stable 5-cell configuration',
                rarity: PatternRarity.COMMON,
                properties: {
                    population: 5,
                    stability: 1.0,
                    boundingBox: { width: 2, height: 2, depth: 2 }
                },
                relatedPatterns: ['block', 'beehive']
            },

            // Oscillators
            {
                id: 'blinker',
                name: 'Blinker',
                category: PatternCategory.OSCILLATOR,
                discovered: false,
                timesSpotted: 0,
                description: 'The simplest oscillator, period 2',
                behavior: 'Alternates between horizontal and vertical line',
                rarity: PatternRarity.COMMON,
                properties: {
                    period: 2,
                    population: 3,
                    stability: 0.8,
                    boundingBox: { width: 3, height: 1, depth: 1 }
                },
                lore: 'Time\'s heartbeat. The first rhythm in the void.',
                relatedPatterns: ['toad', 'beacon']
            },
            {
                id: 'toad',
                name: 'Toad',
                category: PatternCategory.OSCILLATOR,
                discovered: false,
                timesSpotted: 0,
                description: 'A period-2 oscillator',
                behavior: 'Pulses between two states',
                rarity: PatternRarity.COMMON,
                properties: {
                    period: 2,
                    population: 6,
                    stability: 0.8,
                    boundingBox: { width: 3, height: 2, depth: 2 }
                },
                relatedPatterns: ['blinker', 'beacon']
            },
            {
                id: 'beacon',
                name: 'Beacon',
                category: PatternCategory.OSCILLATOR,
                discovered: false,
                timesSpotted: 0,
                description: 'Two blocks that blink',
                behavior: 'Alternates between two configurations',
                rarity: PatternRarity.COMMON,
                properties: {
                    period: 2,
                    population: 6,
                    stability: 0.8,
                    boundingBox: { width: 2, height: 2, depth: 2 }
                },
                lore: 'A lighthouse in the computational sea.',
                relatedPatterns: ['blinker', 'toad']
            },
            {
                id: 'pulsar',
                name: 'Pulsar',
                category: PatternCategory.OSCILLATOR,
                discovered: false,
                timesSpotted: 0,
                description: 'A large period-3 oscillator',
                behavior: 'Complex pulsing pattern',
                rarity: PatternRarity.UNCOMMON,
                properties: {
                    period: 3,
                    population: 48,
                    stability: 0.7,
                    boundingBox: { width: 13, height: 13, depth: 1 }
                },
                lore: 'Like a star, it breathes. Three beats, eternal.',
                relatedPatterns: ['pentadecathlon']
            },

            // Spaceships
            {
                id: 'glider',
                name: 'Glider',
                category: PatternCategory.SPACESHIP,
                discovered: false,
                timesSpotted: 0,
                description: 'The smallest, most common spaceship',
                behavior: 'Moves diagonally, period 4',
                rarity: PatternRarity.COMMON,
                properties: {
                    period: 4,
                    speed: 0.25,
                    population: 5,
                    stability: 0.9,
                    boundingBox: { width: 3, height: 3, depth: 1 }
                },
                lore: 'Life finds a way to move. The first traveler.',
                relatedPatterns: ['glider_3d', 'lightweight_spaceship']
            },
            {
                id: 'glider_3d',
                name: '3D Glider',
                category: PatternCategory.SPACESHIP,
                discovered: false,
                timesSpotted: 0,
                description: 'A glider that moves through 3D space',
                behavior: 'Travels diagonally through all three dimensions',
                rarity: PatternRarity.UNCOMMON,
                properties: {
                    period: 4,
                    speed: 0.25,
                    population: 7,
                    stability: 0.85,
                    boundingBox: { width: 3, height: 3, depth: 3 }
                },
                lore: 'When 2D wasn\'t enough. Evolution breaks barriers.',
                relatedPatterns: ['glider', 'lightweight_spaceship_3d']
            },
            {
                id: 'lightweight_spaceship',
                name: 'Lightweight Spaceship (LWSS)',
                category: PatternCategory.SPACESHIP,
                discovered: false,
                timesSpotted: 0,
                description: 'A small orthogonal spaceship',
                behavior: 'Moves in cardinal directions',
                rarity: PatternRarity.UNCOMMON,
                properties: {
                    period: 4,
                    speed: 0.5,
                    population: 9,
                    stability: 0.8,
                    boundingBox: { width: 5, height: 3, depth: 1 }
                },
                lore: 'Faster than a glider. The courier of the void.',
                relatedPatterns: ['glider', 'middleweight_spaceship']
            },
            {
                id: 'lightweight_spaceship_3d',
                name: '3D Lightweight Spaceship',
                category: PatternCategory.SPACESHIP,
                discovered: false,
                timesSpotted: 0,
                description: 'LWSS adapted for 3D space',
                behavior: 'Fast movement through 3D space',
                rarity: PatternRarity.RARE,
                properties: {
                    period: 4,
                    speed: 0.5,
                    population: 12,
                    stability: 0.75,
                    boundingBox: { width: 5, height: 3, depth: 3 }
                },
                relatedPatterns: ['lightweight_spaceship', 'glider_3d']
            },

            // Exotic/Special
            {
                id: 'energy_core',
                name: 'Energy Core',
                category: PatternCategory.EXOTIC,
                discovered: false,
                timesSpotted: 0,
                description: 'A pulsing sphere of pure energy',
                behavior: 'Radiates energy pulses, period varies',
                rarity: PatternRarity.RARE,
                properties: {
                    period: 8,
                    population: 32,
                    stability: 0.6,
                    boundingBox: { width: 5, height: 5, depth: 5 }
                },
                lore: 'The heart of creation. Where patterns are born.',
                relatedPatterns: ['crystal_cluster']
            },
            {
                id: 'crystal_cluster',
                name: 'Crystal Cluster',
                category: PatternCategory.EXOTIC,
                discovered: false,
                timesSpotted: 0,
                description: 'A stable crystalline formation',
                behavior: 'Slowly grows and stabilizes',
                rarity: PatternRarity.RARE,
                properties: {
                    population: 64,
                    stability: 0.7,
                    boundingBox: { width: 7, height: 7, depth: 7 }
                },
                lore: 'Order from chaos. Frozen complexity.',
                relatedPatterns: ['energy_core']
            },

            // Methuselahs
            {
                id: 'r_pentomino',
                name: 'R-pentomino',
                category: PatternCategory.METHUSELAH,
                discovered: false,
                timesSpotted: 0,
                description: 'A pattern that evolves for a long time',
                behavior: 'Runs for 1103 generations before stabilizing',
                rarity: PatternRarity.EPIC,
                properties: {
                    population: 5,
                    stability: 0.3,
                    lifespan: 1103,
                    boundingBox: { width: 2, height: 3, depth: 1 }
                },
                lore: 'From five cells, a universe. Patience rewards discovery.',
                relatedPatterns: ['acorn', 'diehard']
            },
            {
                id: 'acorn',
                name: 'Acorn',
                category: PatternCategory.METHUSELAH,
                discovered: false,
                timesSpotted: 0,
                description: 'A small pattern with long evolution',
                behavior: 'Runs for 5206 generations',
                rarity: PatternRarity.EPIC,
                properties: {
                    population: 7,
                    stability: 0.2,
                    lifespan: 5206,
                    boundingBox: { width: 7, height: 3, depth: 1 }
                },
                lore: 'Mighty oaks from little acorns grow.',
                relatedPatterns: ['r_pentomino']
            },

            // Guns
            {
                id: 'gosper_glider_gun',
                name: 'Gosper Glider Gun',
                category: PatternCategory.GUN,
                discovered: false,
                timesSpotted: 0,
                description: 'Periodically creates gliders',
                behavior: 'Spawns a new glider every 30 generations',
                rarity: PatternRarity.LEGENDARY,
                properties: {
                    period: 30,
                    population: 36,
                    stability: 0.9,
                    boundingBox: { width: 36, height: 9, depth: 1 }
                },
                lore: 'The first proof of infinite growth. A factory of life.',
                relatedPatterns: ['glider']
            }
        ];

        patterns.forEach(pattern => {
            this.patterns.set(pattern.id, pattern);
        });
    }

    discover(patternId: string, location?: Vector3): boolean {
        const pattern = this.patterns.get(patternId);
        if (!pattern) {
            console.warn(`Pattern ${patternId} not found in codex`);
            return false;
        }

        if (!pattern.discovered) {
            pattern.discovered = true;
            pattern.discoveredAt = Date.now();
            pattern.firstSeenLocation = location?.clone();
            pattern.timesSpotted = 1;

            this.discoveryHistory.push({
                pattern: patternId,
                timestamp: Date.now()
            });

            console.log(`📖 Pattern Discovered: ${pattern.name}`);
            console.log(`   ${pattern.description}`);
            console.log(`   Rarity: ${pattern.rarity}`);

            if (pattern.lore) {
                console.log(`   "${pattern.lore}"`);
            }

            this.emit('discovered', pattern);

            return true;
        } else {
            pattern.timesSpotted++;
            return false;
        }
    }

    isDiscovered(patternId: string): boolean {
        const pattern = this.patterns.get(patternId);
        return pattern ? pattern.discovered : false;
    }

    getPattern(patternId: string): PatternEntry | undefined {
        return this.patterns.get(patternId);
    }

    getAllPatterns(): PatternEntry[] {
        return Array.from(this.patterns.values());
    }

    getDiscoveredPatterns(): PatternEntry[] {
        return Array.from(this.patterns.values()).filter(p => p.discovered);
    }

    getUndiscoveredPatterns(): PatternEntry[] {
        return Array.from(this.patterns.values()).filter(p => !p.discovered);
    }

    getPatternsByCategory(category: PatternCategory): PatternEntry[] {
        return Array.from(this.patterns.values()).filter(p => p.category === category);
    }

    getPatternsByRarity(rarity: PatternRarity): PatternEntry[] {
        return Array.from(this.patterns.values()).filter(p => p.rarity === rarity);
    }

    getStats(): PatternStats {
        const patterns = Array.from(this.patterns.values());
        const discovered = patterns.filter(p => p.discovered);

        const byCategory = new Map<PatternCategory, number>();
        Object.values(PatternCategory).forEach(category => {
            byCategory.set(category, discovered.filter(p => p.category === category).length);
        });

        const byRarity = new Map<PatternRarity, number>();
        Object.values(PatternRarity).forEach(rarity => {
            byRarity.set(rarity, discovered.filter(p => p.rarity === rarity).length);
        });

        return {
            totalDiscovered: discovered.length,
            totalPatterns: patterns.length,
            byCategory,
            byRarity,
            completionPercentage: (discovered.length / patterns.length) * 100
        };
    }

    getRecentDiscoveries(count: number = 5): PatternEntry[] {
        return this.discoveryHistory
            .slice(-count)
            .reverse()
            .map(entry => this.patterns.get(entry.pattern))
            .filter(p => p !== undefined) as PatternEntry[];
    }

    getMostSpottedPatterns(count: number = 5): PatternEntry[] {
        return Array.from(this.patterns.values())
            .filter(p => p.discovered)
            .sort((a, b) => b.timesSpotted - a.timesSpotted)
            .slice(0, count);
    }

    getRelatedPatterns(patternId: string): PatternEntry[] {
        const pattern = this.patterns.get(patternId);
        if (!pattern || !pattern.relatedPatterns) {
            return [];
        }

        return pattern.relatedPatterns
            .map(id => this.patterns.get(id))
            .filter(p => p !== undefined) as PatternEntry[];
    }

    searchPatterns(query: string): PatternEntry[] {
        const lowerQuery = query.toLowerCase();
        return Array.from(this.patterns.values()).filter(p =>
            p.name.toLowerCase().includes(lowerQuery) ||
            p.description.toLowerCase().includes(lowerQuery) ||
            p.behavior.toLowerCase().includes(lowerQuery) ||
            (p.lore && p.lore.toLowerCase().includes(lowerQuery))
        );
    }

    // Custom pattern registration
    registerCustomPattern(
        name: string,
        description: string,
        properties: PatternProperties,
        behavior: string = 'Custom pattern'
    ): string {
        const id = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const pattern: PatternEntry = {
            id,
            name,
            category: PatternCategory.CUSTOM,
            discovered: true,
            discoveredAt: Date.now(),
            timesSpotted: 1,
            description,
            behavior,
            rarity: PatternRarity.UNCOMMON,
            properties
        };

        this.patterns.set(id, pattern);
        console.log(`📝 Custom Pattern Registered: ${name}`);

        this.emit('registered', pattern);

        return id;
    }

    // Event system
    on(event: string, callback: Function): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)!.push(callback);
    }

    private emit(event: string, data?: any): void {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.forEach(cb => cb(data));
        }
    }

    serialize(): any {
        return {
            patterns: Array.from(this.patterns.values()).map(p => ({
                id: p.id,
                discovered: p.discovered,
                discoveredAt: p.discoveredAt,
                firstSeenLocation: p.firstSeenLocation?.toArray(),
                timesSpotted: p.timesSpotted
            })),
            discoveryHistory: this.discoveryHistory
        };
    }

    deserialize(data: any): void {
        if (data.patterns) {
            data.patterns.forEach((patternData: any) => {
                const pattern = this.patterns.get(patternData.id);
                if (pattern) {
                    pattern.discovered = patternData.discovered || false;
                    pattern.discoveredAt = patternData.discoveredAt;
                    pattern.timesSpotted = patternData.timesSpotted || 0;

                    if (patternData.firstSeenLocation) {
                        pattern.firstSeenLocation = new Vector3().fromArray(patternData.firstSeenLocation);
                    }
                }
            });
        }

        if (data.discoveryHistory) {
            this.discoveryHistory = data.discoveryHistory;
        }
    }
}
