import {
  createDefaultProject, createEmptyMap, createMapData, TILES, HELP, syncActiveMap,
} from './state.js';
import { MapEditor, renderTilePalette } from './mapEditor.js';
import { TowerEditor } from './towerEditor.js';
import { EnemyEditor } from './enemyEditor.js';
import { UpgradeTreeEditor } from './upgradeTree.js';
import { DifficultyEditor, SpecialEditor } from './waveEditor.js';
import { TEMPLATES, renderTemplates } from './templates.js';
import { GameEngine } from './gameEngine.js';
import { downloadJSON, downloadHTML, projectToJSON, buildPlayableHTML } from './export.js';

let project = createDefaultProject();
syncActiveMap(project);

const $ = (s) => document.querySelector(s);
let mapEditor, towerEditor, enemyEditor, upgradeEditor, diffEditor, specialEditor;
let previewEngine = null;
let previewDiffId = null;

function initEditors() {
  mapEditor = new MapEditor($('#mapCanvas'), project, updateStatus);
  towerEditor = new TowerEditor($('#towerList'), $('#towerDetail'), project, updateStatus);
  enemyEditor = new EnemyEditor($('#enemyList'), $('#enemyDetail'), project, updateStatus);
  upgradeEditor = new UpgradeTreeEditor($('#upgradeCanvas'), $('#upgradeNodeDetail'), project, updateStatus);
  diffEditor = new DifficultyEditor($('#difficultyList'), project, updateStatus);
  specialEditor = new SpecialEditor($('#specialList'), $('#specialDetail'), project, updateStatus);

  const selectTile = (id) => {
    mapEditor.setSelectedTile(id);
    renderTilePalette($('#tilePalette'), id, selectTile);
  };
  selectTile(TILES.path.id);

  $('#brushSize').oninput = (e) => {
    mapEditor.setBrushSize(+e.target.value);
    $('#brushSizeVal').textContent = e.target.value;
  };
  $('#btnResizeMap').onclick = () => {
    mapEditor.applySize(+$('#mapWidth').value, +$('#mapHeight').value);
    updateStatus();
  };
  $('#btnClearMap').onclick = () => { if (confirm('맵 전체 지우기?')) mapEditor.clear(); };

  // multi map
  refreshMapSelect();
  $('#mapSelect').onchange = () => {
    project.activeMapId = +$('#mapSelect').value;
    syncActiveMap(project);
    mapEditor.setProject(project);
    $('#mapWidth').value = project.map.width;
    $('#mapHeight').value = project.map.height;
  };
  $('#btnAddMap').onclick = () => {
    const id = Math.max(0, ...project.maps.map(m => m.id)) + 1;
    const m = createMapData(id, `맵 ${id}`, 24, 16);
    project.maps.push(m);
    project.activeMapId = id;
    syncActiveMap(project);
    mapEditor.setProject(project);
    refreshMapSelect();
    updateStatus();
  };
  $('#btnRenameMap').onclick = () => {
    const name = prompt('맵 이름', project.map.name);
    if (name) { project.map.name = name; refreshMapSelect(); updateStatus(); }
  };
  $('#btnDeleteMap').onclick = () => {
    if (project.maps.length <= 1) { alert('최소 1개 맵 필요'); return; }
    if (!confirm('이 맵 삭제?')) return;
    project.maps = project.maps.filter(m => m.id !== project.activeMapId);
    project.activeMapId = project.maps[0].id;
    syncActiveMap(project);
    mapEditor.setProject(project);
    refreshMapSelect();
    updateStatus();
  };

  $('#btnAddTower').onclick = () => towerEditor.addTower();
  $('#btnAddEnemy').onclick = () => enemyEditor.addEnemy();
  $('#btnAddDifficulty').onclick = () => diffEditor.addDifficulty();
  $('#btnAddSpecial').onclick = () => specialEditor.add();
  $('#btnAddUpgradeNode').onclick = () => upgradeEditor.addNode();
  $('#btnClearTree').onclick = () => upgradeEditor.clearTree();
  refreshUpgradeTowerSelect();

  renderTemplates($('#templatesGrid'), (tpl) => {
    tpl.apply(project);
    syncAllEditors();
    setStatus(`템플릿 "${tpl.name}" 적용`);
  });

  bindSettings();
  renderMenuEditor();
  setupHelp();
}

function refreshMapSelect() {
  const sel = $('#mapSelect');
  if (!sel) return;
  sel.innerHTML = project.maps.map(m =>
    `<option value="${m.id}" ${m.id === project.activeMapId ? 'selected' : ''}>${m.name}</option>`
  ).join('');
}

