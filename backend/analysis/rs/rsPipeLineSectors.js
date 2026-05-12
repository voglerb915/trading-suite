// analysis/rs/rsPipelineSectors.js
const { sql, config } = require('../../db/connection');
const { calculateRsScoreWoNFromDb } = require('./rsScoreWoNFromDb');
const { getRankingDiffs } = require('./rsRankingHistory');

async function buildSectorRsSnapshot() {
  await sql.connect(config);

  // ⭐ 1) Neueste Sector-Daten holen
  const result = await sql.query(`
    WITH latest AS (
        SELECT *,
            ROW_NUMBER() OVER (
                PARTITION BY name 
                ORDER BY anl_datum DESC
            ) AS rn
        FROM trading.dbo.finviz_groups
        WHERE [group] = 'sector'
    )
    SELECT 
      [name],
      [perf_week],
      [perf_month],
      [perf_quart],
      [perf_half],
      [perf_year],
      [change],
      [anl_datum]
    FROM latest
    WHERE rn = 1
  `);

  // ⭐ 2) Snapshot-Objekte erzeugen
  let sectors = result.recordset.map(row => {
    const rs = calculateRsScoreWoNFromDb(row);

    return {
      name: row.name,
      score: rs.score,

      // wird später gesetzt
      rankWonDb: 0,
      diffW: 0,
      diffM: 0,
      diffQ: 0,

      perf_week: row.perf_week,
      perf_month: row.perf_month,
      perf_quart: row.perf_quart,
      perf_half: row.perf_half,
      perf_year: row.perf_year,

      data: [
        {
          date: row.anl_datum.toISOString().slice(0, 10),
          change: row.change
        }
      ],

      anl_datum: row.anl_datum
    };
  });

  // ⭐ 3) Ranking nach RS-Score
  sectors.sort((a, b) => b.score - a.score);
  sectors.forEach((sec, i) => sec.rankWonDb = i + 1);

  // ⭐ 4) Deltas holen (nutzt jetzt Rankmap → extrem schnell)
  const diffs = getRankingDiffs(sectors, 'sector');

  sectors = sectors.map(sec => ({
    ...sec,
    ...(diffs.find(d => d.name === sec.name) || {})
  }));

  return sectors;
}

module.exports = { buildSectorRsSnapshot };
