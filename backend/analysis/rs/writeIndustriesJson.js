const fs = require('fs');
const path = require('path');
const { buildIndustryRsSnapshot } = require('./rsPipelineIndustries');

// Robust: akzeptiert Date-Objekte und Strings
function normalizeDate(value) {
  if (!value) return null;

  let d;

  if (value instanceof Date) {
    d = value;
  } else if (typeof value === "string") {
    d = new Date(value);
  } else {
    return null;
  }

  if (isNaN(d.getTime())) return null;

  return d.toISOString().slice(0, 10);
}

async function runIndustryPipeline() {
  const industries = await buildIndustryRsSnapshot();

  if (!industries || industries.length === 0) {
    console.warn("⚠️ Keine Industry-Daten, Snapshot/History wird nicht geschrieben.");
    return industries;
  }

  // 1) Datum aus erstem Industry holen
  const anlDatum = normalizeDate(industries[0].anl_datum);

  if (!anlDatum) {
    console.error("❌ Ungültiges anl_datum im ersten Industry:", industries[0].anl_datum);
    console.error("❌ Snapshot/History wird NICHT geschrieben.");
    return industries;
  }

  // 2) Prüfen, ob ALLE Industries dasselbe gültige Datum haben
  for (const ind of industries) {
    const d = normalizeDate(ind.anl_datum);

    if (!d) {
      console.error("❌ Ungültiges anl_datum in Industry:", ind.name, ind.anl_datum);
      console.error("❌ Snapshot/History wird NICHT geschrieben.");
      return industries;
    }

    if (d !== anlDatum) {
      console.error("❌ Inkonsistente anl_datum-Werte:", ind.name, ind.anl_datum);
      console.error("❌ Snapshot/History wird NICHT geschrieben.");
      return industries;
    }
  }

  // 3) SNAPSHOT schreiben
  const snapshotFile = path.join(__dirname, '..', '..', 'json', 'rs_industries.json');
  fs.writeFileSync(snapshotFile, JSON.stringify(industries, null, 2), 'utf8');

  // 4) HISTORY schreiben
  const historyDir = path.join(__dirname, '..', '..', 'json-history');
  if (!fs.existsSync(historyDir)) {
    fs.mkdirSync(historyDir, { recursive: true });
  }

  const historyFile = path.join(historyDir, `${anlDatum}_industries.json`);
  fs.writeFileSync(historyFile, JSON.stringify(industries, null, 2), 'utf8');

  return industries;
}

module.exports = { runIndustryPipeline };
