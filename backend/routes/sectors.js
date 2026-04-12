const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// TEMPORÄR: Nur JSON direkt zurückgeben
router.get('/won-db', (req, res) => {
    try {
        const file = path.join(__dirname, '../db/finviz_sectors.json');
        const json = JSON.parse(fs.readFileSync(file, 'utf8'));
        res.json(json);
    } catch (err) {
        console.error("Fehler beim Laden der Sektoren:", err);
        res.status(500).json({ error: "Fehler beim Laden der Sektoren" });
    }
});

module.exports = router;
