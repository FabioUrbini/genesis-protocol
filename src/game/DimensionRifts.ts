import { Vector3, Mesh, SphereGeometry, MeshStandardMaterial, Scene, Color } from 'three';
import { BiomeType } from './WorldManager';

/**
 * Portal/Rift state
 */
export enum RiftState {
  Dormant = 'dormant',
  Active = 'active',
  Unstable = 'unstable',
  Closing = 'closing'
}

/**
 * Dimension Rift (Portal)
 */
export interface DimensionRift {
  id: string;
  position: Vector3;
  targetBiome: BiomeType;
  targetPosition: Vector3;
  radius: number;
  state: RiftState;
  energy: number; // 0-100, depletes over time
  visualMesh?: Mesh;
  particles?: Mesh[]; // Swirling particles
}

/**
 * DimensionRiftManager - Manages portals between biomes/dimensions
 */
export class DimensionRiftManager {
  private rifts: Map<string, DimensionRift>;
  private scene: Scene | null = null;
  private nextRiftId: number = 0;

  constructor() {
    this.rifts = new Map();
  }

  /**
   * Set scene for visual representation
   */
  public setScene(scene: Scene): void {
    this.scene = scene;
  }

  /**
   * Create a new rift
   */
  public createRift(
    position: Vector3,
    targetBiome: BiomeType,
    targetPosition: Vector3,
    radius: number = 3
  ): DimensionRift {
    const id = `rift_${this.nextRiftId++}`;

    const rift: DimensionRift = {
      id,
      position: position.clone(),
      targetBiome,
      targetPosition: targetPosition.clone(),
      radius,
      state: RiftState.Active,
      energy: 100
    };

    this.rifts.set(id, rift);

    // Create visual representation
    if (this.scene) {
      this.createRiftVisuals(rift);
    }

    console.log(`Created rift ${id} to ${targetBiome} at`, position);

    return rift;
  }

  /**
   * Create visual representation of rift
   */
  private createRiftVisuals(rift: DimensionRift): void {
    if (!this.scene) return;

    // Main portal sphere (semi-transparent, pulsing)
    const geometry = new SphereGeometry(rift.radius, 32, 32);
    const material = new MeshStandardMaterial({
      color: this.getBiomeColor(rift.targetBiome),
      emissive: this.getBiomeColor(rift.targetBiome),
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.6,
      metalness: 0.8,
      roughness: 0.2
    });

    const mesh = new Mesh(geometry, material);
    mesh.position.copy(rift.position);
    mesh.name = `rift_${rift.id}`;

    this.scene.add(mesh);
    rift.visualMesh = mesh;

    // Create swirling particles
    rift.particles = [];
    const particleCount = 20;

    for (let i = 0; i < particleCount; i++) {
      const particleGeom = new SphereGeometry(0.2, 8, 8);
      const particleMat = new MeshStandardMaterial({
        color: this.getBiomeColor(rift.targetBiome),
        emissive: this.getBiomeColor(rift.targetBiome),
        emissiveIntensity: 1.0
      });

      const particle = new Mesh(particleGeom, particleMat);

      // Random position around portal
      const angle = (i / particleCount) * Math.PI * 2;
      const distance = rift.radius * 0.8;
      particle.position.set(
        rift.position.x + Math.cos(angle) * distance,
        rift.position.y + (Math.random() - 0.5) * rift.radius,
        rift.position.z + Math.sin(angle) * distance
      );

      this.scene.add(particle);
      rift.particles.push(particle);
    }
  }

  /**
   * Get color for biome
   */
  private getBiomeColor(biome: BiomeType): Color {
    const colors: Record<BiomeType, number> = {
      [BiomeType.CrystalCaves]: 0x4a9eff,
      [BiomeType.ChaosWastes]: 0xff4444,
      [BiomeType.StillGardens]: 0x44ff88,
      [BiomeType.ThePulse]: 0xff00ff,
      [BiomeType.GliderStorms]: 0xffaa00,
      [BiomeType.VoidTears]: 0x8800ff,
      [BiomeType.QuantumFoam]: 0x00ffff
    };

    return new Color(colors[biome]);
  }

