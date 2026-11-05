import { TILES, createEmptyMap, syncActiveMap } from './state.js';

export class MapEditor {
  constructor(canvas, project, onChange) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.project = project;
    this.onChange = onChange;
    this.selectedTile = TILES.path.id;
    this.brushSize = 1;
    this.isDrawing = false;
    this.drawValue = null;
    this.tileSize = 36;
    this._bindEvents();
    this.resize();
  }

  _bindEvents() {
    this.canvas.addEventListener('mousedown', (e) => this._onDown(e));
    this.canvas.addEventListener('mousemove', (e) => this._onMove(e));
    this.canvas.addEventListener('mouseup', () => this._onUp());
    this.canvas.addEventListener('mouseleave', () => this._onUp());
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  setProject(project) {
    this.project = project;
    syncActiveMap(project);
    this.resize();
    this.render();
  }

  get map() {
    return this.project.map;
  }

  resize() {
    const { width, height } = this.map;
    this.canvas.width = width * this.tileSize;
    this.canvas.height = height * this.tileSize;
    this.render();
  }

  setSelectedTile(id) { this.selectedTile = id; }
  setBrushSize(s) { this.brushSize = s; }

  clear() {
    this.map.tiles = createEmptyMap(this.map.width, this.map.height);
    this.render();
    this.onChange?.();
  }

  applySize(w, h) {
    const old = this.map.tiles;
    const tiles = createEmptyMap(w, h);
    for (let y = 0; y < Math.min(h, old?.length || 0); y++) {
      for (let x = 0; x < Math.min(w, old[y]?.length || 0); x++) {
        tiles[y][x] = old[y][x];
      }
    }
    this.map.width = w;
    this.map.height = h;
    this.map.tiles = tiles;
    this.resize();
    this.onChange?.();
  }

  _pos(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / this.tileSize);
    const y = Math.floor((e.clientY - rect.top) / this.tileSize);
    return { x, y };
  }

  _paint(x, y, value) {
    const { width, height, tiles } = this.map;
    const r = Math.floor(this.brushSize / 2);
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < width && ny < height) tiles[ny][nx] = value;
      }
    }
  }

  _onDown(e) {
    this.isDrawing = true;
    const { x, y } = this._pos(e);
    this.drawValue = e.button === 2 ? TILES.grass.id : this.selectedTile;
    this._paint(x, y, this.drawValue);
    this.render();
  }
  _onMove(e) {
    if (!this.isDrawing) return;
    const { x, y } = this._pos(e);
    this._paint(x, y, this.drawValue);
    this.render();
  }
  _onUp() {
    if (this.isDrawing) { this.isDrawing = false; this.onChange?.(); }
  }

  render() {
    const { width, height, tiles } = this.map;
    const ts = this.tileSize;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tid = tiles[y][x];
        const tile = Object.values(TILES).find(t => t.id === tid) || TILES.grass;
        ctx.fillStyle = tile.color;
        ctx.fillRect(x * ts, y * ts, ts, ts);
        ctx.strokeStyle = 'rgba(0,0,0,0.12)';
        ctx.strokeRect(x * ts, y * ts, ts, ts);
        if (tile.symbol && tid !== TILES.grass.id) {
          ctx.font = `${Math.floor(ts * 0.45)}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(tile.symbol, x * ts + ts / 2, y * ts + ts / 2);
        }
      }
    }
  }

  findPath() {
    const { width, height, tiles } = this.map;
    const walkable = new Set([TILES.path.id, TILES.spawn.id, TILES.end.id]);
    let start = null, end = null;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (tiles[y][x] === TILES.spawn.id) start = { x, y };
        if (tiles[y][x] === TILES.end.id) end = { x, y };
      }
    }
    if (!start || !end) return null;
    const key = (p) => `${p.x},${p.y}`;
    const queue = [start];
    const came = new Map();
    came.set(key(start), null);
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    while (queue.length) {
      const cur = queue.shift();
      if (cur.x === end.x && cur.y === end.y) {
        const path = [];
        let c = cur;
        while (c) { path.push(c); c = came.get(key(c)); }
        return path.reverse();
      }
      for (const [dx, dy] of dirs) {
        const nx = cur.x + dx, ny = cur.y + dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        if (!walkable.has(tiles[ny][nx])) continue;
        const k = `${nx},${ny}`;
        if (came.has(k)) continue;
        came.set(k, cur);
        queue.push({ x: nx, y: ny });
      }
    }
    return null;
  }
}

export function renderTilePalette(container, selectedId, onSelect) {
  container.innerHTML = '';
  Object.values(TILES).forEach(tile => {
    const btn = document.createElement('button');
    btn.className = 'tile-btn' + (tile.id === selectedId ? ' active' : '');
    btn.style.background = tile.color;
    btn.innerHTML = `${tile.symbol}<span>${tile.name}</span>`;
    btn.onclick = () => onSelect(tile.id);
    container.appendChild(btn);
  });
}
