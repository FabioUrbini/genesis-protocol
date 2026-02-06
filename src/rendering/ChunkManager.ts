import { VoxelGrid } from '../core/VoxelGrid';
import { WorldManager } from '../game/WorldManager';
import { VoxelRenderer } from './VoxelRenderer';
import { OrganicRenderer } from './OrganicRenderer';
import { ChunkStorage } from '../game/ChunkStorage';
import { Vector3 } from 'three';

/**
 * Chunk identifier
 */
export interface ChunkCoord {
  x: number;
  y: number;
  z: number;
}

/**
 * Chunk data structure
 */
export interface Chunk {
  coord: ChunkCoord;
  grid: VoxelGrid;
  loaded: boolean;
  dirty: boolean; // Needs re-rendering
  lastAccessed: number; // Timestamp for LRU eviction
}

/**
 * Chunk Manager - Handles dynamic loading/unloading of world chunks
 */
export class ChunkManager {
  private chunks: Map<string, Chunk>;
  private chunkSize: number;
  private viewDistance: number; // In chunks
  private maxLoadedChunks: number;
  private worldManager: WorldManager;
  private renderer: VoxelRenderer | OrganicRenderer | null = null;
  private storage: ChunkStorage;
  private useStorage: boolean = true;

  constructor(
    chunkSize: number = 32,
    viewDistance: number = 3,
    maxLoadedChunks: number = 27, // 3x3x3 cube
    seed?: number
  ) {
    this.chunks = new Map();
    this.chunkSize = chunkSize;
    this.viewDistance = viewDistance;
    this.maxLoadedChunks = maxLoadedChunks;
    this.worldManager = new WorldManager(seed);
    this.storage = new ChunkStorage();
  }

  /**
   * Initialize storage
   */
  public async initStorage(): Promise<void> {
    try {
      await this.storage.init();
      console.log('Chunk storage initialized');
    } catch (error) {
      console.error('Failed to initialize chunk storage:', error);
      this.useStorage = false;
    }
  }

  /**
   * Set renderer for chunk visualization
   */
  public setRenderer(renderer: VoxelRenderer | OrganicRenderer): void {
    this.renderer = renderer;
  }

  /**
   * Get chunk key from coordinates
   */
  private getChunkKey(x: number, y: number, z: number): string {
    return `${x},${y},${z}`;
  }

  /**
   * World position to chunk coordinate
   */
  public worldToChunk(worldPos: Vector3): ChunkCoord {
    return {
      x: Math.floor(worldPos.x / this.chunkSize),
      y: Math.floor(worldPos.y / this.chunkSize),
      z: Math.floor(worldPos.z / this.chunkSize)
    };
  }

  /**
   * Chunk coordinate to world position (origin)
   */
  public chunkToWorld(chunkCoord: ChunkCoord): Vector3 {
    return new Vector3(
      chunkCoord.x * this.chunkSize,
      chunkCoord.y * this.chunkSize,
      chunkCoord.z * this.chunkSize
    );
  }

  /**
   * Load a chunk (generate or retrieve from storage)
   */
  public async loadChunk(chunkCoord: ChunkCoord): Promise<Chunk> {
    const key = this.getChunkKey(chunkCoord.x, chunkCoord.y, chunkCoord.z);

    // Check if already loaded
    let chunk = this.chunks.get(key);
    if (chunk) {
      chunk.lastAccessed = Date.now();
      return chunk;
    }

    // Try to load from storage first
    if (this.useStorage) {
      try {
        chunk = await this.storage.loadChunk(chunkCoord, this.chunkSize);
        if (chunk) {
          this.chunks.set(key, chunk);
          console.log(`Loaded chunk ${key} from storage`);

          // Evict old chunks if needed
          if (this.chunks.size > this.maxLoadedChunks) {
            this.evictOldestChunk();
          }

          return chunk;
        }
      } catch (error) {
        console.error('Failed to load chunk from storage:', error);
      }
    }

    // Create new chunk (generate)
    const grid = new VoxelGrid(this.chunkSize, this.chunkSize, this.chunkSize);

    // Generate world data
    const worldOrigin = this.chunkToWorld(chunkCoord);
    this.worldManager.generateWorld(
      grid,
      worldOrigin.x,
      worldOrigin.y,
      worldOrigin.z
    );

    // Add features
    this.worldManager.addFeatures(
      grid,
      worldOrigin.x,
      worldOrigin.y,
      worldOrigin.z
    );

    chunk = {
      coord: chunkCoord,
      grid,
      loaded: true,
      dirty: true,
      lastAccessed: Date.now()
    };

    this.chunks.set(key, chunk);

    // Evict old chunks if needed
    if (this.chunks.size > this.maxLoadedChunks) {
      this.evictOldestChunk();
    }

    return chunk;
  }

