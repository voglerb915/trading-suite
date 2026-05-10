const { sql, config } = require('../../db/connection')
const { calculateRsScoreWoNFromDb } = require('./rsScoreWoNFromDb')
const { getRankingDiffs } = require('./rsRankingHistory')

async function buildSectorRsSnapshot() {
  await sql.connect(config)

  const result = await sql.query(`
      WITH latest AS (
          SELECT 
              *,
              ROW_NUMBER() OVER (
                  PARTITION BY name 
                  ORDER BY anl_datum DESC
              ) AS rn
          FROM trading.dbo.finviz_groups
          WHERE [group] = 'sector'
      )
      SELECT 
          name,
          perf_week,
          perf_month,
          perf_quart,
          perf_half,
          perf_year,
          anl_datum
      FROM latest
      WHERE rn = 1
  `)

  let sectors = result.recordset.map(row => {
    const rs = calculateRsScoreWoNFromDb(row)

    return {
      name: row.name,
      score: rs.score,
      perf_week: row.perf_week,
      perf_month: row.perf_month,
      perf_quart: row.perf_quart,
      perf_half: row.perf_half,
      perf_year: row.perf_year,
      anl_datum: row.anl_datum   // ⭐ MUSS REIN!
    }
  })

  // Ranking nach RS-Score (O'Neil DB)
  sectors.sort((a, b) => b.score - a.score)
  sectors.forEach((sec, i) => { sec.rankWonDb = i + 1 })

  // ⭐ KORREKT: Deltas holen
  const diffs = getRankingDiffs(sectors, 'sector')

  // ⭐ KORREKT: Deltas in Snapshot mergen
  sectors = sectors.map(sec => ({
    ...sec,
    ...(diffs[sec.name] || { diffW: 0, diffM: 0, diffQ: 0 })
  }))

  return sectors
}

module.exports = { buildSectorRsSnapshot }
