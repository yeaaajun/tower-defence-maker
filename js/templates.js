import {
  createDefaultProject,
  createEmptyMap,
  TILES,
  createDefaultTower,
  createDefaultEnemy,
  createDefaultWave,
  defaultTowerSVG,
  defaultEnemySVG,
  defaultAirEnemySVG,
  defaultGhostEnemySVG,
  defaultBossSVG,
} from './state.js';

function pathHorizontal(map, y, x1, x2) {
  for (let x = x1; x <= x2; x++) map.tiles[y][x] = TILES.path.id;
}
function pathVertical(map, x, y1, y2) {
  for (let y = y1; y <= y2; y++) map.tiles[y][x] = TILES.path.id;
}

export const TEMPLATES = [
  {
    id: 'basic',
    name: '기본 스타터',
    desc: '간단한 경로, 기본 타워 3종, 지상/공중/유령 적, 10웨이브',
    tag: '입문',
    apply(project) {
      Object.assign(project, createDefaultProject());
      project.meta.name = '기본 타워 디펜스';
      project.map.width = 16;
      project.map.height = 12;
      project.map.tiles = createEmptyMap(16, 12);
      // simple S path
      pathHorizontal(project.map, 2, 0, 10);
      pathVertical(project.map, 10, 2, 6);
      pathHorizontal(project.map, 6, 3, 10);
      pathVertical(project.map, 3, 6, 10);
      pathHorizontal(project.map, 10, 3, 15);
      project.map.tiles[2][0] = TILES.spawn.id;
      project.map.tiles[10][15] = TILES.end.id;
      // some cliffs
      for (let x = 5; x <= 8; x++) project.map.tiles[4][x] = TILES.cliff.id;
      for (let x = 5; x <= 8; x++) project.map.tiles[8][x] = TILES.cliff.id;

      // towers
      const t1 = createDefaultTower(1);
      t1.name = '기본 포탑';
      t1.cost = 80;
      t1.damage = 12;
      t1.range = 2.5;
      t1.canAttackGround = true;
      t1.color = '#6c5ce7';
      t1.svg = defaultTowerSVG(t1.color);

      const t2 = createDefaultTower(2);
      t2.name = '대공 포탑';
      t2.cost = 120;
      t2.damage = 18;
      t2.range = 3.5;
      t2.canAttackGround = false;
      t2.canAttackAir = true;
      t2.color = '#0984e3';
      t2.svg = defaultTowerSVG(t2.color);

      const t3 = createDefaultTower(3);
      t3.name = '유령 헌터';
      t3.cost = 150;
      t3.damage = 20;
      t3.range = 3;
      t3.canAttackGround = true;
      t3.canAttackGhost = true;
      t3.color = '#a29bfe';
      t3.svg = defaultTowerSVG(t3.color);

      const t4 = createDefaultTower(4);
      t4.name = '절벽 저격수';
      t4.cost = 200;
      t4.damage = 35;
      t4.range = 5;
      t4.attackSpeed = 0.6;
      t4.isCliffOnly = true;
      t4.canAttackGround = true;
      t4.canAttackAir = true;
      t4.color = '#e17055';
      t4.svg = defaultTowerSVG(t4.color);

      project.towers = [t1, t2, t3, t4];

      // enemies
      const e1 = createDefaultEnemy(1);
      e1.name = '슬라임';
      e1.hp = 40;
      e1.speed = 1.4;
      e1.reward = 8;
      e1.svg = defaultEnemySVG('#00b894');

      const e2 = createDefaultEnemy(2);
      e2.name = '비행 박쥐';
      e2.hp = 30;
      e2.speed = 2.2;
      e2.reward = 12;
      e2.type = 'air';
      e2.color = '#74b9ff';
      e2.svg = defaultAirEnemySVG(e2.color);

      const e3 = createDefaultEnemy(3);
      e3.name = '유령';
      e3.hp = 55;
      e3.speed = 1.6;
      e3.reward = 15;
      e3.type = 'ghost';
      e3.color = '#a29bfe';
      e3.svg = defaultGhostEnemySVG(e3.color);

      const e4 = createDefaultEnemy(4);
      e4.name = '보스 골렘';
      e4.hp = 500;
      e4.speed = 0.8;
      e4.reward = 100;
      e4.isBoss = true;
      e4.color = '#d63031';
      e4.svg = defaultBossSVG(e4.color);
      e4.armor = 5;

      project.enemies = [e1, e2, e3, e4];

      // waves
      project.waves = [];
      for (let i = 0; i < 10; i++) {
        const w = createDefaultWave(i);
        w.name = `웨이브 ${i + 1}`;
        if (i < 3) {
          w.entries = [{ enemyId: 1, count: 5 + i * 2, interval: 0.7 }];
        } else if (i < 6) {
          w.entries = [
            { enemyId: 1, count: 6, interval: 0.6 },
            { enemyId: 2, count: 3 + (i - 3), interval: 0.9 },
          ];
        } else if (i < 9) {
          w.entries = [
            { enemyId: 1, count: 8, interval: 0.5 },
            { enemyId: 2, count: 4, interval: 0.8 },
            { enemyId: 3, count: 3, interval: 1.0 },
          ];
        } else {
          w.entries = [
            { enemyId: 1, count: 10, interval: 0.4 },
            { enemyId: 4, count: 1, interval: 2 },
          ];
          w.bonusGold = 150;
        }
        project.waves.push(w);
      }

      // simple upgrade tree for t1
      project.upgradeTrees[1] = {
        nodes: [
          { id: 1, x: 200, y: 150, name: '강화', cost: 50, damageBonus: 8, rangeBonus: 0, attackSpeedBonus: 0, isRoot: true, description: '기본 강화' },
          { id: 2, x: 120, y: 280, name: '화력+', cost: 80, damageBonus: 15, rangeBonus: 0, attackSpeedBonus: 0, isRoot: false, description: '' },
          { id: 3, x: 280, y: 280, name: '사거리+', cost: 70, damageBonus: 0, rangeBonus: 1, attackSpeedBonus: 0, isRoot: false, description: '' },
          { id: 4, x: 120, y: 400, name: '초화력', cost: 120, damageBonus: 25, rangeBonus: 0, attackSpeedBonus: 0.2, isRoot: false, description: '' },
        ],
        edges: [
          { from: 1, to: 2 },
          { from: 1, to: 3 },
          { from: 2, to: 4 },
        ],
      };

      project.difficulty.startGold = 400;
      project.difficulty.startLives = 20;
    },
  },
  {
    id: 'cliff_map',
    name: '절벽 요새',
    desc: '절벽이 많은 맵. 절벽 전용 타워가 핵심인 맵 템플릿',
    tag: '맵',
    apply(project) {
      project.map.width = 18;
      project.map.height = 14;
      project.map.tiles = createEmptyMap(18, 14);
      // winding path
      pathHorizontal(project.map, 1, 0, 8);
      pathVertical(project.map, 8, 1, 5);
      pathHorizontal(project.map, 5, 8, 14);
      pathVertical(project.map, 14, 5, 9);
      pathHorizontal(project.map, 9, 4, 14);
      pathVertical(project.map, 4, 9, 12);
      pathHorizontal(project.map, 12, 4, 17);
      project.map.tiles[1][0] = TILES.spawn.id;
      project.map.tiles[12][17] = TILES.end.id;
      // cliffs around path
      for (let y = 2; y <= 4; y++) for (let x = 2; x <= 6; x++) project.map.tiles[y][x] = TILES.cliff.id;
      for (let y = 6; y <= 8; y++) for (let x = 10; x <= 13; x++) project.map.tiles[y][x] = TILES.cliff.id;
      for (let y = 10; y <= 11; y++) for (let x = 6; x <= 10; x++) project.map.tiles[y][x] = TILES.cliff.id;
      // water decoration
      for (let x = 0; x < 18; x++) {
        if (project.map.tiles[0][x] === TILES.grass.id) project.map.tiles[0][x] = TILES.water.id;
        if (project.map.tiles[13][x] === TILES.grass.id) project.map.tiles[13][x] = TILES.water.id;
      }
    },
  },
  {
    id: 'boss_rush',
    name: '보스 러시',
    desc: '보스가 연속으로 나오는 고난이도 웨이브 세트',
    tag: '난이도',
    apply(project) {
      // ensure boss enemy exists
      let boss = project.enemies.find(e => e.isBoss);
      if (!boss) {
        boss = createDefaultEnemy(100);
        boss.name = '메가 보스';
        boss.hp = 800;
        boss.speed = 0.7;
        boss.reward = 200;
        boss.isBoss = true;
        boss.color = '#d63031';
        boss.svg = defaultBossSVG(boss.color);
        project.enemies.push(boss);
      }
      project.waves = [];
      for (let i = 0; i < 5; i++) {
        const w = createDefaultWave(i);
        w.name = `보스 웨이브 ${i + 1}`;
        w.entries = [{ enemyId: boss.id, count: 1 + Math.floor(i / 2), interval: 3 }];
        w.bonusGold = 100 + i * 50;
        project.waves.push(w);
      }
      project.difficulty.hpScale = 1.3;
      project.difficulty.startGold = 600;
    },
  },
  {
    id: 'empty',
    name: '빈 프로젝트',
    desc: '모든 것을 처음부터 직접 만들고 싶을 때',
    tag: '초기화',
    apply(project) {
      Object.assign(project, createDefaultProject());
      project.map.tiles = createEmptyMap(20, 15);
      project.meta.name = '새 게임';
    },
  },
];

export function renderTemplates(container, onApply) {
  container.innerHTML = '';
  TEMPLATES.forEach(tpl => {
    const card = document.createElement('div');
    card.className = 'template-card';
    card.innerHTML = `
      <h3>${tpl.name}</h3>
      <p>${tpl.desc}</p>
      <span class="tag">${tpl.tag}</span>
    `;
    card.onclick = () => {
      if (confirm(`"${tpl.name}" 템플릿을 적용할까요?\n현재 작업 내용이 덮어씌워질 수 있습니다.`)) {
        onApply(tpl);
      }
    };
    container.appendChild(card);
  });
}
