/**
 * MusicSystem.ts
 * Procedural music system with adaptive layers
 */

export interface MusicLayer {
  id: string;
  oscillators: OscillatorNode[];
  gainNode: GainNode;
  enabled: boolean;
  volume: number;
}

export interface MusicConfig {
  tempo: number; // BPM
  key: string; // Musical key
  scale: number[]; // Scale intervals
  intensity: number; // 0-1
}

export class MusicSystem {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private isInitialized: boolean = false;
  private isPlaying: boolean = false;
  private volume: number = 0.4;
  private layers: Map<string, MusicLayer> = new Map();
  private config: MusicConfig;
  private currentBeat: number = 0;
  private beatInterval: number | null = null;

  constructor() {
    this.config = {
      tempo: 90,
      key: 'A',
      scale: [0, 2, 3, 5, 7, 8, 10], // A minor scale
      intensity: 0.5
    };
  }

  /**
   * Initialize audio context
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Create compressor for dynamics
      this.compressor = this.audioContext.createDynamicsCompressor();
      this.compressor.threshold.value = -20;
      this.compressor.knee.value = 10;
      this.compressor.ratio.value = 4;
      this.compressor.attack.value = 0.003;
      this.compressor.release.value = 0.25;

      // Create master gain
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = this.volume;

      // Connect chain
      this.compressor.connect(this.masterGain);
      this.masterGain.connect(this.audioContext.destination);

      this.isInitialized = true;
      console.log('MusicSystem initialized');
    } catch (error) {
      console.error('Failed to initialize MusicSystem:', error);
    }
  }

  /**
   * Start music playback
   */
  start(): void {
    if (!this.isInitialized || this.isPlaying || !this.audioContext) return;

    this.isPlaying = true;
    this.currentBeat = 0;

    // Create layers
    this.createBassLayer();
    this.createPadLayer();
    this.createArpeggioLayer();
    this.createPercussionLayer();

    // Start beat counter
    const beatDuration = (60 / this.config.tempo) * 1000;
    this.beatInterval = window.setInterval(() => {
      this.currentBeat++;
      this.onBeat();
    }, beatDuration);
  }

  /**
   * Stop music playback
   */
  stop(): void {
    if (!this.isPlaying) return;

    this.layers.forEach(layer => {
      layer.oscillators.forEach(osc => {
        osc.stop();
      });
    });

    this.layers.clear();

    if (this.beatInterval !== null) {
      clearInterval(this.beatInterval);
      this.beatInterval = null;
    }

    this.isPlaying = false;
  }

  /**
   * Create bass layer
   */
  private createBassLayer(): void {
    if (!this.audioContext || !this.compressor) return;

    const layer: MusicLayer = {
      id: 'bass',
      oscillators: [],
      gainNode: this.audioContext.createGain(),
      enabled: true,
      volume: 0.4
    };

    layer.gainNode.gain.value = layer.volume;
    layer.gainNode.connect(this.compressor);

    // Create bass oscillator
    const osc = this.audioContext.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = this.getFrequency(0, 2); // Root note, 2nd octave

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 200;
    filter.Q.value = 2;

    osc.connect(filter);
    filter.connect(layer.gainNode);
    osc.start();

    layer.oscillators.push(osc);
    this.layers.set('bass', layer);
  }

  /**
   * Create pad layer
   */
  private createPadLayer(): void {
    if (!this.audioContext || !this.compressor) return;

    const layer: MusicLayer = {
      id: 'pad',
      oscillators: [],
      gainNode: this.audioContext.createGain(),
      enabled: true,
      volume: 0.15
    };

    layer.gainNode.gain.value = layer.volume;
    layer.gainNode.connect(this.compressor);

    // Create chord (root, third, fifth)
    const chordNotes = [0, 2, 4]; // Indices in scale
    chordNotes.forEach((noteIndex, i) => {
      const osc = this.audioContext!.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = this.getFrequency(noteIndex, 4); // 4th octave

      // Slight detuning for richness
      osc.detune.value = (i - 1) * 3;

      osc.connect(layer.gainNode);
      osc.start();
      layer.oscillators.push(osc);
    });

    this.layers.set('pad', layer);
  }

  /**
   * Create arpeggio layer
   */
  private createArpeggioLayer(): void {
    if (!this.audioContext || !this.compressor) return;

    const layer: MusicLayer = {
      id: 'arpeggio',
      oscillators: [],
      gainNode: this.audioContext.createGain(),
      enabled: true,
      volume: 0.12
    };

    layer.gainNode.gain.value = 0; // Start silent, will be triggered on beat
    layer.gainNode.connect(this.compressor);

    this.layers.set('arpeggio', layer);
  }