function refreshUpgradeTowerSelect() {
  const sel = $('#upgradeTowerSelect');
  sel.innerHTML = '<option value="">타워 선택</option>' +
    project.towers.map(t => `<option value="${t.id}">${t.emoji || '🗼'} ${t.name}</option>`).join('');
  sel.onchange = () => upgradeEditor.setTower(sel.value ? +sel.value : null);
}

function bindSettings() {
  const map = {
    gameName: ['meta', 'name'], authorName: ['meta', 'author'], gameVersion: ['meta', 'version'],
    gameDesc: ['meta', 'description'], tileSize: ['meta', 'tileSize'], maxTowers: ['meta', 'maxTowers'],
    allowSell: ['meta', 'allowSell'], showPath: ['meta', 'showPath'],
    bgColor: ['meta', 'bgColor'], pathColor: ['meta', 'pathColor'], enableParticles: ['meta', 'enableParticles'],
  };
  Object.entries(map).forEach(([id, path]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener(el.type === 'checkbox' || el.type === 'color' ? 'change' : 'input', () => {
      let val = el.type === 'checkbox' ? el.checked : el.type === 'number' ? parseFloat(el.value) : el.value;
      project[path[0]][path[1]] = val;
      if (id === 'gameName') {
        project.meta.name = val;
        if (project.mainMenu) project.mainMenu.title = val;
        renderMenuEditor();
      }
      updateStatus();
    });
  });
  syncSettingsToUI();
}

function syncSettingsToUI() {
  const m = project.meta;
  const set = (id, v) => { const el = document.getElementById(id); if (el) { if (el.type === 'checkbox') el.checked = !!v; else el.value = v ?? ''; } };
  set('gameName', m.name); set('authorName', m.author); set('gameVersion', m.version);
  set('gameDesc', m.description); set('tileSize', m.tileSize || 48); set('maxTowers', m.maxTowers);
  set('allowSell', m.allowSell); set('showPath', m.showPath); set('bgColor', m.bgColor);
  set('pathColor', m.pathColor); set('enableParticles', m.enableParticles);
  set('mapWidth', project.map?.width); set('mapHeight', project.map?.height);
}

function renderMenuEditor() {
  if (!project.mainMenu) {
    project.mainMenu = {
      title: project.meta.name, subtitle: '', bgColor: '#0f0f1a', titleColor: '#ffffff',
      buttons: [{ id: 'play', label: '게임 시작', action: 'play' }, { id: 'diff', label: '난이도 선택', action: 'difficulty' }],
    };
  }
  const mm = project.mainMenu;
  const form = $('#menuForm');
  if (!form) return;
  form.innerHTML = `
    <div class="form-group" style="margin-bottom:12px"><label>제목</label><input id="mmTitle" value="${esc(mm.title)}" /></div>
    <div class="form-group" style="margin-bottom:12px"><label>부제</label><input id="mmSub" value="${esc(mm.subtitle||'')}" /></div>
    <div class="form-group" style="margin-bottom:12px"><label>배경색</label><input type="color" id="mmBg" value="${mm.bgColor||'#0f0f1a'}" /></div>
    <div class="form-group" style="margin-bottom:12px"><label>제목 색</label><input type="color" id="mmTc" value="${mm.titleColor||'#ffffff'}" /></div>
    <div class="section-title">버튼</div>
    <div id="mmBtns"></div>
    <button type="button" class="btn btn-sm btn-primary" id="mmAddBtn" style="margin-top:10px">+ 버튼</button>`;
  const btnsEl = form.querySelector('#mmBtns');
  (mm.buttons || []).forEach((b, i) => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:8px;margin-bottom:8px;align-items:center;';
    row.innerHTML = `
      <input data-i="${i}" data-f="label" value="${esc(b.label)}" style="flex:1;background:var(--bg3);border:1px solid var(--border);color:var(--text);padding:8px;border-radius:6px;" />
      <select data-i="${i}" data-f="action" style="background:var(--bg3);border:1px solid var(--border);color:var(--text);padding:8px;border-radius:6px;">
        <option value="play" ${b.action==='play'?'selected':''}>게임 시작</option>
        <option value="difficulty" ${b.action==='difficulty'?'selected':''}>난이도 선택</option>
      </select>
      <button type="button" class="btn btn-ghost btn-sm" data-del="${i}">✕</button>`;
    btnsEl.appendChild(row);
  });
  form.querySelector('#mmTitle').oninput = (e) => { mm.title = e.target.value; renderMenuPreview(); };
  form.querySelector('#mmSub').oninput = (e) => { mm.subtitle = e.target.value; renderMenuPreview(); };
  form.querySelector('#mmBg').oninput = (e) => { mm.bgColor = e.target.value; renderMenuPreview(); };
  form.querySelector('#mmTc').oninput = (e) => { mm.titleColor = e.target.value; renderMenuPreview(); };
  form.querySelectorAll('[data-f]').forEach(el => {
    el.onchange = el.oninput = () => {
      const i = +el.dataset.i;
      mm.buttons[i][el.dataset.f] = el.value;
      renderMenuPreview();
    };
  });
  form.querySelectorAll('[data-del]').forEach(btn => {
    btn.onclick = () => {
      mm.buttons.splice(+btn.dataset.del, 1);
      renderMenuEditor();
    };
  });
  form.querySelector('#mmAddBtn').onclick = () => {
    mm.buttons.push({ id: 'b' + Date.now(), label: '새 버튼', action: 'play' });
    renderMenuEditor();
  };
  renderMenuPreview();
}

