/**
 * VisualFeedback.ts
 * Reactive visual feedback system for game events
 */

import * as THREE from 'three';

export enum FeedbackType {
  Damage = 'damage',
  Heal = 'heal',
  EnergyLow = 'energy_low',
  OxygenLow = 'oxygen_low',
  ItemCollect = 'item_collect',
  VoxelPlace = 'voxel_place',
  VoxelBreak = 'voxel_break',
  PortalEnter = 'portal_enter',
  TimeRewind = 'time_rewind',
  Success = 'success',
  Error = 'error'
}

interface RippleEffect {
  position: THREE.Vector3;
  radius: number;
  maxRadius: number;
  color: THREE.Color;
  startTime: number;
  duration: number;
}

interface ScreenShake {
  intensity: number;
  duration: number;
  startTime: number;
}

export class VisualFeedback {
  private camera: THREE.Camera;
  private scene: THREE.Scene;
  private ripples: RippleEffect[] = [];
  private screenShakes: ScreenShake[] = [];
  private vignetteIntensity: number = 0;
  private targetVignetteIntensity: number = 0;
  private chromaticAberration: number = 0;
  private targetChromaticAberration: number = 0;
  private desaturation: number = 0;
  private targetDesaturation: number = 0;
  private flashColor: THREE.Color = new THREE.Color(0xffffff);
  private flashIntensity: number = 0;
  private originalCameraPosition: THREE.Vector3 = new THREE.Vector3();
  private originalCameraRotation: THREE.Euler = new THREE.Euler();

  constructor(camera: THREE.Camera, scene: THREE.Scene) {
    this.camera = camera;
    this.scene = scene;
    this.originalCameraPosition.copy(camera.position);
    this.originalCameraRotation.copy(camera.rotation);
  }

  /**
   * Trigger visual feedback
   */
  trigger(type: FeedbackType, position?: THREE.Vector3, intensity: number = 1.0): void {
    switch (type) {
      case FeedbackType.Damage:
        this.triggerDamageFeedback(intensity);
        break;
      case FeedbackType.Heal:
        this.triggerHealFeedback(intensity);
        break;
      case FeedbackType.EnergyLow:
        this.triggerEnergyLowFeedback();
        break;
      case FeedbackType.OxygenLow:
        this.triggerOxygenLowFeedback();
        break;
      case FeedbackType.ItemCollect:
        if (position) this.triggerItemCollectFeedback(position);
        break;
      case FeedbackType.VoxelPlace:
        if (position) this.triggerVoxelPlaceFeedback(position);
        break;
      case FeedbackType.VoxelBreak:
        if (position) this.triggerVoxelBreakFeedback(position);
        break;
      case FeedbackType.PortalEnter:
        this.triggerPortalEnterFeedback();
        break;
      case FeedbackType.TimeRewind:
        this.triggerTimeRewindFeedback();
        break;
      case FeedbackType.Success:
        this.triggerSuccessFeedback();
        break;
      case FeedbackType.Error:
        this.triggerErrorFeedback();
        break;
    }
  }

  private triggerDamageFeedback(intensity: number): void {
    this.screenShake(0.5 * intensity, 300);
    this.flash(new THREE.Color(0xff0000), 0.3 * intensity);
    this.setVignette(0.7 * intensity, 500);
  }

  private triggerHealFeedback(intensity: number): void {
    this.flash(new THREE.Color(0x00ff00), 0.2 * intensity);
    this.setVignette(-0.2 * intensity, 300);
  }

  private triggerEnergyLowFeedback(): void {
    this.pulseVignette(0.5, 2000);
    this.setDesaturation(0.3, 1000);
  }

  private triggerOxygenLowFeedback(): void {
    this.pulseVignette(0.6, 1500);
    this.setChromaticAberration(0.003, 1000);
  }

  private triggerItemCollectFeedback(position: THREE.Vector3): void {
    this.ripple(position, new THREE.Color(0x50e3c2), 3.0, 500);
    this.flash(new THREE.Color(0x50e3c2), 0.1);
  }

  private triggerVoxelPlaceFeedback(position: THREE.Vector3): void {
    this.ripple(position, new THREE.Color(0xffffff), 1.5, 300);
  }

  private triggerVoxelBreakFeedback(position: THREE.Vector3): void {
    this.ripple(position, new THREE.Color(0xff6b6b), 2.0, 400);
    this.screenShake(0.1, 100);
  }

  private triggerPortalEnterFeedback(): void {
    this.screenShake(1.0, 800);
    this.flash(new THREE.Color(0x9b59b6), 0.5);
    this.setChromaticAberration(0.01, 500);
    this.setDesaturation(0.5, 1000);
  }

  private triggerTimeRewindFeedback(): void {
    this.setChromaticAberration(0.015, 1000);
    this.flash(new THREE.Color(0x3498db), 0.3);
  }

  private triggerSuccessFeedback(): void {
    this.flash(new THREE.Color(0x2ecc71), 0.2);
  }

  private triggerErrorFeedback(): void {
    this.screenShake(0.3, 200);
    this.flash(new THREE.Color(0xe74c3c), 0.25);
  }

  /**
   * Create ripple effect
   */
  ripple(position: THREE.Vector3, color: THREE.Color, maxRadius: number, duration: number): void {
    this.ripples.push({
      position: position.clone(),
      radius: 0,
      maxRadius,
      color: color.clone(),
      startTime: Date.now(),
      duration
    });
  }

