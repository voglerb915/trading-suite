const express = require('express');
const router = express.Router();

const { writeStocksJson } = require('../../analysis/rs/writeStocksJson');
const { updateTileStatus } = require('../../utils/cockpitStatus');

router.get('/write-stocks', async (req, res) => {
  const start = Date.now();

  try {
    // ⭐ komplette Pipeline: Snapshot + History
    const snapshot = await writeStocksJson();

    const durationMs = Date.now() - start;
    const duration = `${(durationMs / 1000).toFixed(2)}s`;

    // ⭐ Cockpit-Status setzen
    updateTileStatus("RS_Stocks", {
      status: "success",
      lastRun: new Date().toISOString(),
      duration
    });

    res.json({
      success: true,
      count: Object.keys(snapshot).length,
      message: "RS Stocks JSON erfolgreich erzeugt."
    });

  } catch (err) {
    console.error("❌ Fehler beim Schreiben der RS Stocks:", err);

    updateTileStatus("RS_Stocks", {
      status: "error",
      lastRun: new Date().toISOString(),
      duration: null,
      error: err.message
    });

    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

module.exports = router;
