const express = require("express");
const router = express.Router();

const {
    readStatusFile,
    updateTileStatus
} = require("../utils/cockpitStatus");

// GET: gesamten Status liefern – aber transformiert für das Cockpit
router.get("/status", (req, res) => {
    const raw = readStatusFile();

    const status = {
        downloads: raw.downloads ?? {},
        calculations: raw.calculations ?? {},
        checks: raw.checks ?? {}
    };

    res.json(status);
});

// POST: Status einer Kachel aktualisieren (nur für calculations + checks)
router.post("/status/:tile", (req, res) => {
    const tile = req.params.tile;
    const payload = req.body;

    if (!payload) {
        return res.status(400).json({ error: "Payload fehlt" });
    }

    updateTileStatus(tile, payload);
    res.json({ success: true });
});

module.exports = router;
