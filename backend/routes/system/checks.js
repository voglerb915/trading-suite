// routes/checks.js
const express = require("express");
const router = express.Router();
const { sql, tradingPool, yahooPool, journalPool } = require("../../db/connection");
const fs = require("fs");
const path = require("path");

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
    DailyHistory: { column: "date", type: "date" },
    DailySignals: { column: "date", type: "date" },
    StockMetrics: { column: "date", type: "date" },
    strategies: { column: "date", type: "date" },   // ← NEU

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
// FINVIZ JSON-Dateien prüfen
// ------------------------------------------------------

// 🟢 ERWEITERT: Pfad für die ETFs mit aufgenommen!
const sectorsPath = path.join(__dirname, "../../json/rs_sectors.json");
const industriesPath = path.join(__dirname, "../../json/rs_industries.json");
const stocksPath = path.join(__dirname, "../../json/rs_stocks.json");
const etfsPath = path.join(__dirname, "../../json/rs_etfs.json"); // 🟢 NEU!

        // Sectors JSON
        let sectorsLastDate = null;
        let sectorsLastDateStr = null;
        let sectorsCount = null;
        let sectorsOk = fs.existsSync(sectorsPath);

        if (sectorsOk) {
            try {
                const raw = fs.readFileSync(sectorsPath, "utf8");
                const parsed = JSON.parse(raw);

                if (Array.isArray(parsed)) {
                    sectorsCount = parsed.length;
                } else if (parsed && typeof parsed === "object") {
                    sectorsCount = Object.keys(parsed).length;
                }

                const first = Array.isArray(parsed) ? parsed[0] : null;

                if (first && first.anl_datum) {
                    const anl = first.anl_datum;
                    sectorsLastDateStr = anl.slice(0, 19).replace("T", " ");
                    sectorsLastDate = new Date(anl);
                } else {
                    sectorsOk = false;
                }
            } catch (e) {
                sectorsOk = false;
            }
        }

        trading.tables.push({
            table: "Sectors JSON",
            ok: sectorsOk,
            message: sectorsOk ? "OK" : "FEHLT",
            lastDate: sectorsLastDate,
            lastDateStr: sectorsLastDateStr,
            totalCount: sectorsCount,
            countAtLastDate: sectorsCount
        });

        // Industries JSON
        let industriesLastDate = null;
        let industriesLastDateStr = null;
        let industriesCount = null;
        let industriesOk = fs.existsSync(industriesPath);

        if (industriesOk) {
            try {
                const raw = fs.readFileSync(industriesPath, "utf8");
                const parsed = JSON.parse(raw);

                if (Array.isArray(parsed)) {
                    industriesCount = parsed.length;
                } else if (parsed && typeof parsed === "object") {
                    industriesCount = Object.keys(parsed).length;
                }

                const first = Array.isArray(parsed) ? parsed[0] : null;

                if (first && first.anl_datum) {
                    const rawDatum = first.anl_datum;
                    industriesLastDateStr = rawDatum.slice(0, 19).replace("T", " ");
                    industriesLastDate = new Date(rawDatum);
                } else {
                    industriesOk = false;
                }
            } catch (e) {
                industriesOk = false;
            }
        }

        trading.tables.push({
            table: "Industries JSON",
            ok: industriesOk,
            message: industriesOk ? "OK" : "FEHLT",
            lastDate: industriesLastDate,
            lastDateStr: industriesLastDateStr,
            totalCount: industriesCount,
            countAtLastDate: industriesCount
        });

        // Stocks JSON
        let stocksLastDate = null;
        let stocksLastDateStr = null;
        let stocksCount = null;
        let stocksOk = fs.existsSync(stocksPath);

        if (stocksOk) {
            try {
                const raw = fs.readFileSync(stocksPath, "utf8");
                const parsed = JSON.parse(raw);

                if (Array.isArray(parsed)) {
                    stocksCount = parsed.length;
                } else if (parsed && typeof parsed === "object") {
                    stocksCount = Object.keys(parsed).length;
                }

                const first = Array.isArray(parsed) ? parsed[0] : null;

                if (first && first.anl_datum) {
                    const anl = first.anl_datum;
                    stocksLastDateStr = anl.slice(0, 19).replace("T", " ");
                    stocksLastDate = new Date(anl);
                } else {
                    stocksOk = false;
                }
            } catch (e) {
                stocksOk = false;
            }
        }

        trading.tables.push({
            table: "Stocks JSON",
            ok: stocksOk,
            message: stocksOk ? "OK" : "FEHLT",
            lastDate: stocksLastDate,
            lastDateStr: stocksLastDateStr,
            totalCount: stocksCount,
            countAtLastDate: stocksCount
        });

        // ------------------------------------------------------
        // 🟢 NEU: ETFs JSON prüfen
        // ------------------------------------------------------
        let etfsLastDate = null;
        let etfsLastDateStr = null;
        let etfsCount = null;
        let etfsOk = fs.existsSync(etfsPath);

        if (etfsOk) {
            try {
                const raw = fs.readFileSync(etfsPath, "utf8");
                const parsed = JSON.parse(raw);

                if (Array.isArray(parsed)) {
                    etfsCount = parsed.length;
                } else if (parsed && typeof parsed === "object") {
                    etfsCount = Object.keys(parsed).length;
                }

                const first = Array.isArray(parsed) ? parsed[0] : null;

                if (first && first.anl_datum) {
                    const anl = first.anl_datum;
                    etfsLastDateStr = anl.slice(0, 19).replace("T", " ");
                    etfsLastDate = new Date(anl);
                } else {
                    etfsOk = false;
                }
            } catch (e) {
                etfsOk = false;
            }
        }

        trading.tables.push({
            table: "ETFs JSON",
            ok: etfsOk,
            message: etfsOk ? "OK" : "FEHLT",
            lastDate: etfsLastDate,
            lastDateStr: etfsLastDateStr,
            totalCount: etfsCount,
            countAtLastDate: etfsCount
        });

