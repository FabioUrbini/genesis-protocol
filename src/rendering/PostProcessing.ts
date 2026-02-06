import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';

/**
 * Post-processing configuration
 */
export interface PostProcessingConfig {
  bloomEnabled: boolean;
  bloomStrength: number;
  bloomThreshold: number;
  bloomRadius: number;
  fxaaEnabled: boolean;
  vignetteEnabled: boolean;
  vignetteIntensity: number;
  chromaticAberrationEnabled: boolean;
  chromaticAberrationStrength: number;
}

/**
 * Default post-processing configuration
 */
export const DEFAULT_POST_PROCESSING_CONFIG: PostProcessingConfig = {
  bloomEnabled: true,
  bloomStrength: 1.5,
  bloomThreshold: 0.2,
  bloomRadius: 0.8,
  fxaaEnabled: true,
  vignetteEnabled: true,
  vignetteIntensity: 0.4,
  chromaticAberrationEnabled: false,
  chromaticAberrationStrength: 0.003,
};

/**
 * Custom vignette shader
 */
const VignetteShader = {
  uniforms: {
    tDiffuse: { value: null },
    intensity: { value: 0.4 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float intensity;
    varying vec2 vUv;
    
    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      vec2 center = vec2(0.5, 0.5);
      float dist = distance(vUv, center);
      float vignette = smoothstep(0.7, 0.4, dist);
      vignette = mix(1.0, vignette, intensity);
      gl_FragColor = vec4(texel.rgb * vignette, texel.a);
    }
  `,
};

/**
 * Custom chromatic aberration shader
 */
const ChromaticAberrationShader = {
  uniforms: {
    tDiffuse: { value: null },
    strength: { value: 0.003 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float strength;
    varying vec2 vUv;
    
    void main() {
      vec2 direction = vUv - 0.5;
      float dist = length(direction);
      
      vec2 offset = direction * dist * strength;
      
      float r = texture2D(tDiffuse, vUv + offset).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv - offset).b;
      
      gl_FragColor = vec4(r, g, b, 1.0);
    }
  `,
};

/**
 * PostProcessingManager - Handles all post-processing effects
 */
export class PostProcessingManager {
  private composer: EffectComposer;
  private renderPass: RenderPass;
  private bloomPass: UnrealBloomPass;
  private fxaaPass: ShaderPass;
  private vignettePass: ShaderPass;
  private chromaticAberrationPass: ShaderPass;
  private config: PostProcessingConfig;
  private renderer: THREE.WebGLRenderer;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    config: Partial<PostProcessingConfig> = {}
  ) {
    this.renderer = renderer;
    this.config = { ...DEFAULT_POST_PROCESSING_CONFIG, ...config };

    // Create composer
    this.composer = new EffectComposer(renderer);

    // Render pass (base scene)
    this.renderPass = new RenderPass(scene, camera);
    this.composer.addPass(this.renderPass);

    // Bloom pass
    const resolution = new THREE.Vector2(window.innerWidth, window.innerHeight);
    this.bloomPass = new UnrealBloomPass(
      resolution,
      this.config.bloomStrength,
      this.config.bloomRadius,
      this.config.bloomThreshold
    );
    this.bloomPass.enabled = this.config.bloomEnabled;
    this.composer.addPass(this.bloomPass);

    // FXAA pass (anti-aliasing)
    this.fxaaPass = new ShaderPass(FXAAShader);
    const pixelRatio = renderer.getPixelRatio();
    const fxaaResolution = this.fxaaPass.uniforms['resolution'];
    if (fxaaResolution) {
      fxaaResolution.value.set(
        1 / (window.innerWidth * pixelRatio),
        1 / (window.innerHeight * pixelRatio)
      );
    }
    this.fxaaPass.enabled = this.config.fxaaEnabled;
    this.composer.addPass(this.fxaaPass);

    // Chromatic aberration pass
    this.chromaticAberrationPass = new ShaderPass(ChromaticAberrationShader);
    const caStrength = this.chromaticAberrationPass.uniforms['strength'];
    if (caStrength) {
      caStrength.value = this.config.chromaticAberrationStrength;
    }
    this.chromaticAberrationPass.enabled = this.config.chromaticAberrationEnabled;
    this.composer.addPass(this.chromaticAberrationPass);

    // Vignette pass
    this.vignettePass = new ShaderPass(VignetteShader);
    const vigIntensity = this.vignettePass.uniforms['intensity'];
    if (vigIntensity) {
      vigIntensity.value = this.config.vignetteIntensity;
    }
    this.vignettePass.enabled = this.config.vignetteEnabled;
    this.composer.addPass(this.vignettePass);

    // Handle resize
    window.addEventListener('resize', () => this.onWindowResize());
  }

  /**
   * Render with post-processing
   */
  public render(): void {
    this.composer.render();
  }

  /**
   * Set bloom enabled
   */
  public setBloomEnabled(enabled: boolean): void {
    this.config.bloomEnabled = enabled;
    this.bloomPass.enabled = enabled;
  }

  /**
   * Set bloom strength
   */
  public setBloomStrength(strength: number): void {
    this.config.bloomStrength = strength;
    this.bloomPass.strength = strength;
  }

  /**
   * Set bloom threshold
   */
  public setBloomThreshold(threshold: number): void {
    this.config.bloomThreshold = threshold;
    this.bloomPass.threshold = threshold;
  }

  /**
   * Set bloom radius
   */
  public setBloomRadius(radius: number): void {
    this.config.bloomRadius = radius;
    this.bloomPass.radius = radius;
  }

  /**
   * Set FXAA enabled
   */
  public setFXAAEnabled(enabled: boolean): void {
    this.config.fxaaEnabled = enabled;
    this.fxaaPass.enabled = enabled;
  }

  /**
   * Set vignette enabled
   */
  public setVignetteEnabled(enabled: boolean): void {
    this.config.vignetteEnabled = enabled;
    this.vignettePass.enabled = enabled;
  }

  /**
   * Set vignette intensity
   */
  public setVignetteIntensity(intensity: number): void {
    this.config.vignetteIntensity = intensity;
    const uniform = this.vignettePass.uniforms['intensity'];
    if (uniform) {
      uniform.value = intensity;
    }
  }

  /**
   * Set chromatic aberration enabled
   */
  public setChromaticAberrationEnabled(enabled: boolean): void {
    this.config.chromaticAberrationEnabled = enabled;
    this.chromaticAberrationPass.enabled = enabled;
  }

  /**
   * Set chromatic aberration strength
   */
  public setChromaticAberrationStrength(strength: number): void {
    this.config.chromaticAberrationStrength = strength;
    const uniform = this.chromaticAberrationPass.uniforms['strength'];
    if (uniform) {
      uniform.value = strength;
    }
  }

  /**
   * Toggle all post-processing
   */
  public setEnabled(enabled: boolean): void {
    this.bloomPass.enabled = enabled && this.config.bloomEnabled;
    this.fxaaPass.enabled = enabled && this.config.fxaaEnabled;
    this.vignettePass.enabled = enabled && this.config.vignetteEnabled;
    this.chromaticAberrationPass.enabled = enabled && this.config.chromaticAberrationEnabled;
  }

  /**
   * Get current configuration
   */
  public getConfig(): PostProcessingConfig {
    return { ...this.config };
  }

  /**
   * Update camera reference (for when camera changes)
   */
  public updateCamera(camera: THREE.Camera): void {
    this.renderPass.camera = camera;
  }

  /**
   * Update scene reference (for when scene changes)
   */
  public updateScene(scene: THREE.Scene): void {
    this.renderPass.scene = scene;
  }

  /**
   * Handle window resize
   */
  private onWindowResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const pixelRatio = this.renderer.getPixelRatio();

    this.composer.setSize(width, height);
    this.bloomPass.resolution.set(width, height);
    const fxaaResolution = this.fxaaPass.uniforms['resolution'];
    if (fxaaResolution) {
      fxaaResolution.value.set(
        1 / (width * pixelRatio),
        1 / (height * pixelRatio)
      );
    }
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    this.composer.dispose();
    window.removeEventListener('resize', () => this.onWindowResize());
  }
}
