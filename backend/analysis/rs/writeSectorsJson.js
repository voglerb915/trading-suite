// analysis/rs/writeSectorsJson.js
const fs = require('fs');
const path = require('path');
const { buildSectorRsSnapshot } = require('./rsPipelineSectors');

function normalizeDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function loadHistoryFiles() {
  const historyDir = path.join(__dirname, '..', '..', 'json-history');
  if (!fs.existsSync(historyDir)) return [];

  return fs.readdirSync(historyDir)
    .filter(f => f.endsWith('_sectors.json'))
    .sort()
    .map(f => ({
      date: f.slice(0, 10),
      file: path.join(historyDir, f)
    }));
}

function loadSnapshotByDate(date, historyFiles) {
  const entry = historyFiles.find(h => h.date === date);
  if (!entry) return null;

  try {
    return JSON.parse(fs.readFileSync(entry.file, 'utf8'));
  } catch {
    return null;
  }
}

function buildRankMap(snapshot) {
  const map = {};
  snapshot.forEach((sec, idx) => {
    map[sec.name] = idx + 1;
  });
  return map;
}

function computeDiffs(current, historyFiles) {
  const today = normalizeDate(current[0].anl_datum);

  // ❗ KEIN DAY MEHR
  const steps = {
    diffW: 5,
    diffM: 21,
    diffQ: 63
  };

  const result = current.map(sec => ({
    ...sec,
    diffW: null,
    diffM: null,
    diffQ: null
  }));

  const allDates = historyFiles.map(h => h.date);
  const todayIndex = allDates.indexOf(today);

  if (todayIndex === -1) return result;

  for (const [key, offset] of Object.entries(steps)) {
    const targetIndex = todayIndex - offset;
    if (targetIndex < 0) continue;

    const targetDate = allDates[targetIndex];
    const snapshot = loadSnapshotByDate(targetDate, historyFiles);
    if (!snapshot) continue;

    const prevRankMap = buildRankMap(snapshot);

    result.forEach(sec => {
      const prevRank = prevRankMap[sec.name];
      if (!prevRank) return;

      const currentRank = sec.rankWonDb;
      sec[key] = prevRank - currentRank;
    });
  }

  return result;
}

async function writeSectorsJson() {
  let sectors = await buildSectorRsSnapshot();
  if (!sectors || sectors.length === 0) return sectors;

  const latestDate = normalizeDate(sectors[0].anl_datum);
  sectors = sectors.filter(sec => normalizeDate(sec.anl_datum) === latestDate);

  const snapshotFile = path.join(__dirname, '..', '..', 'json', 'rs_sectors.json');
  const historyDir = path.join(__dirname, '..', '..', 'json-history');
  if (!fs.existsSync(historyDir)) fs.mkdirSync(historyDir, { recursive: true });

  const historyFile = path.join(historyDir, `${latestDate}_sectors.json`);

  // 1) Roh-Snapshot (ohne Diffs) als History speichern
  fs.writeFileSync(historyFile, JSON.stringify(sectors, null, 2));

  // 2) History laden und Diffs berechnen
  const historyFiles = loadHistoryFiles();
  const sectorsWithDiffs = computeDiffs(sectors, historyFiles);

  // 3) Snapshot MIT Diffs schreiben
  fs.writeFileSync(snapshotFile, JSON.stringify(sectorsWithDiffs, null, 2));

  // 4) History ebenfalls MIT Diffs überschreiben
  fs.writeFileSync(historyFile, JSON.stringify(sectorsWithDiffs, null, 2));

  console.log(`✅ RS Sectors Snapshot + History geschrieben (${sectors.length} Einträge, Datum ${latestDate})`);

  return sectorsWithDiffs;
}

module.exports = { writeSectorsJson };
