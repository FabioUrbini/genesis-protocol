import { Vector3, Color } from 'three';
import type { VoxelGrid } from '../core/VoxelGrid';

export interface MemorySnapshot {
    id: string;
    timestamp: number;
    position: Vector3;
    voxelData: Uint8Array;
    boundingBox: { min: Vector3; max: Vector3 };
    intensity: number; // 0-1, how visible the echo is
    fadeRate: number;
}

export interface EchoConfig {
    maxEchoes: number;
    snapshotInterval: number; // milliseconds between snapshots
    defaultIntensity: number;
    fadeRate: number;
    renderDistance: number;
    minVoxelChange: number; // Minimum voxel changes to create echo
}

export class MemoryEchoes {
    private echoes: Map<string, MemorySnapshot> = new Map();
    private config: EchoConfig;
    private lastSnapshotTime: number = 0;
    // Removed unused: _snapshotHistory and _maxHistorySize
    private enabled: boolean = true;

    constructor(config?: Partial<EchoConfig>) {
        this.config = {
            maxEchoes: 10,
            snapshotInterval: 5000, // 5 seconds
            defaultIntensity: 0.6,
            fadeRate: 0.001, // Intensity loss per millisecond
            renderDistance: 50,
            minVoxelChange: 5,
            ...config
        };
    }

    /**
     * Update memory echoes - fade them over time
     */
    update(deltaTime: number, playerPosition: Vector3): void {
        if (!this.enabled) return;

        const deltaMs = deltaTime * 1000;

        // Fade existing echoes
        const toRemove: string[] = [];
        this.echoes.forEach((echo, id) => {
            echo.intensity -= this.config.fadeRate * deltaMs;

            // Remove echoes that are too far or fully faded
            const distance = playerPosition.distanceTo(echo.position);
            if (echo.intensity <= 0 || distance > this.config.renderDistance) {
                toRemove.push(id);
            }
        });

        // Clean up faded echoes
        toRemove.forEach(id => this.echoes.delete(id));
    }

    /**
     * Capture a snapshot of significant pattern changes
     */
    captureSnapshot(grid: VoxelGrid, significantArea?: { min: Vector3; max: Vector3 }): boolean {
        const now = Date.now();

        // Check if enough time has passed since last snapshot
        if (now - this.lastSnapshotTime < this.config.snapshotInterval) {
            return false;
        }

        // Don't create echo if we're at max capacity
        if (this.echoes.size >= this.config.maxEchoes) {
            // Remove oldest echo
            const oldest = Array.from(this.echoes.entries())
                .sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
            if (oldest) {
                this.echoes.delete(oldest[0]);
            }
        }

        // Determine bounding box
        let boundingBox: { min: Vector3; max: Vector3 };
        if (significantArea) {
            boundingBox = significantArea;
        } else {
            // Find active region
            boundingBox = this.findActiveBounds(grid);
        }

        // Check if there's enough activity
        const voxelCount = this.countActiveVoxels(grid, boundingBox);
        if (voxelCount < this.config.minVoxelChange) {
            return false;
        }

        // Create snapshot
        const snapshot = this.createSnapshot(grid, boundingBox);
        this.echoes.set(snapshot.id, snapshot);

        this.lastSnapshotTime = now;

        console.log(`📸 Memory Echo captured: ${voxelCount} voxels at ${snapshot.position.toArray()}`);

        return true;
    }

