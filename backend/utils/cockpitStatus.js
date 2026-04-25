const fs = require("fs");
const path = require("path");
const os = require("os");

// 🔥 Hostname des Geräts (Laptop / Desktop)
const HOST = os.hostname();

// 🔥 Jede Maschine bekommt ihre eigene Datei
const STATUS_FILE = path.join(
    __dirname,
    "../db",
    `cockpit_status_${HOST}.json`
);

// ------------------------------------------------------
// Status lesen
// ------------------------------------------------------
function readStatusFile() {
    try {
        if (!fs.existsSync(STATUS_FILE)) {
            return {};
        }

        const raw = fs.readFileSync(STATUS_FILE, "utf8");
        return JSON.parse(raw);

    } catch (err) {
        console.error("Fehler beim Lesen der Status-Datei:", err);
        return {};
    }
}

// ------------------------------------------------------
// Status schreiben (atomisch)
// ------------------------------------------------------
function writeStatusFile(data) {
    try {
        const json = JSON.stringify(data, null, 2);

        const tmpFile = STATUS_FILE + ".tmp";
        fs.writeFileSync(tmpFile, json, "utf8");
        fs.renameSync(tmpFile, STATUS_FILE);

    } catch (err) {
        console.error("Fehler beim Schreiben der Status-Datei:", err);
    }
}

// ------------------------------------------------------
// Einzelnen Tile-Status aktualisieren
// ------------------------------------------------------
function updateTileStatus(tile, payload) {
    const status = readStatusFile();

    // Root-Objekte sicherstellen
    status.downloads = status.downloads || {};
    status.calculations = status.calculations || {};
    status.checks = status.checks || {};

    // 🟥 Downloads selbst darf NICHT überschrieben werden
    if (tile === "downloads") {
        console.trace("❌ ILLEGALER updateTileStatus('downloads') AUFRUF");
        return;
    }

    // 🟩 ABER: IndexHistory & DailyHistory gehören UNTER downloads
    if (tile === "IndexHistory" || tile === "DailyHistory") {
        status.downloads[tile] = {
            ...(status.downloads[tile] || {}),
            ...payload
        };

        writeStatusFile(status);
        return;
    }

    // 🟩 Alle anderen Tiles normal speichern
    status[tile] = {
        ...(status[tile] || {}),
        ...payload
    };

    writeStatusFile(status);
}

module.exports = {
    readStatusFile,
    writeStatusFile,
    updateTileStatus
};
