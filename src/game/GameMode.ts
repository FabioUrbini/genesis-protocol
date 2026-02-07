import { Vector3 } from 'three';
import type { Game } from './Game';
import type { Player } from './Player';

export enum GameModeType {
    SURVIVAL = 'survival',
    EXPLORER = 'explorer',
    ARCHITECT = 'architect',
    PUZZLE = 'puzzle'
}

export interface GameModeConfig {
    type: GameModeType;
    name: string;
    description: string;
    startingResources?: Map<string, number>;
    objectives?: GameObjective[];
    rules?: GameModeRules;
}

export interface GameObjective {
    id: string;
    title: string;
    description: string;
    completed: boolean;
    progress: number;
    maxProgress: number;
    reward?: {
        xp?: number;
        resources?: Map<string, number>;
        unlocks?: string[];
    };
}

export interface GameModeRules {
    energyDrain: boolean;
    oxygenDrain: boolean;
    hostilePatterns: boolean;
    resourceScarcity: number; // 0-1 multiplier
    timeControlEnabled: boolean;
    creativeBuilding: boolean;
    permadeath: boolean;
}

export interface WaveData {
    waveNumber: number;
    enemyCount: number;
    enemyTypes: string[];
    spawnInterval: number;
    difficulty: number;
}

export abstract class GameMode {
    protected game: Game;
    protected player: Player;
    public config: GameModeConfig;
    public isActive: boolean = false;
    public startTime: number = 0;
    public playTime: number = 0;
    public score: number = 0;

    constructor(game: Game, player: Player, config: GameModeConfig) {
        this.game = game;
        this.player = player;
        this.config = config;
    }

    abstract onStart(): void;
    abstract onEnd(): void;
    abstract update(deltaTime: number): void;
    abstract onVoxelPlaced(position: Vector3, voxelType: number): void;
    abstract onVoxelRemoved(position: Vector3, voxelType: number): void;
    abstract onPatternSpawned(patternName: string): void;
    abstract onPlayerDeath(): void;

    start(): void {
        this.isActive = true;
        this.startTime = Date.now();
        this.playTime = 0;
        this.score = 0;
        this.onStart();
    }

    end(): void {
        this.isActive = false;
        this.onEnd();
    }

    addScore(points: number): void {
        this.score += points;
    }

    getPlayTime(): number {
        if (this.isActive) {
            return this.playTime + (Date.now() - this.startTime);
        }
        return this.playTime;
    }

    serialize(): any {
        return {
            type: this.config.type,
            isActive: this.isActive,
            playTime: this.getPlayTime(),
            score: this.score,
            objectives: this.config.objectives
        };
    }

    deserialize(data: any): void {
        this.isActive = data.isActive;
        this.playTime = data.playTime || 0;
        this.score = data.score || 0;
        if (data.objectives) {
            this.config.objectives = data.objectives;
        }
    }
}

export class SurvivalMode extends GameMode {
    private currentWave: number = 0;
    private waveActive: boolean = false;
    private waveStartTime: number = 0;
    private waveDuration: number = 60000; // 60 seconds per wave
    private restDuration: number = 30000; // 30 seconds rest between waves
    private enemiesSpawned: number = 0;
    private enemiesDefeated: number = 0;
    private spawnTimer: number = 0;
    private nextWaveTimer: number = 0;

    constructor(game: Game, player: Player) {
        super(game, player, {
            type: GameModeType.SURVIVAL,
            name: 'Survival Mode',
            description: 'Survive increasingly difficult waves of hostile patterns. Gather resources and build defenses.',
            startingResources: new Map([
                ['energy_crystal', 10],
                ['crystallized_voxel', 5]
            ]),
            objectives: [
                {
                    id: 'survive_wave_5',
                    title: 'Survive to Wave 5',
                    description: 'Survive 5 waves of hostile patterns',
                    completed: false,
                    progress: 0,
                    maxProgress: 5,
                    reward: { xp: 100, unlocks: ['advanced_barriers'] }
                },
                {
                    id: 'survive_wave_10',
                    title: 'Survive to Wave 10',
                    description: 'Survive 10 waves of hostile patterns',
                    completed: false,
                    progress: 0,
                    maxProgress: 10,
                    reward: { xp: 500, unlocks: ['temporal_shields'] }
                },
                {
                    id: 'defeat_100_enemies',
                    title: 'Pattern Destroyer',
                    description: 'Defeat 100 hostile patterns',
                    completed: false,
                    progress: 0,
                    maxProgress: 100,
                    reward: { xp: 200 }
                }
            ],
            rules: {
                energyDrain: true,
                oxygenDrain: true,
                hostilePatterns: true,
                resourceScarcity: 0.7,
                timeControlEnabled: true,
                creativeBuilding: false,
                permadeath: false
            }
        });
    }

