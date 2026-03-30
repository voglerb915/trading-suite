const express = require('express');
const router = express.Router();
const { yahooPool } = require('../db/connection');
const logger = require('../utils/logger');

// Ändere GET zu POST
router.post('/', async (req, res) => {
    try {
        // Ticker kommen jetzt aus req.body statt req.query
        const { tickers } = req.body; 
        
        if (!tickers || !Array.isArray(tickers)) {
            return res.status(400).json({ error: "tickers array missing in body" });
        }

        const pool = await yahooPool;
        const request = pool.request();

        await request.query(`
            IF OBJECT_ID('tempdb..#Tickers') IS NOT NULL DROP TABLE #Tickers;
            CREATE TABLE #Tickers (ticker VARCHAR(20));
        `);

        // Da es ein Array ist, können wir es direkt mappen
        const values = tickers.map(t => `('${t.trim()}')`).join(',');
        await request.query(`INSERT INTO #Tickers (ticker) VALUES ${values};`);

        const result = await request.query(`
            SELECT h.*
            FROM [yahoo].[dbo].[DailyHistory] h
            INNER JOIN #Tickers t ON t.ticker = h.ticker
            WHERE h.[date] = (SELECT MAX([date]) FROM [yahoo].[dbo].[DailyHistory]);
        `);

        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
