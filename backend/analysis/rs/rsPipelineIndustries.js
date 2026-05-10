const { sql, config } = require('../../db/connection');
const { calculateRsScoreWoNFromDb } = require('./rsScoreWoNFromDb')
const { getRankingDiffs } = require('./rsRankingHistory')

async function buildIndustryRsSnapshot() {
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
        WHERE [group] = 'industry'
    )
    SELECT 
      [name],
      [perf_week],
      [perf_month],
      [perf_quart],
      [perf_half],
      [perf_year],
      [anl_datum]
    FROM latest
    WHERE rn = 1
  `)

  let industries = result.recordset.map(row => {
    const rs = calculateRsScoreWoNFromDb(row)

    return {
      name: row.name,
      score: rs.score,
      perf_week: row.perf_week,
      perf_month: row.perf_month,
      perf_quart: row.perf_quart,
      perf_half: row.perf_half,
      perf_year: row.perf_year,
      anl_datum: row.anl_datum   // ⭐ MUSS REIN
    }
  })

  // Ranking nach RS-Score
  industries.sort((a, b) => b.score - a.score)
  industries.forEach((ind, i) => { ind.rankWonDb = i + 1 })

  // ⭐ Deltas holen (D/W/M)
  const diffs = getRankingDiffs(industries, 'industry')

  // ⭐ Deltas in Snapshot mergen
  industries = industries.map(ind => ({
    ...ind,
    ...(diffs[ind.name] || { diffD: 0, diffW: 0, diffM: 0 })
  }))

  return industries
}

module.exports = { buildIndustryRsSnapshot }