  /**
   * Load a chunk synchronously (for backward compatibility)
   */
  public loadChunkSync(chunkCoord: ChunkCoord): Chunk {
    const key = this.getChunkKey(chunkCoord.x, chunkCoord.y, chunkCoord.z);

    // Check if already loaded
    let chunk = this.chunks.get(key);
    if (chunk) {
      chunk.lastAccessed = Date.now();
      return chunk;
    }

    // Create new chunk (generate synchronously)
    const grid = new VoxelGrid(this.chunkSize, this.chunkSize, this.chunkSize);

    // Generate world data
    const worldOrigin = this.chunkToWorld(chunkCoord);
    this.worldManager.generateWorld(
      grid,
      worldOrigin.x,
      worldOrigin.y,
      worldOrigin.z
    );

    // Add features
    this.worldManager.addFeatures(
      grid,
      worldOrigin.x,
      worldOrigin.y,
      worldOrigin.z
    );

    chunk = {
      coord: chunkCoord,
      grid,
      loaded: true,
      dirty: true,
      lastAccessed: Date.now()
    };

    this.chunks.set(key, chunk);

    // Evict old chunks if needed
    if (this.chunks.size > this.maxLoadedChunks) {
      this.evictOldestChunk();
    }

    return chunk;
  }

  /**
   * Unload a chunk
   */
  public async unloadChunk(chunkCoord: ChunkCoord): Promise<void> {
    const key = this.getChunkKey(chunkCoord.x, chunkCoord.y, chunkCoord.z);
    const chunk = this.chunks.get(key);

    if (chunk) {
      // Save to IndexedDB before unloading
      if (this.useStorage && chunk.dirty) {
        try {
          await this.storage.saveChunk(chunk);
          console.log(`Saved chunk ${key} to storage`);
        } catch (error) {
          console.error('Failed to save chunk to storage:', error);
        }
      }

      this.chunks.delete(key);
    }
  }

  /**
   * Unload a chunk synchronously (without saving)
   */
  public unloadChunkSync(chunkCoord: ChunkCoord): void {
    const key = this.getChunkKey(chunkCoord.x, chunkCoord.y, chunkCoord.z);
    this.chunks.delete(key);
  }

  /**
   * Get chunk if loaded
   */
  public getChunk(chunkCoord: ChunkCoord): Chunk | undefined {
    const key = this.getChunkKey(chunkCoord.x, chunkCoord.y, chunkCoord.z);
    const chunk = this.chunks.get(key);

    if (chunk) {
      chunk.lastAccessed = Date.now();
    }

    return chunk;
  }

