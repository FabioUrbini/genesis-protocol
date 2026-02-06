/**
 * SoundEffects.ts
 * Sound effects system with procedural generation
 */

export enum SFXType {
  VoxelPlace = 'voxel_place',
  VoxelBreak = 'voxel_break',
  VoxelPick = 'voxel_pick',
  ItemCollect = 'item_collect',
  MenuOpen = 'menu_open',
  MenuClose = 'menu_close',
  ButtonClick = 'button_click',
  ButtonHover = 'button_hover',
  TimeRewind = 'time_rewind',
  TimeSpeedUp = 'time_speed_up',
  TimeSlowDown = 'time_slow_down',
  TimePause = 'time_pause',
  EnergyLow = 'energy_low',
  OxygenLow = 'oxygen_low',
  Respawn = 'respawn',
  PortalOpen = 'portal_open',
  PatternSpawn = 'pattern_spawn',
  StructureBuild = 'structure_build',
  Footstep = 'footstep',
  Jump = 'jump',
  Land = 'land'
}

export interface SFXConfig {
  volume?: number;
  pitch?: number;
  randomizePitch?: boolean;
  pitchVariation?: number;
}

export class SoundEffects {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isInitialized: boolean = false;
  private volume: number = 0.5;
  private cache: Map<SFXType, AudioBuffer> = new Map();

  constructor() {}

  /**
   * Initialize audio context
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.audioContext.destination);

      this.isInitialized = true;
      console.log('SoundEffects initialized');
    } catch (error) {
      console.error('Failed to initialize SoundEffects:', error);
    }
  }

  /**
   * Play a sound effect
   */
  play(type: SFXType, config: SFXConfig = {}): void {
    if (!this.isInitialized || !this.audioContext) return;

    const {
      volume = 1.0,
      pitch = 1.0,
      randomizePitch = true,
      pitchVariation = 0.1
    } = config;

    const actualPitch = randomizePitch
      ? pitch * (1 + (Math.random() * 2 - 1) * pitchVariation)
      : pitch;

    this.generateAndPlay(type, volume, actualPitch);
  }

  /**
   * Generate and play procedural sound
   */
  private generateAndPlay(type: SFXType, volume: number, pitch: number): void {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;

    switch (type) {
      case SFXType.VoxelPlace:
        this.playVoxelPlace(now, volume, pitch);
        break;
      case SFXType.VoxelBreak:
        this.playVoxelBreak(now, volume, pitch);
        break;
      case SFXType.VoxelPick:
        this.playVoxelPick(now, volume, pitch);
        break;
      case SFXType.ItemCollect:
        this.playItemCollect(now, volume, pitch);
        break;
      case SFXType.MenuOpen:
        this.playMenuOpen(now, volume, pitch);
        break;
      case SFXType.MenuClose:
        this.playMenuClose(now, volume, pitch);
        break;
      case SFXType.ButtonClick:
        this.playButtonClick(now, volume, pitch);
        break;
      case SFXType.ButtonHover:
        this.playButtonHover(now, volume, pitch);
        break;
      case SFXType.TimeRewind:
        this.playTimeRewind(now, volume, pitch);
        break;
      case SFXType.TimePause:
        this.playTimePause(now, volume, pitch);
        break;
      case SFXType.EnergyLow:
        this.playEnergyLow(now, volume, pitch);
        break;
      case SFXType.Jump:
        this.playJump(now, volume, pitch);
        break;
      case SFXType.Land:
        this.playLand(now, volume, pitch);
        break;
      case SFXType.PortalOpen:
        this.playPortalOpen(now, volume, pitch);
        break;
      case SFXType.PatternSpawn:
        this.playPatternSpawn(now, volume, pitch);
        break;
    }
  }

  private playVoxelPlace(time: number, volume: number, pitch: number): void {
    if (!this.audioContext) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'square';
    osc.frequency.value = 440 * pitch;

    gain.gain.setValueAtTime(volume * 0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(time);
    osc.stop(time + 0.1);
  }

  private playVoxelBreak(time: number, volume: number, pitch: number): void {
    if (!this.audioContext) return;

    // Noise burst
    const bufferSize = this.audioContext.sampleRate * 0.15;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = pitch;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 200;

    const gain = this.audioContext.createGain();
    gain.gain.value = volume * 0.4;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);

    source.start(time);
  }

  private playVoxelPick(time: number, volume: number, pitch: number): void {
    if (!this.audioContext) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880 * pitch, time);
    osc.frequency.exponentialRampToValueAtTime(440 * pitch, time + 0.05);

    gain.gain.setValueAtTime(volume * 0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(time);
    osc.stop(time + 0.05);
  }