    /**
     * Create a snapshot from the grid
     */
    private createSnapshot(grid: VoxelGrid, boundingBox: { min: Vector3; max: Vector3 }): MemorySnapshot {
        const size = new Vector3()
            .subVectors(boundingBox.max, boundingBox.min)
            .addScalar(1);

        const voxelData = new Uint8Array(size.x * size.y * size.z);

        // Copy voxel data in bounding box
        let index = 0;
        for (let z = boundingBox.min.z; z <= boundingBox.max.z; z++) {
            for (let y = boundingBox.min.y; y <= boundingBox.max.y; y++) {
                for (let x = boundingBox.min.x; x <= boundingBox.max.x; x++) {
                    voxelData[index++] = grid.get(x, y, z);
                }
            }
        }

        // Calculate center position
        const center = new Vector3()
            .addVectors(boundingBox.min, boundingBox.max)
            .multiplyScalar(0.5);

        return {
            id: `echo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            position: center,
            voxelData,
            boundingBox,
            intensity: this.config.defaultIntensity,
            fadeRate: this.config.fadeRate
        };
    }

    /**
     * Find bounding box of active voxels
     */
    private findActiveBounds(grid: VoxelGrid): { min: Vector3; max: Vector3 } {
        let minX = grid.width, minY = grid.height, minZ = grid.depth;
        let maxX = 0, maxY = 0, maxZ = 0;

        for (let z = 0; z < grid.depth; z++) {
            for (let y = 0; y < grid.height; y++) {
                for (let x = 0; x < grid.width; x++) {
                    if (grid.get(x, y, z) > 0) {
                        minX = Math.min(minX, x);
                        minY = Math.min(minY, y);
                        minZ = Math.min(minZ, z);
                        maxX = Math.max(maxX, x);
                        maxY = Math.max(maxY, y);
                        maxZ = Math.max(maxZ, z);
                    }
                }
            }
        }

        return {
            min: new Vector3(minX, minY, minZ),
            max: new Vector3(maxX, maxY, maxZ)
        };
    }

    /**
     * Count active voxels in bounding box
     */
    private countActiveVoxels(grid: VoxelGrid, boundingBox: { min: Vector3; max: Vector3 }): number {
        let count = 0;

        for (let z = boundingBox.min.z; z <= boundingBox.max.z; z++) {
            for (let y = boundingBox.min.y; y <= boundingBox.max.y; y++) {
                for (let x = boundingBox.min.x; x <= boundingBox.max.x; x++) {
                    if (grid.get(x, y, z) > 0) {
                        count++;
                    }
                }
            }
        }

        return count;
    }

    /**
     * Manually create an echo at a specific location
     */
    createEchoAt(grid: VoxelGrid, center: Vector3, radius: number = 5): void {
        const boundingBox = {
            min: new Vector3(
                Math.max(0, Math.floor(center.x - radius)),
                Math.max(0, Math.floor(center.y - radius)),
                Math.max(0, Math.floor(center.z - radius))
            ),
            max: new Vector3(
                Math.min(grid.width - 1, Math.ceil(center.x + radius)),
                Math.min(grid.height - 1, Math.ceil(center.y + radius)),
                Math.min(grid.depth - 1, Math.ceil(center.z + radius))
            )
        };

        const snapshot = this.createSnapshot(grid, boundingBox);
        this.echoes.set(snapshot.id, snapshot);
    }

    /**
     * Get all visible echoes
     */
    getVisibleEchoes(playerPosition: Vector3): MemorySnapshot[] {
        return Array.from(this.echoes.values())
            .filter(echo => {
                const distance = playerPosition.distanceTo(echo.position);
                return distance <= this.config.renderDistance && echo.intensity > 0;
            })
            .sort((a, b) => b.intensity - a.intensity);
    }

    /**
     * Get echo color based on age and intensity
     */
    getEchoColor(echo: MemorySnapshot): Color {
        // Older echoes are more blue/purple, newer are more cyan/white
        const age = Date.now() - echo.timestamp;
        const ageNormalized = Math.min(age / 30000, 1); // 30 seconds to full blue

        const cyan = new Color(0x00ffff);
        const purple = new Color(0x8800ff);

        return cyan.lerp(purple, ageNormalized);
    }

    /**
     * Clear all echoes
     */
    clear(): void {
        this.echoes.clear();
    }

    /**
     * Get echo by ID
     */
    getEcho(id: string): MemorySnapshot | undefined {
        return this.echoes.get(id);
    }

    /**
     * Get all echoes
     */
    getAllEchoes(): MemorySnapshot[] {
        return Array.from(this.echoes.values());
    }

    /**
     * Get echo count
     */
    getEchoCount(): number {
        return this.echoes.size;
    }

    /**
     * Enable/disable echoes
     */
    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
        if (!enabled) {
            this.clear();
        }
    }

    isEnabled(): boolean {
        return this.enabled;
    }

    /**
     * Update configuration
     */
    updateConfig(config: Partial<EchoConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Get configuration
     */
    getConfig(): EchoConfig {
        return { ...this.config };
    }

    /**
     * Replay an echo (restore voxels to grid)
     */
    replayEcho(echo: MemorySnapshot, grid: VoxelGrid, intensity: number = 1.0): void {
        let index = 0;
        for (let z = echo.boundingBox.min.z; z <= echo.boundingBox.max.z; z++) {
            for (let y = echo.boundingBox.min.y; y <= echo.boundingBox.max.y; y++) {
                for (let x = echo.boundingBox.min.x; x <= echo.boundingBox.max.x; x++) {
                    const voxelState = echo.voxelData[index++];
                    if (voxelState && voxelState > 0 && Math.random() < intensity) {
                        grid.set(x, y, z, voxelState);
                    }
                }
            }
        }

        console.log(`🔄 Echo replayed at ${echo.position.toArray()}`);
    }

    /**
     * Get statistics
     */
    getStats(): {
        totalEchoes: number;
        averageIntensity: number;
        oldestEcho: number;
        newestEcho: number;
    } {
        const echoes = Array.from(this.echoes.values());

        if (echoes.length === 0) {
            return {
                totalEchoes: 0,
                averageIntensity: 0,
                oldestEcho: 0,
                newestEcho: 0
            };
        }

        const totalIntensity = echoes.reduce((sum, e) => sum + e.intensity, 0);
        const timestamps = echoes.map(e => e.timestamp);

        return {
            totalEchoes: echoes.length,
            averageIntensity: totalIntensity / echoes.length,
            oldestEcho: Math.min(...timestamps),
            newestEcho: Math.max(...timestamps)
        };
    }

    serialize(): any {
        return {
            echoes: Array.from(this.echoes.values()).map(echo => ({
                id: echo.id,
                timestamp: echo.timestamp,
                position: echo.position.toArray(),
                voxelData: Array.from(echo.voxelData),
                boundingBox: {
                    min: echo.boundingBox.min.toArray(),
                    max: echo.boundingBox.max.toArray()
                },
                intensity: echo.intensity,
                fadeRate: echo.fadeRate
            })),
            config: this.config,
            enabled: this.enabled
        };
    }

    deserialize(data: any): void {
        if (data.echoes) {
            this.echoes.clear();
            data.echoes.forEach((echoData: any) => {
                const echo: MemorySnapshot = {
                    id: echoData.id,
                    timestamp: echoData.timestamp,
                    position: new Vector3().fromArray(echoData.position),
                    voxelData: new Uint8Array(echoData.voxelData),
                    boundingBox: {
                        min: new Vector3().fromArray(echoData.boundingBox.min),
                        max: new Vector3().fromArray(echoData.boundingBox.max)
                    },
                    intensity: echoData.intensity,
                    fadeRate: echoData.fadeRate
                };
                this.echoes.set(echo.id, echo);
            });
        }

        if (data.config) {
            this.config = data.config;
        }

        if (data.enabled !== undefined) {
            this.enabled = data.enabled;
        }
    }
}
