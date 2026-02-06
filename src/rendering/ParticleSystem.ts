/**
 * Particle System for voxel birth/death effects
 * Creates visual feedback when voxels change state
 */

import * as THREE from 'three';

/**
 * Particle types for different voxel events
 */
export enum ParticleType {
  Birth = 'birth',
  Death = 'death',
  StateChange = 'stateChange',
  Energy = 'energy',
}

/**
 * Individual particle
 */
interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  life: number;
  maxLife: number;
  size: number;
  type: ParticleType;
}

/**
 * Particle System Manager
 */
export class ParticleSystem {
  private scene: THREE.Scene;
  private particles: Particle[] = [];
  private particleGeometry: THREE.BufferGeometry;
  private particleMaterial: THREE.PointsMaterial;
  private particleMesh: THREE.Points;
  private maxParticles: number = 10000;

  // Buffers for GPU updates
  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;

  constructor(scene: THREE.Scene, maxParticles: number = 10000) {
    this.scene = scene;
    this.maxParticles = maxParticles;

    // Initialize buffers
    this.positions = new Float32Array(maxParticles * 3);
    this.colors = new Float32Array(maxParticles * 3);
    this.sizes = new Float32Array(maxParticles);

    // Create geometry
    this.particleGeometry = new THREE.BufferGeometry();
    this.particleGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(this.positions, 3)
    );
    this.particleGeometry.setAttribute(
      'color',
      new THREE.BufferAttribute(this.colors, 3)
    );
    this.particleGeometry.setAttribute(
      'size',
      new THREE.BufferAttribute(this.sizes, 1)
    );

