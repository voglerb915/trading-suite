console.log("SSE ROUTE GELADEN");

const express = require("express");
const router = express.Router();
const { sql, yahooPool } = require("../db/connection");
const axios = require("axios");
const { readStatusFile, writeStatusFile } = require("../utils/cockpitStatus");

router.get("/stream", async (req, res) => {
    const startTime = Date.now();
    console.log("SSE STREAM AUFGERUFEN");

    // SSE Header
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
    res.setHeader("Access-Control-Allow-Credentials", "true");

    if (res.flushHeaders) res.flushHeaders();

    function sendEvent(event, data) {
        res.write(`event: ${event}\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    }

    // ------------------------------------------------------
    // 🔥 STARTBLOCK – setzt KEINE duration
    // ------------------------------------------------------
    let status = readStatusFile();
    status.downloads = status.downloads || {};
    status.downloads.IndexHistory = status.downloads.IndexHistory || {};

    status.downloads.IndexHistory.ok = true;
    status.downloads.IndexHistory.lastRun = new Date().toISOString();
    // ❗ duration NICHT setzen – Endblock macht das

    writeStatusFile(status);

    // ------------------------------------------------------

    let globalError = null;
    let errorCount = 0;

    try {
        const result = await yahooPool.request().query(`
            SELECT index_id, ticker FROM indices WHERE yahoo_available = 1
        `);

        const indices = result.recordset;
        const total = indices.length;
        let current = 0;

        for (const row of indices) {
            current++;
            sendEvent("progress", { current, total, ticker: row.ticker });

            try {
                const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(row.ticker)}?range=2y&interval=1d`;
                const response = await axios.get(url, { headers: { "User-Agent": "Mozilla/5.0" }, timeout: 10000 });

                if (!response.data.chart.result) continue;

                const resData = response.data.chart.result[0];
                const timestamps = resData.timestamp;
                const quote = resData.indicators.quote[0];
                const adjClose = resData.indicators.adjclose ? resData.indicators.adjclose[0].adjclose : quote.close;

                if (!timestamps) continue;

                for (let i = 0; i < timestamps.length; i++) {
                    if (quote.close[i] === null) continue;

                    const dateVal = new Date(timestamps[i] * 1000).toISOString().split("T")[0];

                    await yahooPool.request()
                        .input("idxId", sql.Int, row.index_id)
                        .input("dat", sql.Date, dateVal)
                        .input("cls", sql.Decimal(18, 4), quote.close[i])
                        .input("adj", sql.Decimal(18, 4), adjClose[i])
                        .input("opn", sql.Decimal(18, 4), quote.open[i])
                        .input("hi", sql.Decimal(18, 4), quote.high[i])
                        .input("lo", sql.Decimal(18, 4), quote.low[i])
                        .input("vol", sql.BigInt, quote.volume[i] || 0)
                        .query(`
                            MERGE INTO IndexHistory AS target
                            USING (SELECT @idxId AS index_id, @dat AS [date]) AS source
                            ON (target.index_id = source.index_id AND target.[date] = source.[date])
                            WHEN MATCHED THEN
                                UPDATE SET [close] = @cls, adj_close = @adj, [open] = @opn, high = @hi, low = @lo, volume = @vol
                            WHEN NOT MATCHED THEN
                                INSERT (index_id, [date], [close], adj_close, [open], high, low, volume)
                                VALUES (@idxId, @dat, @cls, @adj, @opn, @hi, @lo, @vol);
                        `);
                }
            } catch (err) {
                errorCount++;
                console.error(`Fehler bei ${row.ticker}:`, err.message);
                sendEvent("error", { ticker: row.ticker, message: err.message });
            }
        }

        sendEvent("done", { message: "Download abgeschlossen." });

    } catch (err) {
        globalError = err.message;
        console.error("GLOBALER FEHLER:", err);
        sendEvent("error", { message: err.message });
    }

    // ------------------------------------------------------
    // 🔥 FINALBLOCK – setzt IMMER die Dauer
    // ------------------------------------------------------
    const endTime = Date.now();
    const finalDuration = Math.round((endTime - startTime) / 1000);

    let finalStatus = readStatusFile();
    finalStatus.downloads = finalStatus.downloads || {};
    finalStatus.downloads.IndexHistory = finalStatus.downloads.IndexHistory || {};

    finalStatus.downloads.IndexHistory.ok = !globalError;
    finalStatus.downloads.IndexHistory.lastRun = new Date().toISOString();
    finalStatus.downloads.IndexHistory.duration = `${finalDuration}s`;
    finalStatus.downloads.IndexHistory.info =
        errorCount > 0 ? `${errorCount} Fehler (404) übersprungen` : "Erfolgreich";

    writeStatusFile(finalStatus);

    console.log(`Fertig! Dauer: ${finalDuration}s`);

    res.end();
});

module.exports = router;