function renderMenuPreview() {
  const mm = project.mainMenu;
  const prev = $('#menuPreview');
  if (!prev || !mm) return;
  prev.style.background = mm.bgColor || '#0a0a14';
  prev.innerHTML = `
    <div class="mp-title" style="color:${mm.titleColor||'#fff'}">${esc(mm.title)}</div>
    <div class="mp-sub">${esc(mm.subtitle||'')}</div>
    ${(mm.buttons||[]).map(b => `<div class="mp-btn">${esc(b.label)}</div>`).join('')}`;
}

function setupHelp() {
  const pop = $('#helpPopover');
  const body = $('#helpBody');
  const close = () => pop.classList.add('hidden');
  $('#helpClose').onclick = close;
  document.addEventListener('click', (e) => {
    if (!pop.contains(e.target) && !e.target.closest('.help-btn')) close();
  });
  window.addEventListener('td-help', (e) => {
    const { key, el } = e.detail;
    body.textContent = HELP[key] || '도움말이 없습니다.';
    const r = el.getBoundingClientRect();
    pop.classList.remove('hidden');
    pop.style.left = Math.min(window.innerWidth - 380, r.left) + 'px';
    pop.style.top = (r.bottom + 8) + 'px';
  });
  document.querySelectorAll('.help-btn').forEach(b => {
    b.onclick = (ev) => {
      ev.stopPropagation();
      window.dispatchEvent(new CustomEvent('td-help', { detail: { key: b.dataset.help, el: b } }));
    };
  });
}

function syncAllEditors() {
  syncActiveMap(project);
  mapEditor.setProject(project);
  towerEditor.setProject(project);
  enemyEditor.setProject(project);
  upgradeEditor.setProject(project);
  diffEditor.setProject(project);
  specialEditor.setProject(project);
  refreshMapSelect();
  refreshUpgradeTowerSelect();
  syncSettingsToUI();
  renderMenuEditor();
  updateStatus();
}

function updateStatus() {
  const nDiff = project.difficulties?.length || 0;
  $('#projectInfo').textContent = `맵 ${project.maps?.length||0} · 타워 ${project.towers.length} · 적 ${project.enemies.length} · 난이도 ${nDiff}`;
}
function setStatus(msg) {
  $('#statusText').textContent = msg;
  setTimeout(() => { $('#statusText').textContent = '준비됨'; }, 2500);
}
function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Tabs
document.querySelectorAll('.nav-item').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.dataset.tab;
    document.getElementById('tab-' + tab)?.classList.add('active');
    if (tab === 'upgrade') { refreshUpgradeTowerSelect(); upgradeEditor._resize(); upgradeEditor.render(); }
    if (tab === 'map') mapEditor.render();
    if (tab === 'menu') renderMenuEditor();
    if (tab === 'difficulty') diffEditor.render();
  };
});

$('#btnSave').onclick = () => {
  try {
    localStorage.setItem('td-maker-project', JSON.stringify(project));
    setStatus('저장됨');
  } catch (e) { setStatus('저장 실패'); }
};
$('#btnLoad').onclick = () => {
  const raw = localStorage.getItem('td-maker-project');
  if (!raw) { setStatus('저장된 프로젝트 없음'); return; }
  try {
    project = JSON.parse(raw);
    migrateProject(project);
    syncAllEditors();
    setStatus('불러오기 완료');
  } catch { setStatus('불러오기 실패'); }
};
$('#btnNew').onclick = () => {
  if (!confirm('새 프로젝트?')) return;
  project = createDefaultProject();
  syncActiveMap(project);
  syncAllEditors();
  setStatus('새 프로젝트');
};

