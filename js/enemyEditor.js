import {
  createDefaultEnemy,
  defaultEnemySVG,
  defaultAirEnemySVG,
  defaultGhostEnemySVG,
  defaultBossSVG,
} from './state.js';

export class EnemyEditor {
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

  addEnemy() {
    const id = this.project.enemies.length
      ? Math.max(...this.project.enemies.map(e => e.id)) + 1
      : 1;
    const enemy = createDefaultEnemy(id);
    this.project.enemies.push(enemy);
    this.selectedId = id;
    this.renderList();
    this.renderDetail();
    this.onChange?.();
  }

  deleteEnemy(id) {
    this.project.enemies = this.project.enemies.filter(e => e.id !== id);
    if (this.selectedId === id) this.selectedId = null;
    this.renderList();
    this.renderDetail();
    this.onChange?.();
  }

  getSelected() {
    return this.project.enemies.find(e => e.id === this.selectedId) || null;
  }

  renderList() {
    this.listEl.innerHTML = '';
    this.project.enemies.forEach(e => {
      const typeIcon = e.type === 'air' ? '✈️' : e.type === 'ghost' ? '👻' : '👾';
      const bossMark = e.isBoss ? '👑 ' : '';
      const card = document.createElement('div');
      card.className = 'item-card' + (e.id === this.selectedId ? ' active' : '');
      card.innerHTML = `
        <div class="icon">${typeIcon}</div>
        <div>
          <div class="name">${bossMark}${escapeHtml(e.name)}</div>
          <div class="meta">❤️${e.hp} · 💨${e.speed} · 💰${e.reward}</div>
        </div>
      `;
      card.onclick = () => {
        this.selectedId = e.id;
        this.renderList();
        this.renderDetail();
      };
      this.listEl.appendChild(card);
    });
    if (!this.project.enemies.length) {
      this.listEl.innerHTML = '<p style="padding:12px;color:var(--text2);font-size:0.85rem;">적이 없습니다.</p>';
    }
  }

  renderDetail() {
    const e = this.getSelected();
    if (!e) {
      this.detailEl.innerHTML = '<p class="placeholder">적을 선택하거나 새로 만드세요.</p>';
      return;
    }

    this.detailEl.innerHTML = `
      <div class="form-grid">
        <div class="form-group">
          <label>이름</label>
          <input type="text" data-field="name" value="${escapeHtml(e.name)}" />
        </div>
        <div class="form-group">
          <label>체력</label>
          <input type="number" data-field="hp" value="${e.hp}" min="1" />
        </div>
        <div class="form-group">
          <label>속도</label>
          <input type="number" data-field="speed" value="${e.speed}" min="0.1" step="0.1" />
        </div>
        <div class="form-group">
          <label>보상 골드</label>
          <input type="number" data-field="reward" value="${e.reward}" min="0" />
        </div>
        <div class="form-group">
          <label>방어력</label>
          <input type="number" data-field="armor" value="${e.armor || 0}" min="0" />
        </div>
        <div class="form-group">
          <label>초당 재생</label>
          <input type="number" data-field="regen" value="${e.regen || 0}" min="0" step="0.5" />
        </div>
        <div class="form-group">
          <label>색상</label>
          <input type="color" data-field="color" value="${e.color}" />
        </div>
        <div class="form-group">
          <label>타입</label>
          <select data-field="type">
            <option value="ground" ${e.type === 'ground' ? 'selected' : ''}>지상</option>
            <option value="air" ${e.type === 'air' ? 'selected' : ''}>공중</option>
            <option value="ghost" ${e.type === 'ghost' ? 'selected' : ''}>유령</option>
          </select>
        </div>
        <div class="form-group span2">
          <label>설명</label>
          <textarea data-field="description" rows="2">${escapeHtml(e.description || '')}</textarea>
        </div>
      </div>

      <div class="section-title">보스 설정</div>
      <div class="form-grid">
        <label class="checkbox-row"><input type="checkbox" data-field="isBoss" ${e.isBoss ? 'checked' : ''}/> 보스 몹 (보스 체력바 표시)</label>
        <div class="form-group">
          <label>보스바 색상</label>
          <input type="color" data-field="bossBarColor" value="${e.bossBarColor || '#e63946'}" />
        </div>
      </div>

      <div class="section-title">SVG 외형</div>
      <div style="display:flex;gap:16px;align-items:flex-start;">
        <div class="svg-preview" id="enemySvgPreview">${e.svg}</div>
        <div class="form-group" style="flex:1;">
          <label>SVG 코드</label>
          <textarea class="svg-editor" data-field="svg" rows="6">${escapeHtml(e.svg)}</textarea>
        </div>
      </div>

      <div class="btn-row">
        <button class="btn btn-danger btn-sm" id="btnDeleteEnemy">삭제</button>
        <button class="btn btn-ghost btn-sm" id="btnResetSvg">타입 기본 SVG</button>
      </div>
    `;

    this.detailEl.querySelectorAll('[data-field]').forEach(el => {
      const field = el.dataset.field;
      const handler = () => {
        if (el.type === 'checkbox') {
          e[field] = el.checked;
        } else if (el.type === 'number') {
          e[field] = parseFloat(el.value) || 0;
        } else {
          e[field] = el.value;
        }
        if (field === 'svg') {
          const prev = this.detailEl.querySelector('#enemySvgPreview');
          if (prev) prev.innerHTML = e.svg;
        }
        if (field === 'type') {
          // auto-suggest svg on type change is optional
        }
        this.renderList();
        this.onChange?.();
      };
      el.addEventListener(el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input', handler);
    });

    this.detailEl.querySelector('#btnDeleteEnemy').onclick = () => {
      if (confirm(`"${e.name}" 적을 삭제할까요?`)) this.deleteEnemy(e.id);
    };
    this.detailEl.querySelector('#btnResetSvg').onclick = () => {
      if (e.isBoss) e.svg = defaultBossSVG(e.color);
      else if (e.type === 'air') e.svg = defaultAirEnemySVG(e.color);
      else if (e.type === 'ghost') e.svg = defaultGhostEnemySVG(e.color);
      else e.svg = defaultEnemySVG(e.color);
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
