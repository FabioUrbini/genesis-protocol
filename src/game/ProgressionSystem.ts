export interface PlayerLevel {
    level: number;
    xp: number;
    xpForNextLevel: number;
}

export interface Unlock {
    id: string;
    name: string;
    description: string;
    type: 'feature' | 'upgrade' | 'cosmetic' | 'recipe' | 'biome';
    requiredLevel?: number;
    requiredXP?: number;
    requiredAchievements?: string[];
    unlocked: boolean;
    unlockedAt?: number;
}

export interface Upgrade {
    id: string;
    name: string;
    description: string;
    category: 'player' | 'suit' | 'tools' | 'building' | 'time' | 'ca';
    currentLevel: number;
    maxLevel: number;
    costs: Map<number, UpgradeCost>; // level -> cost
    effects: Map<number, any>; // level -> effect values
}

export interface UpgradeCost {
    xp?: number;
    resources?: Map<string, number>;
}

export interface ProgressionData {
    level: PlayerLevel;
    totalXP: number;
    unlocks: Unlock[];
    upgrades: Upgrade[];
    unlockedFeatures: Set<string>;
}

export class ProgressionSystem {
    private level: PlayerLevel;
    private totalXP: number = 0;
    private unlocks: Map<string, Unlock> = new Map();
    private upgrades: Map<string, Upgrade> = new Map();
    private unlockedFeatures: Set<string> = new Set();
    private listeners: Map<string, Function[]> = new Map();

    constructor() {
        this.level = {
            level: 1,
            xp: 0,
            xpForNextLevel: 100
        };

        this.initializeUnlocks();
        this.initializeUpgrades();
    }

    private initializeUnlocks(): void {
        const unlocks: Unlock[] = [
            // Features
            {
                id: 'time_control',
                name: 'Time Manipulation',
                description: 'Unlock the ability to control time flow',
                type: 'feature',
                requiredLevel: 2,
                unlocked: false
            },
            {
                id: 'pattern_library',
                name: 'Pattern Library',
                description: 'Access to save and load patterns',
                type: 'feature',
                requiredLevel: 3,
                unlocked: false
            },
            {
                id: 'base_building',
                name: 'Base Building',
                description: 'Construct advanced structures',
                type: 'feature',
                requiredLevel: 5,
                unlocked: false
            },
            {
                id: 'advanced_barriers',
                name: 'Advanced Barriers',
                description: 'Build reinforced barrier shields',
                type: 'recipe',
                requiredLevel: 7,
                unlocked: false
            },
            {
                id: 'temporal_shields',
                name: 'Temporal Shields',
                description: 'Shields that slow down time',
                type: 'recipe',
                requiredLevel: 10,
                unlocked: false
            },
            {
                id: 'biome_teleporter',
                name: 'Biome Teleporter',
                description: 'Teleport between discovered biomes',
                type: 'feature',
                requiredLevel: 15,
                unlocked: false
            },
            {
                id: 'pattern_analyzer',
                name: 'Pattern Analyzer',
                description: 'Analyze CA patterns in real-time',
                type: 'feature',
                requiredLevel: 8,
                unlocked: false
            },
            {
                id: 'pattern_editor',
                name: 'Pattern Editor',
                description: 'Create custom CA patterns',
                type: 'feature',
                requiredLevel: 12,
                unlocked: false
            },

            // Biomes
            {
                id: 'chaos_wastes',
                name: 'Chaos Wastes',
                description: 'Access to the Chaos Wastes biome',
                type: 'biome',
                requiredLevel: 6,
                unlocked: false
            },
            {
                id: 'quantum_foam',
                name: 'Quantum Foam',
                description: 'Access to the Quantum Foam dimension',
                type: 'biome',
                requiredLevel: 10,
                unlocked: false
            },
            {
                id: 'void_tears',
                name: 'Void Tears',
                description: 'Access to the dangerous Void Tears',
                type: 'biome',
                requiredLevel: 15,
                unlocked: false
            },

            // Cosmetics
            {
                id: 'rainbow_trail',
                name: 'Rainbow Trail',
                description: 'Leave a rainbow trail as you move',
                type: 'cosmetic',
                requiredLevel: 20,
                unlocked: false
            },
            {
                id: 'puzzle_master_skin',
                name: 'Puzzle Master Skin',
                description: 'Special skin for puzzle masters',
                type: 'cosmetic',
                requiredAchievements: ['complete_puzzle_perfect'],
                unlocked: false
            }
        ];

        unlocks.forEach(unlock => this.unlocks.set(unlock.id, unlock));
    }

