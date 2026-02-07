import { Chunk, ChunkCoord } from '../rendering/ChunkManager';
import { VoxelGrid } from '../core/VoxelGrid';

/**
 * Serialized chunk data for storage
 */
export interface SerializedChunk {
  coord: ChunkCoord;
  data: Uint8Array;
  timestamp: number;
}

/**
 * ChunkStorage - Handles persistent storage of chunks using IndexedDB
 */
export class ChunkStorage {
  private dbName: string = 'GenesisProtocol';
  private storeName: string = 'chunks';
  private version: number = 1;
  private db: IDBDatabase | null = null;

  constructor() {}

  /**
   * Initialize IndexedDB
   */
  public async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized for chunk storage');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          const objectStore = db.createObjectStore(this.storeName, {
            keyPath: 'key'
          });

          // Create indexes
          objectStore.createIndex('timestamp', 'timestamp', { unique: false });

          console.log('Created chunk object store');
        }
      };
    });
  }

  /**
   * Get chunk key for storage
   */
  private getChunkKey(coord: ChunkCoord): string {
    return `${coord.x},${coord.y},${coord.z}`;
  }

  /**
   * Save chunk to IndexedDB
   */
  public async saveChunk(chunk: Chunk): Promise<void> {
    if (!this.db) {
      console.warn('IndexedDB not initialized');
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);

      const serialized: SerializedChunk & { key: string } = {
        key: this.getChunkKey(chunk.coord),
        coord: chunk.coord,
        data: chunk.grid.getData(),
        timestamp: Date.now()
      };

      const request = objectStore.put(serialized);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to save chunk:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Load chunk from IndexedDB
   */
  public async loadChunk(coord: ChunkCoord, chunkSize: number): Promise<Chunk | null> {
    if (!this.db) {
      console.warn('IndexedDB not initialized');
      return null;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const objectStore = transaction.objectStore(this.storeName);
      const key = this.getChunkKey(coord);

      const request = objectStore.get(key);

      request.onsuccess = () => {
        const result = request.result as (SerializedChunk & { key: string }) | undefined;

        if (!result) {
          resolve(null);
          return;
        }

        // Reconstruct chunk
        const grid = new VoxelGrid(chunkSize, chunkSize, chunkSize);
        grid.setData(result.data);

        const chunk: Chunk = {
          coord: result.coord,
          grid,
          loaded: true,
          dirty: true,
          lastAccessed: Date.now()
        };

        resolve(chunk);
      };

      request.onerror = () => {
        console.error('Failed to load chunk:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Delete chunk from IndexedDB
   */
  public async deleteChunk(coord: ChunkCoord): Promise<void> {
    if (!this.db) {
      console.warn('IndexedDB not initialized');
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);
      const key = this.getChunkKey(coord);

      const request = objectStore.delete(key);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to delete chunk:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Check if chunk exists in storage
   */
  public async hasChunk(coord: ChunkCoord): Promise<boolean> {
    if (!this.db) {
      return false;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const objectStore = transaction.objectStore(this.storeName);
      const key = this.getChunkKey(coord);

      const request = objectStore.count(key);

      request.onsuccess = () => {
        resolve(request.result > 0);
      };

      request.onerror = () => {
        console.error('Failed to check chunk:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get all stored chunk coordinates
   */
  public async getAllChunkCoords(): Promise<ChunkCoord[]> {
    if (!this.db) {
      return [];
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const objectStore = transaction.objectStore(this.storeName);

      const request = objectStore.getAllKeys();

      request.onsuccess = () => {
        const coords = request.result.map((key) => {
          const parts = (key as string).split(',').map(Number);
          return { x: parts[0]!, y: parts[1]!, z: parts[2]! };
        });
        resolve(coords);
      };

      request.onerror = () => {
        console.error('Failed to get chunk coords:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Clear all stored chunks
   */
  public async clearAll(): Promise<void> {
    if (!this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);

      const request = objectStore.clear();

      request.onsuccess = () => {
        console.log('Cleared all chunks from storage');
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to clear chunks:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get storage usage info
   */
  public async getStorageInfo(): Promise<{ chunkCount: number; estimatedSize: number }> {
    if (!this.db) {
      return { chunkCount: 0, estimatedSize: 0 };
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const objectStore = transaction.objectStore(this.storeName);

      const countRequest = objectStore.count();

      countRequest.onsuccess = () => {
        const chunkCount = countRequest.result;

        // Estimate size (each chunk is roughly chunkSize^3 bytes)
        // Assuming 32^3 = 32768 bytes per chunk
        const estimatedSize = chunkCount * 32768;

        resolve({ chunkCount, estimatedSize });
      };

      countRequest.onerror = () => {
        console.error('Failed to get storage info:', countRequest.error);
        reject(countRequest.error);
      };
    });
  }

  /**
   * Delete old chunks (LRU policy)
   */
  public async deleteOldestChunks(keepCount: number): Promise<void> {
    if (!this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);
      const index = objectStore.index('timestamp');

      const request = index.openCursor();
      let deleteCount = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result as IDBCursorWithValue | null;

        if (cursor && deleteCount < keepCount) {
          cursor.delete();
          deleteCount++;
          cursor.continue();
        } else {
          console.log(`Deleted ${deleteCount} old chunks`);
          resolve();
        }
      };

      request.onerror = () => {
        console.error('Failed to delete old chunks:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Close database connection
   */
  public close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('IndexedDB connection closed');
    }
  }
}
