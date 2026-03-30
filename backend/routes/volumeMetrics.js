const express = require('express');
const router = express.Router();
const { yahooPool } = require('../db/connection');
const logger = require('../utils/logger');

router.get('/', async (req, res) => {
    try {
        const pool = await yahooPool;

        const result = await pool.request().query(`
            SELECT TOP 1000 * FROM (
                SELECT 
                    m.ticker,
                    m.vma_20,
                    h.volume,
                    h.[open], h.[high], h.[low], h.[close],
                    h.[date],
                    -- 1. Berechnung der Ratio
                    (CAST(h.volume AS FLOAT) / NULLIF(CAST(m.vma_20 AS FLOAT), 0)) AS ratio,
                    -- 2. NEU: Berechnung des Umsatzes (Preis * Volumen)
                    (CAST(h.[close] AS FLOAT) * CAST(h.volume AS FLOAT)) AS turnover
                FROM [yahoo].[dbo].[StockMetrics] m
                INNER JOIN [yahoo].[dbo].[DailyHistory] h ON m.ticker = h.ticker
                INNER JOIN [trading].[dbo].[finviz] f ON f.ticker = m.ticker 
                    AND CAST(f.anl_datum AS DATE) = CAST(m.[date] AS DATE)
                WHERE CAST(m.[date] AS DATE) = (SELECT MAX(CAST([date] AS DATE)) FROM [yahoo].[dbo].[StockMetrics])
                AND CAST(h.[date] AS DATE) = (SELECT MAX(CAST([date] AS DATE)) FROM [yahoo].[dbo].[DailyHistory])
                AND f.industry NOT LIKE '%Exchange Traded Fund%'
                AND f.industry NOT LIKE '%Shell Companies%'
                AND f.industry NOT LIKE '%Blank Check%'
                AND m.ticker NOT LIKE '^%'
            ) as sub
            WHERE sub.ratio > 2
            ORDER BY sub.ratio DESC;
        `);

        logger.info('COCKPIT-METRICS', `Erfolgreich ${result.recordset.length} Zeilen für Cockpit geladen.`);
        res.json(result.recordset);

    } catch (err) {
        logger.error('COCKPIT-METRICS', `SQL Fehler: ${err.message}`);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;