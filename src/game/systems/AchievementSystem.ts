export enum AchievementCategory {
    EXPLORATION = 'exploration',
    BUILDING = 'building',
    SURVIVAL = 'survival',
    PATTERNS = 'patterns',
    TIME = 'time',
    MASTERY = 'mastery',
    SECRET = 'secret'
}

export enum AchievementRarity {
    COMMON = 'common',
    UNCOMMON = 'uncommon',
    RARE = 'rare',
    EPIC = 'epic',
    LEGENDARY = 'legendary'
}

export interface Achievement {
    id: string;
    name: string;
    description: string;
    category: AchievementCategory;
    rarity: AchievementRarity;
    hidden: boolean;
    icon?: string;
    xpReward: number;
    progress: number;
    maxProgress: number;
    unlocked: boolean;
    unlockedAt?: number;
    trackers?: Map<string, number>; // For multi-stat achievements
}

export interface AchievementStats {
    total: number;
    unlocked: number;
    common: number;
    uncommon: number;
    rare: number;
    epic: number;
    legendary: number;
    byCategory: Map<AchievementCategory, number>;
}

export class AchievementSystem {
    private achievements: Map<string, Achievement> = new Map();
    private listeners: Map<string, Function[]> = new Map();
    private stats: Map<string, number> = new Map();

    constructor() {
        this.initializeAchievements();
    }

