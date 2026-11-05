import {
  createDefaultProject,
  createEmptyMap,
  TILES,
} from './state.js';
import { MapEditor, renderTilePalette } from './mapEditor.js';
import { TowerEditor } from './towerEditor.js';
import { EnemyEditor } from './enemyEditor.js';
import { UpgradeTreeEditor } from './upgradeTree.js';
import { WaveEditor, SpecialEditor } from './waveEditor.js';
import { TEMPLATES, renderTemplates } from './templates.js';
import { GameEngine } from './gameEngine.js';
import { downloadJSON, downloadHTML, projectToJSON, buildPlayableHTML } from './export.js';

// ---- Project state ----
let project = createDefaultProject();
project.map.tiles = createEmptyMap(project.map.width, project.map.height);

// ---- DOM refs ----
const $ = (sel) => document.querySelector(sel);
const statusText = $('#statusText');
const projectInfo = $('#projectInfo');

// ---- Editors ----
let mapEditor, towerEditor, enemyEditor, upgradeEditor, waveEditor, specialEditor;
let previewEngine = null;

function initEditors() {
  mapEditor = new MapEditor($('#mapCanvas'), project, updateStatus);
  towerEditor = new TowerEditor($('#towerList'), $('#towerDetail'), project, updateStatus);
  enemyEditor = new EnemyEditor($('#enemyList'), $('#enemyDetail'), project, updateStatus);
  upgradeEditor = new UpgradeTreeEditor($('#upgradeCanvas'), $('#upgradeNodeDetail'), project, updateStatus);
  waveEditor = new WaveEditor($('#waveList'), project, updateStatus);
  specialEditor = new SpecialEditor($('#specialList'), $('#specialDetail'), project, updateStatus);

  // tile palette
  const selectTile = (id) => {
    mapEditor.setSelectedTile(id);
    renderTilePalette($('#tilePalette'), id, selectTile);
  };
  selectTile(TILES.path.id);

  // brush
  $('#brushSize').oninput = (e) => {
    mapEditor.setBrushSize(+e.target.value);
    $('#brushSizeVal').textContent = e.target.value;
  };

  // map size
  $('#btnResizeMap').onclick = () => {
    const w = +$('#mapWidth').value;
    const h = +$('#mapHeight').value;
    mapEditor.applySize(w, h);
    updateStatus();
  };
  $('#btnClearMap').onclick = () => {
    if (confirm('맵을 전부 지우겠습니까?')) mapEditor.clear();
  };

  // tower / enemy add
  $('#btnAddTower').onclick = () => towerEditor.addTower();
  $('#btnAddEnemy').onclick = () => enemyEditor.addEnemy();
  $('#btnAddWave').onclick = () => waveEditor.addWave();
  $('#btnAddSpecial').onclick = () => specialEditor.add();

  // upgrade
  $('#btnAddUpgradeNode').onclick = () => upgradeEditor.addNode();
  $('#btnClearTree').onclick = () => upgradeEditor.clearTree();
  refreshUpgradeTowerSelect();

  // templates
  renderTemplates($('#templatesGrid'), (tpl) => {
    tpl.apply(project);
    syncAllEditors();
    setStatus(`템플릿 "${tpl.name}" 적용됨`);
  });

  // settings bind
  bindSettings();
}

function refreshUpgradeTowerSelect() {
  const sel = $('#upgradeTowerSelect');
  sel.innerHTML = '<option value="">타워 선택</option>' +
    project.towers.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
  sel.onchange = () => {
    const id = sel.value ? +sel.value : null;
    upgradeEditor.setTower(id);
  };
}

