import { WorkerMessage, WorkerMessageType } from './CAWorker';

/**
 * Worker pool for managing multiple Web Workers
 */
export class WorkerPool {
  private workers: Worker[] = [];
  private availableWorkers: Worker[] = [];
  private taskQueue: Array<{
    message: WorkerMessage;
    resolve: (value: any) => void;
    reject: (reason: any) => void;
  }> = [];

  constructor(workerCount: number, workerUrl: string) {
    // Create workers
    for (let i = 0; i < workerCount; i++) {
      const worker = new Worker(workerUrl, { type: 'module' });
      this.workers.push(worker);
      this.availableWorkers.push(worker);

      // Handle worker messages
      worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
        this.handleWorkerMessage(worker, event.data);
      };

      // Handle worker errors
      worker.onerror = (error) => {
        console.error('Worker error:', error);
      };
    }
  }

  /**
   * Handle message from worker
   */
  private handleWorkerMessage(worker: Worker, _message: WorkerMessage): void {
    // Worker is now available
    this.availableWorkers.push(worker);

    // Process next task in queue
    this.processNextTask();
  }

  /**
   * Process next task in queue
   */
  private processNextTask(): void {
    if (this.taskQueue.length === 0 || this.availableWorkers.length === 0) {
      return;
    }

    const task = this.taskQueue.shift()!;
    const worker = this.availableWorkers.shift()!;

    // Send message to worker
    worker.postMessage(task.message);
  }

  /**
   * Send message to a worker
   */
  public async sendMessage(message: WorkerMessage): Promise<any> {
    return new Promise((resolve, reject) => {
      this.taskQueue.push({ message, resolve, reject });
      this.processNextTask();
    });
  }

  /**
   * Broadcast message to all workers
   */
  public async broadcastMessage(message: WorkerMessage): Promise<any[]> {
    const promises = this.workers.map((worker) => {
      return new Promise((resolve) => {
        const handler = (event: MessageEvent<WorkerMessage>) => {
          worker.removeEventListener('message', handler);
          resolve(event.data);
        };
        worker.addEventListener('message', handler);
        worker.postMessage(message);
      });
    });

    return Promise.all(promises);
  }

  /**
   * Get number of workers
   */
  public getWorkerCount(): number {
    return this.workers.length;
  }

  /**
   * Get number of available workers
   */
  public getAvailableWorkerCount(): number {
    return this.availableWorkers.length;
  }

  /**
   * Terminate all workers
   */
  public terminate(): void {
    this.workers.forEach((worker) => worker.terminate());
    this.workers = [];
    this.availableWorkers = [];
    this.taskQueue = [];
  }
}

/**
 * CA Simulator with Web Worker support
 */
export class CASimulatorWorker {
  private worker: Worker;
  private width: number;
  private height: number;
  private depth: number;
  private tick: number = 0;
  private isInitialized: boolean = false;

  constructor(width: number, height: number, depth: number) {
    this.width = width;
    this.height = height;
    this.depth = depth;

    // Create worker
    this.worker = new Worker(
      new URL('./CAWorker.ts', import.meta.url),
      { type: 'module' }
    );

    // Handle worker messages
    this.worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      this.handleWorkerMessage(event.data);
    };

    // Handle worker errors
    this.worker.onerror = (error) => {
      console.error('CA Worker error:', error);
    };
  }

  /**
   * Handle message from worker
   */
  private handleWorkerMessage(message: WorkerMessage): void {
    switch (message.type) {
      case WorkerMessageType.INIT:
        this.isInitialized = true;
        break;
      case WorkerMessageType.STEP_COMPLETE:
        this.tick = message.data.tick;
        break;
    }
  }

  /**
   * Initialize worker with grid data
   */
  public async init(gridData?: Uint8Array): Promise<void> {
    return new Promise((resolve) => {
      const handler = (event: MessageEvent<WorkerMessage>) => {
        if (event.data.type === WorkerMessageType.INIT) {
          this.worker.removeEventListener('message', handler);
          this.isInitialized = true;
          resolve();
        }
      };

      this.worker.addEventListener('message', handler);
      this.worker.postMessage({
        type: WorkerMessageType.INIT,
        data: {
          width: this.width,
          height: this.height,
          depth: this.depth,
          gridData,
        },
      });
    });
  }

  /**
   * Perform one CA simulation step
   */
  public async step(): Promise<Uint8Array> {
    if (!this.isInitialized) {
      throw new Error('Worker not initialized');
    }

    return new Promise((resolve) => {
      const handler = (event: MessageEvent<WorkerMessage>) => {
        if (event.data.type === WorkerMessageType.STEP_COMPLETE) {
          this.worker.removeEventListener('message', handler);
          this.tick = event.data.data.tick;
          resolve(event.data.data.gridData);
        }
      };

      this.worker.addEventListener('message', handler);
      this.worker.postMessage({
        type: WorkerMessageType.STEP,
      });
    });
  }

  /**
   * Get current grid data
   */
  public async getGridData(): Promise<Uint8Array> {
    if (!this.isInitialized) {
      throw new Error('Worker not initialized');
    }

    return new Promise((resolve) => {
      const handler = (event: MessageEvent<WorkerMessage>) => {
        if (event.data.type === WorkerMessageType.GRID_DATA) {
          this.worker.removeEventListener('message', handler);
          resolve(event.data.data.gridData);
        }
      };

      this.worker.addEventListener('message', handler);
      this.worker.postMessage({
        type: WorkerMessageType.GET_GRID,
      });
    });
  }

  /**
   * Get current tick
   */
  public getTick(): number {
    return this.tick;
  }

  /**
   * Terminate worker
   */
  public terminate(): void {
    this.worker.terminate();
  }
}