    onStart(): void {
        console.log('Survival Mode started!');
        this.currentWave = 0;
        this.waveActive = false;
        this.nextWaveTimer = 5000; // 5 seconds before first wave

        // Give starting resources
        if (this.config.startingResources && this.player.inventory) {
            this.config.startingResources.forEach((amount, resourceType) => {
                this.player.inventory!.addItem(resourceType, amount);
            });
        }
    }

    onEnd(): void {
        console.log(`Survival Mode ended. Final Score: ${this.score}, Waves: ${this.currentWave}`);
        this.waveActive = false;
    }

    update(deltaTime: number): void {
        if (!this.isActive) return;

        if (this.waveActive) {
            this.updateWave(deltaTime);
        } else {
            this.nextWaveTimer -= deltaTime * 1000;
            if (this.nextWaveTimer <= 0) {
                this.startNextWave();
            }
        }
    }

    private updateWave(deltaTime: number): void {
        const elapsed = Date.now() - this.waveStartTime;

        // Spawn enemies during wave
        this.spawnTimer -= deltaTime * 1000;
        if (this.spawnTimer <= 0 && elapsed < this.waveDuration) {
            this.spawnEnemy();
            const waveData = this.getWaveData(this.currentWave);
            this.spawnTimer = waveData.spawnInterval;
        }

        // End wave when duration is over or all enemies defeated
        if (elapsed >= this.waveDuration || (this.enemiesSpawned > 0 && this.enemiesDefeated >= this.enemiesSpawned)) {
            this.endWave();
        }
    }

    private startNextWave(): void {
        this.currentWave++;
        this.waveActive = true;
        this.waveStartTime = Date.now();
        this.enemiesSpawned = 0;
        this.enemiesDefeated = 0;
        this.spawnTimer = 1000; // First spawn after 1 second

        console.log(`Wave ${this.currentWave} started!`);

        // Update objectives
        this.updateObjectiveProgress('survive_wave_5', this.currentWave);
        this.updateObjectiveProgress('survive_wave_10', this.currentWave);

        // Award score
        this.addScore(this.currentWave * 100);
    }

    private endWave(): void {
        this.waveActive = false;
        this.nextWaveTimer = this.restDuration;
        console.log(`Wave ${this.currentWave} completed! Next wave in ${this.restDuration / 1000}s`);

        // Award bonus score for wave completion
        this.addScore(500 + (this.currentWave * 50));
    }

    private getWaveData(wave: number): WaveData {
        return {
            waveNumber: wave,
            enemyCount: Math.floor(5 + wave * 2),
            enemyTypes: ['glider', 'oscillator', 'spaceship'],
            spawnInterval: Math.max(2000, 5000 - wave * 200), // Faster spawns each wave
            difficulty: 1 + (wave * 0.15)
        };
    }

    private spawnEnemy(): void {
        // Spawn hostile pattern near player but not too close
        const playerPos = this.player.getPosition();
        const spawnDistance = 20 + Math.random() * 20;
        const angle = Math.random() * Math.PI * 2;

        const spawnPos = new Vector3(
            playerPos.x + Math.cos(angle) * spawnDistance,
            playerPos.y + (Math.random() - 0.5) * 10,
            playerPos.z + Math.sin(angle) * spawnDistance
        );

        // Spawn a hostile pattern (glider or spaceship)
        const patternTypes = ['glider_3d', 'lightweight_spaceship_3d'];
        const pattern = patternTypes[Math.floor(Math.random() * patternTypes.length)];

        // TODO: Integrate with pattern spawning system
        // For now, just track the spawn
        this.enemiesSpawned++;

        console.log(`Enemy spawned: ${pattern} at ${spawnPos.toArray()}`);
    }