    private initializeAchievements(): void {
        const achievements: Achievement[] = [
            // Exploration
            {
                id: 'first_steps',
                name: 'First Steps',
                description: 'Take your first steps in the Genesis Protocol',
                category: AchievementCategory.EXPLORATION,
                rarity: AchievementRarity.COMMON,
                hidden: false,
                xpReward: 10,
                progress: 0,
                maxProgress: 1,
                unlocked: false
            },
            {
                id: 'explorer',
                name: 'Explorer',
                description: 'Travel 1,000 units',
                category: AchievementCategory.EXPLORATION,
                rarity: AchievementRarity.COMMON,
                hidden: false,
                xpReward: 50,
                progress: 0,
                maxProgress: 1000,
                unlocked: false
            },
            {
                id: 'world_traveler',
                name: 'World Traveler',
                description: 'Travel 10,000 units',
                category: AchievementCategory.EXPLORATION,
                rarity: AchievementRarity.UNCOMMON,
                hidden: false,
                xpReward: 200,
                progress: 0,
                maxProgress: 10000,
                unlocked: false
            },
            {
                id: 'globe_trotter',
                name: 'Globe Trotter',
                description: 'Travel 100,000 units',
                category: AchievementCategory.EXPLORATION,
                rarity: AchievementRarity.RARE,
                hidden: false,
                xpReward: 500,
                progress: 0,
                maxProgress: 100000,
                unlocked: false
            },
            {
                id: 'biome_discoverer',
                name: 'Biome Discoverer',
                description: 'Discover your first biome',
                category: AchievementCategory.EXPLORATION,
                rarity: AchievementRarity.COMMON,
                hidden: false,
                xpReward: 100,
                progress: 0,
                maxProgress: 1,
                unlocked: false
            },
            {
                id: 'biome_master',
                name: 'Biome Master',
                description: 'Discover all 7 biomes',
                category: AchievementCategory.EXPLORATION,
                rarity: AchievementRarity.EPIC,
                hidden: false,
                xpReward: 1000,
                progress: 0,
                maxProgress: 7,
                unlocked: false
            },

            // Building
            {
                id: 'first_block',
                name: 'First Block',
                description: 'Place your first voxel',
                category: AchievementCategory.BUILDING,
                rarity: AchievementRarity.COMMON,
                hidden: false,
                xpReward: 10,
                progress: 0,
                maxProgress: 1,
                unlocked: false
            },
            {
                id: 'builder',
                name: 'Builder',
                description: 'Place 100 voxels',
                category: AchievementCategory.BUILDING,
                rarity: AchievementRarity.COMMON,
                hidden: false,
                xpReward: 50,
                progress: 0,
                maxProgress: 100,
                unlocked: false
            },
            {
                id: 'architect',
                name: 'Architect',
                description: 'Place 1,000 voxels',
                category: AchievementCategory.BUILDING,
                rarity: AchievementRarity.UNCOMMON,
                hidden: false,
                xpReward: 200,
                progress: 0,
                maxProgress: 1000,
                unlocked: false
            },
            {
                id: 'master_builder',
                name: 'Master Builder',
                description: 'Place 10,000 voxels',
                category: AchievementCategory.BUILDING,
                rarity: AchievementRarity.RARE,
                hidden: false,
                xpReward: 500,
                progress: 0,
                maxProgress: 10000,
                unlocked: false
            },
            {
                id: 'structure_builder',
                name: 'Structure Builder',
                description: 'Build your first structure',
                category: AchievementCategory.BUILDING,
                rarity: AchievementRarity.COMMON,
                hidden: false,
                xpReward: 100,
                progress: 0,
                maxProgress: 1,
                unlocked: false
            },
            {
                id: 'base_master',
                name: 'Base Master',
                description: 'Build 10 structures',
                category: AchievementCategory.BUILDING,
                rarity: AchievementRarity.UNCOMMON,
                hidden: false,
                xpReward: 300,
                progress: 0,
                maxProgress: 10,
                unlocked: false
            },

            // Survival
            {
                id: 'survivor',
                name: 'Survivor',
                description: 'Survive for 10 minutes',
                category: AchievementCategory.SURVIVAL,
                rarity: AchievementRarity.COMMON,
                hidden: false,
                xpReward: 50,
                progress: 0,
                maxProgress: 600, // seconds
                unlocked: false
            },
            {
                id: 'endurance',
                name: 'Endurance',
                description: 'Survive for 1 hour',
                category: AchievementCategory.SURVIVAL,
                rarity: AchievementRarity.UNCOMMON,
                hidden: false,
                xpReward: 300,
                progress: 0,
                maxProgress: 3600,
                unlocked: false
            },
            {
                id: 'wave_survivor',
                name: 'Wave Survivor',
                description: 'Survive 5 waves in Survival Mode',
                category: AchievementCategory.SURVIVAL,
                rarity: AchievementRarity.COMMON,
                hidden: false,
                xpReward: 150,
                progress: 0,
                maxProgress: 5,
                unlocked: false
            },
            {
                id: 'wave_master',
                name: 'Wave Master',
                description: 'Survive 20 waves in Survival Mode',
                category: AchievementCategory.SURVIVAL,
                rarity: AchievementRarity.EPIC,
                hidden: false,
                xpReward: 1000,
                progress: 0,
                maxProgress: 20,
                unlocked: false
            },
            {
                id: 'near_death',
                name: 'Near Death Experience',
                description: 'Survive with less than 5% energy',
                category: AchievementCategory.SURVIVAL,
                rarity: AchievementRarity.UNCOMMON,
                hidden: false,
                xpReward: 200,
                progress: 0,
                maxProgress: 1,
                unlocked: false
            },
            {
                id: 'immortal',
                name: 'Immortal',
                description: 'Survive 100 waves without dying',
                category: AchievementCategory.SURVIVAL,
                rarity: AchievementRarity.LEGENDARY,
                hidden: false,
                xpReward: 5000,
                progress: 0,
                maxProgress: 100,
                unlocked: false
            },

            // Patterns
            {
                id: 'pattern_spawner',
                name: 'Pattern Spawner',
                description: 'Spawn your first pattern',
                category: AchievementCategory.PATTERNS,
                rarity: AchievementRarity.COMMON,
                hidden: false,
                xpReward: 25,
                progress: 0,
                maxProgress: 1,
                unlocked: false
            },
            {
                id: 'pattern_collector',
                name: 'Pattern Collector',
                description: 'Discover 10 unique patterns',
                category: AchievementCategory.PATTERNS,
                rarity: AchievementRarity.UNCOMMON,
                hidden: false,
                xpReward: 200,
                progress: 0,
                maxProgress: 10,
                unlocked: false
            },
            {
                id: 'pattern_master',
                name: 'Pattern Master',
                description: 'Discover all 13 predefined patterns',
                category: AchievementCategory.PATTERNS,
                rarity: AchievementRarity.RARE,
                hidden: false,
                xpReward: 500,
                progress: 0,
                maxProgress: 13,
                unlocked: false
            },
            {
                id: 'pattern_creator',
                name: 'Pattern Creator',
                description: 'Save 5 custom patterns',
                category: AchievementCategory.PATTERNS,
                rarity: AchievementRarity.UNCOMMON,
                hidden: false,
                xpReward: 150,
                progress: 0,
                maxProgress: 5,
                unlocked: false
            },
            {
                id: 'pattern_library',
                name: 'Pattern Librarian',
                description: 'Save 25 custom patterns',
                category: AchievementCategory.PATTERNS,
                rarity: AchievementRarity.RARE,
                hidden: false,
                xpReward: 400,
                progress: 0,
                maxProgress: 25,
                unlocked: false
            },

            // Time Manipulation
            {
                id: 'time_traveler',
                name: 'Time Traveler',
                description: 'Use time rewind for the first time',
                category: AchievementCategory.TIME,
                rarity: AchievementRarity.COMMON,
                hidden: false,
                xpReward: 50,
                progress: 0,
                maxProgress: 1,
                unlocked: false
            },
            {
                id: 'time_master',
                name: 'Time Master',
                description: 'Use all time manipulation features (pause, speed up, slow down, rewind)',
                category: AchievementCategory.TIME,
                rarity: AchievementRarity.UNCOMMON,
                hidden: false,
                xpReward: 150,
                progress: 0,
                maxProgress: 4,
                unlocked: false,
                trackers: new Map([
                    ['pause', 0],
                    ['speedup', 0],
                    ['slowdown', 0],
                    ['rewind', 0]
                ])
            },
            {
                id: 'speedrunner',
                name: 'Speedrunner',
                description: 'Complete a puzzle in under 30 seconds',
                category: AchievementCategory.TIME,
                rarity: AchievementRarity.RARE,
                hidden: false,
                xpReward: 300,
                progress: 0,
                maxProgress: 1,
                unlocked: false
            },

            // Mastery
            {
                id: 'perfectionist',
                name: 'Perfectionist',
                description: 'Complete a puzzle with the minimum number of moves',
                category: AchievementCategory.MASTERY,
                rarity: AchievementRarity.RARE,
                hidden: false,
                xpReward: 500,
                progress: 0,
                maxProgress: 1,
                unlocked: false
            },
            {
                id: 'completionist',
                name: 'Completionist',
                description: 'Complete all puzzles',
                category: AchievementCategory.MASTERY,
                rarity: AchievementRarity.EPIC,
                hidden: false,
                xpReward: 1000,
                progress: 0,
                maxProgress: 20,
                unlocked: false
            },
            {
                id: 'resource_hoarder',
                name: 'Resource Hoarder',
                description: 'Collect 1,000 of any single resource',
                category: AchievementCategory.MASTERY,
                rarity: AchievementRarity.UNCOMMON,
                hidden: false,
                xpReward: 200,
                progress: 0,
                maxProgress: 1000,
                unlocked: false
            },
            {
                id: 'fully_upgraded',
                name: 'Fully Upgraded',
                description: 'Max out any upgrade',
                category: AchievementCategory.MASTERY,
                rarity: AchievementRarity.RARE,
                hidden: false,
                xpReward: 400,
                progress: 0,
                maxProgress: 1,
                unlocked: false
            },
            {
                id: 'jack_of_all_trades',
                name: 'Jack of All Trades',
                description: 'Unlock at least one upgrade in each category',
                category: AchievementCategory.MASTERY,
                rarity: AchievementRarity.EPIC,
                hidden: false,
                xpReward: 800,
                progress: 0,
                maxProgress: 6, // 6 categories
                unlocked: false
            },

            // Secret Achievements
            {
                id: 'secret_void',
                name: '???',
                description: 'Enter the Void',
                category: AchievementCategory.SECRET,
                rarity: AchievementRarity.LEGENDARY,
                hidden: true,
                xpReward: 1000,
                progress: 0,
                maxProgress: 1,
                unlocked: false
            },
            {
                id: 'secret_quantum',
                name: '???',
                description: 'Discover quantum superposition',
                category: AchievementCategory.SECRET,
                rarity: AchievementRarity.LEGENDARY,
                hidden: true,
                xpReward: 1000,
                progress: 0,
                maxProgress: 1,
                unlocked: false
            },
            {
                id: 'secret_konami',
                name: 'Old School',
                description: 'Enter the Konami code',
                category: AchievementCategory.SECRET,
                rarity: AchievementRarity.RARE,
                hidden: true,
                xpReward: 500,
                progress: 0,
                maxProgress: 1,
                unlocked: false
            },
            {
                id: 'secret_easter_egg',
                name: 'Easter Egg Hunter',
                description: 'Find the hidden developer message',
                category: AchievementCategory.SECRET,
                rarity: AchievementRarity.EPIC,
                hidden: true,
                xpReward: 750,
                progress: 0,
                maxProgress: 1,
                unlocked: false
            }
        ];

        achievements.forEach(achievement => {
            this.achievements.set(achievement.id, achievement);
        });
    }

