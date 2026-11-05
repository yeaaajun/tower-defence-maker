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

export function createDefaultProject() {
  return {
    meta: {
      name: 'My Tower Defense',
      author: 'Anonymous',
      version: '1.0.0',
      description: '',
      tileSize: 40,
      maxTowers: 50,
      allowSell: true,
      showPath: true,
      bgColor: '#1a1a2e',
      pathColor: '#4a4a6a',
      enableParticles: true,
      enableSound: false,
    },
    map: {
      width: 20,
      height: 15,
      tiles: null, // filled later
    },
    towers: [],
    enemies: [],
    waves: [],
    difficulty: {
      startGold: 500,
      startLives: 20,
      waveInterval: 5,
      hpScale: 1.0,
      speedScale: 1.0,
      rewardScale: 1.0,
    },
    specials: [],
    upgradeTrees: {}, // towerId -> { nodes: [], edges: [] }
  };
}

export function createEmptyMap(w, h) {
  const tiles = [];
  for (let y = 0; y < h; y++) {
    const row = [];
    for (let x = 0; x < w; x++) {
      row.push(TILES.grass.id);
    }
    tiles.push(row);
  }
  return tiles;
}

export function createDefaultTower(id) {
  return {
    id,
    name: `타워 ${id}`,
    cost: 100,
    range: 3,
    damage: 15,
    attackSpeed: 1.0, // attacks per second
    projectileSpeed: 8,
    color: '#6c5ce7',
    svg: defaultTowerSVG('#6c5ce7'),
    canAttackGround: true,
    canAttackAir: false,
    canAttackGhost: false,
    isCliffOnly: false,
    sellRatio: 0.6,
    description: '',
    effects: [], // splash, slow, poison, etc.
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
    svg: defaultEnemySVG('#e17055'),
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
    entries: [
      { enemyId: null, count: 5, interval: 0.8 }
    ],
    bonusGold: 50,
  };
}

export function createDefaultSpecial(id) {
  return {
    id,
    name: `특별 난이도 ${id}`,
    description: '클리어 시 특수 타워를 획득합니다.',
    rewardTowerId: null,
    fixedMap: null, // optional override map
    hpScale: 1.5,
    speedScale: 1.2,
    rewardScale: 1.5,
    startGold: 400,
    startLives: 15,
    waves: [],
  };
}

export function defaultTowerSVG(color = '#6c5ce7') {
  return `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
  <rect x="12" y="18" width="16" height="18" rx="2" fill="${color}"/>
  <rect x="8" y="10" width="24" height="10" rx="2" fill="${color}" opacity="0.85"/>
  <circle cx="20" cy="12" r="5" fill="#fff" opacity="0.9"/>
  <rect x="17" y="4" width="6" height="8" rx="1" fill="${color}"/>
</svg>`;
}

export function defaultEnemySVG(color = '#e17055') {
  return `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
  <circle cx="20" cy="22" r="12" fill="${color}"/>
  <circle cx="15" cy="19" r="2.5" fill="#fff"/>
  <circle cx="25" cy="19" r="2.5" fill="#fff"/>
  <circle cx="15.5" cy="19.5" r="1.2" fill="#111"/>
  <circle cx="25.5" cy="19.5" r="1.2" fill="#111"/>
  <ellipse cx="20" cy="27" rx="4" ry="2" fill="#111" opacity="0.4"/>
</svg>`;
}

export function defaultAirEnemySVG(color = '#74b9ff') {
  return `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="20" cy="20" rx="14" ry="8" fill="${color}"/>
  <path d="M6 20 Q20 8 34 20 Q20 14 6 20" fill="${color}" opacity="0.7"/>
  <circle cx="14" cy="18" r="2" fill="#fff"/>
  <circle cx="26" cy="18" r="2" fill="#fff"/>
</svg>`;
}

export function defaultGhostEnemySVG(color = '#a29bfe') {
  return `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
  <path d="M10 28 Q10 10 20 8 Q30 10 30 28 Q27 24 24 28 Q20 24 16 28 Q13 24 10 28" fill="${color}" opacity="0.85"/>
  <circle cx="15" cy="18" r="2.5" fill="#fff"/>
  <circle cx="25" cy="18" r="2.5" fill="#fff"/>
  <circle cx="15.5" cy="18.5" r="1.2" fill="#111"/>
  <circle cx="25.5" cy="18.5" r="1.2" fill="#111"/>
</svg>`;
}

export function defaultBossSVG(color = '#d63031') {
  return `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
  <circle cx="20" cy="22" r="14" fill="${color}"/>
  <circle cx="14" cy="18" r="3" fill="#fff"/>
  <circle cx="26" cy="18" r="3" fill="#fff"/>
  <circle cx="14.5" cy="18.5" r="1.5" fill="#111"/>
  <circle cx="26.5" cy="18.5" r="1.5" fill="#111"/>
  <path d="M12 28 Q20 32 28 28" stroke="#111" stroke-width="2" fill="none"/>
  <polygon points="12,10 14,4 16,10" fill="#fdcb6e"/>
  <polygon points="24,10 26,4 28,10" fill="#fdcb6e"/>
</svg>`;
}
