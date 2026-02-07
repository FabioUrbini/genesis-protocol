/**
 * AudioReactor.ts
 * Procedural soundscape that reacts to game state
 */

export interface AudioState {
  caActivity: number; // 0-1, how active the CA is
  playerEnergy: number; // 0-1
  playerOxygen: number; // 0-1
  biomeType: string;
  timeSpeed: number;
  voxelDensity: number; // 0-1
  dangerLevel: number; // 0-1
}

export class AudioReactor {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private lowFreqOsc: OscillatorNode | null = null;
  private midFreqOsc: OscillatorNode | null = null;
  private highFreqOsc: OscillatorNode | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private reverbNode: ConvolverNode | null = null;

  private isInitialized: boolean = false;
  private isPlaying: boolean = false;
  private volume: number = 0.3;

  private currentState: AudioState = {
    caActivity: 0.5,
    playerEnergy: 1.0,
    playerOxygen: 1.0,
    biomeType: 'default',
    timeSpeed: 1.0,
    voxelDensity: 0.5,
    dangerLevel: 0.0
  };

  constructor() {
    // Audio initialization requires user interaction
  }

  /**
   * Initialize audio context (must be called after user interaction)
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Create master gain
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.audioContext.destination);

      // Create filter for tonal control
      this.filterNode = this.audioContext.createBiquadFilter();
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.value = 2000;
      this.filterNode.Q.value = 1.0;
      this.filterNode.connect(this.masterGain);

      // Create reverb
      await this.createReverb();

      this.isInitialized = true;
      console.log('AudioReactor initialized');
    } catch (error) {
      console.error('Failed to initialize AudioReactor:', error);
    }
  }

  /**
   * Create reverb impulse response
   */
  private async createReverb(): Promise<void> {
    if (!this.audioContext) return;

    this.reverbNode = this.audioContext.createConvolver();

    // Generate impulse response
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * 2; // 2 seconds
    const impulse = this.audioContext.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
      }
    }

    this.reverbNode.buffer = impulse;
  }

  /**
   * Start the procedural soundscape
   */
  start(): void {
    if (!this.isInitialized || this.isPlaying || !this.audioContext) return;

    // Create low frequency drone (base atmosphere)
    this.lowFreqOsc = this.audioContext.createOscillator();
    this.lowFreqOsc.type = 'sine';
    this.lowFreqOsc.frequency.value = 55; // A1
    const lowGain = this.audioContext.createGain();
    lowGain.gain.value = 0.2;
    this.lowFreqOsc.connect(lowGain);
    lowGain.connect(this.filterNode!);

    // Create mid frequency oscillator (CA activity)
    this.midFreqOsc = this.audioContext.createOscillator();
    this.midFreqOsc.type = 'triangle';
    this.midFreqOsc.frequency.value = 220; // A3
    const midGain = this.audioContext.createGain();
    midGain.gain.value = 0.1;
    this.midFreqOsc.connect(midGain);
    midGain.connect(this.filterNode!);

    // Create high frequency shimmer (energy/oxygen levels)
    this.highFreqOsc = this.audioContext.createOscillator();
    this.highFreqOsc.type = 'sine';
    this.highFreqOsc.frequency.value = 880; // A5
    const highGain = this.audioContext.createGain();
    highGain.gain.value = 0.05;
    this.highFreqOsc.connect(highGain);
    highGain.connect(this.filterNode!);

    // Create noise for texture
    this.createNoise();

    this.lowFreqOsc.start();
    this.midFreqOsc.start();
    this.highFreqOsc.start();

    this.isPlaying = true;
    this.updateAudio();
  }

  /**
   * Create noise generator
   */
  private createNoise(): void {
    if (!this.audioContext) return;

    const bufferSize = this.audioContext.sampleRate * 2;
    const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.noiseNode = this.audioContext.createBufferSource();
    this.noiseNode.buffer = noiseBuffer;
    this.noiseNode.loop = true;

    const noiseGain = this.audioContext.createGain();
    noiseGain.gain.value = 0.02;

    const noiseFilter = this.audioContext.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 1000;
    noiseFilter.Q.value = 0.5;

    this.noiseNode.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.filterNode!);

    this.noiseNode.start();
  }

  /**
   * Stop the soundscape
   */
  stop(): void {
    if (!this.isPlaying) return;

    if (this.lowFreqOsc) this.lowFreqOsc.stop();
    if (this.midFreqOsc) this.midFreqOsc.stop();
    if (this.highFreqOsc) this.highFreqOsc.stop();
    if (this.noiseNode) this.noiseNode.stop();

    this.lowFreqOsc = null;
    this.midFreqOsc = null;
    this.highFreqOsc = null;
    this.noiseNode = null;

    this.isPlaying = false;
  }

  /**
   * Update audio based on game state
   */
  updateState(state: Partial<AudioState>): void {
    this.currentState = { ...this.currentState, ...state };
    this.updateAudio();
  }

  /**
   * Update audio parameters based on current state
   */
  private updateAudio(): void {
    if (!this.isPlaying || !this.audioContext) return;

    const now = this.audioContext.currentTime;
    const rampTime = 0.5; // Smooth transitions

    // Update low frequency based on biome
    if (this.lowFreqOsc) {
      const baseFreq = this.getBiomeBaseFrequency(this.currentState.biomeType);
      this.lowFreqOsc.frequency.exponentialRampToValueAtTime(
        baseFreq,
        now + rampTime
      );
    }

    // Update mid frequency based on CA activity
    if (this.midFreqOsc) {
      const activityFreq = 220 * (1 + this.currentState.caActivity * 0.5);
      this.midFreqOsc.frequency.exponentialRampToValueAtTime(
        activityFreq,
        now + rampTime
      );
    }

    // Update high frequency based on player energy/oxygen
    if (this.highFreqOsc) {
      const avgResource = (this.currentState.playerEnergy + this.currentState.playerOxygen) / 2;
      const shimmerFreq = 440 + avgResource * 880;
      this.highFreqOsc.frequency.exponentialRampToValueAtTime(
        shimmerFreq,
        now + rampTime
      );
    }

    // Update filter based on danger level
    if (this.filterNode) {
      const filterFreq = 2000 - this.currentState.dangerLevel * 1000;
      this.filterNode.frequency.exponentialRampToValueAtTime(
        Math.max(200, filterFreq),
        now + rampTime
      );
    }
  }

  /**
   * Get base frequency for biome
   */
  private getBiomeBaseFrequency(biomeType: string): number {
    const biomeFrequencies: Record<string, number> = {
      'Crystal Caves': 65.41,      // C2
      'Chaos Wastes': 82.41,       // E2
      'Still Gardens': 55.0,       // A1
      'The Pulse': 110.0,          // A2
      'Glider Storms': 146.83,     // D3
      'Void Tears': 46.25,         // F#1
      'Quantum Foam': 98.0,        // G2
      'default': 55.0
    };
    return biomeFrequencies[biomeType] ?? biomeFrequencies['default']!;
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
   * Fade in
   */
  fadeIn(duration: number = 2.0): void {
    if (!this.masterGain || !this.audioContext) return;

    const now = this.audioContext.currentTime;
    this.masterGain.gain.setValueAtTime(0, now);
    this.masterGain.gain.linearRampToValueAtTime(this.volume, now + duration);
  }

  /**
   * Fade out
   */
  fadeOut(duration: number = 2.0): void {
    if (!this.masterGain || !this.audioContext) return;

    const now = this.audioContext.currentTime;
    this.masterGain.gain.linearRampToValueAtTime(0, now + duration);

    setTimeout(() => {
      this.stop();
    }, duration * 1000);
  }

  /**
   * Check if initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Check if playing
   */
  isActive(): boolean {
    return this.isPlaying;
  }

  /**
   * Dispose
   */
  dispose(): void {
    this.stop();
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
}