    trackProgress(achievementId: string, progress: number, trackerKey?: string): boolean {
        const achievement = this.achievements.get(achievementId);
        if (!achievement || achievement.unlocked) {
            return false;
        }

        if (trackerKey && achievement.trackers) {
            // Update specific tracker
            const currentValue = achievement.trackers.get(trackerKey) || 0;
            achievement.trackers.set(trackerKey, Math.max(currentValue, progress));

            // Check if all trackers are completed
            let totalProgress = 0;
            achievement.trackers.forEach(value => {
                if (value > 0) totalProgress++;
            });
            achievement.progress = totalProgress;
        } else {
            // Update main progress
            achievement.progress = Math.min(progress, achievement.maxProgress);
        }

        // Check if achievement is unlocked
        if (achievement.progress >= achievement.maxProgress) {
            return this.unlock(achievementId);
        }

        return false;
    }

    incrementProgress(achievementId: string, amount: number = 1, trackerKey?: string): boolean {
        const achievement = this.achievements.get(achievementId);
        if (!achievement || achievement.unlocked) {
            return false;
        }

        if (trackerKey && achievement.trackers) {
            const currentValue = achievement.trackers.get(trackerKey) || 0;
            return this.trackProgress(achievementId, currentValue + amount, trackerKey);
        } else {
            return this.trackProgress(achievementId, achievement.progress + amount);
        }
    }