    private initializeUpgrades(): void {
        const upgrades: Upgrade[] = [
            // Player upgrades
            {
                id: 'movement_speed',
                name: 'Movement Speed',
                description: 'Increase player movement speed',
                category: 'player',
                currentLevel: 0,
                maxLevel: 5,
                costs: new Map([
                    [1, { xp: 50, resources: new Map([['energy_crystal', 5]]) }],
                    [2, { xp: 100, resources: new Map([['energy_crystal', 10]]) }],
                    [3, { xp: 200, resources: new Map([['energy_crystal', 20]]) }],
                    [4, { xp: 400, resources: new Map([['energy_crystal', 40]]) }],
                    [5, { xp: 800, resources: new Map([['energy_crystal', 80]]) }]
                ]),
                effects: new Map([
                    [0, { speedMultiplier: 1.0 }],
                    [1, { speedMultiplier: 1.1 }],
                    [2, { speedMultiplier: 1.2 }],
                    [3, { speedMultiplier: 1.35 }],
                    [4, { speedMultiplier: 1.5 }],
                    [5, { speedMultiplier: 1.75 }]
                ])
            },
            {
                id: 'interaction_range',
                name: 'Interaction Range',
                description: 'Increase voxel interaction range',
                category: 'player',
                currentLevel: 0,
                maxLevel: 5,
                costs: new Map([
                    [1, { xp: 40, resources: new Map([['crystallized_voxel', 5]]) }],
                    [2, { xp: 80, resources: new Map([['crystallized_voxel', 10]]) }],
                    [3, { xp: 160, resources: new Map([['crystallized_voxel', 20]]) }],
                    [4, { xp: 320, resources: new Map([['crystallized_voxel', 40]]) }],
                    [5, { xp: 640, resources: new Map([['crystallized_voxel', 80]]) }]
                ]),
                effects: new Map([
                    [0, { range: 10 }],
                    [1, { range: 12 }],
                    [2, { range: 15 }],
                    [3, { range: 18 }],
                    [4, { range: 22 }],
                    [5, { range: 30 }]
                ])
            },

            // Suit upgrades
            {
                id: 'energy_capacity',
                name: 'Energy Capacity',
                description: 'Increase maximum energy capacity',
                category: 'suit',
                currentLevel: 0,
                maxLevel: 5,
                costs: new Map([
                    [1, { xp: 60, resources: new Map([['energy_crystal', 10]]) }],
                    [2, { xp: 120, resources: new Map([['energy_crystal', 20]]) }],
                    [3, { xp: 240, resources: new Map([['energy_crystal', 40]]) }],
                    [4, { xp: 480, resources: new Map([['energy_crystal', 80]]) }],
                    [5, { xp: 960, resources: new Map([['energy_crystal', 160]]) }]
                ]),
                effects: new Map([
                    [0, { capacity: 100 }],
                    [1, { capacity: 125 }],
                    [2, { capacity: 150 }],
                    [3, { capacity: 200 }],
                    [4, { capacity: 250 }],
                    [5, { capacity: 350 }]
                ])
            },
            {
                id: 'oxygen_capacity',
                name: 'Oxygen Capacity',
                description: 'Increase maximum oxygen capacity',
                category: 'suit',
                currentLevel: 0,
                maxLevel: 5,
                costs: new Map([
                    [1, { xp: 60, resources: new Map([['oxygen_tank', 5]]) }],
                    [2, { xp: 120, resources: new Map([['oxygen_tank', 10]]) }],
                    [3, { xp: 240, resources: new Map([['oxygen_tank', 20]]) }],
                    [4, { xp: 480, resources: new Map([['oxygen_tank', 40]]) }],
                    [5, { xp: 960, resources: new Map([['oxygen_tank', 80]]) }]
                ]),
                effects: new Map([
                    [0, { capacity: 100 }],
                    [1, { capacity: 125 }],
                    [2, { capacity: 150 }],
                    [3, { capacity: 200 }],
                    [4, { capacity: 250 }],
                    [5, { capacity: 350 }]
                ])
            },

            // Building upgrades
            {
                id: 'structure_durability',
                name: 'Structure Durability',
                description: 'Increase durability of built structures',
                category: 'building',
                currentLevel: 0,
                maxLevel: 3,
                costs: new Map([
                    [1, { xp: 100, resources: new Map([['crystallized_voxel', 20]]) }],
                    [2, { xp: 300, resources: new Map([['crystallized_voxel', 50]]) }],
                    [3, { xp: 600, resources: new Map([['crystallized_voxel', 100]]) }]
                ]),
                effects: new Map([
                    [0, { durabilityMultiplier: 1.0 }],
                    [1, { durabilityMultiplier: 1.5 }],
                    [2, { durabilityMultiplier: 2.0 }],
                    [3, { durabilityMultiplier: 3.0 }]
                ])
            },
            {
                id: 'construction_speed',
                name: 'Construction Speed',
                description: 'Build structures faster',
                category: 'building',
                currentLevel: 0,
                maxLevel: 3,
                costs: new Map([
                    [1, { xp: 80, resources: new Map([['temporal_shard', 10]]) }],
                    [2, { xp: 200, resources: new Map([['temporal_shard', 25]]) }],
                    [3, { xp: 500, resources: new Map([['temporal_shard', 50]]) }]
                ]),
                effects: new Map([
                    [0, { speedMultiplier: 1.0 }],
                    [1, { speedMultiplier: 1.3 }],
                    [2, { speedMultiplier: 1.6 }],
                    [3, { speedMultiplier: 2.0 }]
                ])
            },

            // Time manipulation upgrades
            {
                id: 'rewind_duration',
                name: 'Rewind Duration',
                description: 'Increase time rewind duration',
                category: 'time',
                currentLevel: 0,
                maxLevel: 5,
                costs: new Map([
                    [1, { xp: 150, resources: new Map([['temporal_shard', 15]]) }],
                    [2, { xp: 300, resources: new Map([['temporal_shard', 30]]) }],
                    [3, { xp: 600, resources: new Map([['temporal_shard', 60]]) }],
                    [4, { xp: 1200, resources: new Map([['temporal_shard', 120]]) }],
                    [5, { xp: 2400, resources: new Map([['temporal_shard', 240]]) }]
                ]),
                effects: new Map([
                    [0, { steps: 10 }],
                    [1, { steps: 15 }],
                    [2, { steps: 20 }],
                    [3, { steps: 30 }],
                    [4, { steps: 50 }],
                    [5, { steps: 100 }]
                ])
            },

            // CA upgrades
            {
                id: 'ca_speed',
                name: 'CA Speed Control',
                description: 'Unlock faster CA simulation speeds',
                category: 'ca',
                currentLevel: 0,
                maxLevel: 3,
                costs: new Map([
                    [1, { xp: 200, resources: new Map([['chaos_essence', 20]]) }],
                    [2, { xp: 500, resources: new Map([['chaos_essence', 50]]) }],
                    [3, { xp: 1000, resources: new Map([['chaos_essence', 100]]) }]
                ]),
                effects: new Map([
                    [0, { maxSpeed: 2 }],
                    [1, { maxSpeed: 4 }],
                    [2, { maxSpeed: 8 }],
                    [3, { maxSpeed: 16 }]
                ])
            },
            {
                id: 'pattern_slots',
                name: 'Pattern Slots',
                description: 'Increase pattern library capacity',
                category: 'ca',
                currentLevel: 0,
                maxLevel: 5,
                costs: new Map([
                    [1, { xp: 100, resources: new Map([['quantum_foam', 10]]) }],
                    [2, { xp: 200, resources: new Map([['quantum_foam', 20]]) }],
                    [3, { xp: 400, resources: new Map([['quantum_foam', 40]]) }],
                    [4, { xp: 800, resources: new Map([['quantum_foam', 80]]) }],
                    [5, { xp: 1600, resources: new Map([['quantum_foam', 160]]) }]
                ]),
                effects: new Map([
                    [0, { slots: 10 }],
                    [1, { slots: 15 }],
                    [2, { slots: 25 }],
                    [3, { slots: 40 }],
                    [4, { slots: 60 }],
                    [5, { slots: 100 }]
                ])
            }
        ];

        upgrades.forEach(upgrade => this.upgrades.set(upgrade.id, upgrade));
    }