function bindSettings() {
  const map = {
    gameName: ['meta', 'name'],
    authorName: ['meta', 'author'],
    gameVersion: ['meta', 'version'],
    gameDesc: ['meta', 'description'],
    tileSize: ['meta', 'tileSize'],
    maxTowers: ['meta', 'maxTowers'],
    allowSell: ['meta', 'allowSell'],
    showPath: ['meta', 'showPath'],
    bgColor: ['meta', 'bgColor'],
    pathColor: ['meta', 'pathColor'],
    enableParticles: ['meta', 'enableParticles'],
    enableSound: ['meta', 'enableSound'],
    startGold: ['difficulty', 'startGold'],
    startLives: ['difficulty', 'startLives'],
    waveInterval: ['difficulty', 'waveInterval'],
    hpScale: ['difficulty', 'hpScale'],
    speedScale: ['difficulty', 'speedScale'],
    rewardScale: ['difficulty', 'rewardScale'],
  };

  Object.entries(map).forEach(([id, path]) => {
    const el = document.getElementById(id);
    if (!el) return;
    const apply = () => {
      let val = el.type === 'checkbox' ? el.checked
        : el.type === 'number' ? parseFloat(el.value)
        : el.value;
      project[path[0]][path[1]] = val;
      if (id === 'gameName') project.meta.name = val;
      updateStatus();
    };
    el.addEventListener(el.type === 'checkbox' || el.type === 'color' ? 'change' : 'input', apply);
  });

  // sync from project to inputs
  syncSettingsToUI();
}

function syncSettingsToUI() {
  const m = project.meta;
  const d = project.difficulty;
  if ($('#gameName')) $('#gameName').value = m.name || '';
  if ($('#authorName')) $('#authorName').value = m.author || '';
  if ($('#gameVersion')) $('#gameVersion').value = m.version || '';
  if ($('#gameDesc')) $('#gameDesc').value = m.description || '';
  if ($('#tileSize')) $('#tileSize').value = m.tileSize || 40;
  if ($('#maxTowers')) $('#maxTowers').value = m.maxTowers || 50;
  if ($('#allowSell')) $('#allowSell').checked = !!m.allowSell;
  if ($('#showPath')) $('#showPath').checked = !!m.showPath;
  if ($('#bgColor')) $('#bgColor').value = m.bgColor || '#1a1a2e';
  if ($('#pathColor')) $('#pathColor').value = m.pathColor || '#4a4a6a';
  if ($('#enableParticles')) $('#enableParticles').checked = !!m.enableParticles;
  if ($('#enableSound')) $('#enableSound').checked = !!m.enableSound;
  if ($('#startGold')) $('#startGold').value = d.startGold;
  if ($('#startLives')) $('#startLives').value = d.startLives;
  if ($('#waveInterval')) $('#waveInterval').value = d.waveInterval;
  if ($('#hpScale')) $('#hpScale').value = d.hpScale;
  if ($('#speedScale')) $('#speedScale').value = d.speedScale;
  if ($('#rewardScale')) $('#rewardScale').value = d.rewardScale;
  if ($('#mapWidth')) $('#mapWidth').value = project.map.width;
  if ($('#mapHeight')) $('#mapHeight').value = project.map.height;
}

function syncAllEditors() {
  mapEditor.setProject(project);
  towerEditor.setProject(project);
  enemyEditor.setProject(project);
  upgradeEditor.setProject(project);
  waveEditor.setProject(project);
  specialEditor.setProject(project);
  refreshUpgradeTowerSelect();
  syncSettingsToUI();
  updateStatus();
}

function updateStatus() {
  projectInfo.textContent = `타워 ${project.towers.length} · 적 ${project.enemies.length} · 웨이브 ${project.waves.length}`;
}

function setStatus(msg) {
  statusText.textContent = msg;
  setTimeout(() => { statusText.textContent = '준비됨'; }, 2500);
}

// ---- Tabs ----
document.querySelectorAll('.nav-item').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.dataset.tab;
    const panel = document.getElementById('tab-' + tab);
    if (panel) panel.classList.add('active');
    if (tab === 'upgrade') {
      refreshUpgradeTowerSelect();
      upgradeEditor._resize();
      upgradeEditor.render();
    }
    if (tab === 'map') mapEditor.render();
  };
});