    unlock(achievementId: string): boolean {
        const achievement = this.achievements.get(achievementId);
        if (!achievement || achievement.unlocked) {
            return false;
        }

        achievement.unlocked = true;
        achievement.unlockedAt = Date.now();

        console.log(`🏆 Achievement Unlocked: ${achievement.name}`);
        console.log(`   ${achievement.description}`);
        console.log(`   +${achievement.xpReward} XP`);

        this.emit('unlocked', achievement);

        return true;
    }

    isUnlocked(achievementId: string): boolean {
        const achievement = this.achievements.get(achievementId);
        return achievement ? achievement.unlocked : false;
    }

    getAchievement(achievementId: string): Achievement | undefined {
        return this.achievements.get(achievementId);
    }

    getAllAchievements(): Achievement[] {
        return Array.from(this.achievements.values());
    }

    getUnlockedAchievements(): Achievement[] {
        return Array.from(this.achievements.values()).filter(a => a.unlocked);
    }

    getAchievementsByCategory(category: AchievementCategory): Achievement[] {
        return Array.from(this.achievements.values()).filter(a => a.category === category);
    }

    getAchievementsByRarity(rarity: AchievementRarity): Achievement[] {
        return Array.from(this.achievements.values()).filter(a => a.rarity === rarity);
    }

    getVisibleAchievements(): Achievement[] {
        return Array.from(this.achievements.values()).filter(a => !a.hidden || a.unlocked);
    }

