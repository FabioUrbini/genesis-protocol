/**
 * Game2D - 2D Cellular Automaton game mode
 * A large 2D world (2000×2000 cells) rendered on a 2D canvas with pan/zoom support.
 * Uses Conway's Game of Life rules (B3/S23).
 */

/** Cell states: classic Game of Life (Dead / Alive) */
export enum CellState {
  Dead  = 0,
  Alive = 1,
}

const GRID_WIDTH  = 2000;
const GRID_HEIGHT = 2000;

/**
 * Conway's Game of Life rules (B3/S23)
 * Birth: exactly 3 alive neighbors
 * Survival: 2 or 3 alive neighbors
 */
function nextState2D(current: number, alive: number): number {
  if (current === CellState.Alive) {
    return (alive === 2 || alive === 3) ? CellState.Alive : CellState.Dead;
  } else {
    return alive === 3 ? CellState.Alive : CellState.Dead;
  }
}

export class Game2D {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  // Double-buffered flat Uint8Array grids
  private current: Uint8Array;
  private next: Uint8Array;

  private tickCount: number = 0;
  private isRunning: boolean = false;
  private animationId: number | null = null;
  private caIntervalId: number | null = null;

  // Viewport / pan-zoom state
  private offsetX: number = 0;
  private offsetY: number = 0;
  private cellSize: number = 1; // pixels per cell (start at 1 for large world)
  private readonly MIN_CELL_SIZE = 1;
  private readonly MAX_CELL_SIZE = 32;

  // Pan drag state
  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private dragOffsetX: number = 0;
  private dragOffsetY: number = 0;

  // Rendering
  private needsRender: boolean = true;
  private lastRenderTime: number = 0;

  // Simulation speed (ms per CA step)
  private caIntervalMs: number = 50;

  // Off-screen canvas for grid rendering
  private offscreen: HTMLCanvasElement;
  private offCtx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D rendering context');
    this.ctx = ctx;

    // Create off-screen canvas matching grid
    this.offscreen = document.createElement('canvas');
    this.offscreen.width  = GRID_WIDTH;
    this.offscreen.height = GRID_HEIGHT;
    const offCtx = this.offscreen.getContext('2d');
    if (!offCtx) throw new Error('Failed to get off-screen 2D context');
    this.offCtx = offCtx;

    this.current = new Uint8Array(GRID_WIDTH * GRID_HEIGHT);
    this.next    = new Uint8Array(GRID_WIDTH * GRID_HEIGHT);

