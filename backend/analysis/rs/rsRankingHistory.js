const fs = require('fs');
const path = require('path');

const historyFolder = path.join(__dirname, '..', '..', 'json-history');

/* ============================================================
   1) GLOBALER CACHE & KONSTANTEN
   ============================================================ */
let cache = {
  files: null,
  fileStats: new Map(),
  fileContents: new Map(),
  maps: new Map(),
};

/* ============================================================
   2) LOW-LEVEL HELFERFUNKTIONEN
   ============================================================ */

function extractName(item) {
  if (typeof item.name === 'string' && item.name.trim() !== '') return item.name.trim();
  if (typeof item.industry === 'string' && item.industry.trim() !== '') return item.industry.trim();
  if (typeof item.sector === 'string' && item.sector.trim() !== '') return item.sector.trim();
  return 'UNKNOWN';
}

function loadHistoryFiles(type) {
  const suffix = type === 'sector' ? '_sectors.json' : '_industries.json';

  const files = fs.readdirSync(historyFolder)
    .filter(f => f.endsWith(suffix))
    .sort();

  if (!cache.files || JSON.stringify(cache.files) !== JSON.stringify(files)) {
    cache.files = files;
    cache.fileStats.clear();
    cache.fileContents.clear();
    cache.maps.clear();
  }

  return files;
}

function loadFileCached(filename) {
  const fullPath = path.join(historyFolder, filename);
  const stat = fs.statSync(fullPath);

  const prevStat = cache.fileStats.get(filename);

  if (prevStat && prevStat.mtimeMs === stat.mtimeMs) {
    return cache.fileContents.get(filename);
  }

  const raw = JSON.parse(fs.readFileSync(fullPath, 'utf8'));

  cache.fileStats.set(filename, stat);
  cache.fileContents.set(filename, raw);

  return raw;
}

/* ============================================================
   3) BUSINESS-LOGIK
   ============================================================ */

function buildHistoryMaps(files, steps) {
  const cacheKey = JSON.stringify({ files, steps });

  if (cache.maps.has(cacheKey)) {
    return cache.maps.get(cacheKey);
  }

  const maps = {};

  for (const [key, backStep] of Object.entries(steps)) {
    const index = files.length - 1 - backStep;
    if (index < 0) continue;

    const filename = files[index];
    const raw = loadFileCached(filename);

    // Score NICHT neu berechnen – Score kommt aus JSON
    const ranked = [...raw].sort((a, b) => b.score - a.score);

    const map = new Map();
    ranked.forEach((item, i) => {
      map.set(extractName(item), i + 1);
    });

    maps[key] = map;
  }

  cache.maps.set(cacheKey, maps);

  return maps;
}

function applyDiffs(currentData, historyMaps, steps) {
  return currentData.map((item, index) => {
    const name = extractName(item);
    const currentRank = index + 1;

    const diffs = {};
    for (const key of Object.keys(steps)) {
      const map = historyMaps[key];
      diffs[`diff${key}`] = map?.has(name) ? map.get(name) - currentRank : null;
    }

    return { ...item, ...diffs };
  });
}

/* ============================================================
   4) ÖFFENTLICHE API
   ============================================================ */

module.exports = {
  getRankingDiffs(currentData, type) {
    const files = loadHistoryFiles(type);
    if (files.length === 0) return currentData;

    const steps = type === 'sector'
      ? { W: 5, M: 21, Q: 63 }
      : { D: 1, W: 5, M: 21 };

    const historyMaps = buildHistoryMaps(files, steps);
    return applyDiffs(currentData, historyMaps, steps);
  }
};
