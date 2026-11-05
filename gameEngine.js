:root {
  --bg: #0f0f1a;
  --bg2: #16162a;
  --bg3: #1e1e36;
  --border: #2a2a4a;
  --text: #e8e8f0;
  --text2: #a0a0c0;
  --primary: #6c5ce7;
  --primary-hover: #7f71ef;
  --accent: #00cec9;
  --danger: #e17055;
  --radius: 10px;
  --font: 'Noto Sans KR', system-ui, sans-serif;
  --mono: 'JetBrains Mono', monospace;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: var(--font);
  background: var(--bg);
  color: var(--text);
  height: 100vh;
  overflow: hidden;
  font-size: 16px;
}
#app { display: flex; flex-direction: column; height: 100vh; }
.topbar {
  display: flex; align-items: center; gap: 20px;
  padding: 14px 20px; background: var(--bg2);
  border-bottom: 1px solid var(--border); flex-shrink: 0;
}
.logo { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 1.35rem; }
.logo-icon { font-size: 1.6rem; }
.game-name-wrap { display: flex; align-items: center; gap: 10px; flex: 1; }
.game-name-wrap label { color: var(--text2); font-size: 0.95rem; }
.game-name-wrap input {
  background: var(--bg3); border: 1px solid var(--border); color: var(--text);
  padding: 10px 14px; border-radius: var(--radius); font-size: 1.05rem; width: 260px;
}
.top-actions { display: flex; gap: 10px; }
.btn {
  border: none; border-radius: var(--radius); padding: 10px 16px;
  font-family: var(--font); font-size: 0.95rem; font-weight: 500;
  cursor: pointer; transition: all 0.15s; display: inline-flex; align-items: center; gap: 6px;
}
.btn-sm { padding: 8px 12px; font-size: 0.9rem; }
.btn-primary { background: var(--primary); color: #fff; }
.btn-primary:hover { background: var(--primary-hover); }
.btn-accent { background: var(--accent); color: #0f0f1a; }
.btn-ghost { background: transparent; color: var(--text2); border: 1px solid var(--border); }
.btn-ghost:hover { background: var(--bg3); color: var(--text); }
.btn-danger { background: var(--danger); color: #fff; }
.main-layout { display: flex; flex: 1; overflow: hidden; }
.sidebar {
  width: 200px; background: var(--bg2); border-right: 1px solid var(--border);
  display: flex; flex-direction: column; padding: 14px 10px; gap: 6px; flex-shrink: 0;
}
.nav-item {
  background: transparent; border: none; color: var(--text2); text-align: left;
  padding: 14px 14px; border-radius: var(--radius); cursor: pointer;
  font-family: var(--font); font-size: 1rem;
}
.nav-item:hover { background: var(--bg3); color: var(--text); }
.nav-item.active { background: var(--primary); color: #fff; font-weight: 500; }
.content { flex: 1; overflow: auto; background: var(--bg); }
.tab-panel { display: none; padding: 20px 24px; height: 100%; flex-direction: column; }
.tab-panel.active { display: flex; }
.panel-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 18px; flex-shrink: 0; flex-wrap: wrap; gap: 12px;
}
.panel-header h2 { font-size: 1.4rem; display: flex; align-items: center; gap: 8px; }
.panel-tools { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.panel-tools label { display: flex; align-items: center; gap: 6px; font-size: 0.95rem; color: var(--text2); }
.panel-tools input[type="number"] {
  width: 64px; background: var(--bg3); border: 1px solid var(--border);
  color: var(--text); padding: 6px 8px; border-radius: 6px; font-size: 0.95rem;
}
.panel-tools select {
  background: var(--bg3); border: 1px solid var(--border); color: var(--text);
  padding: 8px 12px; border-radius: 8px; font-size: 0.95rem; min-width: 140px;
}
.help-btn {
  width: 28px; height: 28px; border-radius: 50%; border: 1.5px solid var(--accent);
  background: transparent; color: var(--accent); font-weight: 700; font-size: 0.85rem;
  cursor: pointer; line-height: 1; padding: 0; flex-shrink: 0;
}
.help-btn:hover { background: var(--accent); color: #0f0f1a; }
.help-popover {
  position: fixed; z-index: 2000; max-width: 360px; background: var(--bg3);
  border: 1px solid var(--accent); border-radius: 12px; padding: 16px 18px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5); font-size: 0.95rem; line-height: 1.55; color: var(--text);
}
.help-popover.hidden { display: none; }
.help-popover-inner { position: relative; padding-right: 20px; }
.help-close {
  position: absolute; top: -4px; right: -4px; background: transparent; border: none;
  color: var(--text2); cursor: pointer; font-size: 1rem;
}
.map-editor-layout { display: flex; gap: 18px; flex: 1; min-height: 0; }
.tile-palette {
  width: 180px; flex-shrink: 0; background: var(--bg2); border-radius: var(--radius);
  padding: 14px; border: 1px solid var(--border);
}
.tile-palette h3 { font-size: 1rem; margin-bottom: 12px; color: var(--text2); }
.palette-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; }
.tile-btn {
  aspect-ratio: 1; border: 2px solid transparent; border-radius: 8px; cursor: pointer;
  font-size: 0.8rem; display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 4px; color: #fff;
}
.tile-btn.active { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
.brush-size label { font-size: 0.9rem; color: var(--text2); display: block; margin-bottom: 6px; }
.brush-size input { width: 100%; }
.map-info { font-size: 0.85rem; color: var(--text2); line-height: 1.5; margin-top: 12px; }
.map-canvas-wrap {
  flex: 1; overflow: auto; background: var(--bg2); border-radius: var(--radius);
  border: 1px solid var(--border); padding: 16px;
}
#mapCanvas { cursor: crosshair; image-rendering: pixelated; }
.editor-layout { display: flex; gap: 18px; flex: 1; min-height: 0; }
.list-panel {
  width: 260px; flex-shrink: 0; background: var(--bg2); border-radius: var(--radius);
  border: 1px solid var(--border); overflow-y: auto;
}
.item-list { padding: 10px; }
.item-card {
  padding: 14px; border-radius: 8px; cursor: pointer; margin-bottom: 6px;
  border: 1px solid transparent; display: flex; align-items: center; gap: 12px;
}
.item-card:hover { background: var(--bg3); }
.item-card.active { background: var(--bg3); border-color: var(--primary); }
.item-card .icon { font-size: 1.6rem; width: 36px; text-align: center; }
.item-card .name { font-weight: 500; font-size: 1rem; }
.item-card .meta { font-size: 0.85rem; color: var(--text2); }
.detail-panel {
  flex: 1; background: var(--bg2); border-radius: var(--radius);
  border: 1px solid var(--border); padding: 24px; overflow-y: auto;
}
.detail-panel .placeholder {
  color: var(--text2); text-align: center; padding: 48px 20px; line-height: 1.6; font-size: 1.05rem;
}
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group.span2 { grid-column: span 2; }
.form-group label { font-size: 0.9rem; color: var(--text2); }
.form-group input, .form-group select, .form-group textarea {
  background: var(--bg3); border: 1px solid var(--border); color: var(--text);
  padding: 10px 12px; border-radius: 8px; font-family: var(--font); font-size: 1rem;
}
.form-group input[type="color"] { height: 42px; padding: 3px; cursor: pointer; }
.checkbox-row { display: flex; align-items: center; gap: 8px; font-size: 1rem; }
.emoji-preview {
  font-size: 3.5rem; width: 90px; height: 90px; background: var(--bg);
  border-radius: 12px; border: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center;
}
.section-title {
  font-size: 1.05rem; margin: 22px 0 12px; padding-bottom: 8px;
  border-bottom: 1px solid var(--border); color: var(--accent);
  display: flex; align-items: center; gap: 8px;
}
.btn-row { display: flex; gap: 10px; margin-top: 18px; }
.upgrade-layout { display: flex; gap: 18px; flex: 1; min-height: 0; }
.upgrade-canvas-wrap {
  flex: 1; background: var(--bg2); border-radius: var(--radius);
  border: 1px solid var(--border); overflow: auto;
}
#upgradeCanvas { cursor: grab; display: block; }
.upgrade-sidebar {
  width: 300px; flex-shrink: 0; background: var(--bg2); border-radius: var(--radius);
  border: 1px solid var(--border); padding: 18px; overflow-y: auto;
}
.difficulty-accordion { display: flex; flex-direction: column; gap: 12px; overflow-y: auto; flex: 1; }
.diff-card {
  background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; overflow: hidden;
}
.diff-card-header {
  display: flex; align-items: center; gap: 12px; padding: 14px 18px;
  cursor: pointer; background: var(--bg3); user-select: none;
}
.diff-card-header:hover { filter: brightness(1.05); }
.diff-card-header .chevron { transition: transform 0.2s; color: var(--text2); }
.diff-card.collapsed .chevron { transform: rotate(-90deg); }
.diff-card-header strong { font-size: 1.1rem; flex: 1; }
.diff-card-body { padding: 18px; border-top: 1px solid var(--border); }
.diff-card.collapsed .diff-card-body { display: none; }
.diff-settings-row {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px; margin-bottom: 16px;
}
.diff-settings-row label {
  display: flex; flex-direction: column; gap: 4px; font-size: 0.85rem; color: var(--text2);
}
.diff-settings-row input, .diff-settings-row select {
  background: var(--bg); border: 1px solid var(--border); color: var(--text);
  padding: 8px 10px; border-radius: 6px; font-size: 0.95rem;
}
.wave-list { display: flex; flex-direction: column; gap: 10px; }
.wave-card {
  background: var(--bg3); border-radius: 10px; padding: 14px; border: 1px solid var(--border);
}
.wave-card-header {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;
}
.wave-entry {
  display: flex; gap: 8px; align-items: center; margin-bottom: 6px; font-size: 0.95rem;
}
.wave-entry select, .wave-entry input {
  background: var(--bg); border: 1px solid var(--border); color: var(--text);
  padding: 6px 8px; border-radius: 6px; font-size: 0.9rem;
}
.wave-entry select { flex: 1; }
.wave-entry input { width: 70px; }
.menu-editor-layout {
  display: grid; grid-template-columns: 1fr 1fr; gap: 20px; flex: 1; min-height: 0;
}
.menu-form {
  background: var(--bg2); border-radius: var(--radius); border: 1px solid var(--border);
  padding: 20px; overflow-y: auto;
}
.menu-preview {
  background: #0a0a14; border-radius: var(--radius); border: 1px solid var(--border);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 40px 24px; min-height: 360px; text-align: center;
}
.menu-preview .mp-title { font-size: 2.4rem; font-weight: 700; margin-bottom: 8px; }
.menu-preview .mp-sub { color: var(--text2); margin-bottom: 28px; font-size: 1.05rem; }
.menu-preview .mp-btn {
  display: block; width: 220px; margin: 0 auto 12px; padding: 14px 20px;
  border: none; border-radius: 10px; background: var(--primary); color: #fff;
  font-size: 1.05rem; font-weight: 500;
}
.settings-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 18px;
}
.setting-card {
  background: var(--bg2); border-radius: var(--radius); border: 1px solid var(--border);
  padding: 20px; display: flex; flex-direction: column; gap: 14px;
}
.setting-card h3 { font-size: 1.1rem; color: var(--accent); }
.setting-card label {
  display: flex; flex-direction: column; gap: 6px; font-size: 0.95rem; color: var(--text2);
}
.setting-card label:has(input[type="checkbox"]) { flex-direction: row; align-items: center; }
.setting-card input, .setting-card textarea {
  background: var(--bg3); border: 1px solid var(--border); color: var(--text);
  padding: 10px 12px; border-radius: 8px; font-family: var(--font); font-size: 1rem;
}
.templates-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 18px;
}
.template-card {
  background: var(--bg2); border-radius: var(--radius); border: 1px solid var(--border);
  padding: 20px; cursor: pointer; transition: all 0.15s;
}
.template-card:hover { border-color: var(--primary); transform: translateY(-2px); }
.template-card h3 { font-size: 1.1rem; margin-bottom: 8px; }
.template-card p { font-size: 0.95rem; color: var(--text2); line-height: 1.45; }
.template-card .tag {
  display: inline-block; margin-top: 12px; padding: 4px 10px; background: var(--bg3);
  border-radius: 6px; font-size: 0.8rem; color: var(--accent);
}
.statusbar {
  display: flex; justify-content: space-between; padding: 8px 20px;
  background: var(--bg2); border-top: 1px solid var(--border);
  font-size: 0.9rem; color: var(--text2); flex-shrink: 0;
}
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.75);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.modal-overlay.hidden { display: none; }
.modal {
  background: var(--bg2); border-radius: 14px; border: 1px solid var(--border);
  padding: 28px; max-width: 600px; width: 90%; max-height: 85vh; overflow-y: auto;
}
.export-modal { max-width: 720px; }
.export-options { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; }
#exportCode {
  width: 100%; background: var(--bg); border: 1px solid var(--border); color: var(--text);
  padding: 14px; border-radius: 10px; font-family: var(--mono); font-size: 0.85rem; resize: vertical;
}
.preview-modal {
  background: var(--bg2); border-radius: 14px; border: 1px solid var(--border);
  width: 96vw; max-width: 1200px; max-height: 92vh; display: flex; flex-direction: column; overflow: hidden;
}
.preview-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 18px; border-bottom: 1px solid var(--border);
}
.preview-body {
  display: flex; flex-direction: column; align-items: center; padding: 14px; overflow: auto; gap: 12px;
}
#previewCanvas { background: #1a1a2e; border-radius: 10px; max-width: 100%; }
.preview-hud {
  display: flex; gap: 28px; align-items: center; font-size: 1.15rem; font-weight: 500;
}
.preview-controls { display: flex; gap: 10px; }
.hidden { display: none !important; }
select {
  background: var(--bg3); border: 1px solid var(--border); color: var(--text);
  padding: 8px 12px; border-radius: 8px; font-family: var(--font); font-size: 0.95rem;
}
