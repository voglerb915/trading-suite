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
// Mapping: Tabellen → Datumsspalte + Typ
// ------------------------------------------------------
const DATE_COLUMNS = {
    // Finviz
    finviz: { column: "anl_datum", type: "datetime" },
    finviz_groups: { column: "anl_datum", type: "datetime" },

    // Yahoo
    IndexHistory: { column: "date", type: "date" },

    // TradingJournal
    ExecutedOrders: { column: "execution_time", type: "datetime" },
    MarketContext: { column: "captured_at", type: "datetime" },
    OrderCreation: { column: "created_at", type: "datetime" },
    watchlist: { column: "date", type: "date" }
};

// ------------------------------------------------------
// Universelle Stats-Funktion für Tabellen mit Datum
// ------------------------------------------------------
async function getTableStatsGeneric(pool, tableName) {
    const cfg = DATE_COLUMNS[tableName];

    if (!cfg) {
        // Tabelle hat laut Mapping kein Datum → bewusst kein Datum zurückgeben
        return {
            lastDate: null,
            lastDateStr: null,
            totalCount: null,
            countAtLastDate: null
        };
    }

    const col = cfg.column;
    const isDateOnly = cfg.type === "date";

    // 1. Letztes Datum holen – inkl. String
    const lastDateResult = await pool.request().query(`
        SELECT 
            MAX([${col}]) AS lastDate,
            CONVERT(varchar(19), MAX([${col}]), 120) AS lastDateStr
        FROM dbo.[${tableName}];
    `);

    const row = lastDateResult.recordset[0];
    const lastDate = row.lastDate;
    const lastDateStr = row.lastDateStr;

    if (!lastDate) {
        return {
            lastDate: null,
            lastDateStr: null,
            totalCount: 0,
            countAtLastDate: 0
        };
    }

    const request = pool.request();

    if (isDateOnly) {
        request.input("lastDate", sql.Date, lastDate);
    } else {
        request.input("lastDate", sql.DateTime, lastDate);
    }

    // 2. Counts ermitteln
    const countQuery = isDateOnly
        ? `
            SELECT 
                COUNT(*) AS totalCount,
                SUM(CASE WHEN [${col}] = @lastDate THEN 1 ELSE 0 END) AS countAtLastDate
            FROM dbo.[${tableName}];
        `
        : `
            SELECT 
                COUNT(*) AS totalCount,
                SUM(CASE WHEN CAST([${col}] AS DATE) = CAST(@lastDate AS DATE) THEN 1 ELSE 0 END) AS countAtLastDate
            FROM dbo.[${tableName}];
        `;

    const countResult = await request.query(countQuery);

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
        // ------------------------------------------------------
        // FINVIZ (trading-DB, aber logischer Block "finviz")
// ------------------------------------------------------
        const trading = {
            database: "finviz",
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

            const stats = await getTableStatsGeneric(tradingPool, table);

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

        // ------------------------------------------------------
        // YAHOO – nur IndexHistory (Indexes) in der Prüfungsanzeige
        // Stammdaten (indices, countries, regions) bewusst NICHT hier
        // ------------------------------------------------------
        const yahoo = {
            database: "yahoo",
            tables: []
        };

        {
            const table = "IndexHistory";
            const displayName = "Indexes";

            const exists = await tableExists(yahooPool, table);

            if (!exists) {
                yahoo.tables.push({
                    table: displayName,
                    ok: false,
                    message: "FEHLT"
                });
            } else {
                const stats = await getTableStatsGeneric(yahooPool, table);

                yahoo.tables.push({
                    table: displayName,
                    ok: true,
                    message: "OK",
                    lastDate: stats.lastDate,
                    lastDateStr: stats.lastDateStr,
                    totalCount: stats.totalCount,
                    countAtLastDate: stats.countAtLastDate
                });
            }
        }

        // ------------------------------------------------------
        // TRADING JOURNAL
        // ------------------------------------------------------
        const journal = {
            database: "TradingJournal",
            tables: []
        };

        for (const table of ["ExecutedOrders", "MarketContext", "OrderCreation", "watchlist"]) {
            const exists = await tableExists(journalPool, table);

            if (!exists) {
                journal.tables.push({
                    table,
                    ok: false,
                    message: "FEHLT"
                });
                continue;
            }

            const stats = await getTableStatsGeneric(journalPool, table);

            journal.tables.push({
                table,
                ok: true,
                message: "OK",
                lastDate: stats.lastDate,
                lastDateStr: stats.lastDateStr,
                totalCount: stats.totalCount,
                countAtLastDate: stats.countAtLastDate
            });
        }

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