    getStats(): AchievementStats {
        const achievements = Array.from(this.achievements.values());
        const byCategory = new Map<AchievementCategory, number>();

        Object.values(AchievementCategory).forEach(category => {
            byCategory.set(category, achievements.filter(a => a.category === category && a.unlocked).length);
        });

        return {
            total: achievements.length,
            unlocked: achievements.filter(a => a.unlocked).length,
            common: achievements.filter(a => a.rarity === AchievementRarity.COMMON && a.unlocked).length,
            uncommon: achievements.filter(a => a.rarity === AchievementRarity.UNCOMMON && a.unlocked).length,
            rare: achievements.filter(a => a.rarity === AchievementRarity.RARE && a.unlocked).length,
            epic: achievements.filter(a => a.rarity === AchievementRarity.EPIC && a.unlocked).length,
            legendary: achievements.filter(a => a.rarity === AchievementRarity.LEGENDARY && a.unlocked).length,
            byCategory
        };
    }

    getCompletionPercentage(): number {
        const stats = this.getStats();
        return (stats.unlocked / stats.total) * 100;
    }

    // Helper methods for common tracking scenarios
    trackDistance(distance: number): void {
        this.trackProgress('explorer', distance);
        this.trackProgress('world_traveler', distance);
        this.trackProgress('globe_trotter', distance);
    }

    trackVoxelPlaced(): void {
        this.incrementProgress('first_block');
        this.incrementProgress('builder');
        this.incrementProgress('architect');
        this.incrementProgress('master_builder');
    }

    trackStructureBuilt(): void {
        this.incrementProgress('structure_builder');
        this.incrementProgress('base_master');
    }

    trackSurvivalTime(seconds: number): void {
        this.trackProgress('survivor', seconds);
        this.trackProgress('endurance', seconds);
    }

    trackWave(waveNumber: number): void {
        this.trackProgress('wave_survivor', waveNumber);
        this.trackProgress('wave_master', waveNumber);
        this.trackProgress('immortal', waveNumber);
    }

    trackPatternSpawned(): void {
        this.incrementProgress('pattern_spawner');
    }

    trackPatternDiscovered(): void {
        this.incrementProgress('pattern_collector');
        this.incrementProgress('pattern_master');
    }

    trackPatternSaved(): void {
        this.incrementProgress('pattern_creator');
        this.incrementProgress('pattern_library');
    }

    trackBiomeDiscovered(): void {
        this.incrementProgress('biome_discoverer');
        this.incrementProgress('biome_master');
    }

    trackTimeManipulation(type: 'pause' | 'speedup' | 'slowdown' | 'rewind'): void {
        if (type === 'rewind') {
            this.incrementProgress('time_traveler');
        }
        this.trackProgress('time_master', 1, type);
    }

    trackResourceCollected(resourceType: string, amount: number): void {
        const statKey = `resource_${resourceType}`;
        const current = this.stats.get(statKey) || 0;
        const newTotal = current + amount;
        this.stats.set(statKey, newTotal);

        if (newTotal >= 1000) {
            this.unlock('resource_hoarder');
        }
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
            achievements: Array.from(this.achievements.values()).map(a => ({
                id: a.id,
                progress: a.progress,
                unlocked: a.unlocked,
                unlockedAt: a.unlockedAt,
                trackers: a.trackers ? Array.from(a.trackers.entries()) : undefined
            })),
            stats: Array.from(this.stats.entries())
        };
    }

    deserialize(data: any): void {
        if (data.achievements) {
            data.achievements.forEach((achData: any) => {
                const achievement = this.achievements.get(achData.id);
                if (achievement) {
                    achievement.progress = achData.progress || 0;
                    achievement.unlocked = achData.unlocked || false;
                    achievement.unlockedAt = achData.unlockedAt;

                    if (achData.trackers && achievement.trackers) {
                        achievement.trackers = new Map(achData.trackers);
                    }
                }
            });
        }

        if (data.stats) {
            this.stats = new Map(data.stats);
        }
    }
}