    onVoxelPlaced(position: Vector3, voxelType: number): void {
        // Small score for building
        this.addScore(1);
    }

    onVoxelRemoved(position: Vector3, voxelType: number): void {
        // Check if it was a hostile voxel
        if (voxelType === 1 || voxelType === 2) { // Assuming hostile types
            this.enemiesDefeated++;
            this.updateObjectiveProgress('defeat_100_enemies', this.enemiesDefeated);
            this.addScore(10);
        }
    }

    onPatternSpawned(patternName: string): void {
        this.addScore(50);
    }

    onPlayerDeath(): void {
        if (this.config.rules?.permadeath) {
            this.end();
        } else {
            // Respawn but lose score
            this.score = Math.floor(this.score * 0.5);
            this.currentWave = Math.max(1, this.currentWave - 2);
        }
    }

    private updateObjectiveProgress(objectiveId: string, progress: number): void {
        const objective = this.config.objectives?.find(obj => obj.id === objectiveId);
        if (objective && !objective.completed) {
            objective.progress = Math.min(progress, objective.maxProgress);
            if (objective.progress >= objective.maxProgress) {
                objective.completed = true;
                console.log(`Objective completed: ${objective.title}`);
                // TODO: Award rewards
            }
        }
    }

    getCurrentWave(): number {
        return this.currentWave;
    }

    isWaveActive(): boolean {
        return this.waveActive;
    }

    getNextWaveTime(): number {
        return Math.max(0, this.nextWaveTimer);
    }

    serialize(): any {
        return {
            ...super.serialize(),
            currentWave: this.currentWave,
            waveActive: this.waveActive,
            enemiesSpawned: this.enemiesSpawned,
            enemiesDefeated: this.enemiesDefeated
        };
    }

    deserialize(data: any): void {
        super.deserialize(data);
        this.currentWave = data.currentWave || 0;
        this.waveActive = data.waveActive || false;
        this.enemiesSpawned = data.enemiesSpawned || 0;
        this.enemiesDefeated = data.enemiesDefeated || 0;
    }
}

export class ExplorerMode extends GameMode {
    private discoveredBiomes: Set<string> = new Set();
    private visitedChunks: Set<string> = new Set();
    private distanceTraveled: number = 0;
    private lastPosition: Vector3 = new Vector3();
    private patternsDiscovered: Set<string> = new Set();

    constructor(game: Game, player: Player) {
        super(game, player, {
            type: GameModeType.EXPLORER,
            name: 'Explorer Mode',
            description: 'Explore the infinite world, discover biomes, and catalog patterns. No pressure, just discovery.',
            startingResources: new Map([
                ['energy_crystal', 50],
                ['oxygen_tank', 20],
                ['crystallized_voxel', 20]
            ]),
            objectives: [
                {
                    id: 'discover_all_biomes',
                    title: 'Biome Explorer',
                    description: 'Discover all 7 biomes',
                    completed: false,
                    progress: 0,
                    maxProgress: 7,
                    reward: { xp: 500, unlocks: ['biome_teleporter'] }
                },
                {
                    id: 'travel_10000',
                    title: 'World Wanderer',
                    description: 'Travel 10,000 units',
                    completed: false,
                    progress: 0,
                    maxProgress: 10000,
                    reward: { xp: 300 }
                },
                {
                    id: 'discover_10_patterns',
                    title: 'Pattern Cataloger',
                    description: 'Discover 10 unique patterns',
                    completed: false,
                    progress: 0,
                    maxProgress: 10,
                    reward: { xp: 200, unlocks: ['pattern_analyzer'] }
                }
            ],
            rules: {
                energyDrain: true,
                oxygenDrain: true,
                hostilePatterns: false,
                resourceScarcity: 1.0,
                timeControlEnabled: true,
                creativeBuilding: false,
                permadeath: false
            }
        });
    }

    onStart(): void {
        console.log('Explorer Mode started! Go forth and discover!');
        this.lastPosition = this.player.getPosition().clone();

        if (this.config.startingResources && this.player.inventory) {
            this.config.startingResources.forEach((amount, resourceType) => {
                this.player.inventory!.addItem(resourceType, amount);
            });
        }
    }

