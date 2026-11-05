import { createDefaultEnemy } from './state.js';

const EMOJI_PRESETS = {
  ground: ['👾','🐛','🧟','🐸','🐷','🐻','🦀','🦂'],
  air: ['🦇','🦅','🦋','👻','✈️','🛸'],
  ghost: ['👻','💀','🌫️','👤','🔮'],
  boss: ['👑','🐉','🦖','👹','🤖'],
};

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
      ? Math.max(...this.project.enemies.map(e => e.id)) + 1 : 1;
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
      const card = document.createElement('div');
      card.className = 'item-card' + (e.id === this.selectedId ? ' active' : '');
      const boss = e.isBoss ? '👑 ' : '';
      card.innerHTML = `
        <div class="icon">${e.emoji || '👾'}</div>
        <div>
          <div class="name">${boss}${esc(e.name)}</div>
          <div class="meta">❤️${e.hp} · 💨${e.speed} · 💰${e.reward} · ${e.type}</div>
        </div>`;
      card.onclick = () => {
        this.selectedId = e.id;
        this.renderList();
        this.renderDetail();
      };
      this.listEl.appendChild(card);
    });
    if (!this.project.enemies.length) {
      this.listEl.innerHTML = '<p style="padding:14px;color:var(--text2)">적이 없습니다.</p>';
    }
  }

  renderDetail() {
    const e = this.getSelected();
    if (!e) {
      this.detailEl.innerHTML = '<p class="placeholder">적을 선택하거나 새로 만드세요.</p>';
      return;
    }
    if (!e.emoji) e.emoji = '👾';
    const presets = e.isBoss ? EMOJI_PRESETS.boss
      : (EMOJI_PRESETS[e.type] || EMOJI_PRESETS.ground);

    this.detailEl.innerHTML = `
      <div class="form-grid">
        <div class="form-group"><label>이름</label><input type="text" data-field="name" value="${esc(e.name)}" /></div>
        <div class="form-group"><label>체력</label><input type="number" data-field="hp" value="${e.hp}" min="1" /></div>
        <div class="form-group"><label>속도</label><input type="number" data-field="speed" value="${e.speed}" min="0.1" step="0.1" /></div>
        <div class="form-group"><label>보상 골드</label><input type="number" data-field="reward" value="${e.reward}" min="0" /></div>
        <div class="form-group"><label>방어력</label><input type="number" data-field="armor" value="${e.armor||0}" min="0" /></div>
        <div class="form-group"><label>초당 재생</label><input type="number" data-field="regen" value="${e.regen||0}" min="0" step="0.5" /></div>
        <div class="form-group">
          <label>타입</label>
          <select data-field="type">
            <option value="ground" ${e.type==='ground'?'selected':''}>지상</option>
            <option value="air" ${e.type==='air'?'selected':''}>공중</option>
            <option value="ghost" ${e.type==='ghost'?'selected':''}>유령</option>
          </select>
        </div>
        <div class="form-group span2"><label>설명</label><textarea data-field="description" rows="2">${esc(e.description||'')}</textarea></div>
      </div>
      <div class="section-title">보스 <button type="button" class="help-btn" data-help="boss">?</button></div>
      <div class="form-grid">
        <label class="checkbox-row"><input type="checkbox" data-field="isBoss" ${e.isBoss?'checked':''}/> 보스 몹 (보스 체력바)</label>
        <div class="form-group"><label>보스바 색</label><input type="color" data-field="bossBarColor" value="${e.bossBarColor||'#e63946'}" /></div>
      </div>
      <div class="section-title">이모지 외형</div>
      <div style="display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap;">
        <div class="emoji-preview" id="enemyEmojiPrev">${e.emoji}</div>
        <div class="form-group" style="flex:1;min-width:160px;">
          <label>이모지</label>
          <input type="text" data-field="emoji" value="${esc(e.emoji)}" maxlength="4" style="font-size:1.4rem;" />
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;">
            ${presets.map(em => `<button type="button" class="btn btn-ghost btn-sm emoji-pick" data-e="${em}" style="font-size:1.2rem;padding:6px 8px;">${em}</button>`).join('')}
          </div>
        </div>
      </div>
      <div class="btn-row"><button class="btn btn-danger btn-sm" id="btnDeleteEnemy">삭제</button></div>`;

    this.detailEl.querySelectorAll('[data-field]').forEach(el => {
      const field = el.dataset.field;
      const handler = () => {
        if (el.type === 'checkbox') e[field] = el.checked;
        else if (el.type === 'number') e[field] = parseFloat(el.value) || 0;
        else e[field] = el.value;
        if (field === 'emoji') {
          const prev = this.detailEl.querySelector('#enemyEmojiPrev');
          if (prev) prev.textContent = e.emoji;
        }
        if (field === 'type' || field === 'isBoss') this.renderDetail();
        this.renderList();
        this.onChange?.();
      };
      el.addEventListener(el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input', handler);
    });
    this.detailEl.querySelectorAll('.emoji-pick').forEach(btn => {
      btn.onclick = () => {
        e.emoji = btn.dataset.e;
        this.renderDetail();
        this.renderList();
        this.onChange?.();
      };
    });
    this.detailEl.querySelector('#btnDeleteEnemy').onclick = () => {
      if (confirm(`"${e.name}" 삭제?`)) this.deleteEnemy(e.id);
    };
    this.detailEl.querySelectorAll('.help-btn').forEach(b => {
      b.onclick = (ev) => {
        ev.stopPropagation();
        window.dispatchEvent(new CustomEvent('td-help', { detail: { key: b.dataset.help, el: b } }));
      };
    });
  }
}

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
