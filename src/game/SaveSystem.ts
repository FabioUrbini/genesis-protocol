import type { Game } from './Game';
import type { ProgressionSystem } from './ProgressionSystem';
import type { AchievementSystem } from './AchievementSystem';
import type { PatternCodex } from './PatternCodex';
import type { GameMode } from './GameMode';

export interface SaveData {
    version: string;
    timestamp: number;
    saveName: string;
    playTime: number;

    // Player data
    player: {
        position: [number, number, number];
        rotation: [number, number];
        health: number;
        energy: number;
        oxygen: number;
        flyMode: boolean;
        godMode: boolean;
    };

    // Game mode
    gameMode: {
        type: string;
        data: any;
    } | null;

    // Progression
    progression: any;

    // Achievements
    achievements: any;

    // Pattern Codex
    patternCodex: any;

    // Inventory
    inventory: any;

    // Environmental Suit
    environmentalSuit: any;

    // Base Building
    baseBuilding: any;

    // Pattern Library
    patternLibrary: any;

    // World state
    world: {
        seed: number;
        currentBiome: string;
        chunkData?: any; // Optional, can be large
    };

    // Time manipulation
    timeManipulation: {
        isPaused: boolean;
        speed: number;
        historySize: number;
    };

    // Settings
    settings: any;
}

export interface SaveMetadata {
    id: string;
    name: string;
    timestamp: number;
    playTime: number;
    level: number;
    gameMode: string;
    thumbnail?: string;
}

export class SaveSystem {
    private dbName: string = 'GenesisProtocolSaves';
    private dbVersion: number = 1;
    private db: IDBDatabase | null = null;
    private saveVersion: string = '1.0.0';
    private autoSaveInterval: number = 300000; // 5 minutes
    private autoSaveTimer: number | null = null;
    private listeners: Map<string, Function[]> = new Map();

    constructor() {
        this.initDB();
    }