  /**
   * Evict least recently used chunk
   */
  private evictOldestChunk(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, chunk] of this.chunks) {
      if (chunk.lastAccessed < oldestTime) {
        oldestTime = chunk.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const chunk = this.chunks.get(oldestKey)!;
      console.log(`Evicting chunk ${oldestKey} (LRU)`);
      this.unloadChunk(chunk.coord);
    }
  }

  /**
   * Update chunks around a center position (e.g., player position)
   */
  public updateChunksAroundPosition(centerPos: Vector3): void {
    const centerChunk = this.worldToChunk(centerPos);

    // Load chunks in view distance
    const chunksToLoad: ChunkCoord[] = [];

    for (let dx = -this.viewDistance; dx <= this.viewDistance; dx++) {
      for (let dy = -this.viewDistance; dy <= this.viewDistance; dy++) {
        for (let dz = -this.viewDistance; dz <= this.viewDistance; dz++) {
          const chunkCoord: ChunkCoord = {
            x: centerChunk.x + dx,
            y: centerChunk.y + dy,
            z: centerChunk.z + dz
          };

          // Check if within spherical distance
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (dist <= this.viewDistance) {
            chunksToLoad.push(chunkCoord);
          }
        }
      }
    }

    // Load new chunks
    for (const coord of chunksToLoad) {
      this.loadChunk(coord);
    }

    // Unload distant chunks
    const chunksToUnload: ChunkCoord[] = [];

    for (const [key, chunk] of this.chunks) {
      const dx = chunk.coord.x - centerChunk.x;
      const dy = chunk.coord.y - centerChunk.y;
      const dz = chunk.coord.z - centerChunk.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist > this.viewDistance + 1) {
        chunksToUnload.push(chunk.coord);
      }
    }

    for (const coord of chunksToUnload) {
      this.unloadChunk(coord);
    }
  }

  /**
   * Get all loaded chunks
   */
  public getLoadedChunks(): Chunk[] {
    return Array.from(this.chunks.values());
  }

  /**
   * Mark chunk as dirty (needs re-render)
   */
  public markChunkDirty(chunkCoord: ChunkCoord): void {
    const chunk = this.getChunk(chunkCoord);
    if (chunk) {
      chunk.dirty = true;
    }
  }

  /**
   * Get world manager for external access
   */
  public getWorldManager(): WorldManager {
    return this.worldManager;
  }

  /**
   * Get chunk count
   */
  public getLoadedChunkCount(): number {
    return this.chunks.size;
  }

  /**
   * Clear all chunks
   */
  public clear(): void {
    this.chunks.clear();
  }

  /**
   * Save all loaded chunks to storage
   */
  public async saveAllChunks(): Promise<void> {
    if (!this.useStorage) return;

    const savePromises: Promise<void>[] = [];

    for (const chunk of this.chunks.values()) {
      if (chunk.dirty) {
        savePromises.push(this.storage.saveChunk(chunk));
      }
    }

    await Promise.all(savePromises);
    console.log(`Saved ${savePromises.length} chunks to storage`);
  }

  /**
   * Get storage info
   */
  public async getStorageInfo(): Promise<{ chunkCount: number; estimatedSize: number }> {
    return this.storage.getStorageInfo();
  }

  /**
   * Clear storage
   */
  public async clearStorage(): Promise<void> {
    await this.storage.clearAll();
  }

  /**
   * Get voxel at world position (across chunks)
   */
  public getVoxelAt(worldPos: Vector3): number {
    const chunkCoord = this.worldToChunk(worldPos);
    const chunk = this.getChunk(chunkCoord);

    if (!chunk) {
      return 0; // Dead/empty
    }

    // Convert world pos to local chunk coordinates
    const chunkWorldOrigin = this.chunkToWorld(chunkCoord);
    const localX = Math.floor(worldPos.x - chunkWorldOrigin.x);
    const localY = Math.floor(worldPos.y - chunkWorldOrigin.y);
    const localZ = Math.floor(worldPos.z - chunkWorldOrigin.z);

    // Bounds check
    if (
      localX < 0 || localX >= this.chunkSize ||
      localY < 0 || localY >= this.chunkSize ||
      localZ < 0 || localZ >= this.chunkSize
    ) {
      return 0;
    }

    return chunk.grid.get(localX, localY, localZ);
  }

  /**
   * Set voxel at world position (across chunks)
   */
  public setVoxelAt(worldPos: Vector3, state: number): void {
    const chunkCoord = this.worldToChunk(worldPos);
    let chunk = this.getChunk(chunkCoord);

    // Load chunk if not loaded
    if (!chunk) {
      chunk = this.loadChunk(chunkCoord);
    }

    // Convert world pos to local chunk coordinates
    const chunkWorldOrigin = this.chunkToWorld(chunkCoord);
    const localX = Math.floor(worldPos.x - chunkWorldOrigin.x);
    const localY = Math.floor(worldPos.y - chunkWorldOrigin.y);
    const localZ = Math.floor(worldPos.z - chunkWorldOrigin.z);

    // Bounds check
    if (
      localX < 0 || localX >= this.chunkSize ||
      localY < 0 || localY >= this.chunkSize ||
      localZ < 0 || localZ >= this.chunkSize
    ) {
      return;
    }

    chunk.grid.set(localX, localY, localZ, state);
    chunk.dirty = true;
  }
}