    onEnd(): void {
        console.log(`Explorer Mode ended. Biomes: ${this.discoveredBiomes.size}, Distance: ${Math.floor(this.distanceTraveled)}`);
    }

    update(deltaTime: number): void {
        if (!this.isActive) return;

        const currentPos = this.player.getPosition();
        const distance = currentPos.distanceTo(this.lastPosition);

        if (distance > 0.1) {
            this.distanceTraveled += distance;
            this.lastPosition = currentPos.clone();

            // Update travel objective
            const objective = this.config.objectives?.find(obj => obj.id === 'travel_10000');
            if (objective && !objective.completed) {
                objective.progress = Math.floor(this.distanceTraveled);
                if (objective.progress >= objective.maxProgress) {
                    objective.completed = true;
                    console.log(`Objective completed: ${objective.title}`);
                }
            }
        }

        // Check for new chunks
        const chunkKey = this.getChunkKey(currentPos);
        if (!this.visitedChunks.has(chunkKey)) {
            this.visitedChunks.add(chunkKey);
            this.addScore(10);
        }
    }

    onVoxelPlaced(position: Vector3, voxelType: number): void {
        this.addScore(1);
    }

    onVoxelRemoved(position: Vector3, voxelType: number): void {
        // No penalty in explorer mode
    }

    onPatternSpawned(patternName: string): void {
        this.addScore(25);
    }

    onPlayerDeath(): void {
        // No penalty in explorer mode, just respawn
        console.log('Explorer respawned at last safe location');
    }

    discoverBiome(biomeName: string): void {
        if (!this.discoveredBiomes.has(biomeName)) {
            this.discoveredBiomes.add(biomeName);
            console.log(`New biome discovered: ${biomeName}`);
            this.addScore(500);

            const objective = this.config.objectives?.find(obj => obj.id === 'discover_all_biomes');
            if (objective && !objective.completed) {
                objective.progress = this.discoveredBiomes.size;
                if (objective.progress >= objective.maxProgress) {
                    objective.completed = true;
                    console.log(`Objective completed: ${objective.title}`);
                }
            }
        }
    }

    discoverPattern(patternName: string): void {
        if (!this.patternsDiscovered.has(patternName)) {
            this.patternsDiscovered.add(patternName);
            console.log(`New pattern discovered: ${patternName}`);
            this.addScore(100);

            const objective = this.config.objectives?.find(obj => obj.id === 'discover_10_patterns');
            if (objective && !objective.completed) {
                objective.progress = this.patternsDiscovered.size;
                if (objective.progress >= objective.maxProgress) {
                    objective.completed = true;
                    console.log(`Objective completed: ${objective.title}`);
                }
            }
        }
    }

    private getChunkKey(pos: Vector3): string {
        const cx = Math.floor(pos.x / 16);
        const cy = Math.floor(pos.y / 16);
        const cz = Math.floor(pos.z / 16);
        return `${cx},${cy},${cz}`;
    }

    getDiscoveredBiomes(): string[] {
        return Array.from(this.discoveredBiomes);
    }

    getDistanceTraveled(): number {
        return Math.floor(this.distanceTraveled);
    }

    serialize(): any {
        return {
            ...super.serialize(),
            discoveredBiomes: Array.from(this.discoveredBiomes),
            visitedChunks: Array.from(this.visitedChunks),
            distanceTraveled: this.distanceTraveled,
            patternsDiscovered: Array.from(this.patternsDiscovered)
        };
    }

    deserialize(data: any): void {
        super.deserialize(data);
        this.discoveredBiomes = new Set(data.discoveredBiomes || []);
        this.visitedChunks = new Set(data.visitedChunks || []);
        this.distanceTraveled = data.distanceTraveled || 0;
        this.patternsDiscovered = new Set(data.patternsDiscovered || []);
    }
}

export class ArchitectMode extends GameMode {
    private structuresBuilt: number = 0;
    private voxelsPlaced: number = 0;
    private complexPatternsCreated: number = 0;

