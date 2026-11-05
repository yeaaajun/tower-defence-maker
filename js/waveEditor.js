import { createDefaultWave, createDefaultSpecial } from './state.js';

export class WaveEditor {
  constructor(listEl, project, onChange) {
    this.listEl = listEl;
    this.project = project;
    this.onChange = onChange;
  }

  setProject(project) {
    this.project = project;
    this.render();
  }

  addWave() {
    const id = this.project.waves.length;
    this.project.waves.push(createDefaultWave(id));
    this.render();
    this.onChange?.();
  }

  render() {
    this.listEl.innerHTML = '';
    if (!this.project.waves.length) {
      this.listEl.innerHTML = '<p style="color:var(--text2);font-size:0.9rem;">웨이브가 없습니다. 추가해보세요.</p>';
      return;
    }

    this.project.waves.forEach((wave, idx) => {
      const card = document.createElement('div');
      card.className = 'wave-card';
      const enemyOptions = this.project.enemies
        .map(e => `<option value="${e.id}" ${wave.entries[0]?.enemyId === e.id ? 'selected' : ''}>${escapeHtml(e.name)}</option>`)
        .join('');

      let entriesHtml = wave.entries.map((ent, ei) => `
        <div class="wave-entry" data-ei="${ei}">
          <select data-field="enemyId">
            <option value="">적 선택</option>
            ${this.project.enemies.map(e =>
              `<option value="${e.id}" ${ent.enemyId == e.id ? 'selected' : ''}>${escapeHtml(e.name)}${e.isBoss ? ' 👑' : ''}</option>`
            ).join('')}
          </select>
          <input type="number" data-field="count" value="${ent.count}" min="1" title="수량" />
          <input type="number" data-field="interval" value="${ent.interval}" min="0.1" step="0.1" title="간격(초)" />
          <button class="btn btn-ghost btn-sm btn-rm-entry" title="삭제">✕</button>
        </div>
      `).join('');

      card.innerHTML = `
        <div class="wave-card-header">
          <strong>${escapeHtml(wave.name)}</strong>
          <div>
            <button class="btn btn-ghost btn-sm btn-add-entry">+ 적 추가</button>
            <button class="btn btn-danger btn-sm btn-del-wave">삭제</button>
          </div>
        </div>
        <div style="margin-bottom:8px;">
          <label style="font-size:0.8rem;color:var(--text2);">이름
            <input type="text" data-field="name" value="${escapeHtml(wave.name)}" style="margin-left:6px;width:140px;background:var(--bg);border:1px solid var(--border);color:var(--text);padding:3px 8px;border-radius:4px;" />
          </label>
          <label style="font-size:0.8rem;color:var(--text2);margin-left:12px;">보너스 골드
            <input type="number" data-field="bonusGold" value="${wave.bonusGold}" min="0" style="margin-left:6px;width:70px;background:var(--bg);border:1px solid var(--border);color:var(--text);padding:3px 8px;border-radius:4px;" />
          </label>
        </div>
        <div class="wave-entries">${entriesHtml}</div>
      `;

      // events
      card.querySelector('[data-field="name"]').oninput = (ev) => {
        wave.name = ev.target.value;
        this.onChange?.();
      };
      card.querySelector('[data-field="bonusGold"]').oninput = (ev) => {
        wave.bonusGold = parseInt(ev.target.value) || 0;
        this.onChange?.();
      };
      card.querySelector('.btn-del-wave').onclick = () => {
        this.project.waves.splice(idx, 1);
        this.render();
        this.onChange?.();
      };
      card.querySelector('.btn-add-entry').onclick = () => {
        wave.entries.push({ enemyId: this.project.enemies[0]?.id || null, count: 5, interval: 0.8 });
        this.render();
        this.onChange?.();
      };
      card.querySelectorAll('.wave-entry').forEach(row => {
        const ei = parseInt(row.dataset.ei);
        row.querySelector('[data-field="enemyId"]').onchange = (ev) => {
          wave.entries[ei].enemyId = ev.target.value ? parseInt(ev.target.value) : null;
          this.onChange?.();
        };
        row.querySelector('[data-field="count"]').oninput = (ev) => {
          wave.entries[ei].count = parseInt(ev.target.value) || 1;
          this.onChange?.();
        };
        row.querySelector('[data-field="interval"]').oninput = (ev) => {
          wave.entries[ei].interval = parseFloat(ev.target.value) || 0.5;
          this.onChange?.();
        };
        row.querySelector('.btn-rm-entry').onclick = () => {
          wave.entries.splice(ei, 1);
          if (!wave.entries.length) wave.entries.push({ enemyId: null, count: 5, interval: 0.8 });
          this.render();
          this.onChange?.();
        };
      });

      this.listEl.appendChild(card);
    });
  }
}

