import { TILES } from './state.js';

/**
 * Lightweight playable TD engine for preview & exported HTML
 */
export class GameEngine {
  constructor(canvas, project, hud = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.project = project;
    this.hud = hud; // { gold, lives, wave, onGameOver }
    this.tileSize = project.meta.tileSize || 40;
    this.path = [];
    this.enemies = [];
    this.towers = [];
    this.projectiles = [];
    this.particles = [];
    this.gold = project.difficulty.startGold;
    this.lives = project.difficulty.startLives;
    this.waveIndex = -1;
    this.spawning = null;
    this.paused = false;
    this.selectedTowerType = null;
    this.hoverTile = null;
    this.lastTime = 0;
    this.running = false;
    this.bossEnemy = null;

    this._buildPath();
    this._resize();
    this._bind();
  }

  _resize() {
    const { width, height } = this.project.map;
    this.canvas.width = width * this.tileSize;
    this.canvas.height = height * this.tileSize;
  }

  _buildPath() {
    const { width, height, tiles } = this.project.map;
    const walkable = new Set([TILES.path.id, TILES.spawn.id, TILES.end.id]);
    let start = null, end = null;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (tiles[y][x] === TILES.spawn.id) start = { x, y };
        if (tiles[y][x] === TILES.end.id) end = { x, y };
      }
    }
    if (!start || !end) {
      this.path = [];
      return;
    }
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
        this.path = path.reverse();
        return;
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
    this.path = [];
  }

  _bind() {
    this.canvas.addEventListener('click', (e) => this._onClick(e));
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const x = Math.floor(((e.clientX - rect.left) * scaleX) / this.tileSize);
      const y = Math.floor(((e.clientY - rect.top) * scaleY) / this.tileSize);
      this.hoverTile = { x, y };
    });
  }

  _onClick(e) {
    if (!this.selectedTowerType) return;
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const tx = Math.floor(((e.clientX - rect.left) * scaleX) / this.tileSize);
    const ty = Math.floor(((e.clientY - rect.top) * scaleY) / this.tileSize);
    this.tryPlaceTower(tx, ty, this.selectedTowerType);
  }

  tryPlaceTower(tx, ty, towerDef) {
    const { width, height, tiles } = this.project.map;
    if (tx < 0 || ty < 0 || tx >= width || ty >= height) return false;
    const tid = tiles[ty][tx];
    // cannot place on path/spawn/end/water/block
    if ([TILES.path.id, TILES.spawn.id, TILES.end.id, TILES.water.id, TILES.block.id].includes(tid)) return false;
    if (towerDef.isCliffOnly && tid !== TILES.cliff.id) return false;
    if (!towerDef.isCliffOnly && tid === TILES.cliff.id) {
      // allow non-cliff towers on grass only by default; cliff is special
      // actually allow grass
    }
    if (this.towers.some(t => t.tx === tx && t.ty === ty)) return false;
    if (this.gold < towerDef.cost) return false;
    if (this.towers.length >= (this.project.meta.maxTowers || 50)) return false;

    this.gold -= towerDef.cost;
    this.towers.push({
      ...towerDef,
      tx, ty,
      cooldown: 0,
      upgrades: [],
    });
    this._updateHud();
    return true;
  }

  startNextWave() {
    if (this.spawning) return;
    this.waveIndex++;
    if (this.waveIndex >= this.project.waves.length) {
      // victory
      this.hud.onVictory?.();
      return;
    }
    const wave = this.project.waves[this.waveIndex];
    const queue = [];
    wave.entries.forEach(ent => {
      const def = this.project.enemies.find(e => e.id === ent.enemyId);
      if (!def) return;
      for (let i = 0; i < ent.count; i++) {
        queue.push({ def, delay: ent.interval });
      }
    });
    this.spawning = { queue, timer: 0, index: 0 };
    this._updateHud();
  }

  _spawnEnemy(def) {
    if (!this.path.length) return;
    const hp = def.hp * (this.project.difficulty.hpScale || 1);
    const speed = def.speed * (this.project.difficulty.speedScale || 1);
    const enemy = {
      def,
      hp,
      maxHp: hp,
      speed,
      pathIndex: 0,
      x: this.path[0].x + 0.5,
      y: this.path[0].y + 0.5,
      slow: 0,
      poison: 0,
      facing: 1,
    };
    this.enemies.push(enemy);
    if (def.isBoss) this.bossEnemy = enemy;
  }

  update(dt) {
    if (this.paused || !this.running) return;

    // spawn
    if (this.spawning) {
      this.spawning.timer -= dt;
      if (this.spawning.timer <= 0 && this.spawning.index < this.spawning.queue.length) {
        const item = this.spawning.queue[this.spawning.index++];
        this._spawnEnemy(item.def);
        this.spawning.timer = item.delay;
      }
      if (this.spawning.index >= this.spawning.queue.length && this.spawning.timer <= 0) {
        this.spawning = null;
      }
    }

    // enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      // regen
      if (e.def.regen) e.hp = Math.min(e.maxHp, e.hp + e.def.regen * dt);
      // poison
      if (e.poison > 0) {
        e.hp -= e.poison * dt;
        e.poison -= dt;
      }
      const spd = e.speed * (e.slow > 0 ? 0.5 : 1);
      if (e.slow > 0) e.slow -= dt;

      const target = this.path[e.pathIndex];
      if (!target) {
        this.enemies.splice(i, 1);
        continue;
      }
      const tx = target.x + 0.5, ty = target.y + 0.5;
      const dx = tx - e.x, dy = ty - e.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 0.05) {
        e.pathIndex++;
        if (e.pathIndex >= this.path.length) {
          // reached end
          this.lives -= e.def.isBoss ? 5 : 1;
          this.enemies.splice(i, 1);
          if (this.bossEnemy === e) this.bossEnemy = null;
          this._updateHud();
          if (this.lives <= 0) {
            this.running = false;
            this.hud.onGameOver?.();
          }
          continue;
        }
      } else {
        e.x += (dx / dist) * spd * dt;
        e.y += (dy / dist) * spd * dt;
        if (Math.abs(dx) > 0.01) e.facing = dx >= 0 ? 1 : -1;
      }
      if (e.hp <= 0) {
        const reward = Math.floor(e.def.reward * (this.project.difficulty.rewardScale || 1));
        this.gold += reward;
        this.enemies.splice(i, 1);
        if (this.bossEnemy === e) this.bossEnemy = null;
        this._updateHud();
        // particles
        if (this.project.meta.enableParticles) {
          for (let p = 0; p < 6; p++) {
            this.particles.push({
              x: e.x * this.tileSize,
              y: e.y * this.tileSize,
              vx: (Math.random() - 0.5) * 80,
              vy: (Math.random() - 0.5) * 80,
              life: 0.4,
              color: e.def.color,
            });
          }
        }
      }
    }

    // towers attack
    this.towers.forEach(t => {
      t.cooldown -= dt;
      if (t.cooldown > 0) return;
      const range = t.range;
      let best = null, bestDist = Infinity;
      for (const e of this.enemies) {
        // type check
        if (e.def.type === 'ground' && !t.canAttackGround) continue;
        if (e.def.type === 'air' && !t.canAttackAir) continue;
        if (e.def.type === 'ghost' && !t.canAttackGhost) continue;
        const d = Math.hypot(e.x - (t.tx + 0.5), e.y - (t.ty + 0.5));
        if (d <= range && d < bestDist) {
          best = e;
          bestDist = d;
        }
      }
      if (best) {
        t.cooldown = 1 / (t.attackSpeed || 1);
        this.projectiles.push({
          x: t.tx + 0.5,
          y: t.ty + 0.5,
          target: best,
          speed: t.projectileSpeed || 8,
          damage: t.damage,
          color: t.color,
          effects: t.effects || [],
          tower: t,
        });
      }
    });

    // projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      if (!this.enemies.includes(p.target) || p.target.hp <= 0) {
        this.projectiles.splice(i, 1);
        continue;
      }
      const dx = p.target.x - p.x, dy = p.target.y - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 0.15) {
        let dmg = p.damage - (p.target.def.armor || 0);
        if (dmg < 1) dmg = 1;
        p.target.hp -= dmg;
        // effects
        (p.effects || []).forEach(ef => {
          if (ef.type === 'slow') p.target.slow = Math.max(p.target.slow, ef.value || 1);
          if (ef.type === 'poison') p.target.poison = Math.max(p.target.poison, ef.value || 2);
          if (ef.type === 'splash') {
            this.enemies.forEach(oe => {
              if (oe === p.target) return;
              const d = Math.hypot(oe.x - p.target.x, oe.y - p.target.y);
              if (d < 1.2) oe.hp -= dmg * 0.4;
            });
          }
        });
        this.projectiles.splice(i, 1);
      } else {
        p.x += (dx / dist) * p.speed * dt;
        p.y += (dy / dist) * p.speed * dt;
      }
    }

    // particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  render() {
    const ctx = this.ctx;
    const ts = this.tileSize;
    const { width, height, tiles } = this.project.map;

    // background
    ctx.fillStyle = this.project.meta.bgColor || '#1a1a2e';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // tiles
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tid = tiles[y][x];
        const tile = Object.values(TILES).find(t => t.id === tid) || TILES.grass;
        ctx.fillStyle = tile.color;
        ctx.fillRect(x * ts, y * ts, ts, ts);
      }
    }

    // path highlight
    if (this.project.meta.showPath && this.path.length) {
      ctx.strokeStyle = this.project.meta.pathColor || '#4a4a6a';
      ctx.lineWidth = ts * 0.35;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      this.path.forEach((p, i) => {
        const px = p.x * ts + ts / 2, py = p.y * ts + ts / 2;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
    }

    // towers
    this.towers.forEach(t => {
      const cx = t.tx * ts + ts / 2, cy = t.ty * ts + ts / 2;
      // face nearest enemy
      let face = 1;
      let bestD = Infinity;
      for (const e of this.enemies) {
        const d = Math.hypot(e.x - (t.tx + 0.5), e.y - (t.ty + 0.5));
        if (d < bestD) { bestD = d; face = (e.x >= t.tx + 0.5) ? 1 : -1; }
      }
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(face, 1);
      ctx.font = `${ts * 0.7}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(t.emoji || '🗼', 0, 0);
      ctx.restore();
    });

    // enemies
    this.enemies.forEach(e => {
      const px = e.x * ts, py = e.y * ts;
      ctx.save();
      ctx.translate(px, py);
      ctx.scale(e.facing || 1, 1);
      ctx.globalAlpha = e.def.type === 'ghost' ? 0.8 : 1;
      ctx.font = `${ts * 0.65}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(e.def.emoji || '👾', 0, 0);
      ctx.globalAlpha = 1;
      ctx.setTransform(1,0,0,1,0,0);
      // hp bar
      const barW = ts * 0.55;
      ctx.fillStyle = '#333';
      ctx.fillRect(px - barW / 2, py - ts * 0.48, barW, 5);
      ctx.fillStyle = e.def.isBoss ? (e.def.bossBarColor || '#e63946') : '#00b894';
      ctx.fillRect(px - barW / 2, py - ts * 0.48, barW * (e.hp / e.maxHp), 5);
      ctx.restore();
    });

    // boss bar (top)
    if (this.bossEnemy && this.bossEnemy.hp > 0) {
      const bw = this.canvas.width * 0.6;
      const bx = (this.canvas.width - bw) / 2;
      const by = 10;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(bx - 4, by - 4, bw + 8, 22);
      ctx.fillStyle = '#333';
      ctx.fillRect(bx, by, bw, 14);
      ctx.fillStyle = this.bossEnemy.def.bossBarColor || '#e63946';
      ctx.fillRect(bx, by, bw * (this.bossEnemy.hp / this.bossEnemy.maxHp), 14);
      ctx.fillStyle = '#fff';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`👑 ${this.bossEnemy.def.name}`, this.canvas.width / 2, by + 11);
    }

    // projectiles
    this.projectiles.forEach(p => {
      ctx.fillStyle = p.color || '#fdcb6e';
      ctx.beginPath();
      ctx.arc(p.x * ts, p.y * ts, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // particles
    this.particles.forEach(p => {
      ctx.globalAlpha = Math.max(0, p.life * 2);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 3, 3);
      ctx.globalAlpha = 1;
    });

    // hover placement
    if (this.selectedTowerType && this.hoverTile) {
      const { x, y } = this.hoverTile;
      ctx.strokeStyle = 'rgba(0,206,201,0.8)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x * ts + 2, y * ts + 2, ts - 4, ts - 4);
      // range circle
      ctx.beginPath();
      ctx.arc(x * ts + ts / 2, y * ts + ts / 2, this.selectedTowerType.range * ts, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(108,92,231,0.35)';
      ctx.stroke();
    }
  }

  _updateHud() {
    if (this.hud.gold) this.hud.gold.textContent = this.gold;
    if (this.hud.lives) this.hud.lives.textContent = this.lives;
    if (this.hud.wave) this.hud.wave.textContent = `${Math.max(0, this.waveIndex + 1)} / ${this.project.waves.length}`;
  }

  start() {
    this.running = true;
    this.lastTime = performance.now();
    this._updateHud();
    const loop = (now) => {
      if (!this.running) return;
      const dt = Math.min(0.05, (now - this.lastTime) / 1000);
      this.lastTime = now;
      this.update(dt);
      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
  }

  togglePause() {
    this.paused = !this.paused;
  }
}
