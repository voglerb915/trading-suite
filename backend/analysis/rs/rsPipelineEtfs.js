const { sql, config } = require('../../db/connection');
const { calculateRsScoreWoNFromDb } = require('./rsScoreWoNFromDb');
const { isRealStock } = require('../../../frontend/shared/logic/stockFilter.js');

async function buildEtfRsSnapshot() {
  await sql.connect(config);

  const result = await sql.query(`
    SELECT *
    FROM trading.dbo.finviz
    WHERE anl_datum = (SELECT MAX(anl_datum) FROM trading.dbo.finviz)
      AND ticker IS NOT NULL;
  `);

  const rows = result.recordset.filter(r => !isRealStock(r));

  let etfs = rows.map(row => {
    const rs = calculateRsScoreWoNFromDb(row);

    return {
      ticker: row.ticker,
      company: row.company,      // 🟢 'company' statt 'name' für 1:1 Stock-Gleichheit
      sector: row.sector,
      industry: row.industry,
      rsScore: rs.score,         // 🟢 Gold-Standard: rsScore statt score
      rsRank: 0,                 // 🟢 Gold-Standard: rsRank statt rankWonDb

      diffD: 0,
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
          change: row.perf_week
        }
      ],

      anl_datum: row.anl_datum
    };
  });

  // Nach rsScore sortieren
  etfs.sort((a, b) => b.rsScore - a.rsScore);
  
  // 🟢 Den Rang im Wunschfeld rsRank vergeben
  etfs.forEach((e, i) => e.rsRank = i + 1);

  return etfs;
}

module.exports = { buildEtfRsSnapshot };