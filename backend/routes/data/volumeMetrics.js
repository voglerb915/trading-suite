const express = require('express');
const router = express.Router();
const { yahooPool } = require('../../db/connection');
const logger = require('../../utils/logger');

router.get('/', async (req, res) => {
    try {
        const pool = await yahooPool;

        const result = await pool.request().query(`
            WITH LatestDates AS (
                SELECT 
                    (SELECT MAX(CAST([date] AS DATE)) FROM [yahoo].[dbo].[StockMetrics]) as MaxDateMetrics,
                    (SELECT MAX(CAST([date] AS DATE)) FROM [yahoo].[dbo].[DailyHistory]) as MaxDateHistory
            )
            SELECT TOP 1000 * FROM (
                SELECT 
                    m.ticker,
                    m.vma_20,
                    h.volume,
                    h.[open], 
                    h.[high], 
                    h.[low], 
                    h.[close], -- MIT KLAMMERN
                    h.[date],

                    -- Vortages-Close
                    h_prev.[close] AS prevClose, -- ⭐ HIER WAR DER FEHLER: [close] hinzufügen

                    -- Ratio
                    CASE 
                        WHEN m.vma_20 IS NULL OR m.vma_20 = 0 THEN NULL
                        ELSE CAST(h.volume AS FLOAT) / CAST(m.vma_20 AS FLOAT)
                    END AS ratio,

                    -- Umsatz
                    (CAST(h.[close] AS FLOAT) * CAST(h.volume AS FLOAT)) AS turnover -- HIER AUCH [close]
                FROM [yahoo].[dbo].[StockMetrics] m
                CROSS JOIN LatestDates ld
                INNER JOIN [yahoo].[dbo].[DailyHistory] h ON m.ticker = h.ticker
                LEFT JOIN [yahoo].[dbo].[DailyHistory] h_prev 
                    ON h_prev.ticker = h.ticker
                    AND CAST(h_prev.date AS DATE) = DATEADD(day, -1, CAST(h.date AS DATE))
                INNER JOIN [trading].[dbo].[finviz] f ON f.ticker = m.ticker 
                    AND CAST(f.anl_datum AS DATE) = CAST(m.[date] AS DATE)
                WHERE CAST(m.[date] AS DATE) = ld.MaxDateMetrics
                AND CAST(h.[date] AS DATE) = ld.MaxDateHistory
                AND f.industry NOT LIKE '%Exchange Traded Fund%'
                AND f.industry NOT LIKE '%Shell Companies%'
                AND f.industry NOT LIKE '%Blank Check%'
                AND m.ticker NOT LIKE '^%'
            ) as sub
            WHERE sub.ratio > 2
            ORDER BY sub.ratio DESC
        `);
        // ... restlicher Code

        logger.info('COCKPIT-METRICS', `Erfolgreich ${result.recordset.length} Zeilen für Cockpit geladen.`);
        res.json(result.recordset);

    } catch (err) {
        logger.error('COCKPIT-METRICS', `SQL Fehler: ${err.message}`);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;