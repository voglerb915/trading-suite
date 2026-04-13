// routes/checks.js
const express = require("express");
const router = express.Router();
const { sql, tradingPool, yahooPool, journalPool } = require("../db/connection");

// ------------------------------------------------------
// Hilfsfunktion: Prüft, ob Tabelle existiert
// ------------------------------------------------------
async function tableExists(pool, tableName) {
    const result = await pool.request().query(`
        SELECT 1 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME = '${tableName}'
    `);
    return result.recordset.length > 0;
}

// ------------------------------------------------------
// Prüft eine komplette Datenbank
// ------------------------------------------------------
async function checkDatabase(pool, dbName, tables) {
    const results = [];

    for (const table of tables) {
        try {
            const exists = await tableExists(pool, table);
            results.push({
                table,
                ok: exists,
                message: exists ? "OK" : "FEHLT"
            });
        } catch (err) {
            results.push({
                table,
                ok: false,
                message: "Fehler: " + err.message
            });
        }
    }

    return {
        database: dbName,
        tables: results
    };
}
async function getTableStats(pool, tableName) {
    // 1. Letztes Datum holen – inkl. String
    const lastDateResult = await pool.request().query(`
        SELECT 
            MAX(anl_datum) AS lastDate,
            CONVERT(varchar(19), MAX(anl_datum), 120) AS lastDateStr
        FROM dbo.${tableName};
    `);

    const row = lastDateResult.recordset[0];
    const lastDate = row.lastDate;
    const lastDateStr = row.lastDateStr; // z.B. "2026-04-10 22:15:46"

    if (!lastDate) {
        return {
            lastDate: null,
            lastDateStr: null,
            totalCount: 0,
            countAtLastDate: 0
        };
    }

    const request = pool.request();
    request.input("lastDate", sql.DateTime, lastDate);

    const countResult = await request.query(`
        SELECT 
            COUNT(*) AS totalCount,
            SUM(CASE WHEN CAST(anl_datum AS DATE) = CAST(@lastDate AS DATE) THEN 1 ELSE 0 END) AS countAtLastDate
        FROM dbo.${tableName};
    `);


    return {
        lastDate,
        lastDateStr,
        totalCount: countResult.recordset[0].totalCount,
        countAtLastDate: countResult.recordset[0].countAtLastDate
    };
}



// ------------------------------------------------------
// GET /api/checks/all
// ------------------------------------------------------
router.get("/all", async (req, res) => {
    const start = performance.now();

    try {
        const trading = {
            database: "trading",
            tables: []
        };

        for (const table of ["finviz", "finviz_groups"]) {
            const exists = await tableExists(tradingPool, table);

            if (!exists) {
                trading.tables.push({
                    table,
                    ok: false,
                    message: "FEHLT"
                });
                continue;
            }

            const stats = await getTableStats(tradingPool, table);

            trading.tables.push({
                table,
                ok: true,
                message: "OK",
                lastDate: stats.lastDate,
                lastDateStr: stats.lastDateStr,
                totalCount: stats.totalCount,
                countAtLastDate: stats.countAtLastDate
            });
        }


        const yahoo = await checkDatabase(yahooPool, "yahoo", [
            "DailyHistory",
            "DailySignals",
            "IndexHistory",
            "StockMetrics",
            "countries",
            "indices",
            "regions",
            "strategies"
        ]);

        const journal = await checkDatabase(journalPool, "TradingJournal", [
            "ExecutedOrders",
            "MarketContext",
            "OrderCreation",
            "watchlist"
        ]);

        const end = performance.now();

        res.json({
            ok: true,
            duration: ((end - start) / 1000).toFixed(2) + "s",
            timestamp: new Date(),
            results: [trading, yahoo, journal]
        });

    } catch (err) {
        res.status(500).json({
            ok: false,
            error: err.message
        });
    }
});

module.exports = router;
