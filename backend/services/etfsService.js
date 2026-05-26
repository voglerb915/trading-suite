const { tradingConnect } = require("../db/connection");
const sql = require("mssql");

async function getEtfsForList() {
    try {
        const pool = await tradingConnect;

        // 1. Das neueste ANALYSE-Datum für ETFs holen (Typ 'etf')
        const dateResult = await pool.request().query(`
            SELECT CONVERT(VARCHAR(10), MAX(anl_datum), 120) AS max_date
            FROM marketScores WITH (NOLOCK)
            WHERE type = 'etf'
            OPTION (RECOMPILE);
        `);
        
        const latestDate = dateResult.recordset[0]?.max_date;
        if (!latestDate) return [];

        const request = pool.request();
        request.input("targetDate", sql.VarChar(10), latestDate);

        // 2. Hauptabfrage: Index-optimiertes Zeitfenster
        const result = await request.query(`
            DECLARE @start DATETIME = CAST(@targetDate AS DATETIME);
            DECLARE @end DATETIME = DATEADD(day, 1, @start);

            SELECT
                ms.name        AS ticker,
                ms.name        AS company,
                ms.rank_db     AS rsRank,
                ms.score       AS rsScore
            FROM marketScores ms WITH (NOLOCK)
            WHERE ms.type = 'etf'
              -- Volle Indexunterstützung ohne Datums-Umrechnungen
              AND ms.anl_datum >= @start AND ms.anl_datum < @end
            ORDER BY ms.rank_db ASC
            OPTION (RECOMPILE);
        `);

        return result.recordset;
    } catch (error) {
        console.error("FEHLER IN getEtfsForList:", error);
        throw error;
    }
}

module.exports = {
    getEtfsForList
};