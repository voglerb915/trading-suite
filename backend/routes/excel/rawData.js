const express = require('express');
const router = express.Router();

const { sql, tradingPool } = require('../../db/connection.js');

// GET /api/excel/rawdata
router.get('/rawdata', async (req, res) => {
    try {
        // 1) Letzte 15 Tage holen (als String!)
        const datesResult = await tradingPool.request().query(`
            SELECT DISTINCT TOP 15
                CONVERT(VARCHAR(10), anl_datum, 23) AS anl_datum
            FROM trading.dbo.finviz_groups
            WHERE [group] = 'sector'
            ORDER BY anl_datum DESC
        `);

        const dates = datesResult.recordset.map(r => r.anl_datum);

        // 2) Daten für diese Tage holen
        const dataResult = await tradingPool.request().query(`
            SELECT
                name,
                perf_week,
                perf_month,
                perf_quart,
                CONVERT(VARCHAR(10), anl_datum, 23) AS anl_datum
            FROM trading.dbo.finviz_groups
            WHERE [group] = 'sector'
              AND CONVERT(VARCHAR(10), anl_datum, 23) IN (${dates.map(d => `'${d}'`).join(",")})
            ORDER BY anl_datum DESC, name ASC
        `);

        const rows = dataResult.recordset;

        // 3) Pivot-Struktur
        const sectors = {};
        const sectorNames = [...new Set(rows.map(r => r.name))];

        sectorNames.forEach(sector => {
            sectors[sector] = { week: [], month: [], quarter: [] };

            dates.forEach(date => {
                const row = rows.find(r => r.name === sector && r.anl_datum === date);

                sectors[sector].week.push(row ? row.perf_week : null);
                sectors[sector].month.push(row ? row.perf_month : null);
                sectors[sector].quarter.push(row ? row.perf_quart : null);
            });
        });

        return res.json({
            success: true,
            data: sectors,
            dates
        });

    } catch (err) {
        console.error("DB-Fehler:", err);
        return res.status(500).json({
            success: false,
            error: "Serverfehler"
        });
    }
});


module.exports = router;
