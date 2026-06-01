/**
 * signalsRoute.js
 * ----------------
 * Aufgabe:
 *  - Engine starten (runSignalsEngine)
 *  - Dashboard-Formatter (prepareSignals) bereitstellen
 */

console.log("🔥 signalsRoute LOADED");

const express = require('express');
const router = express.Router();
const logger = require('../../utils/logger');

const { prepareSignals } = require('../../services/prepareSignals');
const { runSignalsEngine } = require('../../workers/signalsEngine');

// ENGINE STARTEN (Control-Center)
router.get('/run-engine', async (req, res) => {
    try {
        const result = await runSignalsEngine();
        res.json({ success: true, result });
    } catch (err) {
        logger.error('SIGNALS-ENGINE', `Fehler: ${err.message}`);
        res.status(500).json({ success: false, error: err.message });
    }
});

// DASHBOARD-DATEN (iframe Dashboard)
router.get('/get-latest', async (req, res) => {
    try {
        const data = await prepareSignals();
        res.json(data);
    } catch (err) {
        logger.error('SIGNALS-ROUTE', `Fehler: ${err.message}`);
        res.status(500).json({ error: 'Fehler beim Abruf der Signale' });
    }
});

module.exports = router;
