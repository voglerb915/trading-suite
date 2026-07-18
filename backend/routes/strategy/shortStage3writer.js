const express = require('express');
const router = express.Router();

const { sql, config } = require('../../db/connection');
const logger = console;

router.get('/write-stage3-strategy', async (req, res) => {
    try {
        logger.log('Short-Stage3 Writer gestartet');

        await sql.connect(config);

        // ------------------------------------------------------
        // 0) Gedächtnis aus SQL laden
        // ------------------------------------------------------
        const memoryResult = await sql.query(`
            SELECT ticker, s1_state_active, s1_trigger_date, s1_days_above
            FROM [yahoo].[dbo].[strategies]
            WHERE strategy_name = 'S1_SHORT_S3T'
              AND [date] = (
                  SELECT MAX([date]) 
                  FROM [yahoo].[dbo].[strategies] 
                  WHERE strategy_name = 'S1_SHORT_S3T'
              )
        `);

        const lastShortMap = {};
        memoryResult.recordset.forEach(s => {
            lastShortMap[s.ticker] = {
                signal_state_active: s.s1_state_active ?? 0,
                trigger_date:        s.s1_trigger_date ?? null,
                days_above_sma:      s.s1_days_above   ?? 0
            };
        });

        // ------------------------------------------------------
        // 1) Industry-Ranking aus Cockpit-API holen
        // ------------------------------------------------------
        const indResult = await sql.query(`
            SELECT name, rank_db
            FROM trading.dbo.marketScores
            WHERE type = 'industry'
        `);

        const industryMap = new Map(
            indResult.recordset.map(i => [i.name, i.rank_db])
        );


        // ------------------------------------------------------
        // 2) Marktdaten holen (200‑Tage Mindesthistorie)
        // ------------------------------------------------------
        const query = `
            WITH TickerHistory AS (
                SELECT ticker, COUNT(*) as record_count
                FROM [dbo].[finviz]
                GROUP BY ticker
                HAVING COUNT(*) >= 200
            ),
            OrderedData AS (
                SELECT 
                    f.ticker, f.price, f.anl_datum, f.industry, f.company, f.sector,
                    f.sma200, f.[_52w_high], f.perf_year,
                    (f.price / NULLIF(1.0 + (f.sma200 / 100.0), 0)) AS sma200_price,
                    ROW_NUMBER() OVER (PARTITION BY f.ticker ORDER BY f.anl_datum DESC) as row_num
                FROM [dbo].[finviz] f
                INNER JOIN TickerHistory th ON f.ticker = th.ticker
                WHERE f.industry NOT LIKE '%Fund%' 
                  AND f.industry <> 'Exchange Traded Fund'
                  AND f.sma200 IS NOT NULL
                  AND f.anl_datum > DATEADD(day, -45, (SELECT MAX(anl_datum) FROM [dbo].[finviz]))
            )
            SELECT * FROM OrderedData 
            WHERE row_num <= 25 AND sma200_price IS NOT NULL 
            ORDER BY ticker, anl_datum ASC;
        `;

        const result = await sql.query(query);
        const allRows = result.recordset;

        const grouped = {};
        allRows.forEach(row => {
            if (!grouped[row.ticker]) grouped[row.ticker] = [];
            grouped[row.ticker].push(row);
        });

        // ------------------------------------------------------
        // 3) Verarbeitung (Stage‑3 Short)
        // ------------------------------------------------------
        const processedRaw = Object.values(grouped).map(history => {

    if (history.length < 21) return null;

    const latest         = history.at(-1);
    const oldestInWindow = history.at(-21);
    const history20      = history.slice(-20);

    const prev = lastShortMap[latest.ticker] ?? {
        signal_state_active: 0,
        trigger_date:        null,
        days_above_sma:      0
    };

    const currentSmaPrice = latest.price / (1 + (latest.sma200 / 100));

    const hasBeenBelow = history20.some(r =>
        r.price < (r.price / (1 + (r.sma200 / 100)))
    );

    const hasBeenAboveAfterBelow = history20.some((r, idx) => {
        const smaVal = r.price / (1 + (r.sma200 / 100));
        if (r.price > smaVal) {
            return history20.slice(0, idx).some(oldR =>
                oldR.price < (oldR.price / (oldR.sma200 / 100))
            );
        }
        return false;
    });

    let currentDaysAbove = (latest.price > currentSmaPrice)
        ? (prev.days_above_sma + 1)
        : 0;

    let state_active = prev.signal_state_active;
    let trigger_date = prev.trigger_date;

    if (currentDaysAbove >= 2) {
        state_active = 0;
        trigger_date = null;
    }

    if (state_active === 0 && latest.price < currentSmaPrice && hasBeenAboveAfterBelow) {
        state_active = 1;
        trigger_date = latest.anl_datum;
    }

    const s1 = state_active ? 40 : 0;
    let s2 = 0;
    let displayAge = 0;

    if (state_active && trigger_date) {
        const diffDays = Math.floor(
            (new Date(latest.anl_datum) - new Date(trigger_date)) / 86400000
        );
        displayAge = diffDays + 1;
        s2 = Math.max(0, 20 - (diffDays * 2));
    }

    let smaSlopePercent = 0;
    if (latest.sma200_price && oldestInWindow?.sma200_price > 0) {
        smaSlopePercent = ((latest.sma200_price / oldestInWindow.sma200_price) - 1) * 100;
    }
    const s3 = Math.max(0, 30 * (1 - Math.pow(smaSlopePercent / 5, 2)));

    const indRank = industryMap.get(latest.industry) ?? 999;
    const s4 = indRank <= 15 ? 0 : Math.min(25, (indRank / 200) * 25);

    const s5 = Math.max(0, 10 - Math.abs(latest.sma200));

    const totalScore = parseFloat((s1 + s2 + s3 + s4 + s5).toFixed(2));

    return {
        ticker: latest.ticker,
        latest,
        history20,
        currentSmaPrice,
        hasBeenBelow,
        hasBeenAboveAfterBelow,
        currentDaysAbove,
        state_active,
        trigger_date,
        indRank,
        price: latest.price,
        totalScore
    };
});

 // ------------------------------------------------------
// DEBUG: Analyse der Rohdaten vor dem Filter
// ------------------------------------------------------
let debug = {
    totalTickers: processedRaw.length,
    validHistory: 0,
    triggerCandidates: 0,
    belowSMA: 0,
    aboveAfterBelow: 0,
    resetCases: 0,
    industryFail: 0,
    priceFail: 0,
    finalSignals: 0,
    examples: []
};

processedRaw.forEach(item => {
    if (!item) return;

    debug.validHistory++;

    if (item.latest.price < item.currentSmaPrice) debug.belowSMA++;
    if (item.hasBeenAboveAfterBelow) debug.aboveAfterBelow++;

    if (item.latest.price < item.currentSmaPrice && item.hasBeenAboveAfterBelow) {
        debug.triggerCandidates++;
    }

    if (item.currentDaysAbove >= 2) debug.resetCases++;

    if (item.indRank <= 15) debug.industryFail++;

    if (item.price <= 12) debug.priceFail++;

    if (debug.examples.length < 10) {
        debug.examples.push({
            ticker: item.ticker,
            price: item.price,
            smaPrice: item.currentSmaPrice,
            industryRank: item.indRank,
            currentDaysAbove: item.currentDaysAbove,
            hasBeenBelow: item.hasBeenBelow,
            hasBeenAboveAfterBelow: item.hasBeenAboveAfterBelow
        });
    }
});


// ------------------------------------------------------
// DEBUG: Final count
// ------------------------------------------------------
const processedData = processedRaw
    .filter(item =>
        item !== null &&
        item.state_active > 0 &&
        item.price > 12 &&
        item.indRank > 15
    )
    .sort((a, b) => b.totalScore - a.totalScore);

debug.finalSignals = processedData.length;

logger.log("=== Stage3 DEBUG ===");
logger.log(JSON.stringify(debug, null, 2));
logger.log("====================");


        // ------------------------------------------------------
        // 4) SQL EXPORT
        // ------------------------------------------------------
        if (processedData.length > 0) {
            const request = new sql.Request();
            const todayStr = processedData[0].anl_datum.toISOString().split('T')[0];

            await request.query(`
                DELETE FROM [yahoo].[dbo].[strategies] 
                WHERE [date] = '${todayStr}' 
                  AND [strategy_name] = 'S1_SHORT_S3T'
            `);

            for (const item of processedData) {
                const triggerDateStr = item.trigger_date
                    ? `'${new Date(item.trigger_date).toISOString().split('T')[0]}'`
                    : 'NULL';

                const insertQuery = `
                    INSERT INTO [yahoo].[dbo].[strategies] 
                    (
                        [date], [ticker], [strategy_name],
                        [s1_total_score], [s1_state_active], [s1_trigger_date],
                        [s1_days_above], [s1_slope_val], [s1_ind_rank],
                        [s1_sma_dist], [s1_details_json]
                    )
                    VALUES (
                        '${item.anl_datum.toISOString().split('T')[0]}',
                        '${item.ticker}',
                        'S1_SHORT_S3T',
                        ${item.toppingScore},
                        ${item.signal_state_active},
                        ${triggerDateStr},
                        ${item.days_above_sma},
                        ${item.sma_slope_percent},
                        ${item.industryRank},
                        ${item.sma_proximity},
                        '${JSON.stringify(item.details).replace(/'/g, "''")}'
                    )
                `;
                await request.query(insertQuery);
            }

            logger.log(`Short-Stage3 gespeichert: ${processedData.length} Signale`);
        } else {
            logger.log('Short-Stage3: keine aktiven Signale');
        }

        res.json({ success: true, count: processedData.length });

    } catch (err) {
        logger.error('Short-Stage3 Writer Fehler:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
