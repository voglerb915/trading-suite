const express = require('express');
const router = express.Router();

const { yahooPool, tradingPool } = require('../db/connection');
const { prepareRsGroups } = require('../utils/prepareRsGroups');
const logger = require('../utils/logger');

// GET /api/short-strategy/update-short-strategy
router.get('/update-short-strategy', async (req, res) => {
    try {
        logger.update('UPDATE-SHORT', 'Short-Stage3 Update gestartet (SQL Datenbank - 200 Tage aktiv)');

        // ─────────────────────────────────────────────────────────────
        // 0) GEDÄCHTNIS LADEN – direkt aus SQL (Yahoo-DB)
        // ─────────────────────────────────────────────────────────────
        const memoryResult = await yahooPool.request().query(`
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

        logger.info('UPDATE-SHORT', `Gedächtnis geladen: ${memoryResult.recordset.length} Ticker aus SQL`);

        // ─────────────────────────────────────────────────────────────
        // 1) MARKTDATEN HOLEN (Trading-DB, 200-Tage Mindesthistorie)
        // ─────────────────────────────────────────────────────────────
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

        const result = await tradingPool.request().query(query);
        const allRows = result.recordset;

        // Gruppieren nach Ticker
        const grouped = {};
        allRows.forEach(row => {
            if (!grouped[row.ticker]) grouped[row.ticker] = [];
            grouped[row.ticker].push(row);
        });

        const { industries } = prepareRsGroups();
        const industryMap = new Map(industries.map(i => [i.name, i.rankWonDb]));

        // ─────────────────────────────────────────────────────────────
        // 2) VERARBEITUNG
        // ─────────────────────────────────────────────────────────────
        const processedData = Object.values(grouped).map(history => {

            if (history.length < 21) return null;

            const latest         = history.at(-1);
            const oldestInWindow = history.at(-21);
            const history20      = history.slice(-20);

            // Vortages-State aus SQL – Fallback: kein Signal
            const prev = lastShortMap[latest.ticker] ?? {
                signal_state_active: 0,
                trigger_date:        null,
                days_above_sma:      0
            };

            const currentSmaPrice = latest.price / (1 + (latest.sma200 / 100));

            // --- A) 3-PHASEN-CHECK ---
            const hasBeenBelow = history20.some(r =>
                r.price < (r.price / (1 + (r.sma200 / 100)))
            );
            const hasBeenAboveAfterBelow = history20.some((r, idx) => {
                const smaVal = r.price / (1 + (r.sma200 / 100));
                if (r.price > smaVal) {
                    return history20.slice(0, idx).some(oldR =>
                        oldR.price < (oldR.price / (oldR.sma200 / 100 + 1))
                    );
                }
                return false;
            });

            // --- B) RESET & TRIGGER ---
            let currentDaysAbove = (latest.price > currentSmaPrice)
                ? (prev.days_above_sma + 1)
                : 0;

            let state_active = prev.signal_state_active;
            let trigger_date = prev.trigger_date;

            // Reset: Aktie schließt 2+ Tage über dem SMA → Signal erlischt
            if (currentDaysAbove >= 2) {
                state_active = 0;
                trigger_date = null;
            }

            // Trigger: Signal NUR setzen wenn vorher kein Signal aktiv war
            if (state_active === 0 && latest.price < currentSmaPrice && hasBeenAboveAfterBelow) {
                state_active = 1;
                trigger_date = latest.anl_datum; // Datum einrasten – wird nie wieder überschrieben
            }

            // --- C) SCORING ---
            const s1 = state_active ? 40 : 0;
            let s2 = 0;
            let displayAge = 0;

            if (state_active && trigger_date) {
                const diffDays = Math.floor(
                    (new Date(latest.anl_datum) - new Date(trigger_date)) / 86400000
                );
                displayAge = diffDays + 1;          // Anzeige: Tag 1, Tag 2...
                s2 = Math.max(0, 20 - (diffDays * 2)); // 2 Pkt Abzug pro Tag
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
                ticker:              latest.ticker,
                name:                latest.company,
                price:               latest.price,
                industry:            latest.industry,
                industryRank:        indRank,
                sector:              latest.sector,
                toppingScore:        totalScore,
                signal_state:        s1,
                signal_age:          s2,
                trend_slope:         s3,
                group_rs:            s4,
                sma_proximity:       s5,
                sma_slope_percent:   smaSlopePercent,
                trigger_date:        trigger_date,
                signal_state_active: state_active,
                days_above_sma:      currentDaysAbove,
                anl_datum:           latest.anl_datum,
                details: [
                    `Signal-State: ${s1.toFixed(2)}`,
                    `Signal-Age: ${s2.toFixed(2)} (Tag ${displayAge})`,
                    `Trend-Slope: ${s3.toFixed(2)} (${smaSlopePercent.toFixed(2)}%)`,
                    `Group-RS: ${s4.toFixed(2)} (Rank ${indRank})`,
                    `SMA-Proximity: ${s5.toFixed(2)}`
                ]
            };
        })
        .filter(item =>
            item !== null &&
            item.signal_state > 0 &&
            item.price > 12 &&
            item.industryRank > 15
        )
        .sort((a, b) => b.toppingScore - a.toppingScore);

        // ─────────────────────────────────────────────────────────────
        // 3) SQL EXPORT (Yahoo-DB)
        // ─────────────────────────────────────────────────────────────
        if (processedData.length > 0) {
            const request = yahooPool.request();
            const todayStr = processedData[0].anl_datum.toISOString().split('T')[0];

            // Heutigen Eintrag löschen falls bereits vorhanden (Idempotenz)
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

            logger.update('UPDATE-SHORT', `${processedData.length} Signale gespeichert für ${todayStr}`);
        } else {
            logger.info('UPDATE-SHORT', 'Keine aktiven Signale heute – nichts gespeichert.');
        }

        // Optional: JSON-Cache – nur übernehmen, wenn saveWithArchive im Cockpit existiert
        if (req.app.locals && typeof req.app.locals.saveWithArchive === 'function') {
            req.app.locals.saveWithArchive('distribution_short.json', processedData);
        }

        res.json({ success: true, count: processedData.length });

    } catch (err) {
        logger.error('UPDATE-SHORT', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
