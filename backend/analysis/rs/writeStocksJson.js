const fs = require("fs");
const path = require("path");
const { tradingPool } = require("../../db/connection.js");

async function writeStocksJson() {
    console.log("▶ RS Stocks Writer gestartet");

    try {
        const result = await tradingPool.request().query(`
            WITH latest AS (
                SELECT *,
                       ROW_NUMBER() OVER (PARTITION BY ticker ORDER BY anl_datum DESC) AS rn
                FROM trading.dbo.finviz
                WHERE ticker IS NOT NULL
            )
            SELECT 
                ticker,
                sector,
                industry,
                perf_week,
                perf_month,
                perf_quart,
                perf_half,
                perf_year,
                anl_datum
            FROM latest
            WHERE rn = 1
            ORDER BY ticker ASC;
        `);

        console.log("▶ RS Stocks SQL ausgeführt, rows =", result.recordset.length);

        const rows = result.recordset;

        const stocks = rows.map((r, idx) => {
            const iso = new Date(r.anl_datum).toISOString();

            return {
                name: r.ticker,
                sector: r.sector,
                industry: r.industry,

                score: 0,
                rankWonDb: idx + 1,
                diffD: 0,
                diffW: 0,
                diffM: 0,
                diffQ: 0,

                perf_week: r.perf_week,
                perf_month: r.perf_month,
                perf_quart: r.perf_quart,
                perf_half: r.perf_half,
                perf_year: r.perf_year,

                data: [
                    {
                        date: iso.slice(0, 10),
                        change: r.perf_week
                    }
                ],

                anl_datum: iso
            };
        });

        const file = path.join(__dirname, "../../json/rs_stocks.json");
        fs.writeFileSync(file, JSON.stringify(stocks, null, 2), "utf8");

        const isoDate = stocks[0]?.anl_datum?.slice(0, 10) || "–";

        console.log(
            `✅ RS Stocks Snapshot geschrieben (${stocks.length} Einträge, Datum ${isoDate})`
        );

        return stocks;

    } catch (err) {
        console.error("❌ RS Stocks Fehler:", err);
        throw err;
    }
}

module.exports = { writeStocksJson };
