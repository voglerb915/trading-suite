const express = require('express')
const router = express.Router()

const { writeSectorSnapshot } = require('../../analysis/rs/writeSectorSnapshot')
const { writeSectorHistory } = require('../../analysis/rs/writeSectorHistory')
const { updateTileStatus } = require('../../utils/cockpitStatus')   // <--- wichtig

router.get('/write-sectors', async (req, res) => {
  const start = Date.now()

  try {
    const snapshot = await writeSectorSnapshot()
    await writeSectorHistory(snapshot)

    // 🔥 Dauer berechnen
    const durationMs = Date.now() - start
    const duration = `${(durationMs / 1000).toFixed(2)}s`

    // 🔥 Status unter calculations.RS_Sectors setzen
    updateTileStatus("RS_Sectors", {
      status: "success",
      lastRun: new Date().toISOString(),
      duration
    })

    res.json({
      success: true,
      count: snapshot.length,
      message: 'RS Sectors JSON erfolgreich erzeugt.'
    })

  } catch (err) {
    console.error("❌ Fehler beim Schreiben der RS Sektoren:", err)

    // 🔥 Fehlerstatus setzen
    updateTileStatus("RS_Sectors", {
      status: "error",
      lastRun: new Date().toISOString(),
      duration: null,
      error: err.message
    })

    res.status(500).json({
      success: false,
      error: err.message
    })
  }
})

module.exports = router