function migrateProject(p) {
  if (!p.maps) {
    p.maps = [p.map || createMapData(1, '맵 1', 24, 16)];
    p.activeMapId = p.maps[0].id;
  }
  syncActiveMap(p);
  if (!p.difficulties) {
    p.difficulties = [{
      id: 1, name: '기본', startGold: p.difficulty?.startGold || 500,
      startLives: p.difficulty?.startLives || 20, hpScale: p.difficulty?.hpScale || 1,
      speedScale: p.difficulty?.speedScale || 1, rewardScale: p.difficulty?.rewardScale || 1,
      waves: p.waves || [], collapsed: false, mapId: null,
    }];
  }
  if (!p.mainMenu) {
    p.mainMenu = {
      title: p.meta?.name || 'Game', subtitle: '', bgColor: '#0f0f1a', titleColor: '#fff',
      buttons: [{ id: 'play', label: '게임 시작', action: 'play' }],
    };
  }
  (p.towers || []).forEach(t => { if (!t.emoji) t.emoji = '🗼'; });
  (p.enemies || []).forEach(e => { if (!e.emoji) e.emoji = '👾'; });
}

function getDiffForPreview() {
  const sel = $('#previewDiffSelect');
  const id = sel?.value ? +sel.value : project.difficulties?.[0]?.id;
  return project.difficulties?.find(d => d.id === id) || project.difficulties?.[0];
}

$('#btnPreview').onclick = () => {
  const diff = getDiffForPreview() || project.difficulties?.[0];
  if (!diff?.waves?.length) { alert('난이도에 웨이브가 없습니다.'); return; }
  if (!project.towers.length) { alert('타워가 없습니다.'); return; }
  // resolve map
  if (diff.mapId) {
    project.activeMapId = diff.mapId;
    syncActiveMap(project);
  }
  if (!mapEditor.findPath()) {
    alert('스폰→엔드 경로가 없습니다. 맵을 확인하세요.');
    return;
  }
  // temp difficulty for engine
  const playProject = {
    ...project,
    map: project.map,
    difficulty: {
      startGold: diff.startGold,
      startLives: diff.startLives,
      hpScale: diff.hpScale,
      speedScale: diff.speedScale,
      rewardScale: diff.rewardScale,
    },
    waves: diff.waves,
  };

  const sel = $('#previewDiffSelect');
  sel.innerHTML = project.difficulties.map(d =>
    `<option value="${d.id}" ${d.id===diff.id?'selected':''}>${d.name}</option>`
  ).join('');

  $('#previewOverlay').classList.remove('hidden');
  if (previewEngine) previewEngine.stop();
  previewEngine = new GameEngine($('#previewCanvas'), playProject, {
    gold: $('#pGold'), lives: $('#pLives'), wave: $('#pWave'),
  });
  previewEngine.selectedTowerType = project.towers[0] || null;
  previewEngine.start();
};

$('#previewDiffSelect')?.addEventListener('change', () => {
  // restart preview with new diff
  $('#btnClosePreview').click();
  setTimeout(() => $('#btnPreview').click(), 100);
});

$('#btnClosePreview').onclick = () => {
  previewEngine?.stop();
  previewEngine = null;
  $('#previewOverlay').classList.add('hidden');
};
$('#btnStartWave').onclick = () => previewEngine?.startNextWave();
$('#btnPausePreview').onclick = () => previewEngine?.togglePause();

$('#btnExport').onclick = () => {
  $('#exportOverlay').classList.remove('hidden');
  $('#exportCode').value = projectToJSON(project);
};
$('#btnCloseExport').onclick = () => $('#exportOverlay').classList.add('hidden');
$('#btnDownloadJSON').onclick = () => { downloadJSON(project); setStatus('JSON 다운로드'); };
$('#btnDownloadHTML').onclick = () => { downloadHTML(project); setStatus('HTML 다운로드'); };
$('#btnCopyCode').onclick = async () => {
  const code = buildPlayableHTML(project);
  $('#exportCode').value = code;
  try { await navigator.clipboard.writeText(code); setStatus('복사됨'); }
  catch { setStatus('복사 실패 — 직접 선택하세요'); }
};

initEditors();
updateStatus();

if (!localStorage.getItem('td-maker-project')) {
  const basic = TEMPLATES.find(t => t.id === 'basic');
  if (basic) {
    basic.apply(project);
    syncAllEditors();
    setStatus('기본 템플릿 로드됨');
  }
}
