// Central project state

export const TILES = {
  grass:  { id: 0, name: '잔디', color: '#2d6a4f', symbol: '🌱' },
  path:   { id: 1, name: '경로', color: '#6c757d', symbol: '🛤️' },
  cliff:  { id: 2, name: '절벽', color: '#8b5e3c', symbol: '🪨' },
  water:  { id: 3, name: '물',   color: '#1d3557', symbol: '💧' },
  spawn:  { id: 4, name: '스폰', color: '#2a9d8f', symbol: '🚪' },
  end:    { id: 5, name: '엔드', color: '#e63946', symbol: '🏁' },
  block:  { id: 6, name: '장애물', color: '#343a40', symbol: '⬛' },
};

export const HELP = {
  map: '맵은 적이 지나가는 경로와 타워를 설치할 땅을 그리는 곳입니다. 스폰(시작)과 엔드(끝)를 반드시 넣고, 그 사이를 경로 타일로 연결하세요.',
  multiMap: '여러 맵을 만들 수 있습니다. 난이도마다 다른 맵을 지정할 수 있어요.',
  tower: '타워는 적을 공격하는 방어 건물입니다. 비용·사거리·공격력·공격 가능 타입을 설정하세요.',
  enemy: '적은 경로를 따라 엔드로 이동합니다. 지상/공중/유령 타입에 맞는 타워만 공격할 수 있습니다.',
  boss: '보스로 체크하면 게임 화면 상단에 큰 체력바가 표시됩니다.',
  cliff: '절벽 전용 타워는 절벽 타일에만 설치할 수 있습니다. 사거리가 긴 저격수 등에 쓰면 좋습니다.',
  upgrade: '업그레이드 트리는 타워를 강화하는 가지형 경로입니다. 노드를 연결해 어떤 순서로 업그레이드할지 정합니다.',
  rootNode: '루트 노드 = 업그레이드 트리의 시작점입니다. 게임에서 타워를 지은 뒤, 가장 먼저 해금·구매할 수 있는 첫 업그레이드입니다. 보통 트리에 하나만 둡니다.',
  difficulty: '난이도마다 시작 골드·라이프·배율과 웨이브 구성을 다르게 둘 수 있습니다. 접기/펼치기로 관리하세요.',
  wave: '웨이브는 한 번에 나오는 적 무리입니다. 적 종류·수·출현 간격을 설정합니다.',
  special: '특별 난이도는 클리어 시 특수 타워를 주는 챌린지 모드입니다. 배율과 시작 자원을 따로 설정할 수 있습니다.',
  mainMenu: '플레이 HTML의 첫 화면입니다. 큰 게임 제목과 그 아래 버튼(게임 시작, 난이도 선택 등)을 꾸밀 수 있습니다.',
  emoji: '타워와 적은 이모지로 표시됩니다. 이동·공격 방향에 따라 이모지가 바라보는 쪽을 바꿉니다.',
};

export function createDefaultProject() {
  const map0 = createMapData(1, '기본 맵', 24, 16);
  return {
    meta: {
      name: 'My Tower Defense',
      author: 'Anonymous',
      version: '1.0.0',
      description: '',
      tileSize: 48,
      maxTowers: 50,
      allowSell: true,
      showPath: true,
      bgColor: '#1a1a2e',
      pathColor: '#4a4a6a',
      enableParticles: true,
      enableSound: false,
    },
    maps: [map0],
    activeMapId: 1,
    // legacy single map pointer (synced to active map)
    map: map0,
    towers: [],
    enemies: [],
    difficulties: [
      createDefaultDifficulty(1, '쉬움', {
        startGold: 600, startLives: 25, hpScale: 0.8, speedScale: 0.9, rewardScale: 1.2,
      }),
      createDefaultDifficulty(2, '보통', {
        startGold: 500, startLives: 20, hpScale: 1.0, speedScale: 1.0, rewardScale: 1.0,
      }),
      createDefaultDifficulty(3, '어려움', {
        startGold: 400, startLives: 15, hpScale: 1.3, speedScale: 1.15, rewardScale: 0.9,
      }),
    ],
    // kept for simple preview default
    difficulty: null,
    specials: [],
    upgradeTrees: {},
    mainMenu: {
      title: 'My Tower Defense',
      subtitle: '타워를 세우고 적을 막으세요',
      bgColor: '#0f0f1a',
      titleColor: '#ffffff',
      buttons: [
        { id: 'play', label: '게임 시작', action: 'play' },
        { id: 'diff', label: '난이도 선택', action: 'difficulty' },
      ],
    },
  };
}

export function createMapData(id, name, w = 24, h = 16) {
  return {
    id,
    name,
    width: w,
    height: h,
    tiles: createEmptyMap(w, h),
  };
}

export function createEmptyMap(w, h) {
  const tiles = [];
  for (let y = 0; y < h; y++) {
    const row = [];
    for (let x = 0; x < w; x++) row.push(TILES.grass.id);
    tiles.push(row);
  }
  return tiles;
}

export function createDefaultDifficulty(id, name, overrides = {}) {
  return {
    id,
    name,
    startGold: 500,
    startLives: 20,
    waveInterval: 5,
    hpScale: 1.0,
    speedScale: 1.0,
    rewardScale: 1.0,
    mapId: null, // null = active/default map
    waves: [],
    collapsed: false,
    ...overrides,
  };
}

export function createDefaultTower(id) {
  return {
    id,
    name: `타워 ${id}`,
    cost: 100,
    range: 3,
    damage: 15,
    attackSpeed: 1.0,
    projectileSpeed: 8,
    color: '#6c5ce7',
    emoji: '🗼',
    canAttackGround: true,
    canAttackAir: false,
    canAttackGhost: false,
    isCliffOnly: false,
    sellRatio: 0.6,
    description: '',
    effects: [],
  };
}

export function createDefaultEnemy(id) {
  return {
    id,
    name: `적 ${id}`,
    hp: 50,
    speed: 1.5,
    reward: 10,
    color: '#e17055',
    emoji: '👾',
    type: 'ground', // ground | air | ghost
    isBoss: false,
    bossBarColor: '#e63946',
    description: '',
    armor: 0,
    regen: 0,
  };
}

export function createDefaultWave(index) {
  return {
    id: index,
    name: `웨이브 ${index + 1}`,
    entries: [{ enemyId: null, count: 5, interval: 0.8 }],
    bonusGold: 50,
  };
}

export function createDefaultSpecial(id) {
  return {
    id,
    name: `특별 난이도 ${id}`,
    description: '클리어 시 특수 타워를 획득합니다.',
    rewardTowerId: null,
    mapId: null,
    hpScale: 1.5,
    speedScale: 1.2,
    rewardScale: 1.5,
    startGold: 400,
    startLives: 15,
    waves: [],
  };
}

/** Sync project.map to the active map in maps[] */
export function syncActiveMap(project) {
  const m = project.maps.find(x => x.id === project.activeMapId) || project.maps[0];
  if (m) {
    project.activeMapId = m.id;
    project.map = m;
  }
  return m;
}
