const { tradingConnect } = require("../db/connection");
const sql = require("mssql");

async function getIndustriesForList() {
    try {
        const pool = await tradingConnect;

        // 1. Das neueste ANALYSE-Datum für Industrien holen
        const dateResult = await pool.request().query(`
            SELECT CONVERT(VARCHAR(10), MAX(anl_datum), 120) AS max_date
            FROM marketScores WITH (NOLOCK)
            WHERE type = 'industry'
            OPTION (RECOMPILE);
        `);
        
        const latestDate = dateResult.recordset[0]?.max_date;
        if (!latestDate) return [];

        const request = pool.request();
        request.input("targetDate", sql.VarChar(10), latestDate);

        // 2. Die Hauptabfrage komplett ohne den finviz-4-Millionen-Scan!
        const result = await request.query(`
            DECLARE @start DATETIME = CAST(@targetDate AS DATETIME);
            DECLARE @end DATETIME = DATEADD(day, 1, @start);

            -- Wir holen das Mapping aus einer kompakten Unterabfrage, die NUR die aktuellen Daten nutzt
            WITH IndustrySectorCTE AS (
                SELECT DISTINCT f.industry, f.sector
                FROM finviz f WITH (NOLOCK)
                WHERE f.anl_datum >= @start AND f.anl_datum < @end
                  AND f.industry IS NOT NULL
            )
            SELECT
                ms.name AS industry,
                ms.score AS rsScore,
                ms.rank_db AS rsRank,
                ms.diffD,
                ms.diffW,
                ms.diffM,
                ISNULL(isc.sector, 'Unknown') AS sector
            FROM marketScores ms WITH (NOLOCK)
            LEFT JOIN IndustrySectorCTE isc 
                ON isc.industry = ms.name
            WHERE ms.type = 'industry'
              AND ms.anl_datum >= @start AND ms.anl_datum < @end
            ORDER BY ms.rank_db ASC
            OPTION (RECOMPILE);
        `);

        return result.recordset;
    } catch (error) {
        console.error("FEHLER IN getIndustriesForList:", error);
        throw error;
    }
}

module.exports = {
    getIndustriesForList
};