const { sql, config } = require('../../db/connection')
const { calculateRsScoreWoNFromDb } = require('./rsScoreWoNFromDb')
const { getRankingDiffs } = require('./rsRankingHistory')

async function buildSectorRsSnapshot() {
  await sql.connect(config)

  const result = await sql.query(`
    SELECT 
      [name],
      [perf_week],
      [perf_month],
      [perf_quart],
      [perf_half],
      [perf_year]
    FROM trading.dbo.finviz_groups
    WHERE [group] = 'sector'
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
      perf_year: row.perf_year
    }
  })

  // Ranking nach RS-Score (O'Neil DB)
  sectors.sort((a, b) => b.score - a.score)
  sectors.forEach((sec, i) => { sec.rankWonDb = i + 1 })

  // Ranking-Deltas W/M/Q
  sectors = getRankingDiffs(sectors, 'sector')

  return sectors
}

module.exports = { buildSectorRsSnapshot }
