// ============================================================
//  DENTSUS V7 XMD — by Natsu Tech
//  dashboard.js  |  Web dashboard + Pairing code page
// ============================================================

const http = require('http');
const fs   = require('fs');
const path = require('path');

// ─── Stats store ─────────────────────────────────────────────
const stats = {
  status:       'starting',
  botNumber:    null,
  groupCount:   0,
  chatCount:    0,
  pluginCount:  0,
  prefix:       '.',
  messagesIn:   0,
  commandsRan:  0,
  deployedAt:   Date.now(),
  connectedAt:  null,
  processStart: global.botStartTime || Date.now(),
};

const DEPLOY_FILE = path.join(__dirname, '.deploy_ts');
function loadDeployTs() {
  try {
    if (fs.existsSync(DEPLOY_FILE)) {
      const ts = parseInt(fs.readFileSync(DEPLOY_FILE, 'utf8').trim(), 10);
      if (!isNaN(ts)) return ts;
    }
  } catch {}
  return null;
}
function saveDeployTs(ts) { try { fs.writeFileSync(DEPLOY_FILE, String(ts), 'utf8'); } catch {} }

const savedTs = loadDeployTs();
if (savedTs) stats.deployedAt = savedTs;
else saveDeployTs(stats.deployedAt);

function updateStats(patch)  { Object.assign(stats, patch); }
function incrementMessages() { stats.messagesIn++; }
function incrementCommands() { stats.commandsRan++; }
function getStats() {
  const now = Date.now();
  return {
    ...stats,
    uptimeMs:       now - stats.processStart,
    connectedForMs: stats.connectedAt ? now - stats.connectedAt : 0,
    serverTime:     new Date().toISOString(),
    sessionCount:   global.sessions ? global.sessions.size : 0,
  };
}

