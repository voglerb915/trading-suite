const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// StrategyEngine
const { runStrategy } = require('../../analysis/strategyEngine.js');

router.get('/:strategyName', async (req, res) => {
    try {
        const strategyName = req.params.strategyName;

        // 1) Rohdaten laden (JSON)
        const file = path.join(__dirname, '../json/rs_stocks.json');
        const baseStocks = JSON.parse(fs.readFileSync(file, 'utf8'));

        // 2) StrategyEngine ausführen
        const result = runStrategy(baseStocks, strategyName);

        // 3) Nur Strategy-Daten zurückgeben
        res.json(result);

    } catch (err) {
        console.error("Strategy-Fehler:", err);
        res.status(500).json({ error: "Strategy konnte nicht ausgeführt werden" });
    }
});

module.exports = router;
