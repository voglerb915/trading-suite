console.log("SSE ROUTE GELADEN");

const express = require("express");
const router = express.Router();
const { sql, yahooPool } = require("../db/connection");
const axios = require("axios");

router.get("/stream", async (req, res) => {
    console.log("SSE STREAM AUFGERUFEN");

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform"); // no-transform ist wichtig für Proxies
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Deaktiviert Buffering für Nginx/Vite-Proxy
    
    // CORS Header (falls Frontend auf 5173 und Backend auf 4000)
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
    res.setHeader("Access-Control-Allow-Credentials", "true");

    // --- WICHTIG: Sofort flushen, damit Vite den Stream erkennt ---
    if (res.flushHeaders) res.flushHeaders();

    function sendEvent(event, data) {
        res.write(`event: ${event}\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    }

    // 🔥 WICHTIG: erstes Event sofort senden
    sendEvent("progress", { current: 0, total: 0, ticker: null });


    try {
        const result = await yahooPool.request().query(`
            SELECT index_id, ticker FROM indices WHERE yahoo_available = 1
        `);

        const indices = result.recordset;
        const total = indices.length;
        let current = 0;

        for (const row of indices) {
            current++;

            sendEvent("progress", {
                current,
                total,
                ticker: row.ticker
            });

            try {
                const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(row.ticker)}?range=2y&interval=1d`;
                const response = await axios.get(url, { headers: { "User-Agent": "Mozilla/5.0" } });

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
                                UPDATE SET 
                                    [close] = @cls, 
                                    adj_close = @adj, 
                                    [open] = @opn, 
                                    high = @hi, 
                                    low = @lo, 
                                    volume = @vol
                            WHEN NOT MATCHED THEN
                                INSERT (index_id, [date], [close], adj_close, [open], high, low, volume)
                                VALUES (@idxId, @dat, @cls, @adj, @opn, @hi, @lo, @vol);
                        `);
                }

            } catch (err) {
                sendEvent("error", { ticker: row.ticker, message: err.message });
            }
        }

        sendEvent("done", { message: "Download abgeschlossen." });
        res.end();

    } catch (err) {
        sendEvent("error", { message: err.message });
        res.end();
    }
});

module.exports = router;
