import { createDefaultTower, defaultTowerSVG } from './state.js';

export class TowerEditor {
  constructor(listEl, detailEl, project, onChange) {
    this.listEl = listEl;
    this.detailEl = detailEl;
    this.project = project;
    this.onChange = onChange;
    this.selectedId = null;
  }

  setProject(project) {
    this.project = project;
    this.selectedId = null;
    this.renderList();
    this.renderDetail();
  }

  addTower() {
    const id = this.project.towers.length
      ? Math.max(...this.project.towers.map(t => t.id)) + 1
      : 1;
    const tower = createDefaultTower(id);
    this.project.towers.push(tower);
    this.selectedId = id;
    this.renderList();
    this.renderDetail();
    this.onChange?.();
  }

  deleteTower(id) {
    this.project.towers = this.project.towers.filter(t => t.id !== id);
    if (this.project.upgradeTrees[id]) delete this.project.upgradeTrees[id];
    if (this.selectedId === id) this.selectedId = null;
    this.renderList();
    this.renderDetail();
    this.onChange?.();
  }

  getSelected() {
    return this.project.towers.find(t => t.id === this.selectedId) || null;
  }

  renderList() {
    this.listEl.innerHTML = '';
    this.project.towers.forEach(t => {
      const card = document.createElement('div');
      card.className = 'item-card' + (t.id === this.selectedId ? ' active' : '');
      card.innerHTML = `
        <div class="icon" style="color:${t.color}">🗼</div>
        <div>
          <div class="name">${escapeHtml(t.name)}</div>
          <div class="meta">💰${t.cost} · ⚔️${t.damage} · 📏${t.range}</div>
        </div>
      `;
      card.onclick = () => {
        this.selectedId = t.id;
        this.renderList();
        this.renderDetail();
      };
      this.listEl.appendChild(card);
    });
    if (!this.project.towers.length) {
      this.listEl.innerHTML = '<p style="padding:12px;color:var(--text2);font-size:0.85rem;">타워가 없습니다.</p>';
    }
  }

  renderDetail() {
    const t = this.getSelected();
    if (!t) {
      this.detailEl.innerHTML = '<p class="placeholder">타워를 선택하거나 새로 만드세요.</p>';
      return;
    }

    this.detailEl.innerHTML = `
      <div class="form-grid">
        <div class="form-group">
          <label>이름</label>
          <input type="text" data-field="name" value="${escapeHtml(t.name)}" />
        </div>
        <div class="form-group">
          <label>비용</label>
          <input type="number" data-field="cost" value="${t.cost}" min="0" />
        </div>
        <div class="form-group">
          <label>사거리 (타일)</label>
          <input type="number" data-field="range" value="${t.range}" min="1" step="0.5" />
        </div>
        <div class="form-group">
          <label>공격력</label>
          <input type="number" data-field="damage" value="${t.damage}" min="1" />
        </div>
        <div class="form-group">
          <label>공격 속도 (회/초)</label>
          <input type="number" data-field="attackSpeed" value="${t.attackSpeed}" min="0.1" step="0.1" />
        </div>
        <div class="form-group">
          <label>투사체 속도</label>
          <input type="number" data-field="projectileSpeed" value="${t.projectileSpeed}" min="1" />
        </div>
        <div class="form-group">
          <label>색상</label>
          <input type="color" data-field="color" value="${t.color}" />
        </div>
        <div class="form-group">
          <label>판매 비율</label>
          <input type="number" data-field="sellRatio" value="${t.sellRatio}" min="0" max="1" step="0.1" />
        </div>
        <div class="form-group span2">
          <label>설명</label>
          <textarea data-field="description" rows="2">${escapeHtml(t.description || '')}</textarea>
        </div>
      </div>

      <div class="section-title">공격 대상</div>
      <div class="form-grid">
        <label class="checkbox-row"><input type="checkbox" data-field="canAttackGround" ${t.canAttackGround ? 'checked' : ''}/> 지상</label>
        <label class="checkbox-row"><input type="checkbox" data-field="canAttackAir" ${t.canAttackAir ? 'checked' : ''}/> 공중</label>
        <label class="checkbox-row"><input type="checkbox" data-field="canAttackGhost" ${t.canAttackGhost ? 'checked' : ''}/> 유령</label>
        <label class="checkbox-row"><input type="checkbox" data-field="isCliffOnly" ${t.isCliffOnly ? 'checked' : ''}/> 절벽 전용 타워</label>
      </div>

      <div class="section-title">특수 효과</div>
      <div class="form-grid">
        <div class="form-group">
          <label>효과 종류</label>
          <select data-field="effectType">
            <option value="">없음</option>
            <option value="splash" ${t.effects?.[0]?.type === 'splash' ? 'selected' : ''}>스플래시</option>
            <option value="slow" ${t.effects?.[0]?.type === 'slow' ? 'selected' : ''}>슬로우</option>
            <option value="poison" ${t.effects?.[0]?.type === 'poison' ? 'selected' : ''}>독</option>
            <option value="pierce" ${t.effects?.[0]?.type === 'pierce' ? 'selected' : ''}>관통</option>
          </select>
        </div>
        <div class="form-group">
          <label>효과 수치</label>
          <input type="number" data-field="effectValue" value="${t.effects?.[0]?.value ?? 0}" min="0" step="0.1" />
        </div>
      </div>

      <div class="section-title">SVG 외형</div>
      <div style="display:flex;gap:16px;align-items:flex-start;">
        <div class="svg-preview" id="towerSvgPreview">${t.svg}</div>
        <div class="form-group" style="flex:1;">
          <label>SVG 코드</label>
          <textarea class="svg-editor" data-field="svg" rows="6">${escapeHtml(t.svg)}</textarea>
        </div>
      </div>

      <div class="btn-row">
        <button class="btn btn-danger btn-sm" id="btnDeleteTower">삭제</button>
        <button class="btn btn-ghost btn-sm" id="btnResetSvg">기본 SVG로</button>
      </div>
    `;

    this.detailEl.querySelectorAll('[data-field]').forEach(el => {
      const field = el.dataset.field;
      const handler = () => {
        if (field === 'effectType' || field === 'effectValue') {
          const type = this.detailEl.querySelector('[data-field="effectType"]').value;
          const value = parseFloat(this.detailEl.querySelector('[data-field="effectValue"]').value) || 0;
          t.effects = type ? [{ type, value }] : [];
        } else if (el.type === 'checkbox') {
          t[field] = el.checked;
        } else if (el.type === 'number') {
          t[field] = parseFloat(el.value) || 0;
        } else {
          t[field] = el.value;
        }
        if (field === 'color') {
          // optional: update svg color if simple
        }
        if (field === 'svg') {
          const prev = this.detailEl.querySelector('#towerSvgPreview');
          if (prev) prev.innerHTML = t.svg;
        }
        this.renderList();
        this.onChange?.();
      };
      el.addEventListener(el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input', handler);
    });

    this.detailEl.querySelector('#btnDeleteTower').onclick = () => {
      if (confirm(`"${t.name}" 타워를 삭제할까요?`)) this.deleteTower(t.id);
    };
    this.detailEl.querySelector('#btnResetSvg').onclick = () => {
      t.svg = defaultTowerSVG(t.color);
      this.renderDetail();
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
