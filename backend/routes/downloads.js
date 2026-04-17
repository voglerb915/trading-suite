const express = require("express");
const router = express.Router();

const { loadIndexes } = require("../services/downloads/loadIndexes");
const { getTickersToDownload, downloadTicker } = require("../services/downloads/streamService");

// ---------------------------------------------------------
// 1) SYNC ENDPOINT (optional, falls du ihn behalten willst)
// ---------------------------------------------------------
router.get("/run", async (req, res) => {
    try {
        const result = await loadIndexes();
        res.json(result);
    } catch (err) {
        console.error("Fehler in /run:", err);
        res.status(500).json({ error: "Fehler beim Download" });
    }
});

// ---------------------------------------------------------
// 2) SSE STREAM ENDPOINT (Fortschritt für die Kachel)
// ---------------------------------------------------------
router.get("/stream", async (req, res) => {
    console.log("SSE STREAM AUFGERUFEN");

    // --- WICHTIG: Header für SSE ---
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    // Optional, aber stabilisierend
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
    res.setHeader("Access-Control-Allow-Credentials", "true");

    // --- WICHTIG: Sofort flushen, damit Vite den Stream erkennt ---
    if (res.flushHeaders) res.flushHeaders();

    function sendEvent(event, data) {
        res.write(`event: ${event}\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
        if (res.flush) res.flush(); // WICHTIG
    }

    // Initiales Event
    sendEvent("progress", { current: 0, total: 1, ticker: "INIT" });

    try {
        const tickers = await getTickersToDownload();
        const total = tickers.length;
        let current = 0;

        for (const ticker of tickers) {
            current++;

            await downloadTicker(ticker);

            sendEvent("progress", {
                current,
                total,
                ticker
            });
        }

        sendEvent("done", { ok: true });

    } catch (err) {
        console.error("STREAM FEHLER:", err);
        sendEvent("error", { message: err.message });
    }
});

module.exports = router;
