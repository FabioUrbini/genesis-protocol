import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * Camera controls wrapper for easy navigation
 */
export class CameraControls {
  private controls: OrbitControls;

  constructor(camera: THREE.Camera, domElement: HTMLElement) {
    this.controls = new OrbitControls(camera, domElement);
    
    // Configure controls
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 200;
    this.controls.maxPolarAngle = Math.PI;
    
    // Mouse button configuration
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN,
    };
  }

  /**
   * Update controls (call in animation loop)
   */
  public update(): void {
    this.controls.update();
  }

  /**
   * Get underlying OrbitControls
   */
  public getControls(): OrbitControls {
    return this.controls;
  }

  /**
   * Set camera target (look at point)
   */
  public setTarget(x: number, y: number, z: number): void {
    this.controls.target.set(x, y, z);
    this.controls.update();
  }

  /**
   * Enable/disable controls
   */
  public setEnabled(enabled: boolean): void {
    this.controls.enabled = enabled;
  }

  /**
   * Dispose controls
   */
  public dispose(): void {
    this.controls.dispose();
  }
}
