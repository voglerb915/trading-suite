const express = require('express');
const router = express.Router();
const { sql, config } = require('../db/connection');

// GET /api/market-scores?type=sector&date=2026-05-22
router.get('/', async (req, res) => {
    try {
        const { type, date } = req.query;

        let query = `
            SELECT *
            FROM trading.dbo.marketScores
            WHERE 1 = 1
        `;

        if (type) {
            query += ` AND type = @type `;
        }

        if (date) {
            query += ` AND CAST(anl_datum AS date) = @date `;
        }

        query += ` ORDER BY anl_datum DESC, rank_db ASC `;

        const pool = await sql.connect(config);
        const request = pool.request();

        if (type) request.input('type', sql.VarChar, type);
        if (date) request.input('date', sql.Date, date);

        const result = await request.query(query);

        res.json(result.recordset);
    } catch (err) {
        console.error('❌ Fehler in /api/market-scores:', err);
        res.status(500).json({ error: 'Serverfehler' });
    }
});

module.exports = router;
