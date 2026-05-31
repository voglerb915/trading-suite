/**
 * signalsRoute.js
 * ----------------
 * Aufgabe:
 *  - prepareSignals() importieren
 *  - GET /signals → prepareSignals() ausführen
 *  - Ergebnis als JSON zurückgeben
 */
console.log("🔥 signalsRoute LOADED");

const express = require('express');
const router = express.Router();
const logger = require('../../utils/logger');
const { prepareSignals } = require('../../services/prepareSignals');

// GET /signals
router.get('/generate-signals', async (req, res) => {
    try {
        const data = await prepareSignals();
        res.json(data);
    } catch (err) {
        logger.error('SIGNALS-ROUTE', `Fehler: ${err.message}`);
        res.status(500).json({ error: 'Fehler beim Abruf der Signale' });
    }
});

module.exports = router;
