const { tradingConnect } = require("../db/connection");
const sql = require("mssql");

async function getSectorsForList() {
    try {
        const pool = await tradingConnect;

        // 1. Das neueste ANALYSE-Datum für Sektoren holen (Typ 'sector')
        const dateResult = await pool.request().query(`
            SELECT CONVERT(VARCHAR(10), MAX(anl_datum), 120) AS max_date
            FROM marketScores WITH (NOLOCK)
            WHERE type = 'sector'
            OPTION (RECOMPILE);
        `);
        
        const latestDate = dateResult.recordset[0]?.max_date;
        if (!latestDate) return [];

        const request = pool.request();
        request.input("targetDate", sql.VarChar(10), latestDate);

        // 2. Hauptabfrage: SARGable Zeitfenster über @start und @end
        const result = await request.query(`
            DECLARE @start DATETIME = CAST(@targetDate AS DATETIME);
            DECLARE @end DATETIME = DATEADD(day, 1, @start);

            SELECT
                ms.name        AS sector,
                ms.score       AS rsScore,
                ms.rank_db     AS rsRank,
                ms.diffW,
                ms.diffM,
                ms.diffQ            
            FROM marketScores ms WITH (NOLOCK)
            WHERE ms.type = 'sector'
              -- Perfekter Index-Seek über das Zeitfenster
              AND ms.anl_datum >= @start AND ms.anl_datum < @end
            ORDER BY ms.rank_db ASC
            OPTION (RECOMPILE);
        `);

        return result.recordset;
    } catch (error) {
        console.error("FEHLER IN getSectorsForList:", error);
        throw error;
    }
}

module.exports = {
    getSectorsForList
};