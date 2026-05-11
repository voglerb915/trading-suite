// analysis/rs/writeIndustriesJson.js
const fs = require('fs');
const path = require('path');
const { buildIndustryRsSnapshot } = require('./rsPipelineIndustries');

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

  // ⭐ Nur neuestes Datum behalten (Ghost-Industries filtern)
  const latestDate = normalizeDate(industries[0].anl_datum);
  industries = industries.filter(ind => normalizeDate(ind.anl_datum) === latestDate);

  // ⭐ Snapshot
  const snapshotFile = path.join(__dirname, '..', '..', 'json', 'rs_industries.json');
  fs.writeFileSync(snapshotFile, JSON.stringify(industries, null, 2));

  // ⭐ History
  const historyDir = path.join(__dirname, '..', '..', 'json-history');
  if (!fs.existsSync(historyDir)) fs.mkdirSync(historyDir, { recursive: true });

  const historyFile = path.join(historyDir, `${latestDate}_industries.json`);
  fs.writeFileSync(historyFile, JSON.stringify(industries, null, 2));

  console.log(`✅ RS Industries Snapshot + History geschrieben (${industries.length} Einträge, Datum ${latestDate})`);

  return industries;
}

module.exports = { writeIndustriesJson };
