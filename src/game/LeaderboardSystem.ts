export enum LeaderboardType {
    SURVIVAL_WAVES = 'survival_waves',
    SURVIVAL_SCORE = 'survival_score',
    EXPLORER_DISTANCE = 'explorer_distance',
    EXPLORER_BIOMES = 'explorer_biomes',
    ARCHITECT_VOXELS = 'architect_voxels',
    PUZZLE_TIME = 'puzzle_time',
    PUZZLE_MOVES = 'puzzle_moves',
    TOTAL_PLAYTIME = 'total_playtime',
    LEVEL = 'level',
    ACHIEVEMENTS = 'achievements'
}

export interface LeaderboardEntry {
    id: string;
    playerName: string;
    score: number;
    rank: number;
    metadata?: {
        level?: number;
        gameMode?: string;
        timestamp?: number;
        additionalInfo?: string;
    };
    timestamp: number;
}

export interface LeaderboardStats {
    type: LeaderboardType;
    totalEntries: number;
    highestScore: number;
    averageScore: number;
    yourRank?: number;
    yourScore?: number;
}

export class LeaderboardSystem {
    private dbName: string = 'GenesisProtocolLeaderboards';
    private dbVersion: number = 1;
    private db: IDBDatabase | null = null;
    private playerName: string = 'Player';
    private playerId: string;
    private listeners: Map<string, Function[]> = new Map();

    constructor() {
        this.playerId = this.getOrCreatePlayerId();
        this.playerName = this.getStoredPlayerName();
        this.initDB();
    }

    private getOrCreatePlayerId(): string {
        let id = localStorage.getItem('genesis_protocol_player_id');
        if (!id) {
            id = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('genesis_protocol_player_id', id);
        }
        return id;
    }

    private getStoredPlayerName(): string {
        return localStorage.getItem('genesis_protocol_player_name') || 'Player';
    }

    setPlayerName(name: string): void {
        this.playerName = name;
        localStorage.setItem('genesis_protocol_player_name', name);
        console.log(`👤 Player name set to: ${name}`);
    }

    getPlayerName(): string {
        return this.playerName;
    }

