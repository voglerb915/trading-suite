const express = require("express");
const router = express.Router();
const { sql, yahooPool, tradingPool } = require("../db/connection");
const axios = require("axios");

router.get("/stream-daily", async (req, res) => {
    console.log("SSE DAILY STREAM AUFGERUFEN");

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    if (res.flushHeaders) res.flushHeaders();

    function send(event, data) {
        res.write(`event: ${event}\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    }

    send("progress", { current: 0, total: 0, ticker: null });

    try {
        // ✔ Ticker aus Finviz holen (wie du es jetzt brauchst)
        const result = await tradingPool.request().query(`
            SELECT DISTINCT Ticker AS ticker 
            FROM trading.dbo.finviz
        `);

        const tickers = result.recordset;
        const total = tickers.length;
        let current = 0;

        for (const row of tickers) {
            current++;

            send("progress", {
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

                if (!timestamps) continue;

                for (let i = 0; i < timestamps.length; i++) {
                    if (quote.close[i] === null) continue;

                    const dateVal = new Date(timestamps[i] * 1000).toISOString().split("T")[0];

                    await yahooPool.request()
                        .input("ticker", sql.VarChar, row.ticker)
                        .input("dat", sql.Date, dateVal)
                        .input("cls", sql.Decimal(18, 4), quote.close[i])
                        .input("opn", sql.Decimal(18, 4), quote.open[i])
                        .input("hi", sql.Decimal(18, 4), quote.high[i])
                        .input("lo", sql.Decimal(18, 4), quote.low[i])
                        .input("vol", sql.BigInt, quote.volume[i] || 0)
                        .query(`
                            MERGE INTO DailyHistory AS target
                            USING (SELECT @ticker AS ticker, @dat AS [date]) AS source
                            ON (target.ticker = source.ticker AND target.[date] = source.[date])
                            WHEN MATCHED THEN
                                UPDATE SET 
                                    [close] = @cls, 
                                    [open] = @opn, 
                                    high = @hi, 
                                    low = @lo, 
                                    volume = @vol
                            WHEN NOT MATCHED THEN
                                INSERT (ticker, [date], [close], [open], high, low, volume)
                                VALUES (@ticker, @dat, @cls, @opn, @hi, @lo, @vol);
                        `);
                }

            } catch (err) {
                send("error", { ticker: row.ticker, message: err.message });
            }
        }

        send("done", { message: "DailyHistory abgeschlossen." });
        res.end();

    } catch (err) {
        send("error", { message: err.message });
        res.end();
    }
});

module.exports = router;
