// analysis/rs/writeSectorsJson.js
const fs = require('fs');
const path = require('path');
const { buildSectorRsSnapshot } = require('./rsPipelineSectors');
const { getRankingDiffs } = require('./rsRankingHistory');

function normalizeDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

async function writeSectorsJson() {
  let sectors = await buildSectorRsSnapshot();

  if (!sectors || sectors.length === 0) {
    console.warn("⚠️ Keine Sector-Daten.");
    return sectors;
  }

  // ⭐ Nur neuestes Datum behalten
  const latestDate = normalizeDate(sectors[0].anl_datum);
  sectors = sectors.filter(sec => normalizeDate(sec.anl_datum) === latestDate);

  // ⭐ Snapshot speichern
  const snapshotFile = path.join(__dirname, '..', '..', 'json', 'rs_sectors.json');
  fs.writeFileSync(snapshotFile, JSON.stringify(sectors, null, 2));

  // ⭐ History speichern
  const historyDir = path.join(__dirname, '..', '..', 'json-history');
  if (!fs.existsSync(historyDir)) fs.mkdirSync(historyDir, { recursive: true });

  const historyFile = path.join(historyDir, `${latestDate}_sectors.json`);
  fs.writeFileSync(historyFile, JSON.stringify(sectors, null, 2));

  // ⭐ Rankmap erzeugen (Precompute)
  const rankmapDir = path.join(historyDir, 'rankmaps');
  if (!fs.existsSync(rankmapDir)) fs.mkdirSync(rankmapDir, { recursive: true });

  // Deltas berechnen → liefert fertige Ranking-Maps
  const diffs = getRankingDiffs(sectors, 'sector');

  // Rankmap extrahieren
  const rankmap = {};
  const steps = { W: 5, M: 21, Q: 63 };

  for (const step of Object.keys(steps)) {
    rankmap[step] = {};
    diffs.forEach(sec => {
      const name = sec.name;
      const diffKey = `diff${step}`;
      const currentRank = sec.rankWonDb;
      const previousRank = currentRank + (sec[diffKey] ?? 0);
      rankmap[step][name] = previousRank;
    });
  }

  // Rankmap speichern
  const rankmapFile = path.join(rankmapDir, `${latestDate}_sectors_rankmap.json`);
  fs.writeFileSync(rankmapFile, JSON.stringify(rankmap, null, 2));

  console.log(`✅ RS Sectors Snapshot + History + Rankmap geschrieben (${sectors.length} Einträge, Datum ${latestDate})`);

  return sectors;
}

module.exports = { writeSectorsJson };