export class SpecialEditor {
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

  add() {
    const id = this.project.specials.length
      ? Math.max(...this.project.specials.map(s => s.id)) + 1
      : 1;
    const s = createDefaultSpecial(id);
    this.project.specials.push(s);
    this.selectedId = id;
    this.renderList();
    this.renderDetail();
    this.onChange?.();
  }

  getSelected() {
    return this.project.specials.find(s => s.id === this.selectedId) || null;
  }

  renderList() {
    this.listEl.innerHTML = '';
    this.project.specials.forEach(s => {
      const card = document.createElement('div');
      card.className = 'item-card' + (s.id === this.selectedId ? ' active' : '');
      card.innerHTML = `
        <div class="icon">⭐</div>
        <div>
          <div class="name">${escapeHtml(s.name)}</div>
          <div class="meta">HP×${s.hpScale} · 속도×${s.speedScale}</div>
        </div>
      `;
      card.onclick = () => {
        this.selectedId = s.id;
        this.renderList();
        this.renderDetail();
      };
      this.listEl.appendChild(card);
    });
    if (!this.project.specials.length) {
      this.listEl.innerHTML = '<p style="padding:12px;color:var(--text2);font-size:0.85rem;">특별 난이도가 없습니다.</p>';
    }
  }

  renderDetail() {
    const s = this.getSelected();
    if (!s) {
      this.detailEl.innerHTML = `<p class="placeholder">특별 난이도를 선택하거나 새로 만드세요.<br/>클리어 시 특수 타워를 지급하고, 전용 맵·난이도로 고정됩니다.</p>`;
      return;
    }

    const towerOpts = this.project.towers.map(t =>
      `<option value="${t.id}" ${s.rewardTowerId == t.id ? 'selected' : ''}>${escapeHtml(t.name)}</option>`
    ).join('');

    this.detailEl.innerHTML = `
      <div class="form-grid">
        <div class="form-group span2">
          <label>이름</label>
          <input type="text" data-field="name" value="${escapeHtml(s.name)}" />
        </div>
        <div class="form-group span2">
          <label>설명</label>
          <textarea data-field="description" rows="2">${escapeHtml(s.description || '')}</textarea>
        </div>
        <div class="form-group">
          <label>보상 특수 타워</label>
          <select data-field="rewardTowerId">
            <option value="">없음</option>
            ${towerOpts}
          </select>
        </div>
        <div class="form-group">
          <label>시작 골드</label>
          <input type="number" data-field="startGold" value="${s.startGold}" min="0" />
        </div>
        <div class="form-group">
          <label>시작 라이프</label>
          <input type="number" data-field="startLives" value="${s.startLives}" min="1" />
        </div>
        <div class="form-group">
          <label>체력 배율</label>
          <input type="number" data-field="hpScale" value="${s.hpScale}" min="0.1" step="0.1" />
        </div>
        <div class="form-group">
          <label>속도 배율</label>
          <input type="number" data-field="speedScale" value="${s.speedScale}" min="0.1" step="0.1" />
        </div>
        <div class="form-group">
          <label>보상 배율</label>
          <input type="number" data-field="rewardScale" value="${s.rewardScale}" min="0.1" step="0.1" />
        </div>
      </div>
      <p style="margin-top:14px;font-size:0.85rem;color:var(--text2);">
        ※ 특별 난이도는 현재 맵과 기본 웨이브를 기반으로 하며, 클리어 시 선택한 특수 타워가 해금됩니다.
      </p>
      <div class="btn-row">
        <button class="btn btn-danger btn-sm" id="btnDelSpecial">삭제</button>
      </div>
    `;

    this.detailEl.querySelectorAll('[data-field]').forEach(el => {
      const field = el.dataset.field;
      el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', () => {
        if (el.type === 'number') s[field] = parseFloat(el.value) || 0;
        else if (field === 'rewardTowerId') s[field] = el.value ? parseInt(el.value) : null;
        else s[field] = el.value;
        this.renderList();
        this.onChange?.();
      });
    });
    this.detailEl.querySelector('#btnDelSpecial').onclick = () => {
      this.project.specials = this.project.specials.filter(x => x.id !== s.id);
      this.selectedId = null;
      this.renderList();
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
