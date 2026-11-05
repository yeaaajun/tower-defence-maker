# Tower Defense Game Maker

웹에서 타워 디펜스 게임을 **코드 없이** 만들고, GitHub Pages에 올리거나 플레이 가능한 HTML로 내보낼 수 있는 메이커입니다.

## 기능

- **맵 메이커** – 타일 기반, 원하는 크기, 경로/절벽/물/스폰/엔드 등
- **타워 생성기** – 스탯, SVG 외형, 지상/공중/유령 공격, 절벽 전용, 특수 효과
- **적 생성기** – 체력·속도·보상·타입(지상/공중/유령), 보스(보스 체력바)
- **업그레이드 트리** – 가지형 노드 그래프 에디터 (드래그, Shift+연결)
- **난이도 & 웨이브** – 골드/라이프/배율, 웨이브별 적 구성
- **특별 난이도** – 클리어 시 특수 타워 보상, 배율·시작 자원 커스텀
- **템플릿** – 기본 스타터, 절벽 요새 맵, 보스 러시 등
- **미리보기** – 에디터 안에서 바로 플레이
- **내보내기** – 프로젝트 JSON / 단독 플레이 HTML / 코드 복사

## 사용법 (로컬)

1. 이 폴더를 정적 서버로 엽니다.  
   예: `npx serve .` 또는 VS Code Live Server
2. 브라우저에서 `index.html` 접속
3. 템플릿 적용 → 맵/타워/적/웨이브 편집 → 미리보기 → 내보내기

## GitHub Pages

1. 이 저장소를 GitHub에 푸시
2. Settings → Pages → Source: Deploy from branch → `main` / root (또는 `/docs`)
3. 배포 URL로 접속

> ES Modules를 사용하므로 **반드시 http(s)로 열어야** 합니다. `file://`로는 동작하지 않습니다.

## 조작 요약

| 영역 | 조작 |
|------|------|
| 맵 | 좌클릭 칠하기, 우클릭 지우기, 브러시 크기 조절 |
| 업그레이드 트리 | 노드 드래그 이동, **Shift+클릭**으로 노드 연결, 휠 줌, 빈 곳 패닝 |
| 미리보기 | 타워 선택 후 맵 클릭으로 배치, 다음 웨이브 버튼 |

## 적 타입 & 타워

- **지상** – `canAttackGround` 타워만 공격 가능
- **공중** – `canAttackAir` 타워만 공격 가능
- **유령** – `canAttackGhost` 타워만 공격 가능
- **절벽 전용 타워** – 절벽 타일에만 설치 가능

## 파일 구조

```
td-maker/
├── index.html
├── css/style.css
├── js/
│   ├── main.js
│   ├── state.js
│   ├── mapEditor.js
│   ├── towerEditor.js
│   ├── enemyEditor.js
│   ├── upgradeTree.js
│   ├── waveEditor.js
│   ├── templates.js
│   ├── gameEngine.js
│   └── export.js
└── README.md
```

## 라이선스

자유롭게 사용·수정·배포하세요.
