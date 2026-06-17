// ============================================================
//  DENTSUS V7 XMD — by Natsu Tech
//  fetchPlugins.js  |  Plugin loader (clean, transparent)
// ============================================================

const fs       = require('fs');
const path     = require('path');
const chokidar = require('chokidar');

const PLUGINS_DIR = path.join(__dirname, 'plugins');

// ─── Plugin registry ─────────────────────────────────────────
const plugins = new Map();

// ─── Load a single plugin file ───────────────────────────────
function loadFile(filePath) {
  try {
    const resolved = require.resolve(filePath);
    delete require.cache[resolved];
    require(filePath);
    console.log(`»  [PLUGIN] Loaded: ${path.relative(__dirname, filePath)}`);
  } catch (err) {
    console.error(`»  [PLUGIN] Failed to load ${path.relative(__dirname, filePath)}: ${err.message}`);
  }
}

// ─── Load all plugins from a directory recursively ───────────
function loadPlugins() {
  if (!fs.existsSync(PLUGINS_DIR)) {
    fs.mkdirSync(PLUGINS_DIR, { recursive: true });
    console.log('»  [PLUGIN] Created plugins/ directory.');
    return;
  }

  const walk = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        loadFile(full);
      }
    }
  };

  walk(PLUGINS_DIR);
  console.log(`»  [PLUGIN] Total loaded: ${plugins.size} plugin(s).`);
}

// ─── Watch for live plugin reloads ───────────────────────────
function watchPlugins() {
  if (!fs.existsSync(PLUGINS_DIR)) return;

  const watcher = chokidar.watch(PLUGINS_DIR, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 500 },
  });

  watcher
    .on('add',    (filePath) => {
      if (filePath.endsWith('.js')) {
        console.log(`»  [PLUGIN] New file detected: ${path.basename(filePath)}`);
        loadFile(filePath);
      }
    })
    .on('change', (filePath) => {
      if (filePath.endsWith('.js')) {
        console.log(`»  [PLUGIN] File changed, reloading: ${path.basename(filePath)}`);
        loadFile(filePath);
      }
    })
    .on('unlink', (filePath) => {
      console.log(`»  [PLUGIN] File removed: ${path.basename(filePath)}`);
    });

  console.log('»  [PLUGIN] Watching plugins/ for live reloads...');
  return watcher;
}

// ─── Register a plugin command ───────────────────────────────
function registerPlugin(name, handler) {
  if (typeof handler !== 'function') {
    console.error(`»  [PLUGIN] registerPlugin: handler for "${name}" must be a function.`);
    return;
  }
  plugins.set(name.toLowerCase(), handler);
}

module.exports = { loadPlugins, watchPlugins, plugins, registerPlugin };