  /**
   * Screen shake
   */
  screenShake(intensity: number, duration: number): void {
    this.screenShakes.push({
      intensity,
      duration,
      startTime: Date.now()
    });
  }

  /**
   * Flash screen
   */
  flash(color: THREE.Color, intensity: number): void {
    this.flashColor.copy(color);
    this.flashIntensity = Math.max(this.flashIntensity, intensity);
  }

  /**
   * Set vignette intensity
   */
  setVignette(intensity: number, duration: number): void {
    this.targetVignetteIntensity = Math.max(0, Math.min(1, intensity));
  }

  /**
   * Pulse vignette
   */
  pulseVignette(intensity: number, duration: number): void {
    this.setVignette(intensity, duration / 2);
    setTimeout(() => {
      this.setVignette(0, duration / 2);
    }, duration / 2);
  }

  /**
   * Set chromatic aberration
   */
  setChromaticAberration(amount: number, duration: number): void {
    this.targetChromaticAberration = Math.max(0, Math.min(0.02, amount));
    setTimeout(() => {
      this.targetChromaticAberration = 0;
    }, duration);
  }

  /**
   * Set desaturation
   */
  setDesaturation(amount: number, duration: number): void {
    this.targetDesaturation = Math.max(0, Math.min(1, amount));
    setTimeout(() => {
      this.targetDesaturation = 0;
    }, duration);
  }

  /**
   * Update (call every frame)
   */
  update(deltaTime: number): void {
    const now = Date.now();

    // Update ripples
    this.ripples = this.ripples.filter(ripple => {
      const elapsed = now - ripple.startTime;
      const progress = elapsed / ripple.duration;

      if (progress >= 1) return false;

      ripple.radius = ripple.maxRadius * progress;
      return true;
    });

    // Update screen shakes
    this.originalCameraPosition.copy(this.camera.position);
    this.originalCameraRotation.copy(this.camera.rotation);

    let totalShakeX = 0;
    let totalShakeY = 0;
    let totalShakeZ = 0;

    this.screenShakes = this.screenShakes.filter(shake => {
      const elapsed = now - shake.startTime;
      const progress = elapsed / shake.duration;

      if (progress >= 1) return false;

      const intensity = shake.intensity * (1 - progress);
      totalShakeX += (Math.random() - 0.5) * intensity;
      totalShakeY += (Math.random() - 0.5) * intensity;
      totalShakeZ += (Math.random() - 0.5) * intensity;

      return true;
    });

    if (totalShakeX !== 0 || totalShakeY !== 0 || totalShakeZ !== 0) {
      this.camera.position.add(new THREE.Vector3(totalShakeX, totalShakeY, totalShakeZ));
    }

    // Smooth transitions for post-processing effects
    const lerpSpeed = deltaTime * 5;
    this.vignetteIntensity += (this.targetVignetteIntensity - this.vignetteIntensity) * lerpSpeed;
    this.chromaticAberration += (this.targetChromaticAberration - this.chromaticAberration) * lerpSpeed;
    this.desaturation += (this.targetDesaturation - this.desaturation) * lerpSpeed;

    // Fade flash
    if (this.flashIntensity > 0) {
      this.flashIntensity -= deltaTime * 2;
      if (this.flashIntensity < 0) this.flashIntensity = 0;
    }
  }

  /**
   * Render ripples (call in render loop)
   */
  renderRipples(): void {
    this.ripples.forEach(ripple => {
      const elapsed = Date.now() - ripple.startTime;
      const progress = elapsed / ripple.duration;
      const alpha = 1 - progress;

      // Create ring geometry
      const geometry = new THREE.RingGeometry(ripple.radius - 0.1, ripple.radius + 0.1, 32);
      const material = new THREE.MeshBasicMaterial({
        color: ripple.color,
        transparent: true,
        opacity: alpha * 0.5,
        side: THREE.DoubleSide
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(ripple.position);
      mesh.lookAt(this.camera.position);

      this.scene.add(mesh);

      // Remove after rendering (should be handled by parent)
      setTimeout(() => {
        this.scene.remove(mesh);
        geometry.dispose();
        material.dispose();
      }, 50);
    });
  }

  /**
   * Get current vignette intensity
   */
  getVignetteIntensity(): number {
    return this.vignetteIntensity;
  }

  /**
   * Get current chromatic aberration
   */
  getChromaticAberration(): number {
    return this.chromaticAberration;
  }

  /**
   * Get current desaturation
   */
  getDesaturation(): number {
    return this.desaturation;
  }

  /**
   * Get current flash
   */
  getFlash(): { color: THREE.Color; intensity: number } {
    return {
      color: this.flashColor,
      intensity: this.flashIntensity
    };
  }

  /**
   * Reset all effects
   */
  reset(): void {
    this.ripples = [];
    this.screenShakes = [];
    this.vignetteIntensity = 0;
    this.targetVignetteIntensity = 0;
    this.chromaticAberration = 0;
    this.targetChromaticAberration = 0;
    this.desaturation = 0;
    this.targetDesaturation = 0;
    this.flashIntensity = 0;
  }

  /**
   * Dispose
   */
  dispose(): void {
    this.reset();
  }
}