    private async initDB(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('Failed to open Leaderboard database');
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('Leaderboard database initialized');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Create object stores for each leaderboard type
                Object.values(LeaderboardType).forEach(type => {
                    if (!db.objectStoreNames.contains(type)) {
                        const store = db.createObjectStore(type, { keyPath: 'id' });
                        store.createIndex('score', 'score', { unique: false });
                        store.createIndex('timestamp', 'timestamp', { unique: false });
                        store.createIndex('playerId', 'playerId', { unique: false });
                    }
                });

                console.log('Leaderboard database schema created');
            };
        });
    }

    async submitScore(
        type: LeaderboardType,
        score: number,
        metadata?: LeaderboardEntry['metadata']
    ): Promise<LeaderboardEntry> {
        if (!this.db) {
            await this.initDB();
        }

        const entry: LeaderboardEntry = {
            id: `${this.playerId}_${type}_${Date.now()}`,
            playerName: this.playerName,
            score,
            rank: 0, // Will be calculated
            metadata,
            timestamp: Date.now()
        };

        try {
            const transaction = this.db!.transaction([type], 'readwrite');
            const store = transaction.objectStore(type);

            // Add playerId to entry for querying
            const dbEntry = { ...entry, playerId: this.playerId };
            await this.promisifyRequest(store.put(dbEntry));

            // Calculate rank
            entry.rank = await this.calculateRank(type, score);

            console.log(`📊 Score submitted to ${type}: ${score} (Rank: ${entry.rank})`);
            this.emit('scoreSubmitted', { type, entry });

            return entry;
        } catch (error) {
            console.error('Failed to submit score:', error);
            throw error;
        }
    }

    private async calculateRank(type: LeaderboardType, score: number): Promise<number> {
        const allEntries = await this.getTopScores(type, 1000);

        // For time-based leaderboards (lower is better)
        const isTimeBased = type === LeaderboardType.PUZZLE_TIME;

        if (isTimeBased) {
            return allEntries.filter(e => e.score < score).length + 1;
        } else {
            return allEntries.filter(e => e.score > score).length + 1;
        }
    }

    async getTopScores(
        type: LeaderboardType,
        limit: number = 100,
        offset: number = 0
    ): Promise<LeaderboardEntry[]> {
        if (!this.db) {
            await this.initDB();
        }

        try {
            const transaction = this.db!.transaction([type], 'readonly');
            const store = transaction.objectStore(type);
            const index = store.index('score');

            const entries: LeaderboardEntry[] = [];
            const request = index.openCursor(null, 'prev'); // Descending order

            await new Promise<void>((resolve, reject) => {
                request.onsuccess = () => {
                    const cursor = request.result;
                    if (cursor && entries.length < limit + offset) {
                        if (entries.length >= offset) {
                            entries.push(cursor.value);
                        }
                        cursor.continue();
                    } else {
                        resolve();
                    }
                };
                request.onerror = () => reject(request.error);
            });

            // Assign ranks
            entries.forEach((entry, index) => {
                entry.rank = offset + index + 1;
            });

            return entries;
        } catch (error) {
            console.error('Failed to get top scores:', error);
            return [];
        }
    }

    async getPlayerScores(type: LeaderboardType, limit: number = 10): Promise<LeaderboardEntry[]> {
        if (!this.db) {
            await this.initDB();
        }

        try {
            const transaction = this.db!.transaction([type], 'readonly');
            const store = transaction.objectStore(type);
            const index = store.index('playerId');

            const entries: LeaderboardEntry[] = [];
            const request = index.openCursor(IDBKeyRange.only(this.playerId), 'prev');

            await new Promise<void>((resolve, reject) => {
                request.onsuccess = () => {
                    const cursor = request.result;
                    if (cursor && entries.length < limit) {
                        entries.push(cursor.value);
                        cursor.continue();
                    } else {
                        resolve();
                    }
                };
                request.onerror = () => reject(request.error);
            });

            // Calculate ranks for each entry
            for (const entry of entries) {
                entry.rank = await this.calculateRank(type, entry.score);
            }

            return entries.sort((a, b) => a.rank - b.rank);
        } catch (error) {
            console.error('Failed to get player scores:', error);
            return [];
        }
    }

    async getPlayerBestScore(type: LeaderboardType): Promise<LeaderboardEntry | null> {
        const scores = await this.getPlayerScores(type, 1);
        return scores.length > 0 ? scores[0] : null;
    }

    async getLeaderboardStats(type: LeaderboardType): Promise<LeaderboardStats> {
        if (!this.db) {
            await this.initDB();
        }

        try {
            const transaction = this.db!.transaction([type], 'readonly');
            const store = transaction.objectStore(type);
            const allEntries = await this.promisifyRequest(store.getAll());

            if (allEntries.length === 0) {
                return {
                    type,
                    totalEntries: 0,
                    highestScore: 0,
                    averageScore: 0
                };
            }

            const scores = allEntries.map(e => e.score);
            const highestScore = Math.max(...scores);
            const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;

            // Find player's best
            const playerEntries = allEntries.filter(e => e.playerId === this.playerId);
            let yourRank: number | undefined;
            let yourScore: number | undefined;

            if (playerEntries.length > 0) {
                const bestPlayerScore = Math.max(...playerEntries.map(e => e.score));
                yourScore = bestPlayerScore;
                yourRank = await this.calculateRank(type, bestPlayerScore);
            }

            return {
                type,
                totalEntries: allEntries.length,
                highestScore,
                averageScore,
                yourRank,
                yourScore
            };
        } catch (error) {
            console.error('Failed to get leaderboard stats:', error);
            return {
                type,
                totalEntries: 0,
                highestScore: 0,
                averageScore: 0
            };
        }
    }

    async getAroundPlayer(
        type: LeaderboardType,
        range: number = 5
    ): Promise<LeaderboardEntry[]> {
        const playerBest = await this.getPlayerBestScore(type);
        if (!playerBest) {
            return await this.getTopScores(type, range * 2 + 1);
        }

        const rank = playerBest.rank;
        const startRank = Math.max(1, rank - range);
        const allTop = await this.getTopScores(type, rank + range);

        return allTop.slice(startRank - 1, startRank - 1 + range * 2 + 1);
    }

    async clearLeaderboard(type: LeaderboardType): Promise<void> {
        if (!this.db) {
            await this.initDB();
        }

        try {
            const transaction = this.db!.transaction([type], 'readwrite');
            const store = transaction.objectStore(type);
            await this.promisifyRequest(store.clear());

            console.log(`🗑️ Cleared leaderboard: ${type}`);
            this.emit('cleared', type);
        } catch (error) {
            console.error('Failed to clear leaderboard:', error);
            throw error;
        }
    }

    async clearAllLeaderboards(): Promise<void> {
        for (const type of Object.values(LeaderboardType)) {
            await this.clearLeaderboard(type);
        }
        console.log('🗑️ All leaderboards cleared');
    }

    async exportLeaderboard(type: LeaderboardType): Promise<string> {
        const entries = await this.getTopScores(type, 1000);
        return JSON.stringify({
            type,
            entries,
            exportedAt: Date.now()
        }, null, 2);
    }

    async importLeaderboard(jsonData: string): Promise<void> {
        try {
            const data = JSON.parse(jsonData);
            const type = data.type;
            const entries = data.entries;

            if (!type || !entries) {
                throw new Error('Invalid leaderboard data');
            }

            if (!this.db) {
                await this.initDB();
            }

            const transaction = this.db!.transaction([type], 'readwrite');
            const store = transaction.objectStore(type);

            for (const entry of entries) {
                await this.promisifyRequest(store.put(entry));
            }

            console.log(`📥 Imported ${entries.length} entries to ${type}`);
        } catch (error) {
            console.error('Failed to import leaderboard:', error);
            throw error;
        }
    }

    // Helper methods for common operations
    async submitSurvivalScore(waves: number, score: number, gameMode: string): Promise<void> {
        await this.submitScore(LeaderboardType.SURVIVAL_WAVES, waves, {
            gameMode,
            additionalInfo: `Score: ${score}`
        });

        await this.submitScore(LeaderboardType.SURVIVAL_SCORE, score, {
            gameMode,
            additionalInfo: `Waves: ${waves}`
        });
    }

    async submitExplorerScore(distance: number, biomes: number): Promise<void> {
        await this.submitScore(LeaderboardType.EXPLORER_DISTANCE, Math.floor(distance), {
            additionalInfo: `Biomes: ${biomes}`
        });

        await this.submitScore(LeaderboardType.EXPLORER_BIOMES, biomes, {
            additionalInfo: `Distance: ${Math.floor(distance)}`
        });
    }

    async submitArchitectScore(voxelsPlaced: number, structures: number): Promise<void> {
        await this.submitScore(LeaderboardType.ARCHITECT_VOXELS, voxelsPlaced, {
            additionalInfo: `Structures: ${structures}`
        });
    }

    async submitPuzzleScore(puzzleId: number, time: number, moves: number): Promise<void> {
        await this.submitScore(LeaderboardType.PUZZLE_TIME, time, {
            additionalInfo: `Puzzle ${puzzleId}, Moves: ${moves}`
        });

        await this.submitScore(LeaderboardType.PUZZLE_MOVES, moves, {
            additionalInfo: `Puzzle ${puzzleId}, Time: ${time.toFixed(1)}s`
        });
    }

    async submitProgressionScore(level: number, achievements: number, playtime: number): Promise<void> {
        await this.submitScore(LeaderboardType.LEVEL, level, {
            additionalInfo: `${achievements} achievements`
        });

        await this.submitScore(LeaderboardType.ACHIEVEMENTS, achievements, {
            level,
            additionalInfo: `Level ${level}`
        });

        await this.submitScore(LeaderboardType.TOTAL_PLAYTIME, Math.floor(playtime / 1000), {
            level,
            additionalInfo: `Level ${level}, ${achievements} achievements`
        });
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

    // Get formatted leaderboard display
    getFormattedLeaderboard(entries: LeaderboardEntry[]): string {
        let output = 'LEADERBOARD\n';
        output += '═'.repeat(50) + '\n';
        output += 'Rank | Player Name          | Score      \n';
        output += '─'.repeat(50) + '\n';

        entries.forEach(entry => {
            const rank = entry.rank.toString().padStart(4);
            const name = entry.playerName.padEnd(20).substring(0, 20);
            const score = entry.score.toString().padStart(10);
            output += `${rank} | ${name} | ${score}\n`;
        });

        return output;
    }
}