    // Create material with custom shader for better effects
    this.particleMaterial = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    // Create mesh
    this.particleMesh = new THREE.Points(this.particleGeometry, this.particleMaterial);
    this.scene.add(this.particleMesh);
  }

  /**
   * Emit particles at a position
   */
  public emit(
    position: THREE.Vector3,
    type: ParticleType,
    color: THREE.Color,
    count: number = 10
  ): void {
    if (this.particles.length + count > this.maxParticles) {
      // Remove oldest particles to make room
      this.particles.splice(0, count);
    }

    for (let i = 0; i < count; i++) {
      const particle: Particle = {
        position: position.clone(),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2
        ).multiplyScalar(this.getVelocityScale(type)),
        color: color.clone(),
        life: 1.0,
        maxLife: 1.0,
        size: this.getParticleSize(type),
        type,
      };

      this.particles.push(particle);
    }
  }

  /**
   * Emit particles for voxel birth
   */
  public emitBirth(position: THREE.Vector3, color: THREE.Color): void {
    this.emit(position, ParticleType.Birth, color, 15);
  }

  /**
   * Emit particles for voxel death
   */
  public emitDeath(position: THREE.Vector3, color: THREE.Color): void {
    this.emit(position, ParticleType.Death, color, 20);
  }

  /**
   * Emit particles for voxel state change
   */
  public emitStateChange(
    position: THREE.Vector3,
    fromColor: THREE.Color,
    toColor: THREE.Color
  ): void {
    // Emit with gradient between colors
    const count = 10;
    for (let i = 0; i < count; i++) {
      const t = i / count;
      const color = new THREE.Color().lerpColors(fromColor, toColor, t);
      this.emit(position, ParticleType.StateChange, color, 1);
    }
  }

  /**
   * Emit energy particles (continuous effect)
   */
  public emitEnergy(position: THREE.Vector3, color: THREE.Color): void {
    this.emit(position, ParticleType.Energy, color, 5);
  }

  /**
   * Update particle system
   */
  public update(delta: number): void {
    // Update all particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];

      // Update particle life
      particle.life -= delta;

      if (particle.life <= 0) {
        // Remove dead particles
        this.particles.splice(i, 1);
        continue;
      }

      // Update position
      particle.position.add(particle.velocity.clone().multiplyScalar(delta));

      // Apply gravity/forces based on type
      this.applyForces(particle, delta);

      // Fade out
      const lifeRatio = particle.life / particle.maxLife;
      particle.color.multiplyScalar(lifeRatio);
    }

    // Update GPU buffers
    this.updateBuffers();
  }

  /**
   * Apply forces to particle based on type
   */
  private applyForces(particle: Particle, delta: number): void {
    switch (particle.type) {
      case ParticleType.Birth:
        // Expand outward with slight upward bias
        particle.velocity.y += 0.5 * delta;
        particle.velocity.multiplyScalar(0.98); // Friction
        break;

      case ParticleType.Death:
        // Fall down with gravity
        particle.velocity.y -= 2.0 * delta;
        particle.velocity.multiplyScalar(0.99);
        break;

      case ParticleType.StateChange:
        // Spiral pattern
        const angle = particle.life * Math.PI * 4;
        particle.velocity.x = Math.cos(angle) * 0.5;
        particle.velocity.z = Math.sin(angle) * 0.5;
        particle.velocity.y += 0.2 * delta;
        break;

      case ParticleType.Energy:
        // Orbit pattern
        const orbitAngle = particle.life * Math.PI * 2;
        particle.velocity.x = Math.cos(orbitAngle) * 0.3;
        particle.velocity.z = Math.sin(orbitAngle) * 0.3;
        break;
    }
  }

  /**
   * Get velocity scale based on particle type
   */
  private getVelocityScale(type: ParticleType): number {
    switch (type) {
      case ParticleType.Birth:
        return 1.5;
      case ParticleType.Death:
        return 2.0;
      case ParticleType.StateChange:
        return 0.8;
      case ParticleType.Energy:
        return 0.5;
      default:
        return 1.0;
    }
  }

  /**
   * Get particle size based on type
   */
  private getParticleSize(type: ParticleType): number {
    switch (type) {
      case ParticleType.Birth:
        return 0.15;
      case ParticleType.Death:
        return 0.1;
      case ParticleType.StateChange:
        return 0.12;
      case ParticleType.Energy:
        return 0.08;
      default:
        return 0.1;
    }
  }

  /**
   * Update GPU buffers with current particle data
   */
  private updateBuffers(): void {
    // Clear buffers
    this.positions.fill(0);
    this.colors.fill(0);
    this.sizes.fill(0);

    // Fill with active particles
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      const i3 = i * 3;

      this.positions[i3] = particle.position.x;
      this.positions[i3 + 1] = particle.position.y;
      this.positions[i3 + 2] = particle.position.z;

      this.colors[i3] = particle.color.r;
      this.colors[i3 + 1] = particle.color.g;
      this.colors[i3 + 2] = particle.color.b;

      this.sizes[i] = particle.size * (particle.life / particle.maxLife);
    }

    // Update geometry
    const posAttr = this.particleGeometry.getAttribute('position');
    const colorAttr = this.particleGeometry.getAttribute('color');
    const sizeAttr = this.particleGeometry.getAttribute('size');

    if (posAttr) {
      posAttr.needsUpdate = true;
    }
    if (colorAttr) {
      colorAttr.needsUpdate = true;
    }
    if (sizeAttr) {
      sizeAttr.needsUpdate = true;
    }

    // Update draw range to only render active particles
    this.particleGeometry.setDrawRange(0, this.particles.length);
  }

  /**
   * Set particle system enabled/disabled
   */
  public setEnabled(enabled: boolean): void {
    this.particleMesh.visible = enabled;
  }

  /**
   * Get particle count
   */
  public getParticleCount(): number {
    return this.particles.length;
  }

  /**
   * Clear all particles
   */
  public clear(): void {
    this.particles = [];
    this.updateBuffers();
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    this.particleGeometry.dispose();
    this.particleMaterial.dispose();
    this.scene.remove(this.particleMesh);
    this.particles = [];
  }
}
