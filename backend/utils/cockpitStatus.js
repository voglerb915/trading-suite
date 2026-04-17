const fs = require("fs");
const path = require("path");

const STATUS_FILE = path.join(__dirname, "../db/cockpit_status.json");

function readStatusFile() {
    try {
        if (!fs.existsSync(STATUS_FILE)) {
            return {};
        }

        const raw = fs.readFileSync(STATUS_FILE, "utf8");
        return JSON.parse(raw);
    } catch (err) {
        console.error("Fehler beim Lesen der cockpit_status.json:", err);
        return {};
    }
}

function writeStatusFile(data) {
    try {
        const json = JSON.stringify(data, null, 2);
        fs.writeFileSync(STATUS_FILE, json, "utf8");
    } catch (err) {
        console.error("Fehler beim Schreiben der cockpit_status.json:", err);
    }
}

function updateTileStatus(tile, payload) {
    const status = readStatusFile();
    status[tile] = payload;
    writeStatusFile(status);
}

module.exports = {
    readStatusFile,
    writeStatusFile,
    updateTileStatus
};