// ---- Save / Load ----
$('#btnSave').onclick = () => {
  try {
    localStorage.setItem('td-maker-project', JSON.stringify(project));
    setStatus('로컬에 저장됨');
  } catch (e) {
    setStatus('저장 실패: ' + e.message);
  }
};

$('#btnLoad').onclick = () => {
  const raw = localStorage.getItem('td-maker-project');
  if (!raw) { setStatus('저장된 프로젝트 없음'); return; }
  try {
    project = JSON.parse(raw);
    if (!project.map.tiles) project.map.tiles = createEmptyMap(project.map.width, project.map.height);
    syncAllEditors();
    setStatus('불러오기 완료');
  } catch (e) {
    setStatus('불러오기 실패');
  }
};

$('#btnNew').onclick = () => {
  if (!confirm('새 프로젝트를 시작할까요? 저장하지 않은 내용은 사라집니다.')) return;
  project = createDefaultProject();
  project.map.tiles = createEmptyMap(project.map.width, project.map.height);
  syncAllEditors();
  setStatus('새 프로젝트');
};

// ---- Preview ----
$('#btnPreview').onclick = () => {
  if (!project.waves.length) {
    alert('웨이브가 없습니다. 난이도/웨이브 탭에서 추가하세요.');
    return;
  }
  if (!project.towers.length) {
    alert('타워가 없습니다. 타워 생성기에서 추가하세요.');
    return;
  }
  const path = mapEditor.findPath();
  if (!path) {
    alert('스폰 → 엔드 경로를 찾을 수 없습니다. 맵에 경로·스폰·엔드를 확인하세요.');
    return;
  }

  $('#previewOverlay').classList.remove('hidden');
  const canvas = $('#previewCanvas');
  if (previewEngine) previewEngine.stop();
  previewEngine = new GameEngine(canvas, project, {
    gold: $('#pGold'),
    lives: $('#pLives'),
    wave: $('#pWave'),
    onGameOver: () => setStatus('게임 오버'),
    onVictory: () => setStatus('승리!'),
  });
  // default select first tower for placement
  previewEngine.selectedTowerType = project.towers[0] || null;
  previewEngine.start();
};

$('#btnClosePreview').onclick = () => {
  if (previewEngine) previewEngine.stop();
  previewEngine = null;
  $('#previewOverlay').classList.add('hidden');
};

$('#btnStartWave').onclick = () => previewEngine?.startNextWave();
$('#btnPausePreview').onclick = () => previewEngine?.togglePause();

// ---- Export ----
$('#btnExport').onclick = () => {
  $('#exportOverlay').classList.remove('hidden');
  $('#exportCode').value = projectToJSON(project);
};

$('#btnCloseExport').onclick = () => $('#exportOverlay').classList.add('hidden');
$('#btnDownloadJSON').onclick = () => {
  downloadJSON(project);
  setStatus('JSON 다운로드됨');
};
$('#btnDownloadHTML').onclick = () => {
  downloadHTML(project);
  setStatus('플레이 HTML 다운로드됨');
};
$('#btnCopyCode').onclick = async () => {
  const code = buildPlayableHTML(project);
  $('#exportCode').value = code;
  try {
    await navigator.clipboard.writeText(code);
    setStatus('플레이어블 코드가 클립보드에 복사됨');
  } catch {
    setStatus('복사 실패 — 텍스트를 직접 선택하세요');
  }
};

// ---- Boot ----
initEditors();
updateStatus();

// Auto-load basic template on first visit if empty
if (!localStorage.getItem('td-maker-project')) {
  const basic = TEMPLATES.find(t => t.id === 'basic');
  if (basic) {
    basic.apply(project);
    syncAllEditors();
    setStatus('기본 템플릿 로드됨 — 바로 편집/미리보기 가능');
  }
}