    addXP(amount: number): boolean {
        this.totalXP += amount;
        this.level.xp += amount;

        let leveledUp = false;

        while (this.level.xp >= this.level.xpForNextLevel) {
            this.level.xp -= this.level.xpForNextLevel;
            this.level.level++;
            this.level.xpForNextLevel = this.calculateXPForLevel(this.level.level + 1);
            leveledUp = true;

            console.log(`🎉 Level Up! You are now level ${this.level.level}`);
            this.emit('levelUp', this.level.level);

            // Check for unlocks
            this.checkUnlocks();
        }

        if (leveledUp) {
            this.emit('xpGained', amount);
        }

        return leveledUp;
    }

    private calculateXPForLevel(level: number): number {
        // Exponential XP curve
        return Math.floor(100 * Math.pow(1.5, level - 1));
    }

    private checkUnlocks(): void {
        this.unlocks.forEach(unlock => {
            if (!unlock.unlocked && this.canUnlock(unlock)) {
                this.unlock(unlock.id);
            }
        });
    }

    private canUnlock(unlock: Unlock): boolean {
        if (unlock.requiredLevel && this.level.level < unlock.requiredLevel) {
            return false;
        }

        if (unlock.requiredXP && this.totalXP < unlock.requiredXP) {
            return false;
        }

        if (unlock.requiredAchievements) {
            // TODO: Check achievements
            return false;
        }

        return true;
    }

