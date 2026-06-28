const { tradingPool } = require("../db/connection.js");
const sql = require("mssql");

// ⭐ Deine SignalEngine importieren
const { getSparklineSignal } = require("./sparksignals/baseSignalEngine");

async function loadStockRawData() {
    console.log("LOAD: Start optimierte Abfrage (Index-gestützt)");

    const query = `
        SELECT 
            f.ticker,
            STRING_AGG(CAST(ISNULL(f.perf_week, 0) AS VARCHAR(20)), ',') 
                WITHIN GROUP (ORDER BY f.anl_datum DESC) as perf_week_list
        FROM finviz f WITH (NOLOCK)
        INNER JOIN marketScores ms WITH (NOLOCK) 
            ON f.ticker = ms.name AND f.anl_datum = ms.anl_datum
        WHERE ms.type = 'stock'
          AND f.anl_datum IN (
              SELECT DISTINCT TOP 25 anl_datum 
              FROM marketScores 
              WHERE type = 'stock' 
              ORDER BY anl_datum DESC
          )
        GROUP BY f.ticker;
    `;

    const result = await tradingPool.request().query(query);
    
    // ⭐ 1) SQL → Zeitreihen umwandeln
    const stocks = {};
    result.recordset.forEach(row => {
        stocks[row.ticker] = {
            week: row.perf_week_list.split(',').map(Number)
        };
    });

// ⭐ 2) HIER kommt die SignalEngine rein
const signals = {};
let entryCount = 0;
let exitCount = 0;
let neutralCount = 0;

Object.entries(stocks).forEach(([ticker, data]) => {
    const signal = getSparklineSignal(data.week); // deine Engine
    signals[ticker] = { signal };


    if (signal === "entry") entryCount++;
    else if (signal === "exit") exitCount++;
    else neutralCount++;
});

// ⭐ Jetzt siehst du die Ausgabe im Backend-Terminal
console.log("SIGNALS GENERATED:", entryCount, exitCount, neutralCount);


    // ⭐ 3) Response erweitern
    return { 
        success: true, 
        stocks,
        signals,
        summary: {
            total: Object.keys(stocks).length,
            entry: entryCount,
            exit: exitCount,
            neutral: neutralCount
        }
    };
}

module.exports = { loadStockRawData };
