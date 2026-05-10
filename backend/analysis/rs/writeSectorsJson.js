const fs = require('fs');
const path = require('path');
const { buildSectorRsSnapshot } = require('./rsPipelineSectors');

// Robust: akzeptiert Date-Objekte und Strings
function normalizeDate(value) {
  if (!value) return null;

  let d;

  // Falls bereits Date-Objekt
  if (value instanceof Date) {
    d = value;
  }
  // Falls String
  else if (typeof value === "string") {
    d = new Date(value);
  }
  else {
    return null;
  }

  // Ungültiges Datum?
  if (isNaN(d.getTime())) return null;

  return d.toISOString().slice(0, 10);
}

async function runSectorPipeline() {
  const sectors = await buildSectorRsSnapshot();

  if (!sectors || sectors.length === 0) {
    console.warn("⚠️ Keine Sektordaten, Snapshot/History wird nicht geschrieben.");
    return sectors;
  }

  // 1) Datum aus erstem Sektor holen
  const anlDatum = normalizeDate(sectors[0].anl_datum);

  if (!anlDatum) {
    console.error("❌ Ungültiges anl_datum im ersten Sektor:", sectors[0].anl_datum);
    console.error("❌ Snapshot/History wird NICHT geschrieben.");
    return sectors;
  }

  // 2) Prüfen, ob ALLE Sektoren dasselbe gültige Datum haben
  for (const s of sectors) {
    const d = normalizeDate(s.anl_datum);

    if (!d) {
      console.error("❌ Ungültiges anl_datum in Sektor:", s.name, s.anl_datum);
      console.error("❌ Snapshot/History wird NICHT geschrieben.");
      return sectors;
    }

    if (d !== anlDatum) {
      console.error("❌ Inkonsistente anl_datum-Werte:", s.name, s.anl_datum);
      console.error("❌ Snapshot/History wird NICHT geschrieben.");
      return sectors;
    }
  }

  // 3) SNAPSHOT schreiben
  const snapshotFile = path.join(__dirname, '..', '..', 'json', 'rs_sectors.json');
  fs.writeFileSync(snapshotFile, JSON.stringify(sectors, null, 2), 'utf8');

  // 4) HISTORY schreiben
  const historyDir = path.join(__dirname, '..', '..', 'json-history');
  if (!fs.existsSync(historyDir)) {
    fs.mkdirSync(historyDir, { recursive: true });
  }

  const historyFile = path.join(historyDir, `${anlDatum}_sectors.json`);
  fs.writeFileSync(historyFile, JSON.stringify(sectors, null, 2), 'utf8');

  return sectors;
}

module.exports = { runSectorPipeline };
