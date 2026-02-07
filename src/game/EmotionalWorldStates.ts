import { Color } from 'three';

export enum WorldMood {
    TRANQUIL = 'tranquil',
    ENERGETIC = 'energetic',
    CHAOTIC = 'chaotic',
    MELANCHOLIC = 'melancholic',
    EUPHORIC = 'euphoric',
    TENSE = 'tense',
    MYSTERIOUS = 'mysterious',
    DREAMLIKE = 'dreamlike'
}

export interface MoodConfig {
    name: string;
    description: string;

    // Visual effects
    colorGrading: {
        primary: Color;
        secondary: Color;
        saturation: number;
        brightness: number;
        contrast: number;
    };

    // Audio effects
    musicTempo: number; // 0.5 - 2.0
    musicIntensity: number; // 0 - 1
    ambientVolume: number; // 0 - 1

    // Gameplay effects
    caSpeed: number; // 0.5 - 2.0
    voxelLifespan: number; // multiplier
    energyDrainRate: number; // multiplier

    // Post-processing
    bloomIntensity: number;
    vignetteStrength: number;
    chromaticAberration: number;

    // Duration and transition
    minDuration: number; // milliseconds
    maxDuration: number;
    transitionTime: number; // milliseconds
}

export class EmotionalWorldStates {
    private currentMood: WorldMood = WorldMood.TRANQUIL;
    private targetMood: WorldMood = WorldMood.TRANQUIL;
    private moodConfigs: Map<WorldMood, MoodConfig> = new Map();
    private transitionProgress: number = 1.0; // 0-1
    private moodStartTime: number = 0;
    private moodDuration: number = 60000; // 60 seconds
    private enabled: boolean = true;
    private autoTransition: boolean = true;
    private listeners: Map<string, Function[]> = new Map();

    constructor() {
        this.initializeMoodConfigs();
    }

