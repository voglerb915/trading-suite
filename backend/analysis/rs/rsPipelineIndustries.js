const { sql, config } = require('../db/connection')
const { calculateRsScoreWoNFromDb } = require('./rsScoreWoNFromDb')
const { getRankingDiffs } = require('./rsRankingHistory')

async function buildIndustryRsSnapshot() {
  await sql.connect(config)

  const result = await sql.query(`
    SELECT 
      [name],
      [sector],
      [perf_week],
      [perf_month],
      [perf_quart],
      [perf_half],
      [perf_year]
    FROM trading.dbo.finviz_groups
    WHERE [group] = 'industry'
  `)

  let industries = result.recordset.map(row => {
    const rs = calculateRsScoreWoNFromDb(row)

    return {
      name: row.name,
      sector: row.sector,
      score: rs.score,
      perf_week: row.perf_week,
      perf_month: row.perf_month,
      perf_quart: row.perf_quart,
      perf_half: row.perf_half,
      perf_year: row.perf_year
    }
  })

  industries.sort((a, b) => b.score - a.score)
  industries.forEach((ind, i) => { ind.rankWonDb = i + 1 })

  industries = getRankingDiffs(industries, 'industry')

  return industries
}

module.exports = { buildIndustryRsSnapshot }