    constructor(game: Game, player: Player) {
        super(game, player, {
            type: GameModeType.ARCHITECT,
            name: 'Architect Mode',
            description: 'Unlimited resources and full time control. Build, experiment, and create without limits.',
            startingResources: new Map([
                ['energy_crystal', 9999],
                ['crystallized_voxel', 9999],
                ['temporal_shard', 9999],
                ['chaos_essence', 9999],
                ['quantum_foam', 9999],
                ['void_matter', 9999]
            ]),
            objectives: [
                {
                    id: 'place_1000_voxels',
                    title: 'Master Builder',
                    description: 'Place 1,000 voxels',
                    completed: false,
                    progress: 0,
                    maxProgress: 1000,
                    reward: { xp: 200 }
                },
                {
                    id: 'build_10_structures',
                    title: 'Architect Supreme',
                    description: 'Build 10 structures',
                    completed: false,
                    progress: 0,
                    maxProgress: 10,
                    reward: { xp: 300 }
                },
                {
                    id: 'create_complex_pattern',
                    title: 'Pattern Designer',
                    description: 'Create 5 complex patterns',
                    completed: false,
                    progress: 0,
                    maxProgress: 5,
                    reward: { xp: 500, unlocks: ['pattern_editor'] }
                }
            ],
            rules: {
                energyDrain: false,
                oxygenDrain: false,
                hostilePatterns: false,
                resourceScarcity: 0,
                timeControlEnabled: true,
                creativeBuilding: true,
                permadeath: false
            }
        });
    }

    onStart(): void {
        console.log('Architect Mode started! Build without limits!');

        // Give unlimited resources
        if (this.config.startingResources && this.player.inventory) {
            this.config.startingResources.forEach((amount, resourceType) => {
                this.player.inventory!.addItem(resourceType, amount);
            });
        }

        // Disable energy/oxygen drain
        if (this.player.environmentalSuit) {
            // Store original values and set to no drain
        }
    }

    onEnd(): void {
        console.log(`Architect Mode ended. Voxels placed: ${this.voxelsPlaced}, Structures: ${this.structuresBuilt}`);
    }

    update(deltaTime: number): void {
        if (!this.isActive) return;

        // Keep resources topped up
        if (this.player.inventory) {
            this.config.startingResources?.forEach((amount, resourceType) => {
                const current = this.player.inventory!.getItemCount(resourceType);
                if (current < amount) {
                    this.player.inventory!.addItem(resourceType, amount - current);
                }
            });
        }
    }

    onVoxelPlaced(position: Vector3, voxelType: number): void {
        this.voxelsPlaced++;
        this.addScore(1);

        const objective = this.config.objectives?.find(obj => obj.id === 'place_1000_voxels');
        if (objective && !objective.completed) {
            objective.progress = this.voxelsPlaced;
            if (objective.progress >= objective.maxProgress) {
                objective.completed = true;
                console.log(`Objective completed: ${objective.title}`);
            }
        }
    }

    onVoxelRemoved(position: Vector3, voxelType: number): void {
        // No penalty
    }

    onPatternSpawned(patternName: string): void {
        this.addScore(50);
    }

    onPlayerDeath(): void {
        // No death in architect mode
        console.log('Architect mode: death disabled');
    }

    onStructureBuilt(structureType: string): void {
        this.structuresBuilt++;
        this.addScore(100);

        const objective = this.config.objectives?.find(obj => obj.id === 'build_10_structures');
        if (objective && !objective.completed) {
            objective.progress = this.structuresBuilt;
            if (objective.progress >= objective.maxProgress) {
                objective.completed = true;
                console.log(`Objective completed: ${objective.title}`);
            }
        }
    }

    onComplexPatternCreated(): void {
        this.complexPatternsCreated++;
        this.addScore(200);

        const objective = this.config.objectives?.find(obj => obj.id === 'create_complex_pattern');
        if (objective && !objective.completed) {
            objective.progress = this.complexPatternsCreated;
            if (objective.progress >= objective.maxProgress) {
                objective.completed = true;
                console.log(`Objective completed: ${objective.title}`);
            }
        }
    }

    serialize(): any {
        return {
            ...super.serialize(),
            structuresBuilt: this.structuresBuilt,
            voxelsPlaced: this.voxelsPlaced,
            complexPatternsCreated: this.complexPatternsCreated
        };
    }