    private initializeMoodConfigs(): void {
        // Tranquil - Peaceful, stable
        this.moodConfigs.set(WorldMood.TRANQUIL, {
            name: 'Tranquil',
            description: 'A peaceful state where patterns evolve slowly and harmoniously',
            colorGrading: {
                primary: new Color(0x88ccff),
                secondary: new Color(0xaaffcc),
                saturation: 0.7,
                brightness: 1.1,
                contrast: 0.9
            },
            musicTempo: 0.8,
            musicIntensity: 0.3,
            ambientVolume: 0.6,
            caSpeed: 0.7,
            voxelLifespan: 1.3,
            energyDrainRate: 0.7,
            bloomIntensity: 0.4,
            vignetteStrength: 0.2,
            chromaticAberration: 0.0,
            minDuration: 45000,
            maxDuration: 90000,
            transitionTime: 5000
        });

        // Energetic - Fast, vibrant
        this.moodConfigs.set(WorldMood.ENERGETIC, {
            name: 'Energetic',
            description: 'Patterns evolve rapidly with high activity',
            colorGrading: {
                primary: new Color(0xffaa00),
                secondary: new Color(0xff5500),
                saturation: 1.2,
                brightness: 1.2,
                contrast: 1.1
            },
            musicTempo: 1.5,
            musicIntensity: 0.8,
            ambientVolume: 0.8,
            caSpeed: 1.5,
            voxelLifespan: 0.9,
            energyDrainRate: 1.2,
            bloomIntensity: 0.8,
            vignetteStrength: 0.1,
            chromaticAberration: 0.001,
            minDuration: 30000,
            maxDuration: 60000,
            transitionTime: 3000
        });

        // Chaotic - Unpredictable, volatile
        this.moodConfigs.set(WorldMood.CHAOTIC, {
            name: 'Chaotic',
            description: 'Reality becomes unstable, rules bend and break',
            colorGrading: {
                primary: new Color(0xff00ff),
                secondary: new Color(0x00ffff),
                saturation: 1.5,
                brightness: 1.0,
                contrast: 1.3
            },
            musicTempo: 1.8,
            musicIntensity: 1.0,
            ambientVolume: 0.9,
            caSpeed: 2.0,
            voxelLifespan: 0.7,
            energyDrainRate: 1.5,
            bloomIntensity: 1.0,
            vignetteStrength: 0.4,
            chromaticAberration: 0.003,
            minDuration: 20000,
            maxDuration: 45000,
            transitionTime: 2000
        });

        // Melancholic - Slow, fading
        this.moodConfigs.set(WorldMood.MELANCHOLIC, {
            name: 'Melancholic',
            description: 'A somber mood where patterns slowly fade away',
            colorGrading: {
                primary: new Color(0x4455aa),
                secondary: new Color(0x6677bb),
                saturation: 0.5,
                brightness: 0.8,
                contrast: 0.8
            },
            musicTempo: 0.6,
            musicIntensity: 0.4,
            ambientVolume: 0.5,
            caSpeed: 0.5,
            voxelLifespan: 0.8,
            energyDrainRate: 1.3,
            bloomIntensity: 0.3,
            vignetteStrength: 0.5,
            chromaticAberration: 0.0,
            minDuration: 50000,
            maxDuration: 100000,
            transitionTime: 8000
        });

        // Euphoric - Joyful, expansive
        this.moodConfigs.set(WorldMood.EUPHORIC, {
            name: 'Euphoric',
            description: 'Pure joy - patterns bloom and flourish',
            colorGrading: {
                primary: new Color(0xffff88),
                secondary: new Color(0xffaaff),
                saturation: 1.3,
                brightness: 1.4,
                contrast: 1.0
            },
            musicTempo: 1.3,
            musicIntensity: 0.9,
            ambientVolume: 0.7,
            caSpeed: 1.2,
            voxelLifespan: 1.5,
            energyDrainRate: 0.5,
            bloomIntensity: 1.2,
            vignetteStrength: 0.0,
            chromaticAberration: 0.0005,
            minDuration: 35000,
            maxDuration: 70000,
            transitionTime: 4000
        });

        // Tense - Anticipation, danger
        this.moodConfigs.set(WorldMood.TENSE, {
            name: 'Tense',
            description: 'Something is about to happen...',
            colorGrading: {
                primary: new Color(0xaa0000),
                secondary: new Color(0xff4400),
                saturation: 0.9,
                brightness: 0.9,
                contrast: 1.2
            },
            musicTempo: 1.1,
            musicIntensity: 0.7,
            ambientVolume: 0.8,
            caSpeed: 1.1,
            voxelLifespan: 1.0,
            energyDrainRate: 1.4,
            bloomIntensity: 0.6,
            vignetteStrength: 0.6,
            chromaticAberration: 0.002,
            minDuration: 25000,
            maxDuration: 50000,
            transitionTime: 3000
        });

        // Mysterious - Unknown, curious
        this.moodConfigs.set(WorldMood.MYSTERIOUS, {
            name: 'Mysterious',
            description: 'Secrets lurk in the patterns',
            colorGrading: {
                primary: new Color(0x6600aa),
                secondary: new Color(0x0066aa),
                saturation: 0.8,
                brightness: 0.7,
                contrast: 1.1
            },
            musicTempo: 0.9,
            musicIntensity: 0.6,
            ambientVolume: 0.7,
            caSpeed: 0.8,
            voxelLifespan: 1.2,
            energyDrainRate: 1.0,
            bloomIntensity: 0.7,
            vignetteStrength: 0.4,
            chromaticAberration: 0.001,
            minDuration: 40000,
            maxDuration: 80000,
            transitionTime: 6000
        });

        // Dreamlike - Surreal, fluid
        this.moodConfigs.set(WorldMood.DREAMLIKE, {
            name: 'Dreamlike',
            description: 'Reality becomes fluid and dreamlike',
            colorGrading: {
                primary: new Color(0xaa88ff),
                secondary: new Color(0x88ffaa),
                saturation: 1.1,
                brightness: 1.0,
                contrast: 0.85
            },
            musicTempo: 0.7,
            musicIntensity: 0.5,
            ambientVolume: 0.6,
            caSpeed: 0.6,
            voxelLifespan: 1.4,
            energyDrainRate: 0.8,
            bloomIntensity: 0.9,
            vignetteStrength: 0.3,
            chromaticAberration: 0.0015,
            minDuration: 45000,
            maxDuration: 90000,
            transitionTime: 7000
        });
    }

    /**
     * Update mood system
     */
    update(deltaTime: number): void {
        if (!this.enabled) return;

        const now = Date.now();

        // Handle transition
        if (this.transitionProgress < 1.0) {
            const config = this.getMoodConfig(this.targetMood);
            const transitionSpeed = 1.0 / (config.transitionTime / 1000);
            this.transitionProgress = Math.min(1.0, this.transitionProgress + deltaTime * transitionSpeed);

            if (this.transitionProgress >= 1.0) {
                this.currentMood = this.targetMood;
                this.moodStartTime = now;
                console.log(`🎭 Mood fully transitioned to: ${this.currentMood}`);
                this.emit('moodChanged', this.currentMood);
            }
        }

        // Check if mood duration expired and auto-transition is enabled
        if (this.autoTransition && this.transitionProgress >= 1.0) {
            const elapsed = now - this.moodStartTime;
            if (elapsed >= this.moodDuration) {
                this.transitionToRandomMood();
            }
        }
    }

    /**
     * Transition to a specific mood
     */
    transitionTo(mood: WorldMood): void {
        if (this.targetMood === mood) return;

        console.log(`🎭 Transitioning mood from ${this.currentMood} to ${mood}`);

        this.targetMood = mood;
        this.transitionProgress = 0.0;

        const config = this.getMoodConfig(mood);
        this.moodDuration = config.minDuration +
            Math.random() * (config.maxDuration - config.minDuration);

        this.emit('moodTransitionStart', { from: this.currentMood, to: mood });
    }

    /**
     * Transition to a random mood (excluding current)
     */
    transitionToRandomMood(): void {
        const moods = Object.values(WorldMood).filter(m => m !== this.currentMood);
        const randomMood = moods[Math.floor(Math.random() * moods.length)]!;
        this.transitionTo(randomMood);
    }

