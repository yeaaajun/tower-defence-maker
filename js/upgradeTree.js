/**
 * Branching upgrade tree editor (canvas-based node graph)
 */
export class UpgradeTreeEditor {
  constructor(canvas, detailEl, project, onChange) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.detailEl = detailEl;
    this.project = project;
    this.onChange = onChange;
    this.towerId = null;
    this.selectedNodeId = null;
    this.dragging = null;
    this.offset = { x: 0, y: 0 };
    this.scale = 1;
    this.connectingFrom = null;
    this.nodeRadius = 28;

    this._bind();
    this._resize();
  }

  _bind() {
    this.canvas.addEventListener('mousedown', (e) => this._onDown(e));
    this.canvas.addEventListener('mousemove', (e) => this._onMove(e));
    this.canvas.addEventListener('mouseup', (e) => this._onUp(e));
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.scale = Math.max(0.5, Math.min(2, this.scale - e.deltaY * 0.001));
      this.render();
    }, { passive: false });
    window.addEventListener('resize', () => this._resize());
  }

  _resize() {
    const wrap = this.canvas.parentElement;
    this.canvas.width = wrap.clientWidth || 800;
    this.canvas.height = Math.max(500, wrap.clientHeight || 500);
    this.render();
  }

  setProject(project) {
    this.project = project;
    this.towerId = null;
    this.selectedNodeId = null;
    this.render();
    this.renderDetail();
  }

  setTower(towerId) {
    this.towerId = towerId;
    if (towerId && !this.project.upgradeTrees[towerId]) {
      this.project.upgradeTrees[towerId] = { nodes: [], edges: [] };
    }
    this.selectedNodeId = null;
    this.render();
    this.renderDetail();
  }

  getTree() {
    if (!this.towerId) return null;
    return this.project.upgradeTrees[this.towerId];
  }

  addNode() {
    const tree = this.getTree();
    if (!tree) return;
    const id = tree.nodes.length ? Math.max(...tree.nodes.map(n => n.id)) + 1 : 1;
    const node = {
      id,
      x: 150 + (tree.nodes.length % 5) * 120,
      y: 100 + Math.floor(tree.nodes.length / 5) * 100,
      name: `업그레이드 ${id}`,
      cost: 50,
      damageBonus: 5,
      rangeBonus: 0,
      attackSpeedBonus: 0,
      description: '',
      isRoot: tree.nodes.length === 0,
    };
    tree.nodes.push(node);
    this.selectedNodeId = id;
    this.render();
    this.renderDetail();
    this.onChange?.();
  }

  clearTree() {
    if (!this.towerId) return;
    if (!confirm('이 타워의 업그레이드 트리를 초기화할까요?')) return;
    this.project.upgradeTrees[this.towerId] = { nodes: [], edges: [] };
    this.selectedNodeId = null;
    this.render();
    this.renderDetail();
    this.onChange?.();
  }

  _pos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - this.offset.x) / this.scale,
      y: (e.clientY - rect.top - this.offset.y) / this.scale,
    };
  }

  _hitNode(p) {
    const tree = this.getTree();
    if (!tree) return null;
    for (let i = tree.nodes.length - 1; i >= 0; i--) {
      const n = tree.nodes[i];
      const dx = p.x - n.x, dy = p.y - n.y;
      if (dx * dx + dy * dy <= this.nodeRadius * this.nodeRadius) return n;
    }
    return null;
  }

  _onDown(e) {
    const p = this._pos(e);
    const node = this._hitNode(p);
    if (e.shiftKey && node) {
      // start connection
      this.connectingFrom = node.id;
      return;
    }
    if (node) {
      this.selectedNodeId = node.id;
      this.dragging = { id: node.id, ox: p.x - node.x, oy: p.y - node.y };
      this.renderDetail();
    } else {
      this.selectedNodeId = null;
      this.dragging = { pan: true, sx: e.clientX - this.offset.x, sy: e.clientY - this.offset.y };
      this.renderDetail();
    }
    this.render();
  }

  _onMove(e) {
    if (!this.dragging) {
      if (this.connectingFrom) this.render(); // redraw line preview later if needed
      return;
    }
    if (this.dragging.pan) {
      this.offset.x = e.clientX - this.dragging.sx;
      this.offset.y = e.clientY - this.dragging.sy;
      this.render();
      return;
    }
    const tree = this.getTree();
    const node = tree?.nodes.find(n => n.id === this.dragging.id);
    if (node) {
      const p = this._pos(e);
      node.x = p.x - this.dragging.ox;
      node.y = p.y - this.dragging.oy;
      this.render();
    }
  }

  _onUp(e) {
    if (this.connectingFrom) {
      const p = this._pos(e);
      const target = this._hitNode(p);
      const tree = this.getTree();
      if (target && target.id !== this.connectingFrom && tree) {
        const exists = tree.edges.some(
          ed => ed.from === this.connectingFrom && ed.to === target.id
        );
        if (!exists) {
          tree.edges.push({ from: this.connectingFrom, to: target.id });
          this.onChange?.();
        }
      }
      this.connectingFrom = null;
      this.render();
    }
    this.dragging = null;
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#16162a';
    ctx.fillRect(0, 0, w, h);

    // grid
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    const tree = this.getTree();
    if (!tree) {
      ctx.fillStyle = '#a0a0c0';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('타워를 선택하세요', w / 2, h / 2);
      return;
    }

    ctx.save();
    ctx.translate(this.offset.x, this.offset.y);
    ctx.scale(this.scale, this.scale);

    // edges
    ctx.strokeStyle = '#6c5ce7';
    ctx.lineWidth = 2;
    tree.edges.forEach(ed => {
      const a = tree.nodes.find(n => n.id === ed.from);
      const b = tree.nodes.find(n => n.id === ed.to);
      if (!a || !b) return;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      // arrow
      const angle = Math.atan2(b.y - a.y, b.x - a.x);
      const ax = b.x - Math.cos(angle) * this.nodeRadius;
      const ay = b.y - Math.sin(angle) * this.nodeRadius;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax - 10 * Math.cos(angle - 0.4), ay - 10 * Math.sin(angle - 0.4));
      ctx.lineTo(ax - 10 * Math.cos(angle + 0.4), ay - 10 * Math.sin(angle + 0.4));
      ctx.closePath();
      ctx.fillStyle = '#6c5ce7';
      ctx.fill();
    });

    // nodes
    tree.nodes.forEach(n => {
      const selected = n.id === this.selectedNodeId;
      ctx.beginPath();
      ctx.arc(n.x, n.y, this.nodeRadius, 0, Math.PI * 2);
      ctx.fillStyle = n.isRoot ? '#00cec9' : '#6c5ce7';
      ctx.fill();
      if (selected) {
        ctx.strokeStyle = '#fdcb6e';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      ctx.fillStyle = '#fff';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = n.name.length > 8 ? n.name.slice(0, 7) + '…' : n.name;
      ctx.fillText(label, n.x, n.y - 4);
      ctx.font = '10px sans-serif';
      ctx.fillText(`💰${n.cost}`, n.x, n.y + 10);
    });

    ctx.restore();

    // help
    ctx.fillStyle = '#a0a0c0';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('드래그: 이동 · Shift+드래그: 연결 · 휠: 줌 · 빈 곳 드래그: 패닝', 12, h - 12);
  }

  renderDetail() {
    const tree = this.getTree();
    const node = tree?.nodes.find(n => n.id === this.selectedNodeId);
    if (!node) {
      this.detailEl.innerHTML = `
        <p class="placeholder">
          노드를 선택하세요.<br/><br/>
          <strong>조작법</strong><br/>
          · 노드 드래그: 위치 이동<br/>
          · Shift + 노드 클릭 후 다른 노드: 연결<br/>
          · 휠: 확대/축소<br/>
          · 빈 공간 드래그: 패닝
        </p>`;
      return;
    }

    this.detailEl.innerHTML = `
      <div class="form-group" style="margin-bottom:10px;">
        <label>이름</label>
        <input type="text" data-field="name" value="${escapeHtml(node.name)}" />
      </div>
      <div class="form-group" style="margin-bottom:10px;">
        <label>비용</label>
        <input type="number" data-field="cost" value="${node.cost}" min="0" />
      </div>
      <div class="form-group" style="margin-bottom:10px;">
        <label>공격력 보너스</label>
        <input type="number" data-field="damageBonus" value="${node.damageBonus}" />
      </div>
      <div class="form-group" style="margin-bottom:10px;">
        <label>사거리 보너스</label>
        <input type="number" data-field="rangeBonus" value="${node.rangeBonus}" step="0.5" />
      </div>
      <div class="form-group" style="margin-bottom:10px;">
        <label>공속 보너스</label>
        <input type="number" data-field="attackSpeedBonus" value="${node.attackSpeedBonus}" step="0.1" />
      </div>
      <div class="form-group" style="margin-bottom:10px;">
        <label>설명</label>
        <textarea data-field="description" rows="2">${escapeHtml(node.description || '')}</textarea>
      </div>
      <label class="checkbox-row" style="margin-bottom:12px;">
        <input type="checkbox" data-field="isRoot" ${node.isRoot ? 'checked' : ''}/> 루트 노드
      </label>
      <div class="btn-row">
        <button class="btn btn-danger btn-sm" id="btnDelNode">노드 삭제</button>
        <button class="btn btn-ghost btn-sm" id="btnDelEdges">연결 끊기</button>
      </div>
    `;

    this.detailEl.querySelectorAll('[data-field]').forEach(el => {
      const field = el.dataset.field;
      el.addEventListener(el.type === 'checkbox' ? 'change' : 'input', () => {
        if (el.type === 'checkbox') node[field] = el.checked;
        else if (el.type === 'number') node[field] = parseFloat(el.value) || 0;
        else node[field] = el.value;
        this.render();
        this.onChange?.();
      });
    });

    this.detailEl.querySelector('#btnDelNode').onclick = () => {
      tree.nodes = tree.nodes.filter(n => n.id !== node.id);
      tree.edges = tree.edges.filter(ed => ed.from !== node.id && ed.to !== node.id);
      this.selectedNodeId = null;
      this.render();
      this.renderDetail();
      this.onChange?.();
    };
    this.detailEl.querySelector('#btnDelEdges').onclick = () => {
      tree.edges = tree.edges.filter(ed => ed.from !== node.id && ed.to !== node.id);
      this.render();
      this.onChange?.();
    };
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