    deserialize(data: any): void {
        super.deserialize(data);
        this.structuresBuilt = data.structuresBuilt || 0;
        this.voxelsPlaced = data.voxelsPlaced || 0;
        this.complexPatternsCreated = data.complexPatternsCreated || 0;
    }
}

export class PuzzleMode extends GameMode {
    private currentPuzzle: number = 0;
    private puzzlesCompleted: number = 0;
    private movesUsed: number = 0;
    private timeUsed: number = 0;
    private hintsUsed: number = 0;
    private puzzles: PuzzleDefinition[] = [];

    constructor(game: Game, player: Player) {
        super(game, player, {
            type: GameModeType.PUZZLE,
            name: 'Puzzle Mode',
            description: 'Solve CA pattern puzzles. Achieve specific goals with limited moves and resources.',
            objectives: [
                {
                    id: 'complete_5_puzzles',
                    title: 'Puzzle Novice',
                    description: 'Complete 5 puzzles',
                    completed: false,
                    progress: 0,
                    maxProgress: 5,
                    reward: { xp: 200 }
                },
                {
                    id: 'complete_puzzle_perfect',
                    title: 'Perfect Solution',
                    description: 'Complete a puzzle with minimum moves',
                    completed: false,
                    progress: 0,
                    maxProgress: 1,
                    reward: { xp: 500, unlocks: ['puzzle_master_skin'] }
                },
                {
                    id: 'complete_all_puzzles',
                    title: 'Puzzle Master',
                    description: 'Complete all puzzles',
                    completed: false,
                    progress: 0,
                    maxProgress: 20,
                    reward: { xp: 1000, unlocks: ['puzzle_creator'] }
                }
            ],
            rules: {
                energyDrain: false,
                oxygenDrain: false,
                hostilePatterns: false,
                resourceScarcity: 0,
                timeControlEnabled: true,
                creativeBuilding: false,
                permadeath: false
            }
        });

        this.initializePuzzles();
    }

    private initializePuzzles(): void {
        this.puzzles = [
            {
                id: 1,
                name: 'First Steps',
                description: 'Create a stable oscillator',
                difficulty: 'easy',
                maxMoves: 10,
                targetPattern: 'blinker',
                startingVoxels: [],
                allowedVoxelTypes: [1, 2],
                timeLimit: 0
            },
            {
                id: 2,
                name: 'Space Travel',
                description: 'Launch a glider to the target zone',
                difficulty: 'easy',
                maxMoves: 15,
                targetPattern: 'glider',
                startingVoxels: [],
                allowedVoxelTypes: [1],
                timeLimit: 0
            },
            {
                id: 3,
                name: 'Still Life',
                description: 'Create a completely stable pattern',
                difficulty: 'medium',
                maxMoves: 8,
                targetPattern: 'block',
                startingVoxels: [],
                allowedVoxelTypes: [1],
                timeLimit: 0
            }
            // TODO: Add more puzzles
        ];
    }

    onStart(): void {
        console.log('Puzzle Mode started!');
        this.loadPuzzle(0);
    }

    onEnd(): void {
        console.log(`Puzzle Mode ended. Completed: ${this.puzzlesCompleted}/${this.puzzles.length}`);
    }

    update(deltaTime: number): void {
        if (!this.isActive) return;

        this.timeUsed += deltaTime;

        const puzzle = this.puzzles[this.currentPuzzle];
        if (puzzle && puzzle.timeLimit > 0 && this.timeUsed >= puzzle.timeLimit) {
            console.log('Time limit exceeded! Puzzle failed.');
            this.resetPuzzle();
        }
    }

    onVoxelPlaced(position: Vector3, voxelType: number): void {
        this.movesUsed++;

        const puzzle = this.puzzles[this.currentPuzzle];
        if (puzzle && this.movesUsed >= puzzle.maxMoves) {
            console.log('Move limit reached!');
            // Check if puzzle is solved
            this.checkPuzzleSolution();
        }
    }

    onVoxelRemoved(position: Vector3, voxelType: number): void {
        this.movesUsed++;
    }

    onPatternSpawned(patternName: string): void {
        // Check if spawned pattern matches target
        const puzzle = this.puzzles[this.currentPuzzle];
        if (puzzle && patternName === puzzle.targetPattern) {
            this.completePuzzle();
        }
    }

