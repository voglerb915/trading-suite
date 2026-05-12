// analysis/rs/writeIndustriesJson.js
const fs = require('fs');
const path = require('path');
const { buildIndustryRsSnapshot } = require('./rsPipelineIndustries');
const { getRankingDiffs } = require('./rsRankingHistory');

function normalizeDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

async function writeIndustriesJson() {
  let industries = await buildIndustryRsSnapshot();

  if (!industries || industries.length === 0) {
    console.warn("⚠️ Keine Industry-Daten.");
    return industries;
  }

  // ⭐ Nur neuestes Datum behalten
  const latestDate = normalizeDate(industries[0].anl_datum);
  industries = industries.filter(ind => normalizeDate(ind.anl_datum) === latestDate);

  // ⭐ Snapshot speichern
  const snapshotFile = path.join(__dirname, '..', '..', 'json', 'rs_industries.json');
  fs.writeFileSync(snapshotFile, JSON.stringify(industries, null, 2));

  // ⭐ History speichern
  const historyDir = path.join(__dirname, '..', '..', 'json-history');
  if (!fs.existsSync(historyDir)) fs.mkdirSync(historyDir, { recursive: true });

  const historyFile = path.join(historyDir, `${latestDate}_industries.json`);
  fs.writeFileSync(historyFile, JSON.stringify(industries, null, 2));

  // ⭐ Rankmap erzeugen (Precompute)
  const rankmapDir = path.join(historyDir, 'rankmaps');
  if (!fs.existsSync(rankmapDir)) fs.mkdirSync(rankmapDir, { recursive: true });

  // Deltas berechnen → liefert fertige Ranking-Maps
  const diffs = getRankingDiffs(industries, 'industry');

  // Rankmap extrahieren
  const rankmap = {};
  const steps = { D: 1, W: 5, M: 21 };

  for (const step of Object.keys(steps)) {
    rankmap[step] = {};
    diffs.forEach(ind => {
      const name = ind.name;
      const diffKey = `diff${step}`;
      const currentRank = ind.rankWonDb;
      const previousRank = currentRank + (ind[diffKey] ?? 0);
      rankmap[step][name] = previousRank;
    });
  }

  // Rankmap speichern
  const rankmapFile = path.join(rankmapDir, `${latestDate}_industries_rankmap.json`);
  fs.writeFileSync(rankmapFile, JSON.stringify(rankmap, null, 2));

  console.log(`✅ RS Industries Snapshot + History + Rankmap geschrieben (${industries.length} Einträge, Datum ${latestDate})`);

  return industries;
}

module.exports = { writeIndustriesJson };
