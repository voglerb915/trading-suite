const express = require('express');
const router = express.Router();
const { sql, config } = require('../../db/connection');

// ------------------------------------------------------
// Stage3 READER – liefert die Signale an Cockpit & Dashboard
// ------------------------------------------------------
router.get('/stage3topping', async (req, res) => {
    try {
        await sql.connect(config);

        // 1) Neueste Stage3‑Signale laden
        const result = await sql.query(`
            SELECT 
                [ticker],
                [s1_total_score]     AS totalScore,
                [s1_state_active]    AS stateActive,
                [s1_trigger_date]    AS triggerDate,
                [s1_days_above]      AS daysAbove,
                [s1_slope_val]       AS slopeVal,
                [s1_ind_rank]        AS indRank,
                [s1_sma_dist]        AS smaDist,
                [s1_details_json]    AS detailsJson,
                [date]
            FROM [yahoo].[dbo].[strategies]
            WHERE strategy_name = 'S1_SHORT_S3T'
              AND [date] = (
                    SELECT MAX([date]) 
                    FROM [yahoo].[dbo].[strategies]
                    WHERE strategy_name = 'S1_SHORT_S3T'
              )
            ORDER BY [s1_total_score] DESC
        `);

        const rows = result.recordset;

        // 2) Dashboard‑kompatibles Format erzeugen
        const mapped = rows.map((r, idx) => {

            // Score-Berechnung wie im Writer
            const s1 = r.stateActive ? 40 : 0;

            let s2 = 0;
            if (r.stateActive && r.triggerDate) {
                const diffDays = Math.floor(
                    (new Date(r.date) - new Date(r.triggerDate)) / 86400000
                );
                s2 = Math.max(0, 20 - (diffDays * 2));
            }

            const smaSlopePercent = r.slopeVal ?? 0;
            const s3 = Math.max(0, 30 * (1 - Math.pow(smaSlopePercent / 5, 2)));

            const s4 = r.indRank <= 15 ? 0 : Math.min(25, (r.indRank / 200) * 25);

            const s5 = Math.max(0, 10 - Math.abs(r.smaDist ?? 0));

            const totalScore = parseFloat((s1 + s2 + s3 + s4 + s5).toFixed(2));

            return {
                ticker: r.ticker,

                strategyRank: idx + 1,
                strategyValue: totalScore,

                // S1–S7 = die echten Scores
                s1,
                s2,
                s3,
                s4,
                s5,
                s6: r.triggerDate,
                s7: r.stateActive,

                // Rohwerte
                totalScore,
                slopeVal: r.slopeVal,
                indRank: r.indRank,
                daysAbove: r.daysAbove,
                smaDist: r.smaDist,
                triggerDate: r.triggerDate,
                stateActive: r.stateActive,

                // Teil-Scores für Tooltip
                score_stateActive: s1,
                score_age: s2,
                score_slope: s3,
                score_indRank: s4,
                score_smaDist: s5,

                details: r.detailsJson ? JSON.parse(r.detailsJson) : null,
                date: r.date
            };
        });

        // 3) Response senden
        res.json({
            count: mapped.length,
            data: mapped
        });

    } catch (err) {
        console.error("Stage3 Reader Fehler:", err.message);
        res.status(500).json({ error: err.message });
    }
}); // ← WICHTIG: Route schließen

module.exports = router;