    onPlayerDeath(): void {
        // No death in puzzle mode
    }

    private loadPuzzle(index: number): void {
        if (index >= this.puzzles.length) {
            console.log('All puzzles completed!');
            this.end();
            return;
        }

        this.currentPuzzle = index;
        this.movesUsed = 0;
        this.timeUsed = 0;
        this.hintsUsed = 0;

        const puzzle = this.puzzles[index];
        console.log(`Loading puzzle ${index + 1}: ${puzzle.name}`);
        console.log(`Description: ${puzzle.description}`);
        console.log(`Max moves: ${puzzle.maxMoves}`);

        // TODO: Setup puzzle environment
    }

    private checkPuzzleSolution(): boolean {
        // TODO: Implement pattern matching logic
        return false;
    }

    private completePuzzle(): void {
        const puzzle = this.puzzles[this.currentPuzzle];
        console.log(`Puzzle completed: ${puzzle.name}`);
        console.log(`Moves: ${this.movesUsed}/${puzzle.maxMoves}, Time: ${this.timeUsed.toFixed(1)}s`);

        this.puzzlesCompleted++;

        // Calculate score based on efficiency
        const moveEfficiency = 1 - (this.movesUsed / puzzle.maxMoves);
        const timeBonus = puzzle.timeLimit > 0 ? (1 - (this.timeUsed / puzzle.timeLimit)) : 1;
        const hintPenalty = this.hintsUsed * 0.1;
        const score = Math.floor(1000 * moveEfficiency * timeBonus * (1 - hintPenalty));

        this.addScore(score);

        // Update objectives
        this.updateObjective('complete_5_puzzles', this.puzzlesCompleted);
        this.updateObjective('complete_all_puzzles', this.puzzlesCompleted);

        if (this.movesUsed <= puzzle.maxMoves * 0.7) {
            this.updateObjective('complete_puzzle_perfect', 1);
        }

        // Load next puzzle after delay
        setTimeout(() => this.loadPuzzle(this.currentPuzzle + 1), 3000);
    }

    private resetPuzzle(): void {
        console.log('Resetting puzzle...');
        this.loadPuzzle(this.currentPuzzle);
    }

    useHint(): void {
        this.hintsUsed++;
        const puzzle = this.puzzles[this.currentPuzzle];
        // TODO: Show hint
        console.log(`Hint for ${puzzle.name}: Try placing voxels in a pattern that matches ${puzzle.targetPattern}`);
    }

    private updateObjective(objectiveId: string, progress: number): void {
        const objective = this.config.objectives?.find(obj => obj.id === objectiveId);
        if (objective && !objective.completed) {
            objective.progress = Math.min(progress, objective.maxProgress);
            if (objective.progress >= objective.maxProgress) {
                objective.completed = true;
                console.log(`Objective completed: ${objective.title}`);
            }
        }
    }

    getCurrentPuzzle(): PuzzleDefinition | null {
        return this.puzzles[this.currentPuzzle] || null;
    }

    getMovesRemaining(): number {
        const puzzle = this.puzzles[this.currentPuzzle];
        return puzzle ? Math.max(0, puzzle.maxMoves - this.movesUsed) : 0;
    }

    serialize(): any {
        return {
            ...super.serialize(),
            currentPuzzle: this.currentPuzzle,
            puzzlesCompleted: this.puzzlesCompleted,
            movesUsed: this.movesUsed,
            timeUsed: this.timeUsed,
            hintsUsed: this.hintsUsed
        };
    }

    deserialize(data: any): void {
        super.deserialize(data);
        this.currentPuzzle = data.currentPuzzle || 0;
        this.puzzlesCompleted = data.puzzlesCompleted || 0;
        this.movesUsed = data.movesUsed || 0;
        this.timeUsed = data.timeUsed || 0;
        this.hintsUsed = data.hintsUsed || 0;
    }
}

interface PuzzleDefinition {
    id: number;
    name: string;
    description: string;
    difficulty: 'easy' | 'medium' | 'hard' | 'expert';
    maxMoves: number;
    targetPattern: string;
    startingVoxels: Array<{ pos: Vector3; type: number }>;
    allowedVoxelTypes: number[];
    timeLimit: number; // 0 = no limit
}
