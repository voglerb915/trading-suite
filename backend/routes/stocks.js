const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Deine bestehende DB-Connection
const { tradingPool } = require('../db/connection.js');

// StrategyEngine importieren
const { runStrategy } = require('../analysis/strategyEngine.js');

router.get('/won-db', async (req, res) => {
    console.log("Backend Strategy:", req.query.strategy);

    try {
        const strategy = req.query.strategy || "none";

        // 1) Stocks aus JSON
        const file = path.join(__dirname, '../json/rs_stocks.json');
        const stocks = JSON.parse(fs.readFileSync(file, 'utf8'));

        // 2) Finviz-Daten aus DB holen (über deinen Pool!)
        const finvizRows = await tradingPool.request().query(`
            SELECT ticker, _52w_high
            FROM trading.dbo.finviz
        `);

        // 3) Map für schnellen Zugriff
        const finvizMap = new Map(
            finvizRows.recordset.map(r => [r.ticker, r])
        );

        // 4) Stocks mit Finviz-Daten anreichern
        const merged = stocks.map(s => {
            const f = finvizMap.get(s.ticker);

            return {
                ...s,
                _52w_high: f?._52w_high ?? null
            };
        });

        // 5) StrategyEngine ausführen
        const enriched = runStrategy(merged, strategy);

        res.json(enriched);

    } catch (err) {
        console.error("Fehler beim Laden der Stocks:", err);
        res.status(500).json({ error: "Fehler beim Laden der Stocks" });
    }
});

module.exports = router;