// ─── HTML: Pairing page (inspired by reference implementation) ─
const PAIR_HTML = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>DENTSUS V7 XMD — Jumelage</title>
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Rajdhani:wght@400;600;700&display=swap" rel="stylesheet"/>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"/>
<style>
  :root{
    --primary:#8a2be2;--secondary:#00f7ff;--accent:#ff2a6d;
    --glass:rgba(255,255,255,.05);--glass-border:rgba(255,255,255,.1);
  }
  *{box-sizing:border-box;margin:0;padding:0}
  body{
    background:#0a0a0f;
    font-family:'Rajdhani',sans-serif;color:white;
    overflow-x:hidden;min-height:100vh;
    display:flex;flex-direction:column;align-items:center;
    padding:30px 16px;
    background-image:
      radial-gradient(circle at 20% 30%,rgba(138,43,226,.15) 0%,transparent 50%),
      radial-gradient(circle at 80% 70%,rgba(0,247,255,.1) 0%,transparent 50%);
  }
  .grid{
    position:fixed;top:0;left:0;width:100%;height:100%;
    background-image:
      linear-gradient(rgba(0,247,255,.04) 1px,transparent 1px),
      linear-gradient(90deg,rgba(0,247,255,.04) 1px,transparent 1px);
    background-size:30px 30px;z-index:-1;pointer-events:none;
  }
  nav{
    display:flex;gap:8px;margin-bottom:36px;
    background:rgba(255,255,255,.04);border:1px solid var(--glass-border);
    border-radius:50px;padding:6px;
  }
  nav a{
    padding:8px 24px;border-radius:50px;text-decoration:none;
    font-weight:600;font-size:.9rem;color:rgba(255,255,255,.5);transition:all .2s;
  }
  nav a.active{background:var(--secondary);color:#000;}
  nav a:not(.active):hover{color:white;}
  .logo-text{
    font-family:'Orbitron',sans-serif;font-size:2rem;font-weight:900;
    background:linear-gradient(45deg,var(--primary),var(--secondary));
    -webkit-background-clip:text;-webkit-text-fill-color:transparent;
    letter-spacing:3px;margin-bottom:6px;text-align:center;
  }
  .tagline{color:rgba(255,255,255,.5);font-size:.85rem;margin-bottom:36px;letter-spacing:1px;}
  .box{
    width:100%;max-width:420px;padding:36px 30px;
    background:var(--glass);border-radius:18px;backdrop-filter:blur(12px);
    border:1px solid var(--glass-border);
    box-shadow:0 10px 40px rgba(0,0,0,.4),inset 0 1px 0 rgba(255,255,255,.08);
    margin-bottom:20px;
  }
  h3{font-family:'Orbitron',sans-serif;font-size:.95rem;color:var(--secondary);margin-bottom:5px;text-align:center;}
  h6{font-size:.82rem;color:rgba(255,255,255,.55);margin-bottom:22px;text-align:center;line-height:1.5;}
  .field-label{
    display:block;font-size:.72rem;font-weight:700;
    color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;
  }
  .input-row{
    display:flex;background:rgba(0,0,0,.25);border-radius:12px;
    gap:4px;padding:4px;border:1px solid var(--glass-border);margin-bottom:12px;
  }
  .input-row input{
    flex:1;padding:13px 14px;border:none;background:rgba(0,0,0,.3);
    border-radius:8px 0 0 8px;color:white;
    font-family:'Rajdhani',sans-serif;font-size:1rem;outline:none;
    border-right:1px solid rgba(138,43,226,.3);
  }
  .input-row input::placeholder{color:rgba(255,255,255,.35);}
  .input-row button{
    padding:13px 16px;
    background:linear-gradient(135deg,var(--primary) 0%,#6a11cb 100%);
    font-family:'Orbitron',sans-serif;font-size:.75rem;font-weight:700;
    text-transform:uppercase;color:white;border:none;border-radius:0 8px 8px 0;
    cursor:pointer;transition:all .3s;white-space:nowrap;letter-spacing:.5px;
  }
  .input-row button:hover{background:linear-gradient(135deg,var(--accent) 0%,#ff2a6d 100%);}
  .input-row button:disabled{opacity:.45;cursor:not-allowed;}
  .sid-input{
    width:100%;padding:11px 14px;border-radius:10px;
    background:rgba(0,0,0,.3);border:1px solid var(--glass-border);
    color:white;font-family:'Rajdhani',sans-serif;font-size:.9rem;
    outline:none;margin-bottom:18px;transition:border-color .2s;
  }
  .sid-input:focus{border-color:var(--secondary);}
  #waiting-message{
    display:none;color:var(--secondary);font-family:'Orbitron',sans-serif;
    font-size:.82rem;text-align:center;padding:10px;margin-bottom:4px;
    animation:blink 1.4s ease-in-out infinite;
  }
  @keyframes blink{0%,100%{opacity:1}50%{opacity:.4}}
  #pair{min-height:60px;display:flex;align-items:center;justify-content:center;margin-top:6px;}
  .code-display{
    font-family:'Orbitron',sans-serif;font-size:1.25rem;
    background:rgba(0,0,0,.35);padding:16px 26px;border-radius:10px;
    border:1px solid var(--glass-border);cursor:pointer;transition:all .3s;
    display:flex;align-items:center;gap:12px;animation:pulse 2s infinite;
  }
  .code-display:hover{box-shadow:0 0 20px rgba(0,247,255,.3);transform:translateY(-2px);}
  .code-value{color:var(--secondary);font-weight:700;letter-spacing:2px;}
  @keyframes pulse{
    0%{box-shadow:0 0 0 0 rgba(0,247,255,.4)}
    70%{box-shadow:0 0 0 10px rgba(0,247,255,0)}
    100%{box-shadow:0 0 0 0 rgba(0,247,255,0)}
  }
  .err-box{
    display:none;padding:12px 16px;border-radius:10px;
    background:rgba(255,42,109,.1);border:1px solid rgba(255,42,109,.4);
    color:#ff6b9d;font-size:.85rem;margin-top:10px;text-align:center;
  }
  .steps{margin-top:22px;padding-top:18px;border-top:1px solid var(--glass-border);}
  .steps-title{
    font-size:.7rem;font-weight:700;color:rgba(255,221,87,.8);
    text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;
  }
  .step{display:flex;gap:11px;align-items:flex-start;margin-bottom:9px;}
  .step-n{
    flex-shrink:0;width:20px;height:20px;border-radius:50%;
    background:var(--secondary);color:#000;font-size:.68rem;
    font-weight:900;display:flex;align-items:center;justify-content:center;margin-top:2px;
  }
  .step-t{font-size:.82rem;color:rgba(255,255,255,.7);line-height:1.5;}
  .step-t em{color:var(--secondary);font-style:normal;font-weight:700;}
  footer{margin-top:40px;color:rgba(255,255,255,.3);font-size:.75rem;text-align:center;}
</style>
</head>
<body>
<div class="grid"></div>
<div class="logo-text">⚡ DENTSUS V7 XMD</div>
<p class="tagline">by Natsu Tech · Multi-Session WhatsApp Bot</p>
<nav>
  <a href="/" class="active">🔗 Jumelage</a>
  <a href="/dashboard">📊 Dashboard</a>
</nav>

<div class="box">
  <h3>∞ Lier avec un numéro de téléphone ∞</h3>
  <h6>📡 Entre ton numéro avec l'indicatif pays (sans +, sans espaces) 📡</h6>

  <label class="field-label">Session</label>
  <input class="sid-input" id="sessionId" value="main" placeholder="main · bot2 · bot3 …"/>

  <div class="input-row">
    <input type="tel" id="number" placeholder="+24206XXXXXXX"/>
    <button id="submit" onclick="doPair()">Générer</button>
  </div>

  <div id="waiting-message">⏳ Génération du code...</div>
  <div id="pair"></div>
  <div class="err-box" id="err-box"></div>

  <div class="steps">
    <div class="steps-title">Comment entrer le code dans WhatsApp :</div>
    <div class="step"><div class="step-n">1</div>
      <div class="step-t">Ouvre <em>WhatsApp</em> sur ton téléphone</div></div>
    <div class="step"><div class="step-n">2</div>
      <div class="step-t">Va dans <em>⋮ → Appareils connectés → Lier un appareil</em></div></div>
    <div class="step"><div class="step-n">3</div>
      <div class="step-t">Appuie sur <em>"Lier avec un numéro de téléphone"</em> (en bas)</div></div>
    <div class="step"><div class="step-n">4</div>
      <div class="step-t">Entre le <em>code à 8 chiffres</em> affiché ci-dessus</div></div>
  </div>
</div>

<footer>DENTSUS V7 XMD &nbsp;·&nbsp; Natsu Tech &nbsp;·&nbsp; +242053323191 · +242065121108</footer>

<script>
function showErr(msg) {
  const el = document.getElementById('err-box');
  el.textContent = '❌ ' + msg;
  el.style.display = 'block';
}
function clearErr() { document.getElementById('err-box').style.display = 'none'; }

async function Copy(val) {
  const display = document.getElementById('code-display');
  try { await navigator.clipboard.writeText(val); } catch {}
  display.innerHTML = '<i class="fas fa-check" style="color:#00ff00"></i>&nbsp; COPIÉ !';
  setTimeout(() => {
    display.innerHTML = '<i class="fas fa-copy" style="color:var(--secondary)"></i>&nbsp;<span>CODE :</span>&nbsp;<span class="code-value">' + val + '</span>';
    display.onclick = () => Copy(val);
  }, 2000);
}

async function doPair() {
  clearErr();
  const raw = document.getElementById('number').value.replace(/[^0-9]/g, '');
  const sid = document.getElementById('sessionId').value.trim() || 'main';
  const btn = document.getElementById('submit');
  const pairEl = document.getElementById('pair');
  const waitEl = document.getElementById('waiting-message');

  if (!raw || raw.length < 7) {
    showErr('Numéro invalide — inclus le code pays (ex: 242065121108)');
    return;
  }

  btn.disabled = true;
  waitEl.style.display = 'block';
  pairEl.innerHTML = '';

  try {
    const r = await fetch('/code?number=' + encodeURIComponent(raw) + '&sid=' + encodeURIComponent(sid));
    const d = await r.json();
    waitEl.style.display = 'none';
    if (d.error) { showErr(d.error); btn.disabled = false; return; }
    const code = d.code || 'N/A';
    pairEl.innerHTML =
      '<div class="code-display" id="code-display" onclick="Copy(\\''+code+'\\')">'+
        '<i class="fas fa-copy" style="color:var(--secondary)"></i>'+
        '&nbsp;<span>CODE :</span>&nbsp;'+
        '<span class="code-value">'+code+'</span>'+
      '</div>';
  } catch (e) {
    waitEl.style.display = 'none';
    showErr('Erreur réseau. Réessaie dans 30 secondes.');
  }
  btn.disabled = false;
}

document.getElementById('number').addEventListener('keydown', e => {
  if (e.key === 'Enter') doPair();
});
</script>
</body>
</html>`;

// ─── HTML: Dashboard ─────────────────────────────────────────
const DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>DENTSUS V7 XMD · Dashboard</title>
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Rajdhani:wght@400;600;700&family=Share+Tech+Mono&display=swap" rel="stylesheet"/>
<style>
  :root{--bg:#080a10;--panel:#0d0f1a;--border:#1a1e30;--accent:#00ffe0;--purple:#bd93f9;--pink:#ff6ac1;--green:#50fa7b;--yellow:#ffdd57;--red:#ff5555;--text:#cdd6f4;--muted:#6272a4;}
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:var(--bg);color:var(--text);font-family:'Rajdhani',sans-serif;min-height:100vh;padding:40px 16px;
    display:flex;flex-direction:column;align-items:center;
    background-image:radial-gradient(ellipse at 20% 50%,rgba(0,255,224,.03) 0%,transparent 60%),
                     radial-gradient(ellipse at 80% 20%,rgba(189,147,249,.04) 0%,transparent 60%);}
  nav{display:flex;gap:8px;margin-bottom:40px;background:rgba(255,255,255,.04);
    border:1px solid #1a1e30;border-radius:50px;padding:6px;}
  nav a{padding:8px 24px;border-radius:50px;text-decoration:none;font-weight:600;
    font-size:.9rem;color:var(--muted);transition:all .2s;}
  nav a.active{background:var(--accent);color:#000;}
  nav a:not(.active):hover{color:var(--text);}
  .logo{font-family:'Orbitron',monospace;font-size:2rem;font-weight:900;color:var(--accent);
    text-shadow:0 0 20px rgba(0,255,224,.3);letter-spacing:3px;margin-bottom:6px;text-align:center;}
  .tagline{color:var(--muted);font-size:.85rem;margin-bottom:40px;letter-spacing:1px;}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));
    gap:14px;max-width:900px;width:100%;margin-bottom:24px;}
  .card{background:var(--panel);border:1px solid var(--border);border-radius:16px;padding:22px;text-align:center;}
  .card .lbl{color:var(--muted);font-size:.72rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;}
  .card .val{font-size:1.9rem;font-weight:700;font-family:'Share Tech Mono',monospace;color:var(--accent);}
  .val.g{color:var(--green)}.val.p{color:var(--purple)}.val.pk{color:var(--pink)}.val.y{color:var(--yellow)}
  .status-bar{display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:24px;flex-wrap:wrap;}
  .badge{display:inline-block;padding:6px 18px;border-radius:20px;font-size:.82rem;font-weight:700;}
  .badge.online{background:rgba(80,250,123,.15);color:var(--green);}
  .badge.offline{background:rgba(255,85,85,.15);color:var(--red);}
  .badge.wait{background:rgba(255,221,87,.15);color:var(--yellow);}
  .bot-num{color:var(--muted);font-family:'Share Tech Mono';font-size:.85rem;}
  .pair-btn{display:inline-block;padding:10px 28px;border-radius:50px;
    background:var(--accent);color:#000;font-family:'Orbitron',monospace;
    font-size:.78rem;font-weight:700;text-decoration:none;letter-spacing:1px;
    box-shadow:0 0 20px rgba(0,255,224,.3);}
  footer{margin-top:32px;color:var(--muted);font-size:.78rem;text-align:center;}
</style>
</head>
<body>
<div class="logo">⚡ DENTSUS V7 XMD</div>
<p class="tagline">by Natsu Tech · Live Dashboard</p>
<nav>
  <a href="/">🔗 Jumelage</a>
  <a href="/dashboard" class="active">📊 Dashboard</a>
</nav>
<div id="app"><p style="color:var(--muted);text-align:center">Chargement...</p></div>
<footer>Auto-refresh 5s &nbsp;·&nbsp; DENTSUS V7 XMD &nbsp;·&nbsp; Natsu Tech</footer>
<script>
function fmt(ms){const s=Math.floor(ms/1000),m=Math.floor(s/60),h=Math.floor(m/60),d=Math.floor(h/24);
  if(d>0)return d+'j '+(h%24)+'h '+(m%60)+'m';
  if(h>0)return h+'h '+(m%60)+'m '+(s%60)+'s';
  if(m>0)return m+'m '+(s%60)+'s';return s+'s';}
async function refresh(){
  try{
    const r=await fetch('/stats');const d=await r.json();
    const sm={online:'online',starting:'wait',reconnecting:'wait',offline:'offline'};
    const sl={online:'🟢 En ligne',starting:'🟡 Démarrage',reconnecting:'🟡 Reconnexion',offline:'🔴 Hors ligne'};
    document.getElementById('app').innerHTML=\`
      <div class="status-bar">
        <span class="badge \${sm[d.status]||'wait'}">\${sl[d.status]||d.status}</span>
        <span class="bot-num">\${d.botNumber||'Non connecté'}</span>
      </div>
      <div class="grid">
        <div class="card"><div class="lbl">Uptime</div><div class="val g">\${fmt(d.uptimeMs)}</div></div>
        <div class="card"><div class="lbl">Messages</div><div class="val p">\${d.messagesIn}</div></div>
        <div class="card"><div class="lbl">Commandes</div><div class="val pk">\${d.commandsRan}</div></div>
        <div class="card"><div class="lbl">Groupes</div><div class="val y">\${d.groupCount}</div></div>
        <div class="card"><div class="lbl">Sessions</div><div class="val">\${d.sessionCount||0}</div></div>
        <div class="card"><div class="lbl">Plugins</div><div class="val g">\${d.pluginCount}</div></div>
      </div>
      <div style="text-align:center"><a href="/" class="pair-btn">+ Jumeler un numéro</a></div>
    \`;
  }catch(e){document.getElementById('app').innerHTML='<p style="color:var(--red);text-align:center">Erreur de connexion</p>';}
}
refresh();setInterval(refresh,5000);
</script>
</body>
</html>`;

// ─── HTTP server ──────────────────────────────────────────────
function startDashboard(port) {
  const PORT = port || parseInt(process.env.DASHBOARD_PORT || process.env.PORT || '3000', 10);

  function parseBody(req) {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', c => { body += c; if (body.length > 1e6) reject(new Error('too large')); });
      req.on('end', () => resolve(body));
      req.on('error', reject);
    });
  }

  const server = http.createServer(async (req, res) => {
    const urlObj = new URL(req.url, `http://localhost`);
    const url    = urlObj.pathname;

    // ── GET /stats ──────────────────────────────────────────
    if (req.method === 'GET' && url === '/stats') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(getStats()));
    }

    // ── GET /code?number=XXXX&sid=main ───────────────────────
    // Calls global.requestPairCode (defined in index.js)
    // Returns { code: "XXXX-XXXX" } or { error: "..." }
    if (req.method === 'GET' && url === '/code') {
      const number = urlObj.searchParams.get('number') || '';
      const sid    = urlObj.searchParams.get('sid')    || 'main';
      const clean  = number.replace(/[^0-9]/g, '');

      if (!clean || clean.length < 7) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Numéro invalide. Inclus le code pays (ex: 242065121108)' }));
      }

      if (typeof global.requestPairCode !== 'function') {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Bot pas encore prêt. Attends 15 secondes et réessaie.' }));
      }

      try {
        const code = await global.requestPairCode(clean, sid);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ code }));
      } catch (e) {
        const msg = e.message === 'already_registered'
          ? 'Ce numéro est déjà connecté.'
          : 'WhatsApp a refusé: ' + e.message + '. Attends 30s et réessaie.';
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: msg }));
      }
    }

    // ── GET /api/sessions ────────────────────────────────────
    if (req.method === 'GET' && url === '/api/sessions') {
      const list = [];
      if (global.sessions) {
        for (const [id, entry] of global.sessions) {
          list.push({ id, connected: !!entry?.sock?.user });
        }
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(list));
    }

    // ── GET /dashboard ───────────────────────────────────────
    if (req.method === 'GET' && url === '/dashboard') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(DASHBOARD_HTML);
    }

    // ── GET / — pairing page ─────────────────────────────────
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(PAIR_HTML);
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`»  [DASHBOARD] http://localhost:${PORT}  — Pairing + Stats`);
  });

  return server;
}

module.exports = { startDashboard, updateStats, incrementMessages, incrementCommands, getStats };