    unlock(unlockId: string): boolean {
        const unlock = this.unlocks.get(unlockId);
        if (!unlock || unlock.unlocked) {
            return false;
        }

        if (!this.canUnlock(unlock)) {
            return false;
        }

        unlock.unlocked = true;
        unlock.unlockedAt = Date.now();
        this.unlockedFeatures.add(unlockId);

        console.log(`🔓 Unlocked: ${unlock.name} - ${unlock.description}`);
        this.emit('unlocked', unlock);

        return true;
    }

    canPurchaseUpgrade(upgradeId: string, inventory?: any): { can: boolean; reason?: string } {
        const upgrade = this.upgrades.get(upgradeId);
        if (!upgrade) {
            return { can: false, reason: 'Upgrade not found' };
        }

        if (upgrade.currentLevel >= upgrade.maxLevel) {
            return { can: false, reason: 'Already at max level' };
        }

        const nextLevel = upgrade.currentLevel + 1;
        const cost = upgrade.costs.get(nextLevel);

        if (!cost) {
            return { can: false, reason: 'No cost defined for next level' };
        }

        if (cost.xp && this.totalXP < cost.xp) {
            return { can: false, reason: `Need ${cost.xp} XP (have ${this.totalXP})` };
        }

        if (cost.resources && inventory) {
            for (const [resource, amount] of cost.resources) {
                if (inventory.getItemCount(resource) < amount) {
                    return { can: false, reason: `Need ${amount} ${resource}` };
                }
            }
        }

        return { can: true };
    }

    purchaseUpgrade(upgradeId: string, inventory?: any): boolean {
        const check = this.canPurchaseUpgrade(upgradeId, inventory);
        if (!check.can) {
            console.log(`Cannot purchase upgrade: ${check.reason}`);
            return false;
        }

        const upgrade = this.upgrades.get(upgradeId);
        if (!upgrade) return false;

        const nextLevel = upgrade.currentLevel + 1;
        const cost = upgrade.costs.get(nextLevel);
        if (!cost) return false;

        // Deduct XP (but don't reduce total XP, only current level XP pool)
        // Total XP is kept for unlock requirements

        // Deduct resources
        if (cost.resources && inventory) {
            for (const [resource, amount] of cost.resources) {
                inventory.removeItem(resource, amount);
            }
        }

        upgrade.currentLevel = nextLevel;

        console.log(`⬆️ Upgraded ${upgrade.name} to level ${nextLevel}`);
        this.emit('upgraded', { upgrade, level: nextLevel });

        return true;
    }

    getUpgradeEffect(upgradeId: string): any {
        const upgrade = this.upgrades.get(upgradeId);
        if (!upgrade) return null;

        return upgrade.effects.get(upgrade.currentLevel);
    }

    isUnlocked(unlockId: string): boolean {
        return this.unlockedFeatures.has(unlockId);
    }

    getLevel(): PlayerLevel {
        return { ...this.level };
    }

    getTotalXP(): number {
        return this.totalXP;
    }

    getUnlocks(): Unlock[] {
        return Array.from(this.unlocks.values());
    }

    getUpgrades(): Upgrade[] {
        return Array.from(this.upgrades.values());
    }

    getUpgradesByCategory(category: string): Upgrade[] {
        return Array.from(this.upgrades.values()).filter(u => u.category === category);
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
            level: this.level,
            totalXP: this.totalXP,
            unlocks: Array.from(this.unlocks.values()),
            upgrades: Array.from(this.upgrades.values()).map(u => ({
                id: u.id,
                currentLevel: u.currentLevel
            })),
            unlockedFeatures: Array.from(this.unlockedFeatures)
        };
    }

    deserialize(data: any): void {
        if (data.level) {
            this.level = data.level;
        }

        if (data.totalXP !== undefined) {
            this.totalXP = data.totalXP;
        }

        if (data.unlocks) {
            data.unlocks.forEach((unlockData: Unlock) => {
                const unlock = this.unlocks.get(unlockData.id);
                if (unlock) {
                    unlock.unlocked = unlockData.unlocked;
                    unlock.unlockedAt = unlockData.unlockedAt;
                }
            });
        }

        if (data.upgrades) {
            data.upgrades.forEach((upgradeData: any) => {
                const upgrade = this.upgrades.get(upgradeData.id);
                if (upgrade) {
                    upgrade.currentLevel = upgradeData.currentLevel;
                }
            });
        }

        if (data.unlockedFeatures) {
            this.unlockedFeatures = new Set(data.unlockedFeatures);
        }
    }
}
