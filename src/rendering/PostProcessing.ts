import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { SSAOShader, DepthOfFieldShader, MotionBlurShader, FilmGrainShader, GodRaysShader, ColorGradingShader } from './shaders/PostProcessShaders';

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
  ssaoEnabled: boolean;
  ssaoIntensity: number;
  ssaoRadius: number;
  depthOfFieldEnabled: boolean;
  dofFocus: number;
  dofAperture: number;
  dofMaxBlur: number;
  motionBlurEnabled: boolean;
  motionBlurIntensity: number;
  filmGrainEnabled: boolean;
  filmGrainIntensity: number;
  godRaysEnabled: boolean;
  godRaysExposure: number;
  colorGradingEnabled: boolean;
  colorGradingIntensity: number;
}

/**
 * Default post-processing configuration
 */
export const DEFAULT_POST_PROCESSING_CONFIG: PostProcessingConfig = {
  bloomEnabled: true,
  bloomStrength: 0.4,
  bloomThreshold: 0.6,
  bloomRadius: 0.4,
  fxaaEnabled: true,
  vignetteEnabled: true,
  vignetteIntensity: 0.4,
  chromaticAberrationEnabled: false,
  chromaticAberrationStrength: 0.003,
  ssaoEnabled: true,
  ssaoIntensity: 1.0,
  ssaoRadius: 0.5,
  depthOfFieldEnabled: false,
  dofFocus: 1.0,
  dofAperture: 0.025,
  dofMaxBlur: 1.0,
  motionBlurEnabled: false,
  motionBlurIntensity: 1.0,
  filmGrainEnabled: true,
  filmGrainIntensity: 0.1,
  godRaysEnabled: false,
  godRaysExposure: 0.5,
  colorGradingEnabled: false,
  colorGradingIntensity: 1.0,
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
  private ssaoPass: ShaderPass;
  private depthOfFieldPass: ShaderPass;
  private motionBlurPass: ShaderPass;
  private filmGrainPass: ShaderPass;
  private godRaysPass: ShaderPass;
  private colorGradingPass: ShaderPass;
  private config: PostProcessingConfig;
  private renderer: THREE.WebGLRenderer;
  private time: number = 0;

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

    // SSAO pass
    this.ssaoPass = new ShaderPass(SSAOShader);
    if (this.ssaoPass.uniforms['intensity']) this.ssaoPass.uniforms['intensity'].value = this.config.ssaoIntensity;
    if (this.ssaoPass.uniforms['radius']) this.ssaoPass.uniforms['radius'].value = this.config.ssaoRadius;
    if (this.ssaoPass.uniforms['resolution']) this.ssaoPass.uniforms['resolution'].value.set(window.innerWidth, window.innerHeight);
    this.ssaoPass.enabled = this.config.ssaoEnabled;
    this.composer.addPass(this.ssaoPass);

    // Depth of Field pass
    this.depthOfFieldPass = new ShaderPass(DepthOfFieldShader);
    if (this.depthOfFieldPass.uniforms['focus']) this.depthOfFieldPass.uniforms['focus'].value = this.config.dofFocus;
    if (this.depthOfFieldPass.uniforms['aperture']) this.depthOfFieldPass.uniforms['aperture'].value = this.config.dofAperture;
    if (this.depthOfFieldPass.uniforms['maxBlur']) this.depthOfFieldPass.uniforms['maxBlur'].value = this.config.dofMaxBlur;
    if (this.depthOfFieldPass.uniforms['resolution']) this.depthOfFieldPass.uniforms['resolution'].value.set(window.innerWidth, window.innerHeight);
    this.depthOfFieldPass.enabled = this.config.depthOfFieldEnabled;
    this.composer.addPass(this.depthOfFieldPass);

    // Motion Blur pass
    this.motionBlurPass = new ShaderPass(MotionBlurShader);
    if (this.motionBlurPass.uniforms['velocityFactor']) this.motionBlurPass.uniforms['velocityFactor'].value = this.config.motionBlurIntensity;
    this.motionBlurPass.enabled = this.config.motionBlurEnabled;
    this.composer.addPass(this.motionBlurPass);

    // God Rays pass
    this.godRaysPass = new ShaderPass(GodRaysShader);
    if (this.godRaysPass.uniforms['exposure']) this.godRaysPass.uniforms['exposure'].value = this.config.godRaysExposure;
    this.godRaysPass.enabled = this.config.godRaysEnabled;
    this.composer.addPass(this.godRaysPass);

    // Color Grading pass
    this.colorGradingPass = new ShaderPass(ColorGradingShader);
    if (this.colorGradingPass.uniforms['intensity']) this.colorGradingPass.uniforms['intensity'].value = this.config.colorGradingIntensity;
    this.colorGradingPass.enabled = this.config.colorGradingEnabled;
    this.composer.addPass(this.colorGradingPass);

    // Film Grain pass (should be last for best effect)
    this.filmGrainPass = new ShaderPass(FilmGrainShader);
    if (this.filmGrainPass.uniforms['intensity']) this.filmGrainPass.uniforms['intensity'].value = this.config.filmGrainIntensity;
    this.filmGrainPass.enabled = this.config.filmGrainEnabled;
    this.composer.addPass(this.filmGrainPass);

    // Handle resize
    window.addEventListener('resize', () => this.onWindowResize());
  }

  /**
   * Render with post-processing
   */
  public render(delta?: number): void {
    // Update time for animated effects
    if (delta !== undefined) {
      this.time += delta;
      if (this.filmGrainPass.uniforms['time']) {
        this.filmGrainPass.uniforms['time'].value = this.time;
      }
    }
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
   * Set SSAO enabled
   */
  public setSSAOEnabled(enabled: boolean): void {
    this.config.ssaoEnabled = enabled;
    this.ssaoPass.enabled = enabled;
  }

  /**
   * Set SSAO intensity
   */
  public setSSAOIntensity(intensity: number): void {
    this.config.ssaoIntensity = intensity;
    if (this.ssaoPass.uniforms['intensity']) {
      this.ssaoPass.uniforms['intensity'].value = intensity;
    }
  }

  /**
   * Set SSAO radius
   */
  public setSSAORadius(radius: number): void {
    this.config.ssaoRadius = radius;
    if (this.ssaoPass.uniforms['radius']) {
      this.ssaoPass.uniforms['radius'].value = radius;
    }
  }

  /**
   * Set Depth of Field enabled
   */
  public setDepthOfFieldEnabled(enabled: boolean): void {
    this.config.depthOfFieldEnabled = enabled;
    this.depthOfFieldPass.enabled = enabled;
  }

  /**
   * Set DOF focus distance
   */
  public setDOFFocus(focus: number): void {
    this.config.dofFocus = focus;
    if (this.depthOfFieldPass.uniforms['focus']) {
      this.depthOfFieldPass.uniforms['focus'].value = focus;
    }
  }

  /**
   * Set DOF aperture
   */
  public setDOFAperture(aperture: number): void {
    this.config.dofAperture = aperture;
    if (this.depthOfFieldPass.uniforms['aperture']) {
      this.depthOfFieldPass.uniforms['aperture'].value = aperture;
    }
  }

  /**
   * Set Motion Blur enabled
   */
  public setMotionBlurEnabled(enabled: boolean): void {
    this.config.motionBlurEnabled = enabled;
    this.motionBlurPass.enabled = enabled;
  }

  /**
   * Set Motion Blur intensity
   */
  public setMotionBlurIntensity(intensity: number): void {
    this.config.motionBlurIntensity = intensity;
    if (this.motionBlurPass.uniforms['velocityFactor']) {
      this.motionBlurPass.uniforms['velocityFactor'].value = intensity;
    }
  }

  /**
   * Set Film Grain enabled
   */
  public setFilmGrainEnabled(enabled: boolean): void {
    this.config.filmGrainEnabled = enabled;
    this.filmGrainPass.enabled = enabled;
  }

  /**
   * Set Film Grain intensity
   */
  public setFilmGrainIntensity(intensity: number): void {
    this.config.filmGrainIntensity = intensity;
    if (this.filmGrainPass.uniforms['intensity']) {
      this.filmGrainPass.uniforms['intensity'].value = intensity;
    }
  }

  /**
   * Set God Rays enabled
   */
  public setGodRaysEnabled(enabled: boolean): void {
    this.config.godRaysEnabled = enabled;
    this.godRaysPass.enabled = enabled;
  }

  /**
   * Set God Rays exposure
   */
  public setGodRaysExposure(exposure: number): void {
    this.config.godRaysExposure = exposure;
    if (this.godRaysPass.uniforms['exposure']) {
      this.godRaysPass.uniforms['exposure'].value = exposure;
    }
  }

  /**
   * Set Color Grading enabled
   */
  public setColorGradingEnabled(enabled: boolean): void {
    this.config.colorGradingEnabled = enabled;
    this.colorGradingPass.enabled = enabled;
  }

  /**
   * Set Color Grading intensity
   */
  public setColorGradingIntensity(intensity: number): void {
    this.config.colorGradingIntensity = intensity;
    if (this.colorGradingPass.uniforms['intensity']) {
      this.colorGradingPass.uniforms['intensity'].value = intensity;
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
    this.ssaoPass.enabled = enabled && this.config.ssaoEnabled;
    this.depthOfFieldPass.enabled = enabled && this.config.depthOfFieldEnabled;
    this.motionBlurPass.enabled = enabled && this.config.motionBlurEnabled;
    this.filmGrainPass.enabled = enabled && this.config.filmGrainEnabled;
    this.godRaysPass.enabled = enabled && this.config.godRaysEnabled;
    this.colorGradingPass.enabled = enabled && this.config.colorGradingEnabled;
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

    if (this.ssaoPass.uniforms['resolution']) {
      this.ssaoPass.uniforms['resolution'].value.set(width, height);
    }
    if (this.depthOfFieldPass.uniforms['resolution']) {
      this.depthOfFieldPass.uniforms['resolution'].value.set(width, height);
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