  /**
   * Remove a rift
   */
  public removeRift(riftId: string): void {
    const rift = this.rifts.get(riftId);
    if (!rift) return;

    // Remove visuals
    if (rift.visualMesh && this.scene) {
      this.scene.remove(rift.visualMesh);
      rift.visualMesh.geometry.dispose();
      (rift.visualMesh.material as MeshStandardMaterial).dispose();
    }

    if (rift.particles && this.scene) {
      for (const particle of rift.particles) {
        this.scene.remove(particle);
        particle.geometry.dispose();
        (particle.material as MeshStandardMaterial).dispose();
      }
    }

    this.rifts.delete(riftId);
    console.log(`Removed rift ${riftId}`);
  }

  /**
   * Get rift by id
   */
  public getRift(riftId: string): DimensionRift | undefined {
    return this.rifts.get(riftId);
  }

  /**
   * Get all rifts
   */
  public getAllRifts(): DimensionRift[] {
    return Array.from(this.rifts.values());
  }

  /**
   * Check if position is inside a rift
   */
  public getRiftAtPosition(position: Vector3): DimensionRift | null {
    for (const rift of this.rifts.values()) {
      if (rift.state !== RiftState.Active) continue;

      const distance = position.distanceTo(rift.position);
      if (distance <= rift.radius) {
        return rift;
      }
    }

    return null;
  }

  /**
   * Update rifts (energy decay, animations)
   */
  public update(deltaTime: number): void {
    for (const rift of this.rifts.values()) {
      // Energy decay
      if (rift.state === RiftState.Active) {
        rift.energy -= deltaTime * 0.5; // Lose 0.5 energy per second

        if (rift.energy <= 20) {
          rift.state = RiftState.Unstable;
        }

        if (rift.energy <= 0) {
          rift.state = RiftState.Closing;
          this.removeRift(rift.id);
          continue;
        }
      }

      // Animate portal
      if (rift.visualMesh) {
        // Pulse effect
        const pulse = Math.sin(Date.now() * 0.003) * 0.2 + 0.8;
        rift.visualMesh.scale.setScalar(pulse);

        // Rotation
        rift.visualMesh.rotation.y += deltaTime * 0.001;
        rift.visualMesh.rotation.x += deltaTime * 0.0005;

        // Unstable effect
        if (rift.state === RiftState.Unstable) {
          const flicker = Math.random();
          (rift.visualMesh.material as MeshStandardMaterial).opacity = 0.3 + flicker * 0.3;
        }
      }

      // Animate particles (swirl around portal)
      if (rift.particles) {
        const time = Date.now() * 0.001;

        for (let i = 0; i < rift.particles.length; i++) {
          const particle = rift.particles[i];
          const angle = (i / rift.particles.length) * Math.PI * 2 + time;
          const distance = rift.radius * 0.8;
          const verticalOscillation = Math.sin(time * 2 + i) * rift.radius * 0.3;

          particle.position.set(
            rift.position.x + Math.cos(angle) * distance,
            rift.position.y + verticalOscillation,
            rift.position.z + Math.sin(angle) * distance
          );
        }
      }
    }
  }

  /**
   * Recharge a rift's energy
   */
  public rechargeRift(riftId: string, amount: number): void {
    const rift = this.rifts.get(riftId);
    if (!rift) return;

    rift.energy = Math.min(100, rift.energy + amount);

    if (rift.energy > 20 && rift.state === RiftState.Unstable) {
      rift.state = RiftState.Active;
    }
  }

  /**
   * Create a random rift near position
   */
  public createRandomRift(nearPosition: Vector3, biomes: BiomeType[]): DimensionRift {
    // Random offset
    const offset = new Vector3(
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 20
    );

    const riftPosition = nearPosition.clone().add(offset);

    // Random target biome
    const targetBiome = biomes[Math.floor(Math.random() * biomes.length)];

    // Random distant target position
    const targetPosition = new Vector3(
      (Math.random() - 0.5) * 200,
      (Math.random() - 0.5) * 100,
      (Math.random() - 0.5) * 200
    );

    return this.createRift(riftPosition, targetBiome, targetPosition);
  }

  /**
   * Clear all rifts
   */
  public clear(): void {
    for (const rift of this.rifts.values()) {
      this.removeRift(rift.id);
    }
  }

  /**
   * Get rift count
   */
  public getRiftCount(): number {
    return this.rifts.size;
  }
}
