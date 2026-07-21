// backend/routes/strategies/insideDay52wReader.js
const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { config } = require('../../db/connection');
const insideDay52WLogic = require('../../analysis/strategies/insideDay52W');

router.get('/insideDay52wReader', async (req, res) => {
    try {
        const pool = await sql.connect(config);

        const result = await insideDay52WLogic.getActiveSignalsFromDB(pool);

        res.json({
            count: result.length,
            data: result
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
