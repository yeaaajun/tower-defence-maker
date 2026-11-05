/**
 * Export project as JSON or standalone playable HTML
 */

export function projectToJSON(project) {
  return JSON.stringify(project, null, 2);
}

export function downloadJSON(project) {
  const blob = new Blob([projectToJSON(project)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${sanitize(project.meta.name || 'td-game')}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function buildPlayableHTML(project) {
  const data = JSON.stringify(project);
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${escapeHtml(project.meta.name || 'Tower Defense')}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0f0f1a;color:#e8e8f0;font-family:system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;min-height:100vh;padding:12px}
h1{font-size:1.4rem;margin-bottom:8px}
#gameWrap{position:relative}
canvas{background:#1a1a2e;border-radius:8px;max-width:100%;display:block}
.hud{display:flex;gap:20px;align-items:center;margin:10px 0;flex-wrap:wrap;justify-content:center}
.hud span{font-weight:600}
.tower-bar{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-bottom:10px;max-width:900px}
.tower-btn{background:#1e1e36;border:2px solid #2a2a4a;color:#e8e8f0;padding:8px 12px;border-radius:8px;cursor:pointer;font-size:0.85rem}
.tower-btn:hover,.tower-btn.active{border-color:#6c5ce7;background:#2a2a4a}
.tower-btn small{display:block;color:#a0a0c0;font-size:0.75rem}
.controls{display:flex;gap:8px}
button{background:#6c5ce7;color:#fff;border:none;padding:8px 14px;border-radius:8px;cursor:pointer;font-weight:500}
button.secondary{background:#2a2a4a}
#msg{margin-top:8px;min-height:24px;color:#00cec9;font-weight:500}
</style>
</head>
<body>
<h1>${escapeHtml(project.meta.name || 'Tower Defense')}</h1>
<p style="color:#a0a0c0;font-size:0.85rem;margin-bottom:8px">${escapeHtml(project.meta.description || '')}</p>
<div class="tower-bar" id="towerBar"></div>
<div class="hud">
  <span>💰 <span id="gold">0</span></span>
  <span>❤️ <span id="lives">0</span></span>
  <span>🌊 <span id="wave">0</span></span>
  <div class="controls">
    <button id="btnWave">다음 웨이브</button>
    <button id="btnPause" class="secondary">일시정지</button>
  </div>
</div>
<div id="gameWrap"><canvas id="c"></canvas></div>
<div id="msg"></div>
<script>
const PROJECT = ${data};

const TILES = {
  grass:0, path:1, cliff:2, water:3, spawn:4, end:5, block:6
};
const TILE_COLORS = {
  0:'#2d6a4f',1:'#6c757d',2:'#8b5e3c',3:'#1d3557',4:'#2a9d8f',5:'#e63946',6:'#343a40'
};

class Game {
  constructor() {
    this.canvas = document.getElementById('c');
    this.ctx = this.canvas.getContext('2d');
    this.ts = PROJECT.meta.tileSize || 40;
    this.path = [];
    this.enemies = [];
    this.towers = [];
    this.projectiles = [];
    this.particles = [];
    this.gold = PROJECT.difficulty.startGold;
    this.lives = PROJECT.difficulty.startLives;
    this.waveIndex = -1;
    this.spawning = null;
    this.paused = false;
    this.selected = null;
    this.hover = null;
    this.running = true;
    this.boss = null;
    this._buildPath();
    this.canvas.width = PROJECT.map.width * this.ts;
    this.canvas.height = PROJECT.map.height * this.ts;
    this._bind();
    this._buildTowerBar();
    this._hud();
    this._loop(performance.now());
  }
  _buildPath() {
    const {width,height,tiles} = PROJECT.map;
    let start=null,end=null;
    for(let y=0;y<height;y++) for(let x=0;x<width;x++){
      if(tiles[y][x]===4) start={x,y};
      if(tiles[y][x]===5) end={x,y};
    }
    if(!start||!end){this.path=[];return;}
    const walk=new Set([1,4,5]);
    const key=p=>p.x+','+p.y;
    const q=[start], came=new Map(); came.set(key(start),null);
    const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
    while(q.length){
      const cur=q.shift();
      if(cur.x===end.x&&cur.y===end.y){
        const path=[]; let c=cur; while(c){path.push(c);c=came.get(key(c));}
        this.path=path.reverse(); return;
      }
      for(const [dx,dy] of dirs){
        const nx=cur.x+dx,ny=cur.y+dy;
        if(nx<0||ny<0||nx>=width||ny>=height) continue;
        if(!walk.has(tiles[ny][nx])) continue;
        const k=nx+','+ny; if(came.has(k)) continue;
        came.set(k,cur); q.push({x:nx,y:ny});
      }
    }
    this.path=[];
  }
  _bind(){
    this.canvas.onclick=e=>{
      if(!this.selected) return;
      const r=this.canvas.getBoundingClientRect();
      const sx=this.canvas.width/r.width, sy=this.canvas.height/r.height;
      const tx=Math.floor(((e.clientX-r.left)*sx)/this.ts);
      const ty=Math.floor(((e.clientY-r.top)*sy)/this.ts);
      this.place(tx,ty);
    };
    this.canvas.onmousemove=e=>{
      const r=this.canvas.getBoundingClientRect();
      const sx=this.canvas.width/r.width, sy=this.canvas.height/r.height;
      this.hover={
        x:Math.floor(((e.clientX-r.left)*sx)/this.ts),
        y:Math.floor(((e.clientY-r.top)*sy)/this.ts)
      };
    };
    document.getElementById('btnWave').onclick=()=>this.nextWave();
    document.getElementById('btnPause').onclick=()=>{this.paused=!this.paused;};
  }
  _buildTowerBar(){
    const bar=document.getElementById('towerBar');
    PROJECT.towers.forEach(t=>{
      const b=document.createElement('button');
      b.className='tower-btn';
      b.innerHTML=escapeHtml(t.name)+'<small>💰'+t.cost+' · ⚔️'+t.damage+'</small>';
      b.onclick=()=>{
        document.querySelectorAll('.tower-btn').forEach(x=>x.classList.remove('active'));
        b.classList.add('active');
        this.selected=t;
      };
      bar.appendChild(b);
    });
  }
  place(tx,ty){
    const t=this.selected; if(!t) return;
    const {width,height,tiles}=PROJECT.map;
    if(tx<0||ty<0||tx>=width||ty>=height) return;
    const tid=tiles[ty][tx];
    if([1,3,4,5,6].includes(tid)) return;
    if(t.isCliffOnly && tid!==2) return;
    if(this.towers.some(x=>x.tx===tx&&x.ty===ty)) return;
    if(this.gold<t.cost) return;
    this.gold-=t.cost;
    this.towers.push({...t,tx,ty,cooldown:0});
    this._hud();
  }
  nextWave(){
    if(this.spawning) return;
    this.waveIndex++;
    if(this.waveIndex>=PROJECT.waves.length){
      document.getElementById('msg').textContent='🎉 승리! 모든 웨이브를 클리어했습니다!';
      this.running=false; return;
    }
    const wave=PROJECT.waves[this.waveIndex];
    const queue=[];
    wave.entries.forEach(ent=>{
      const def=PROJECT.enemies.find(e=>e.id===ent.enemyId);
      if(!def) return;
      for(let i=0;i<ent.count;i++) queue.push({def,delay:ent.interval});
    });
    this.spawning={queue,timer:0,index:0};
    this.gold += wave.bonusGold||0;
    this._hud();
  }
  _spawn(def){
    if(!this.path.length) return;
    const hp=def.hp*(PROJECT.difficulty.hpScale||1);
    const speed=def.speed*(PROJECT.difficulty.speedScale||1);
    const e={def,hp,maxHp:hp,speed,pathIndex:0,x:this.path[0].x+0.5,y:this.path[0].y+0.5,slow:0,poison:0};
    this.enemies.push(e);
    if(def.isBoss) this.boss=e;
  }
  update(dt){
    if(this.paused||!this.running) return;
    if(this.spawning){
      this.spawning.timer-=dt;
      if(this.spawning.timer<=0 && this.spawning.index<this.spawning.queue.length){
        const item=this.spawning.queue[this.spawning.index++];
        this._spawn(item.def);
        this.spawning.timer=item.delay;
      }
      if(this.spawning.index>=this.spawning.queue.length && this.spawning.timer<=0) this.spawning=null;
    }
    for(let i=this.enemies.length-1;i>=0;i--){
      const e=this.enemies[i];
      if(e.def.regen) e.hp=Math.min(e.maxHp,e.hp+e.def.regen*dt);
      if(e.poison>0){e.hp-=e.poison*dt;e.poison-=dt;}
      const spd=e.speed*(e.slow>0?0.5:1);
      if(e.slow>0) e.slow-=dt;
      const target=this.path[e.pathIndex];
      if(!target){this.enemies.splice(i,1);continue;}
      const tx=target.x+0.5,ty=target.y+0.5;
      const dx=tx-e.x,dy=ty-e.y,dist=Math.hypot(dx,dy);
      if(dist<0.05){
        e.pathIndex++;
        if(e.pathIndex>=this.path.length){
          this.lives-=e.def.isBoss?5:1;
          this.enemies.splice(i,1);
          if(this.boss===e) this.boss=null;
          this._hud();
          if(this.lives<=0){
            document.getElementById('msg').textContent='💀 게임 오버';
            this.running=false;
          }
          continue;
        }
      } else {
        e.x+=(dx/dist)*spd*dt; e.y+=(dy/dist)*spd*dt;
      }
      if(e.hp<=0){
        this.gold+=Math.floor(e.def.reward*(PROJECT.difficulty.rewardScale||1));
        this.enemies.splice(i,1);
        if(this.boss===e) this.boss=null;
        this._hud();
      }
    }
    this.towers.forEach(t=>{
      t.cooldown-=dt; if(t.cooldown>0) return;
      let best=null,bd=Infinity;
      for(const e of this.enemies){
        if(e.def.type==='ground'&&!t.canAttackGround) continue;
        if(e.def.type==='air'&&!t.canAttackAir) continue;
        if(e.def.type==='ghost'&&!t.canAttackGhost) continue;
        const d=Math.hypot(e.x-(t.tx+0.5),e.y-(t.ty+0.5));
        if(d<=t.range&&d<bd){best=e;bd=d;}
      }
      if(best){
        t.cooldown=1/(t.attackSpeed||1);
        this.projectiles.push({x:t.tx+0.5,y:t.ty+0.5,target:best,speed:t.projectileSpeed||8,damage:t.damage,color:t.color,effects:t.effects||[]});
      }
    });
    for(let i=this.projectiles.length-1;i>=0;i--){
      const p=this.projectiles[i];
      if(!this.enemies.includes(p.target)||p.target.hp<=0){this.projectiles.splice(i,1);continue;}
      const dx=p.target.x-p.x,dy=p.target.y-p.y,dist=Math.hypot(dx,dy);
      if(dist<0.15){
        let dmg=p.damage-(p.target.def.armor||0); if(dmg<1) dmg=1;
        p.target.hp-=dmg;
        (p.effects||[]).forEach(ef=>{
          if(ef.type==='slow') p.target.slow=Math.max(p.target.slow,ef.value||1);
          if(ef.type==='poison') p.target.poison=Math.max(p.target.poison,ef.value||2);
          if(ef.type==='splash'){
            this.enemies.forEach(oe=>{
              if(oe===p.target) return;
              if(Math.hypot(oe.x-p.target.x,oe.y-p.target.y)<1.2) oe.hp-=dmg*0.4;
            });
          }
        });
        this.projectiles.splice(i,1);
      } else {
        p.x+=(dx/dist)*p.speed*dt; p.y+=(dy/dist)*p.speed*dt;
      }
    }
  }
  render(){
    const ctx=this.ctx, ts=this.ts;
    const {width,height,tiles}=PROJECT.map;
    ctx.fillStyle=PROJECT.meta.bgColor||'#1a1a2e';
    ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    for(let y=0;y<height;y++) for(let x=0;x<width;x++){
      ctx.fillStyle=TILE_COLORS[tiles[y][x]]||'#2d6a4f';
      ctx.fillRect(x*ts,y*ts,ts,ts);
    }
    if(PROJECT.meta.showPath && this.path.length){
      ctx.strokeStyle=PROJECT.meta.pathColor||'#4a4a6a';
      ctx.lineWidth=ts*0.35; ctx.lineCap='round'; ctx.lineJoin='round';
      ctx.beginPath();
      this.path.forEach((p,i)=>{
        const px=p.x*ts+ts/2,py=p.y*ts+ts/2;
        if(i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
      });
      ctx.stroke();
    }
    this.towers.forEach(t=>{
      ctx.fillStyle=t.color;
      ctx.beginPath();
      ctx.arc(t.tx*ts+ts/2,t.ty*ts+ts/2,ts*0.35,0,Math.PI*2);
      ctx.fill();
      ctx.fillStyle='#fff'; ctx.font=(ts*0.3)+'px sans-serif';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('🗼',t.tx*ts+ts/2,t.ty*ts+ts/2);
    });
    this.enemies.forEach(e=>{
      const px=e.x*ts,py=e.y*ts;
      ctx.fillStyle=e.def.color;
      ctx.globalAlpha=e.def.type==='ghost'?0.75:1;
      ctx.beginPath();
      if(e.def.type==='air') ctx.ellipse(px,py,ts*0.3,ts*0.18,0,0,Math.PI*2);
      else ctx.arc(px,py,ts*0.28,0,Math.PI*2);
      ctx.fill();
      ctx.globalAlpha=1;
      const barW=ts*0.5;
      ctx.fillStyle='#333'; ctx.fillRect(px-barW/2,py-ts*0.42,barW,4);
      ctx.fillStyle=e.def.isBoss?(e.def.bossBarColor||'#e63946'):'#00b894';
      ctx.fillRect(px-barW/2,py-ts*0.42,barW*(e.hp/e.maxHp),4);
    });
    if(this.boss&&this.boss.hp>0){
      const bw=this.canvas.width*0.6, bx=(this.canvas.width-bw)/2, by=10;
      ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(bx-4,by-4,bw+8,22);
      ctx.fillStyle='#333'; ctx.fillRect(bx,by,bw,14);
      ctx.fillStyle=this.boss.def.bossBarColor||'#e63946';
      ctx.fillRect(bx,by,bw*(this.boss.hp/this.boss.maxHp),14);
      ctx.fillStyle='#fff'; ctx.font='12px sans-serif'; ctx.textAlign='center';
      ctx.fillText('👑 '+this.boss.def.name,this.canvas.width/2,by+11);
    }
    this.projectiles.forEach(p=>{
      ctx.fillStyle=p.color||'#fdcb6e';
      ctx.beginPath(); ctx.arc(p.x*ts,p.y*ts,4,0,Math.PI*2); ctx.fill();
    });
    if(this.selected&&this.hover){
      ctx.strokeStyle='rgba(0,206,201,0.8)'; ctx.lineWidth=2;
      ctx.strokeRect(this.hover.x*ts+2,this.hover.y*ts+2,ts-4,ts-4);
      ctx.beginPath();
      ctx.arc(this.hover.x*ts+ts/2,this.hover.y*ts+ts/2,this.selected.range*ts,0,Math.PI*2);
      ctx.strokeStyle='rgba(108,92,231,0.35)'; ctx.stroke();
    }
  }
  _hud(){
    document.getElementById('gold').textContent=this.gold;
    document.getElementById('lives').textContent=this.lives;
    document.getElementById('wave').textContent=Math.max(0,this.waveIndex+1)+' / '+PROJECT.waves.length;
  }
  _loop(now){
    if(!this._last) this._last=now;
    const dt=Math.min(0.05,(now-this._last)/1000);
    this._last=now;
    this.update(dt);
    this.render();
    requestAnimationFrame(t=>this._loop(t));
  }
}
function escapeHtml(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
new Game();
</script>
</body>
</html>`;
}

export function downloadHTML(project) {
  const html = buildPlayableHTML(project);
  const blob = new Blob([html], { type: 'text/html' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${sanitize(project.meta.name || 'td-game')}.html`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function sanitize(name) {
  return name.replace(/[^\w\uac00-\ud7a3\- ]+/g, '').trim().replace(/\s+/g, '-') || 'td-game';
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