  private playItemCollect(time: number, volume: number, pitch: number): void {
    if (!this.audioContext) return;

    // Ascending arpeggio
    const notes = [1, 1.25, 1.5, 2];
    notes.forEach((mult, i) => {
      const osc = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();

      osc.type = 'sine';
      osc.frequency.value = 523.25 * mult * pitch; // C5

      const startTime = time + i * 0.05;
      gain.gain.setValueAtTime(volume * 0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(startTime);
      osc.stop(startTime + 0.1);
    });
  }

  private playMenuOpen(time: number, volume: number, pitch: number): void {
    if (!this.audioContext) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300 * pitch, time);
    osc.frequency.exponentialRampToValueAtTime(600 * pitch, time + 0.2);

    gain.gain.setValueAtTime(volume * 0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(time);
    osc.stop(time + 0.2);
  }

  private playMenuClose(time: number, volume: number, pitch: number): void {
    if (!this.audioContext) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600 * pitch, time);
    osc.frequency.exponentialRampToValueAtTime(300 * pitch, time + 0.15);

    gain.gain.setValueAtTime(volume * 0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(time);
    osc.stop(time + 0.15);
  }

  private playButtonClick(time: number, volume: number, pitch: number): void {
    if (!this.audioContext) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'square';
    osc.frequency.value = 800 * pitch;

    gain.gain.setValueAtTime(volume * 0.15, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(time);
    osc.stop(time + 0.05);
  }

  private playButtonHover(time: number, volume: number, pitch: number): void {
    if (!this.audioContext) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sine';
    osc.frequency.value = 1000 * pitch;

    gain.gain.setValueAtTime(volume * 0.1, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.03);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(time);
    osc.stop(time + 0.03);
  }

  private playTimeRewind(time: number, volume: number, pitch: number): void {
    if (!this.audioContext) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800 * pitch, time);
    osc.frequency.exponentialRampToValueAtTime(200 * pitch, time + 0.4);

    gain.gain.setValueAtTime(volume * 0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.4);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(time);
    osc.stop(time + 0.4);
  }

  private playTimePause(time: number, volume: number, pitch: number): void {
    if (!this.audioContext) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'triangle';
    osc.frequency.value = 220 * pitch;

    gain.gain.setValueAtTime(volume * 0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(time);
    osc.stop(time + 0.3);
  }

  private playEnergyLow(time: number, volume: number, pitch: number): void {
    if (!this.audioContext) return;

    // Pulsing low frequency warning
    for (let i = 0; i < 3; i++) {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = 'sine';
      osc.frequency.value = 150 * pitch;

      const startTime = time + i * 0.2;
      gain.gain.setValueAtTime(volume * 0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(startTime);
      osc.stop(startTime + 0.15);
    }
  }

  private playJump(time: number, volume: number, pitch: number): void {
    if (!this.audioContext) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300 * pitch, time);
    osc.frequency.exponentialRampToValueAtTime(500 * pitch, time + 0.1);

    gain.gain.setValueAtTime(volume * 0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(time);
    osc.stop(time + 0.1);
  }

  private playLand(time: number, volume: number, pitch: number): void {
    if (!this.audioContext) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200 * pitch, time);
    osc.frequency.exponentialRampToValueAtTime(100 * pitch, time + 0.15);

    gain.gain.setValueAtTime(volume * 0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(time);
    osc.stop(time + 0.15);
  }

  private playPortalOpen(time: number, volume: number, pitch: number): void {
    if (!this.audioContext) return;

    // Whoosh with frequency sweep
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100 * pitch, time);
    osc.frequency.exponentialRampToValueAtTime(1000 * pitch, time + 0.6);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(500, time);
    filter.frequency.exponentialRampToValueAtTime(2000, time + 0.6);
    filter.Q.value = 5;

    gain.gain.setValueAtTime(volume * 0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.6);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(time);
    osc.stop(time + 0.6);
  }

  private playPatternSpawn(time: number, volume: number, pitch: number): void {
    if (!this.audioContext) return;

    // Crystalline sparkle
    const notes = [1, 1.5, 2, 3];
    notes.forEach((mult, i) => {
      const osc = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();

      osc.type = 'sine';
      osc.frequency.value = 1000 * mult * pitch;

      const startTime = time + i * 0.03;
      gain.gain.setValueAtTime(volume * 0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(startTime);
      osc.stop(startTime + 0.2);
    });
  }

  /**
   * Set master volume
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume;
    }
  }

  /**
   * Get master volume
   */
  getVolume(): number {
    return this.volume;
  }

  /**
   * Check if initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Dispose
   */
  dispose(): void {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    this.cache.clear();
  }
}
