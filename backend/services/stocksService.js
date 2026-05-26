const { tradingConnect } = require("../db/connection");
const sql = require("mssql");

async function getStocksForList() {
    try {
        const pool = await tradingConnect;

        // 1. Das exakte, maximale DATETIME holen
        const dateResult = await pool.request().query(`
            SELECT MAX(anl_datum) AS max_date 
            FROM marketScores WITH (NOLOCK)
            WHERE type = 'stock';
        `);
        
        const latestDate = dateResult.recordset[0]?.max_date;
        if (!latestDate) return [];

        // 2. Ein einziger, optimierter Request mit direktem JOIN
        const request = pool.request();
        request.input("targetDate", sql.DateTime, latestDate);

        const result = await request.query(`
            SELECT
                ms.name        AS ticker,
                f.company,
                f.sector,
                f.industry,
                f.price,
                f.change,
                f.volume,
                ms.score       AS rsScore,
                ms.rank_db     AS rsRank,
                f.anl_datum    AS anl_datum,      -- 🟢 NEU: Für dein Dashboard-Header 'Last Update'
                f.[_52w_high]   AS [52w_high]      -- 🟢 NEU: Direkt mitliefern für die Strategie-Filterung
            FROM marketScores ms WITH (NOLOCK)
            INNER JOIN finviz f WITH (NOLOCK) 
                ON f.anl_datum = @targetDate  
               AND f.ticker = ms.name
            WHERE ms.type = 'stock'
              AND ms.anl_datum = @targetDate
            ORDER BY ms.rank_db ASC;
        `);

        return result.recordset;

    } catch (error) {
        console.error("FEHLER IN getStocksForList:", error);
        throw error;
    }
}

module.exports = {
    getStocksForList
};