// ------------------------------------------------------
// 🟢 NEU: marketScores Datenbank direkt prüfen
// ------------------------------------------------------
const msQuery = `
    SELECT 
        m.type, 
        m.anl_datum as lastDate, 
        (SELECT COUNT(*) 
         FROM trading.dbo.marketScores sub 
         WHERE sub.type = m.type 
         AND CAST(sub.anl_datum AS DATE) = CAST(m.anl_datum AS DATE)
        ) as countAtLastDate
    FROM trading.dbo.marketScores m
    WHERE m.anl_datum = (
        SELECT MAX(anl_datum) 
        FROM trading.dbo.marketScores 
        WHERE type = m.type
    )
    GROUP BY m.type, m.anl_datum
`;

const msResult = await tradingPool.request().query(msQuery);

for (const row of msResult.recordset) {
    trading.tables.push({
        table: `marketScores (${row.type})`,
        ok: true,
        message: "OK",
        lastDate: row.lastDate,
        lastDateStr: row.lastDate.toISOString().slice(0, 19).replace("T", " "),
        totalCount: row.countAtLastDate, // Wir zeigen hier den aktuellen Stand
        countAtLastDate: row.countAtLastDate
    });
}

// ------------------------------------------------------
// YAHOO – alle Zeitreihen-Tabellen
// ------------------------------------------------------
const yahoo = {
    database: "yahoo",
    tables: []
};

const yahooTables = [
    { table: "IndexHistory", display: "Indexes" },
    { table: "DailyHistory", display: "DailyHistory" },
    { table: "DailySignals", display: "DailySignals" },
    { table: "StockMetrics", display: "StockMetrics" },
    { table: "strategies", display: "Strategies" },   // ← NEU
];

for (const { table, display } of yahooTables) {
    const exists = await tableExists(yahooPool, table);

    if (!exists) {
        yahoo.tables.push({
            table: display,
            ok: false,
            message: "FEHLT"
        });
        continue;
    }

    const stats = await getTableStatsGeneric(yahooPool, table);

    yahoo.tables.push({
        table: display,
        ok: true,
        message: "OK",
        lastDate: stats.lastDate,
        lastDateStr: stats.lastDateStr,
        totalCount: stats.totalCount,
        countAtLastDate: stats.countAtLastDate
    });
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
