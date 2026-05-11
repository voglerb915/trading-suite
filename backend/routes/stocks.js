const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

router.get('/won-db', (req, res) => {
    try {
        const file = path.join(__dirname, '../json/rs_stocks.json');
        const json = JSON.parse(fs.readFileSync(file, 'utf8'));
        res.json(json);
    } catch (err) {
        console.error("Fehler beim Laden der Stocks:", err);
        res.status(500).json({ error: "Fehler beim Laden der Stocks" });
    }
});

module.exports = router;
