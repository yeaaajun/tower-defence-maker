<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tower Defense Game Maker</title>
  <link rel="stylesheet" href="css/style.css" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
</head>
<body>
  <div id="app">
    <header class="topbar">
      <div class="logo">
        <span class="logo-icon">🏰</span>
        <span class="logo-text">TD Maker</span>
      </div>
      <div class="game-name-wrap">
        <label>게임 이름</label>
        <input type="text" id="gameName" value="My Tower Defense" placeholder="게임 이름 입력" />
      </div>
      <div class="top-actions">
        <button id="btnNew" class="btn btn-ghost">🆕 새 프로젝트</button>
        <button id="btnLoad" class="btn btn-ghost">📂 불러오기</button>
        <button id="btnSave" class="btn btn-ghost">💾 저장</button>
        <button id="btnPreview" class="btn btn-primary">▶ 미리보기</button>
        <button id="btnExport" class="btn btn-accent">📦 내보내기</button>
      </div>
    </header>

    <div class="main-layout">
      <nav class="sidebar">
        <button class="nav-item active" data-tab="map">🗺️ 맵 메이커</button>
        <button class="nav-item" data-tab="tower">🗼 타워</button>
        <button class="nav-item" data-tab="enemy">👾 적</button>
        <button class="nav-item" data-tab="upgrade">🌳 업그레이드</button>
        <button class="nav-item" data-tab="difficulty">⚡ 난이도/웨이브</button>
        <button class="nav-item" data-tab="special">⭐ 특별 난이도</button>
        <button class="nav-item" data-tab="menu">🏠 메인메뉴</button>
        <button class="nav-item" data-tab="settings">⚙️ 설정</button>
        <button class="nav-item" data-tab="templates">📋 템플릿</button>
      </nav>

      <main class="content">
        <!-- MAP -->
        <section id="tab-map" class="tab-panel active">
          <div class="panel-header">
            <h2>맵 메이커 <button type="button" class="help-btn" data-help="map">?</button></h2>
            <div class="panel-tools">
              <select id="mapSelect"></select>
              <button id="btnAddMap" class="btn btn-sm btn-primary">+ 맵 추가</button>
              <button id="btnRenameMap" class="btn btn-sm">이름 변경</button>
              <button id="btnDeleteMap" class="btn btn-sm btn-danger">맵 삭제</button>
              <label>가로 <input type="number" id="mapWidth" value="24" min="8" max="50" /></label>
              <label>세로 <input type="number" id="mapHeight" value="16" min="8" max="40" /></label>
              <button id="btnResizeMap" class="btn btn-sm">크기 적용</button>
              <button id="btnClearMap" class="btn btn-sm btn-danger">전체 지우기</button>
              <button type="button" class="help-btn" data-help="multiMap">?</button>
            </div>
          </div>
          <div class="map-editor-layout">
            <div class="tile-palette">
              <h3>타일 팔레트</h3>
              <div class="palette-grid" id="tilePalette"></div>
              <div class="brush-size">
                <label>브러시 크기 <span id="brushSizeVal">1</span></label>
                <input type="range" id="brushSize" min="1" max="5" value="1" />
              </div>
              <div class="map-info">
                <p>좌클릭: 칠하기 / 우클릭: 지우기</p>
                <p>스폰과 엔드를 넣고 경로로 연결하세요.</p>
              </div>
            </div>
            <div class="map-canvas-wrap">
              <canvas id="mapCanvas"></canvas>
            </div>
          </div>
        </section>

        <!-- TOWER -->
        <section id="tab-tower" class="tab-panel">
          <div class="panel-header">
            <h2>타워 생성기 <button type="button" class="help-btn" data-help="tower">?</button></h2>
            <button id="btnAddTower" class="btn btn-primary btn-sm">+ 새 타워</button>
          </div>
          <div class="editor-layout">
            <div class="list-panel"><div id="towerList" class="item-list"></div></div>
            <div class="detail-panel" id="towerDetail"><p class="placeholder">타워를 선택하거나 새로 만드세요.</p></div>
          </div>
        </section>

        <!-- ENEMY -->
        <section id="tab-enemy" class="tab-panel">
          <div class="panel-header">
            <h2>적 생성기 <button type="button" class="help-btn" data-help="enemy">?</button></h2>
            <button id="btnAddEnemy" class="btn btn-primary btn-sm">+ 새 적</button>
          </div>
          <div class="editor-layout">
            <div class="list-panel"><div id="enemyList" class="item-list"></div></div>
            <div class="detail-panel" id="enemyDetail"><p class="placeholder">적을 선택하거나 새로 만드세요.</p></div>
          </div>
        </section>

        <!-- UPGRADE -->
        <section id="tab-upgrade" class="tab-panel">
          <div class="panel-header">
            <h2>업그레이드 트리 <button type="button" class="help-btn" data-help="upgrade">?</button>
              <button type="button" class="help-btn" data-help="rootNode" title="루트 노드란?">루트?</button>
            </h2>
            <div class="panel-tools">
              <select id="upgradeTowerSelect"></select>
              <button id="btnAddUpgradeNode" class="btn btn-sm">+ 노드 추가</button>
              <button id="btnClearTree" class="btn btn-sm btn-danger">트리 초기화</button>
            </div>
          </div>
          <div class="upgrade-layout">
            <div class="upgrade-canvas-wrap"><canvas id="upgradeCanvas"></canvas></div>
            <div class="upgrade-sidebar" id="upgradeNodeDetail"><p class="placeholder">노드를 선택하세요.</p></div>
          </div>
        </section>

        <!-- DIFFICULTY -->
        <section id="tab-difficulty" class="tab-panel">
          <div class="panel-header">
            <h2>난이도 & 웨이브 <button type="button" class="help-btn" data-help="difficulty">?</button></h2>
            <button id="btnAddDifficulty" class="btn btn-primary btn-sm">+ 난이도 추가</button>
          </div>
          <div id="difficultyList" class="difficulty-accordion"></div>
        </section>

        <!-- SPECIAL -->
        <section id="tab-special" class="tab-panel">
          <div class="panel-header">
            <h2>특별 난이도 <button type="button" class="help-btn" data-help="special">?</button></h2>
            <button id="btnAddSpecial" class="btn btn-primary btn-sm">+ 특별 난이도 추가</button>
          </div>
          <div class="editor-layout">
            <div class="list-panel"><div id="specialList" class="item-list"></div></div>
            <div class="detail-panel" id="specialDetail"><p class="placeholder">특별 난이도를 선택하거나 새로 만드세요.</p></div>
          </div>
        </section>

        <!-- MAIN MENU -->
        <section id="tab-menu" class="tab-panel">
          <div class="panel-header">
            <h2>메인메뉴 편집 <button type="button" class="help-btn" data-help="mainMenu">?</button></h2>
          </div>
          <div class="menu-editor-layout">
            <div class="menu-form" id="menuForm"></div>
            <div class="menu-preview" id="menuPreview"></div>
          </div>
        </section>

        <!-- SETTINGS -->
        <section id="tab-settings" class="tab-panel">
          <div class="panel-header"><h2>게임 설정</h2></div>
          <div class="settings-grid">
            <div class="setting-card">
              <h3>기본 정보</h3>
              <label>제작자 <input type="text" id="authorName" value="Anonymous" /></label>
              <label>버전 <input type="text" id="gameVersion" value="1.0.0" /></label>
              <label>설명 <textarea id="gameDesc" rows="3"></textarea></label>
            </div>
            <div class="setting-card">
              <h3>플레이 설정</h3>
              <label>타일 크기(px) <input type="number" id="tileSize" value="48" min="24" max="72" /></label>
              <label>최대 타워 수 <input type="number" id="maxTowers" value="50" min="10" /></label>
              <label><input type="checkbox" id="allowSell" checked /> 타워 판매 허용</label>
              <label><input type="checkbox" id="showPath" checked /> 경로 미리보기</label>
            </div>
            <div class="setting-card">
              <h3>시각</h3>
              <label>배경색 <input type="color" id="bgColor" value="#1a1a2e" /></label>
              <label>경로색 <input type="color" id="pathColor" value="#4a4a6a" /></label>
              <label><input type="checkbox" id="enableParticles" checked /> 파티클</label>
            </div>
          </div>
        </section>

        <!-- TEMPLATES -->
        <section id="tab-templates" class="tab-panel">
          <div class="panel-header"><h2>템플릿</h2></div>
          <div class="templates-grid" id="templatesGrid"></div>
        </section>
      </main>
    </div>

    <footer class="statusbar">
      <span id="statusText">준비됨</span>
      <span id="projectInfo">타워 0 · 적 0 · 난이도 0</span>
    </footer>
  </div>

  <!-- Help popover -->
  <div id="helpPopover" class="help-popover hidden">
    <div class="help-popover-inner">
      <button type="button" class="help-close" id="helpClose">✕</button>
      <div id="helpBody"></div>
    </div>
  </div>

  <!-- Preview -->
  <div id="previewOverlay" class="modal-overlay hidden">
    <div class="preview-modal">
      <div class="preview-header">
        <h2>게임 미리보기</h2>
        <div style="display:flex;gap:8px;align-items:center;">
          <select id="previewDiffSelect"></select>
          <button id="btnClosePreview" class="btn btn-ghost">✕ 닫기</button>
        </div>
      </div>
      <div class="preview-body">
        <canvas id="previewCanvas"></canvas>
        <div class="preview-hud">
          <div>💰 <span id="pGold">0</span></div>
          <div>❤️ <span id="pLives">0</span></div>
          <div>🌊 <span id="pWave">0</span></div>
          <div class="preview-controls">
            <button id="btnStartWave" class="btn btn-sm btn-primary">다음 웨이브</button>
            <button id="btnPausePreview" class="btn btn-sm">일시정지</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Export -->
  <div id="exportOverlay" class="modal-overlay hidden">
    <div class="modal export-modal">
      <h2>내보내기</h2>
      <div class="export-options">
        <button id="btnDownloadJSON" class="btn btn-primary">📄 JSON 다운로드</button>
        <button id="btnDownloadHTML" class="btn btn-accent">🌐 플레이 HTML 다운로드</button>
        <button id="btnCopyCode" class="btn btn-ghost">📋 코드 복사</button>
      </div>
      <textarea id="exportCode" readonly rows="12"></textarea>
      <button id="btnCloseExport" class="btn btn-ghost" style="margin-top:12px">닫기</button>
    </div>
  </div>

  <script type="module" src="js/main.js"></script>
</body>
</html>