    this.initializePattern();
    this.centerView();
    this.setupInput();
    this.setupKeyboard();
    this.updateHUD();
  }

  // ─── Initialization ────────────────────────────────────────────────────────

  private initializePattern(): void {
    // Classic random soup: ~30% alive cells
    for (let i = 0; i < GRID_WIDTH * GRID_HEIGHT; i++) {
      this.current[i] = Math.random() < 0.30 ? CellState.Alive : CellState.Dead;
    }
    this.needsRender = true;
  }

  private centerView(): void {
    // Center the grid in the canvas
    const w = this.canvas.width  || window.innerWidth;
    const h = this.canvas.height || window.innerHeight;
    this.offsetX = Math.round((w - GRID_WIDTH  * this.cellSize) / 2);
    this.offsetY = Math.round((h - GRID_HEIGHT * this.cellSize) / 2);
  }

  // ─── CA Simulation ─────────────────────────────────────────────────────────

  private stepCA(): void {
    const W = GRID_WIDTH;
    const H = GRID_HEIGHT;
    const cur = this.current;
    const nxt = this.next;

    // Pre-compute row offsets for toroidal wrap
    const rowPrev = new Int32Array(H);
    const rowNext = new Int32Array(H);
    for (let y = 0; y < H; y++) {
      rowPrev[y] = ((y - 1 + H) % H) * W;
      rowNext[y] = ((y + 1) % H) * W;
    }

    for (let y = 0; y < H; y++) {
      const rowY  = y * W;
      const rowYm = rowPrev[y];
      const rowYp = rowNext[y];

      for (let x = 0; x < W; x++) {
        const xm = x === 0 ? W - 1 : x - 1;
        const xp = x === W - 1 ? 0 : x + 1;

        // 8 Moore neighbors — no array allocation
        const n0 = cur[rowYm + xm];
        const n1 = cur[rowYm + x];
        const n2 = cur[rowYm + xp];
        const n3 = cur[rowY  + xm];
        const n4 = cur[rowY  + xp];
        const n5 = cur[rowYp + xm];
        const n6 = cur[rowYp + x];
        const n7 = cur[rowYp + xp];

        // Count alive neighbors (unrolled)
        const alive = (n0 === 1 ? 1 : 0) + (n1 === 1 ? 1 : 0) + (n2 === 1 ? 1 : 0)
                    + (n3 === 1 ? 1 : 0) + (n4 === 1 ? 1 : 0) + (n5 === 1 ? 1 : 0)
                    + (n6 === 1 ? 1 : 0) + (n7 === 1 ? 1 : 0);

        nxt[rowY + x] = nextState2D(cur[rowY + x], alive);
      }
    }

    // Swap buffers
    const tmp = this.current;
    this.current = this.next;
    this.next = tmp;

    this.tickCount++;
    this.needsRender = true;

    // Throttle HUD DOM updates — only every 10 ticks
    if (this.tickCount % 10 === 0) this.updateHUD();
  }

  // ─── Rendering ─────────────────────────────────────────────────────────────

  private renderGrid(): void {
    const W = GRID_WIDTH;
    const H = GRID_HEIGHT;
    const imageData = this.offCtx.createImageData(W, H);
    const pixels = imageData.data;
    const cur = this.current;

    for (let i = 0; i < W * H; i++) {
      const state = cur[i];
      // Dead = black, Alive = bright green (classic GoL look)
      const alive = state === CellState.Alive;
      const r = alive ? 80  : 10;
      const g = alive ? 220 : 12;
      const b = alive ? 80  : 10;

      const p = i * 4;
      pixels[p]     = r;
      pixels[p + 1] = g;
      pixels[p + 2] = b;
      pixels[p + 3] = 255;
    }

    this.offCtx.putImageData(imageData, 0, 0);
    this.needsRender = false;
  }

  private draw(): void {
    const canvas = this.canvas;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    ctx.fillStyle = '#05050f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (this.needsRender) {
      this.renderGrid();
    }

    // Draw the off-screen canvas scaled to current cellSize
    ctx.imageSmoothingEnabled = this.cellSize < 2;
    ctx.drawImage(
      this.offscreen,
      this.offsetX,
      this.offsetY,
      GRID_WIDTH  * this.cellSize,
      GRID_HEIGHT * this.cellSize
    );

    // Grid border
    ctx.strokeStyle = 'rgba(80, 227, 194, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      this.offsetX - 0.5,
      this.offsetY - 0.5,
      GRID_WIDTH  * this.cellSize + 1,
      GRID_HEIGHT * this.cellSize + 1
    );
  }

  // ─── Game Loop ─────────────────────────────────────────────────────────────

  private renderLoop(): void {
    if (!this.isRunning) return;
    const now = performance.now();

    // Render at ~60 FPS
    if (now - this.lastRenderTime >= 16) {
      this.draw();
      this.lastRenderTime = now;
    }

    this.animationId = requestAnimationFrame(() => this.renderLoop());
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    // Resize canvas to fill viewport
    this.resizeCanvas();

    // Start CA simulation at fixed interval
    this.caIntervalId = window.setInterval(() => this.stepCA(), this.caIntervalMs);

    // Start render loop
    this.renderLoop();
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this.caIntervalId !== null) {
      clearInterval(this.caIntervalId);
      this.caIntervalId = null;
    }
  }

  public reset(): void {
    this.current.fill(0);
    this.next.fill(0);
    this.tickCount = 0;
    this.initializePattern();
    this.updateHUD();
  }

  public dispose(): void {
    this.stop();
    this.removeInput();
  }

  // ─── Zoom / Pan ─────────────────────────────────────────────────────────────

  private zoom(factor: number, pivotX: number, pivotY: number): void {
    const oldCell = this.cellSize;
    const newCell = Math.max(this.MIN_CELL_SIZE, Math.min(this.MAX_CELL_SIZE, this.cellSize * factor));
    if (newCell === oldCell) return;

    // Zoom toward pivot point
    const scale = newCell / oldCell;
    this.offsetX = Math.round(pivotX - (pivotX - this.offsetX) * scale);
    this.offsetY = Math.round(pivotY - (pivotY - this.offsetY) * scale);
    this.cellSize = newCell;
    this.needsRender = true;
  }

  // ─── Speed control ──────────────────────────────────────────────────────────

  private setSpeed(ms: number): void {
    this.caIntervalMs = Math.max(16, ms);
    if (this.caIntervalId !== null) {
      clearInterval(this.caIntervalId);
      this.caIntervalId = window.setInterval(() => this.stepCA(), this.caIntervalMs);
    }
    this.updateHUD();
  }

  // ─── HUD ────────────────────────────────────────────────────────────────────

  private updateHUD(): void {
    const tickEl = document.getElementById('tick-2d');
    const speedEl = document.getElementById('speed-2d');
    const sizeEl = document.getElementById('size-2d');
    if (tickEl)  tickEl.textContent  = this.tickCount.toString();
    if (speedEl) speedEl.textContent = `${this.caIntervalMs}ms`;
    if (sizeEl)  sizeEl.textContent  = `${GRID_WIDTH}×${GRID_HEIGHT}`;
  }

  // ─── Canvas resize ──────────────────────────────────────────────────────────

  private resizeCanvas(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width  = w;
      this.canvas.height = h;
    }
    this.centerView();
    this.needsRender = true;
  }

  // ─── Input ──────────────────────────────────────────────────────────────────

  private _onWheel   = (e: WheelEvent)      => this.onWheel(e);
  private _onMouseDown = (e: MouseEvent)    => this.onMouseDown(e);
  private _onMouseMove = (e: MouseEvent)    => this.onMouseMove(e);
  private _onMouseUp   = (_e: MouseEvent)   => this.onMouseUp();
  private _onResize    = ()                 => this.resizeCanvas();
  private _onKeyDown   = (e: KeyboardEvent) => this.onKeyDown(e);

  private setupInput(): void {
    this.canvas.addEventListener('wheel',     this._onWheel,    { passive: false });
    this.canvas.addEventListener('mousedown', this._onMouseDown);
    this.canvas.addEventListener('mousemove', this._onMouseMove);
    this.canvas.addEventListener('mouseup',   this._onMouseUp);
    window.addEventListener('resize',         this._onResize);
  }

  private setupKeyboard(): void {
    document.addEventListener('keydown', this._onKeyDown);
  }

  private removeInput(): void {
    this.canvas.removeEventListener('wheel',     this._onWheel);
    this.canvas.removeEventListener('mousedown', this._onMouseDown);
    this.canvas.removeEventListener('mousemove', this._onMouseMove);
    this.canvas.removeEventListener('mouseup',   this._onMouseUp);
    window.removeEventListener('resize',         this._onResize);
    document.removeEventListener('keydown',      this._onKeyDown);
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    this.zoom(factor, px, py);
  }

  private onMouseDown(e: MouseEvent): void {
    if (e.button === 0 || e.button === 1) {
      this.isDragging  = true;
      this.dragStartX  = e.clientX;
      this.dragStartY  = e.clientY;
      this.dragOffsetX = this.offsetX;
      this.dragOffsetY = this.offsetY;
      this.canvas.style.cursor = 'grabbing';
    }
  }

  private onMouseMove(e: MouseEvent): void {
    if (!this.isDragging) return;
    this.offsetX = this.dragOffsetX + (e.clientX - this.dragStartX);
    this.offsetY = this.dragOffsetY + (e.clientY - this.dragStartY);
    this.needsRender = true;
  }

  private onMouseUp(): void {
    this.isDragging = false;
    this.canvas.style.cursor = 'crosshair';
  }

  private onKeyDown(e: KeyboardEvent): void {
    switch (e.key.toLowerCase()) {
      case 'r':
        this.reset();
        break;
      case 'p':
      case ' ':
        e.preventDefault();
        if (this.caIntervalId !== null) {
          clearInterval(this.caIntervalId);
          this.caIntervalId = null;
        } else {
          this.caIntervalId = window.setInterval(() => this.stepCA(), this.caIntervalMs);
        }
        break;
      case '+':
      case '=':
        this.setSpeed(this.caIntervalMs / 2);
        break;
      case '-':
        this.setSpeed(this.caIntervalMs * 2);
        break;
      case '1': this.setSpeed(500); break;
      case '2': this.setSpeed(200); break;
      case '3': this.setSpeed(100); break;
      case '4': this.setSpeed(50);  break;
      case '5': this.setSpeed(20);  break;
      case '0': this.setSpeed(16);  break;
      case 'arrowup':    this.offsetY += 50; this.needsRender = true; break;
      case 'arrowdown':  this.offsetY -= 50; this.needsRender = true; break;
      case 'arrowleft':  this.offsetX += 50; this.needsRender = true; break;
      case 'arrowright': this.offsetX -= 50; this.needsRender = true; break;
    }
  }
}