  /**
   * Create percussion layer
   */
  private createPercussionLayer(): void {
    if (!this.audioContext || !this.compressor) return;

    const layer: MusicLayer = {
      id: 'percussion',
      oscillators: [],
      gainNode: this.audioContext.createGain(),
      enabled: true,
      volume: 0.1
    };

    layer.gainNode.gain.value = 0; // Start silent, will be triggered on beat
    layer.gainNode.connect(this.compressor);

    this.layers.set('percussion', layer);
  }

  /**
   * Called on each beat
   */
  private onBeat(): void {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;

    // Trigger arpeggio note
    if (this.currentBeat % 2 === 0) {
      this.triggerArpeggioNote(now);
    }

    // Trigger percussion
    if (this.currentBeat % 4 === 0) {
      this.triggerKick(now);
    }
    if (this.currentBeat % 4 === 2) {
      this.triggerSnare(now);
    }
  }

  /**
   * Trigger arpeggio note
   */
  private triggerArpeggioNote(time: number): void {
    if (!this.audioContext) return;

    const layer = this.layers.get('arpeggio');
    if (!layer || !layer.enabled) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    const noteIndex = (this.currentBeat / 2) % this.config.scale.length;
    osc.type = 'sine';
    osc.frequency.value = this.getFrequency(noteIndex, 5);

    gain.gain.setValueAtTime(layer.volume, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);

    osc.connect(gain);
    gain.connect(layer.gainNode);

    osc.start(time);
    osc.stop(time + 0.3);
  }

  /**
   * Trigger kick drum
   */
  private triggerKick(time: number): void {
    if (!this.audioContext) return;

    const layer = this.layers.get('percussion');
    if (!layer || !layer.enabled) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.1);

    gain.gain.setValueAtTime(layer.volume * 2, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);

    osc.connect(gain);
    gain.connect(layer.gainNode);

    osc.start(time);
    osc.stop(time + 0.3);
  }

  /**
   * Trigger snare drum
   */
  private triggerSnare(time: number): void {
    if (!this.audioContext) return;

    const layer = this.layers.get('percussion');
    if (!layer || !layer.enabled) return;

    // Create noise
    const bufferSize = this.audioContext.sampleRate * 0.1;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.5));
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1000;

    const gain = this.audioContext.createGain();
    gain.gain.value = layer.volume * 1.5;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(layer.gainNode);

    source.start(time);
  }

  /**
   * Get frequency for note
   */
  private getFrequency(scaleIndex: number, octave: number): number {
    const A4 = 440;
    const baseNote = this.getKeyOffset();
    const scaleOffset = this.config.scale[scaleIndex % this.config.scale.length];
    const semitones = baseNote + scaleOffset + (octave - 4) * 12;

    return A4 * Math.pow(2, semitones / 12);
  }

  /**
   * Get offset for musical key
   */
  private getKeyOffset(): number {
    const keys: Record<string, number> = {
      'C': -9, 'C#': -8, 'D': -7, 'D#': -6,
      'E': -5, 'F': -4, 'F#': -3, 'G': -2,
      'G#': -1, 'A': 0, 'A#': 1, 'B': 2
    };
    return keys[this.config.key] || 0;
  }

  /**
   * Update music configuration
   */
  updateConfig(config: Partial<MusicConfig>): void {
    this.config = { ...this.config, ...config };

    // Update layers based on new config
    if (this.isPlaying) {
      // Could implement smooth transitions here
    }
  }

  /**
   * Enable/disable layer
   */
  setLayerEnabled(layerId: string, enabled: boolean): void {
    const layer = this.layers.get(layerId);
    if (layer) {
      layer.enabled = enabled;
      if (!enabled) {
        layer.gainNode.gain.value = 0;
      } else {
        layer.gainNode.gain.value = layer.volume;
      }
    }
  }

  /**
   * Set layer volume
   */
  setLayerVolume(layerId: string, volume: number): void {
    const layer = this.layers.get(layerId);
    if (layer) {
      layer.volume = Math.max(0, Math.min(1, volume));
      if (layer.enabled) {
        layer.gainNode.gain.value = layer.volume;
      }
    }
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
  fadeIn(duration: number = 3.0): void {
    if (!this.masterGain || !this.audioContext) return;

    const now = this.audioContext.currentTime;
    this.masterGain.gain.setValueAtTime(0, now);
    this.masterGain.gain.linearRampToValueAtTime(this.volume, now + duration);
  }

  /**
   * Fade out
   */
  fadeOut(duration: number = 3.0): void {
    if (!this.masterGain || !this.audioContext) return;

    const now = this.audioContext.currentTime;
    this.masterGain.gain.linearRampToValueAtTime(0, now + duration);
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