    private async initDB(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('Failed to open SaveSystem database');
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('SaveSystem database initialized');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Create saves object store
                if (!db.objectStoreNames.contains('saves')) {
                    const savesStore = db.createObjectStore('saves', { keyPath: 'id' });
                    savesStore.createIndex('timestamp', 'timestamp', { unique: false });
                    savesStore.createIndex('name', 'name', { unique: false });
                }

                // Create metadata object store for quick loading
                if (!db.objectStoreNames.contains('metadata')) {
                    const metadataStore = db.createObjectStore('metadata', { keyPath: 'id' });
                    metadataStore.createIndex('timestamp', 'timestamp', { unique: false });
                }

                console.log('SaveSystem database schema created');
            };
        });
    }

    async save(
        game: Game,
        saveName: string,
        progressionSystem?: ProgressionSystem,
        achievementSystem?: AchievementSystem,
        patternCodex?: PatternCodex,
        gameMode?: GameMode | null
    ): Promise<string> {
        if (!this.db) {
            await this.initDB();
        }

        const saveId = `save_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const saveData: SaveData = {
            version: this.saveVersion,
            timestamp: Date.now(),
            saveName,
            playTime: game.getTotalPlayTime ? game.getTotalPlayTime() : 0,

            player: {
                position: game.player.getPosition().toArray() as [number, number, number],
                rotation: [game.player.camera.rotation.x, game.player.camera.rotation.y],
                health: 100, // TODO: Get from player
                energy: game.player.environmentalSuit?.getCurrentEnergy() || 100,
                oxygen: game.player.environmentalSuit?.getCurrentOxygen() || 100,
                flyMode: game.player.flyMode || false,
                godMode: game.player.godMode || false
            },

            gameMode: gameMode ? {
                type: gameMode.config.type,
                data: gameMode.serialize()
            } : null,

            progression: progressionSystem ? progressionSystem.serialize() : null,
            achievements: achievementSystem ? achievementSystem.serialize() : null,
            patternCodex: patternCodex ? patternCodex.serialize() : null,

            inventory: game.player.inventory ? game.player.inventory.serialize() : null,
            environmentalSuit: game.player.environmentalSuit ? game.player.environmentalSuit.serialize() : null,
            baseBuilding: game.baseBuilding ? game.baseBuilding.serialize() : null,
            patternLibrary: game.patternLibrary ? game.patternLibrary.serialize() : null,

            world: {
                seed: game.worldManager?.getSeed() || 0,
                currentBiome: game.biomeManager?.getCurrentBiome()?.name || 'unknown'
            },

            timeManipulation: {
                isPaused: game.timeManipulation?.isPaused() || false,
                speed: game.timeManipulation?.getSpeed() || 1,
                historySize: game.timeManipulation?.getHistorySize() || 10
            },

            settings: this.getSettings()
        };

        // Create metadata for quick access
        const metadata: SaveMetadata = {
            id: saveId,
            name: saveName,
            timestamp: saveData.timestamp,
            playTime: saveData.playTime,
            level: progressionSystem ? progressionSystem.getLevel().level : 1,
            gameMode: gameMode ? gameMode.config.type : 'none'
        };

        try {
            // Save full data
            const saveTransaction = this.db!.transaction(['saves'], 'readwrite');
            const saveStore = saveTransaction.objectStore('saves');
            await this.promisifyRequest(saveStore.put({ id: saveId, data: saveData }));

            // Save metadata
            const metaTransaction = this.db!.transaction(['metadata'], 'readwrite');
            const metaStore = metaTransaction.objectStore('metadata');
            await this.promisifyRequest(metaStore.put(metadata));

            console.log(`💾 Game saved: ${saveName} (${saveId})`);
            this.emit('saved', { id: saveId, name: saveName });

            return saveId;
        } catch (error) {
            console.error('Failed to save game:', error);
            throw error;
        }
    }

    async load(
        saveId: string,
        game: Game,
        progressionSystem?: ProgressionSystem,
        achievementSystem?: AchievementSystem,
        patternCodex?: PatternCodex,
        gameMode?: GameMode | null
    ): Promise<SaveData> {
        if (!this.db) {
            await this.initDB();
        }

        try {
            const transaction = this.db!.transaction(['saves'], 'readonly');
            const store = transaction.objectStore('saves');
            const request = store.get(saveId);
            const result = await this.promisifyRequest(request);

            if (!result || !result.data) {
                throw new Error('Save not found');
            }

            const saveData: SaveData = result.data;

            // Verify version compatibility
            if (saveData.version !== this.saveVersion) {
                console.warn(`Save version mismatch: ${saveData.version} vs ${this.saveVersion}`);
                // TODO: Implement migration logic
            }

            // Restore player state
            game.player.setPosition(saveData.player.position[0], saveData.player.position[1], saveData.player.position[2]);
            game.player.camera.rotation.x = saveData.player.rotation[0];
            game.player.camera.rotation.y = saveData.player.rotation[1];
            game.player.flyMode = saveData.player.flyMode;
            game.player.godMode = saveData.player.godMode;

            // Restore systems
            if (progressionSystem && saveData.progression) {
                progressionSystem.deserialize(saveData.progression);
            }

            if (achievementSystem && saveData.achievements) {
                achievementSystem.deserialize(saveData.achievements);
            }

            if (patternCodex && saveData.patternCodex) {
                patternCodex.deserialize(saveData.patternCodex);
            }

            if (gameMode && saveData.gameMode) {
                gameMode.deserialize(saveData.gameMode.data);
            }

            // Restore player systems
            if (game.player.inventory && saveData.inventory) {
                game.player.inventory.deserialize(saveData.inventory);
            }

            if (game.player.environmentalSuit && saveData.environmentalSuit) {
                game.player.environmentalSuit.deserialize(saveData.environmentalSuit);
            }

            if (game.baseBuilding && saveData.baseBuilding) {
                game.baseBuilding.deserialize(saveData.baseBuilding);
            }

            if (game.patternLibrary && saveData.patternLibrary) {
                game.patternLibrary.deserialize(saveData.patternLibrary);
            }

            // Restore time manipulation
            if (game.timeManipulation && saveData.timeManipulation) {
                if (saveData.timeManipulation.isPaused) {
                    game.timeManipulation.pause();
                }
                game.timeManipulation.setSpeed(saveData.timeManipulation.speed);
            }

            console.log(`📂 Game loaded: ${saveData.saveName}`);
            this.emit('loaded', { id: saveId, name: saveData.saveName });

            return saveData;
        } catch (error) {
            console.error('Failed to load game:', error);
            throw error;
        }
    }

    async deleteSave(saveId: string): Promise<void> {
        if (!this.db) {
            await this.initDB();
        }

        try {
            const saveTransaction = this.db!.transaction(['saves'], 'readwrite');
            const saveStore = saveTransaction.objectStore('saves');
            await this.promisifyRequest(saveStore.delete(saveId));

            const metaTransaction = this.db!.transaction(['metadata'], 'readwrite');
            const metaStore = metaTransaction.objectStore('metadata');
            await this.promisifyRequest(metaStore.delete(saveId));

            console.log(`🗑️ Save deleted: ${saveId}`);
            this.emit('deleted', saveId);
        } catch (error) {
            console.error('Failed to delete save:', error);
            throw error;
        }
    }

    async getAllSaves(): Promise<SaveMetadata[]> {
        if (!this.db) {
            await this.initDB();
        }

        try {
            const transaction = this.db!.transaction(['metadata'], 'readonly');
            const store = transaction.objectStore('metadata');
            const request = store.getAll();
            const saves = await this.promisifyRequest(request);

            // Sort by timestamp (most recent first)
            return saves.sort((a, b) => b.timestamp - a.timestamp);
        } catch (error) {
            console.error('Failed to get saves:', error);
            return [];
        }
    }

    async getSaveData(saveId: string): Promise<SaveData | null> {
        if (!this.db) {
            await this.initDB();
        }

        try {
            const transaction = this.db!.transaction(['saves'], 'readonly');
            const store = transaction.objectStore('saves');
            const request = store.get(saveId);
            const result = await this.promisifyRequest(request);

            return result ? result.data : null;
        } catch (error) {
            console.error('Failed to get save data:', error);
            return null;
        }
    }

    async exportSave(saveId: string): Promise<string> {
        const saveData = await this.getSaveData(saveId);
        if (!saveData) {
            throw new Error('Save not found');
        }

        return JSON.stringify(saveData, null, 2);
    }

    async importSave(jsonData: string, saveName?: string): Promise<string> {
        try {
            const saveData: SaveData = JSON.parse(jsonData);

            if (saveName) {
                saveData.saveName = saveName;
            }

            const saveId = `save_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            saveData.timestamp = Date.now();

            const metadata: SaveMetadata = {
                id: saveId,
                name: saveData.saveName,
                timestamp: saveData.timestamp,
                playTime: saveData.playTime,
                level: saveData.progression?.level?.level || 1,
                gameMode: saveData.gameMode?.type || 'none'
            };

            if (!this.db) {
                await this.initDB();
            }

            const saveTransaction = this.db!.transaction(['saves'], 'readwrite');
            const saveStore = saveTransaction.objectStore('saves');
            await this.promisifyRequest(saveStore.put({ id: saveId, data: saveData }));

            const metaTransaction = this.db!.transaction(['metadata'], 'readwrite');
            const metaStore = metaTransaction.objectStore('metadata');
            await this.promisifyRequest(metaStore.put(metadata));

            console.log(`📥 Save imported: ${saveName}`);
            return saveId;
        } catch (error) {
            console.error('Failed to import save:', error);
            throw error;
        }
    }

    // Auto-save functionality
    startAutoSave(
        game: Game,
        progressionSystem?: ProgressionSystem,
        achievementSystem?: AchievementSystem,
        patternCodex?: PatternCodex,
        gameMode?: GameMode | null
    ): void {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }

        this.autoSaveTimer = window.setInterval(() => {
            this.save(game, 'AutoSave', progressionSystem, achievementSystem, patternCodex, gameMode)
                .then(() => console.log('🔄 Auto-save completed'))
                .catch(err => console.error('Auto-save failed:', err));
        }, this.autoSaveInterval);

        console.log(`🔄 Auto-save enabled (every ${this.autoSaveInterval / 1000}s)`);
    }

    stopAutoSave(): void {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
            console.log('🔄 Auto-save disabled');
        }
    }

    setAutoSaveInterval(milliseconds: number): void {
        this.autoSaveInterval = milliseconds;
        console.log(`🔄 Auto-save interval set to ${milliseconds / 1000}s`);
    }

    // Quick save/load
    async quickSave(
        game: Game,
        progressionSystem?: ProgressionSystem,
        achievementSystem?: AchievementSystem,
        patternCodex?: PatternCodex,
        gameMode?: GameMode | null
    ): Promise<void> {
        await this.save(game, 'QuickSave', progressionSystem, achievementSystem, patternCodex, gameMode);
        console.log('⚡ Quick save completed');
    }

    async quickLoad(
        game: Game,
        progressionSystem?: ProgressionSystem,
        achievementSystem?: AchievementSystem,
        patternCodex?: PatternCodex,
        gameMode?: GameMode | null
    ): Promise<void> {
        const saves = await this.getAllSaves();
        const quickSave = saves.find(s => s.name === 'QuickSave');

        if (!quickSave) {
            throw new Error('No quick save found');
        }

        await this.load(quickSave.id, game, progressionSystem, achievementSystem, patternCodex, gameMode);
        console.log('⚡ Quick load completed');
    }

    // Settings management
    private getSettings(): any {
        const settings = localStorage.getItem('genesis_protocol_settings');
        return settings ? JSON.parse(settings) : {};
    }

    // Utility
    private promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
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

    async clearAllSaves(): Promise<void> {
        const saves = await this.getAllSaves();
        for (const save of saves) {
            await this.deleteSave(save.id);
        }
        console.log('🗑️ All saves cleared');
    }

    async getStorageInfo(): Promise<{ used: number; available: number }> {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            const estimate = await navigator.storage.estimate();
            return {
                used: estimate.usage || 0,
                available: estimate.quota || 0
            };
        }
        return { used: 0, available: 0 };
    }
}