    /**
     * Get current mood configuration (interpolated during transition)
     */
    getCurrentMoodConfig(): MoodConfig {
        if (this.transitionProgress >= 1.0) {
            return this.getMoodConfig(this.currentMood);
        }

        // Interpolate between current and target mood
        const fromConfig = this.getMoodConfig(this.currentMood);
        const toConfig = this.getMoodConfig(this.targetMood);
        const t = this.transitionProgress;

        return {
            name: toConfig.name,
            description: toConfig.description,
            colorGrading: {
                primary: new Color().lerpColors(fromConfig.colorGrading.primary, toConfig.colorGrading.primary, t),
                secondary: new Color().lerpColors(fromConfig.colorGrading.secondary, toConfig.colorGrading.secondary, t),
                saturation: this.lerp(fromConfig.colorGrading.saturation, toConfig.colorGrading.saturation, t),
                brightness: this.lerp(fromConfig.colorGrading.brightness, toConfig.colorGrading.brightness, t),
                contrast: this.lerp(fromConfig.colorGrading.contrast, toConfig.colorGrading.contrast, t)
            },
            musicTempo: this.lerp(fromConfig.musicTempo, toConfig.musicTempo, t),
            musicIntensity: this.lerp(fromConfig.musicIntensity, toConfig.musicIntensity, t),
            ambientVolume: this.lerp(fromConfig.ambientVolume, toConfig.ambientVolume, t),
            caSpeed: this.lerp(fromConfig.caSpeed, toConfig.caSpeed, t),
            voxelLifespan: this.lerp(fromConfig.voxelLifespan, toConfig.voxelLifespan, t),
            energyDrainRate: this.lerp(fromConfig.energyDrainRate, toConfig.energyDrainRate, t),
            bloomIntensity: this.lerp(fromConfig.bloomIntensity, toConfig.bloomIntensity, t),
            vignetteStrength: this.lerp(fromConfig.vignetteStrength, toConfig.vignetteStrength, t),
            chromaticAberration: this.lerp(fromConfig.chromaticAberration, toConfig.chromaticAberration, t),
            minDuration: toConfig.minDuration,
            maxDuration: toConfig.maxDuration,
            transitionTime: toConfig.transitionTime
        };
    }

    private lerp(a: number, b: number, t: number): number {
        return a + (b - a) * t;
    }

    /**
     * Get mood configuration
     */
    getMoodConfig(mood: WorldMood): MoodConfig {
        return this.moodConfigs.get(mood)!;
    }

    /**
     * Get current mood
     */
    getCurrentMood(): WorldMood {
        return this.currentMood;
    }

    /**
     * Get target mood (if transitioning)
     */
    getTargetMood(): WorldMood {
        return this.targetMood;
    }

    /**
     * Get transition progress (0-1)
     */
    getTransitionProgress(): number {
        return this.transitionProgress;
    }

    /**
     * Is currently transitioning?
     */
    isTransitioning(): boolean {
        return this.transitionProgress < 1.0;
    }

    /**
     * Set auto-transition
     */
    setAutoTransition(enabled: boolean): void {
        this.autoTransition = enabled;
    }

    /**
     * Set enabled
     */
    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
    }

    isEnabled(): boolean {
        return this.enabled;
    }

    /**
     * Get all available moods
     */
    getAllMoods(): WorldMood[] {
        return Object.values(WorldMood);
    }

    /**
     * Trigger mood based on game events
     */
    triggerMoodFromEvent(event: string): void {
        switch (event) {
            case 'player_death':
                this.transitionTo(WorldMood.MELANCHOLIC);
                break;
            case 'achievement_unlocked':
                this.transitionTo(WorldMood.EUPHORIC);
                break;
            case 'wave_start':
                this.transitionTo(WorldMood.TENSE);
                break;
            case 'pattern_discovered':
                this.transitionTo(WorldMood.MYSTERIOUS);
                break;
            case 'chaos_event':
                this.transitionTo(WorldMood.CHAOTIC);
                break;
            case 'safe_zone':
                this.transitionTo(WorldMood.TRANQUIL);
                break;
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
            currentMood: this.currentMood,
            targetMood: this.targetMood,
            transitionProgress: this.transitionProgress,
            moodStartTime: this.moodStartTime,
            moodDuration: this.moodDuration,
            enabled: this.enabled,
            autoTransition: this.autoTransition
        };
    }

    deserialize(data: any): void {
        if (data.currentMood) this.currentMood = data.currentMood;
        if (data.targetMood) this.targetMood = data.targetMood;
        if (data.transitionProgress !== undefined) this.transitionProgress = data.transitionProgress;
        if (data.moodStartTime) this.moodStartTime = data.moodStartTime;
        if (data.moodDuration) this.moodDuration = data.moodDuration;
        if (data.enabled !== undefined) this.enabled = data.enabled;
        if (data.autoTransition !== undefined) this.autoTransition = data.autoTransition;
    }
}
