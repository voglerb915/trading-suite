const { tradingConnect } = require("../db/connection");
const sql = require("mssql");

// 🟦 Index-Normalisierung
const INDEX_MAP = {
    "s&p 500": "SP500",
    "ndx": "NDX",
    "djia": "DJI",
    "rut": "RUT"
};


function parseIndexField(rawIndex) {
    if (!rawIndex || rawIndex.trim() === "" || rawIndex.trim() === "-") {
        return [];
    }

    return rawIndex
        .split(",")
        .map(x => x.trim().toLowerCase())
        .map(x => INDEX_MAP[x] ?? null)
        .filter(x => x !== null);
}

async function getStocksForList() {
    try {
        const pool = await tradingConnect;

        const dateResult = await pool.request().query(`
            SELECT MAX(anl_datum) AS max_date 
            FROM marketScores WITH (NOLOCK)
            WHERE type = 'stock';
        `);
        
        const latestDate = dateResult.recordset[0]?.max_date;
        if (!latestDate) return [];

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
                f.anl_datum    AS anl_datum,
                f.[_52w_high]  AS [52w_high],
                f.[index]      AS finviz_index   -- 🟢 NEU
            FROM marketScores ms WITH (NOLOCK)
            INNER JOIN finviz f WITH (NOLOCK) 
                ON f.anl_datum = @targetDate  
               AND f.ticker = ms.name
            WHERE ms.type = 'stock'
              AND ms.anl_datum = @targetDate
            ORDER BY ms.rank_db ASC;
        `);

        // 🟩 Index-Feld mappen
        const rows = result.recordset.map(row => ({
            ...row,
            index: parseIndexField(row.finviz_index)
        }));

        return rows;

    } catch (error) {
        console.error("FEHLER IN getStocksForList:", error);
        throw error;
    }
}

module.exports = {
    getStocksForList
};
