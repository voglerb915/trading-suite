const express = require('express');
const compression = require('compression');
const path = require('path');
const cors = require('cors');
const os = require('os'); // <--- NEU: Für die Geräte-Erkennung
const logger = require('./utils/logger');
const { getTradingDate } = require('./utils/dateHelper');

// --- Datenbank-Verbindung importieren ---
const { tradingConnect, yahooConnect, journalConnect } = require('./db/connection');

const app = express();

// --- Middleware ---
app.use(compression());
app.use(cors());
app.use(express.json());

// --- Datenbank-Check beim Start ---
Promise.all([tradingConnect, yahooConnect, journalConnect])
    .then(() => {
        console.log('✅ Datenbanken erfolgreich verbunden (Pfad: ./db/connection.js)');
    })
    .catch(err => {
        // Wir loggen den Fehler, lassen den Server aber laufen (hilfreich bei Teilausfällen)
        console.error('❌ Datenbank-Verbindungsfehler:', err.message);
    });

// ---------------------------------------------
// 1. NEU: Geräte-Info Endpunkt
// ---------------------------------------------
app.get('/api/device-info', (req, res) => {
    const hostname = os.hostname();
    res.json({ 
        deviceName: hostname,
        // Erkennt deinen Laptop anhand des Namens aus dem SSMS-Screenshot
        isLaptop: hostname.toUpperCase().includes('TRADESMART') 
    });
});

// ---------------------------------------------
// 2. API-Routen
// ---------------------------------------------
app.use('/api/volume-metrics', require('./routes/volumeMetrics'));
app.use('/api/daily-history', require('./routes/dailyHistory'));
app.use('/api/journal', require('./routes/journal')); 
app.use('/api/calculations', require('./routes/calculations'));
app.use('/api/short-strategy-1', require('./routes/shortStrategy1'));
app.use('/api/sectors', require('./routes/sectors'));
app.use("/api/checks", require("./routes/checks"));
app.use("/api/downloads", require("./routes/download_stream_indexes"));
app.use("/api/downloads", require("./routes/download_stream_stocks"));
app.use("/api/cockpit", require("./routes/cockpitStatusRoutes"));
app.use("/api/downloads", require("./routes/loadIndexes"));
app.use("/api/downloads", require("./routes/loadYahooStocks"));


// ---------------------------------------------
// 3. STATIC FRONTEND SERVING
// ---------------------------------------------
const FRONTEND_ROOT = path.join(__dirname, '../frontend');

app.use('/cockpit', express.static(path.join(FRONTEND_ROOT, 'apps/cockpit')));
app.use('/lab', express.static(path.join(FRONTEND_ROOT, 'apps/lab')));
app.use('/dashboard', express.static(path.join(FRONTEND_ROOT, 'apps/dashboard')));
app.use('/journal', express.static(path.join(FRONTEND_ROOT, 'apps/journal')));
app.use('/charting-tool', express.static(path.join(FRONTEND_ROOT, 'apps/charting-tool')));
app.use('/control-center', express.static(path.join(FRONTEND_ROOT, 'apps/control-center')));
app.use('/shared', express.static(path.join(FRONTEND_ROOT, 'shared')));

// ---------------------------------------------
// 4. Fallback & Error Handling
// ---------------------------------------------
app.get('/', (req, res) => {
    res.redirect('/cockpit');
});

app.use((err, req, res, next) => {
    logger.error('SERVER', `${req.method} ${req.url} → ${err.message}`);
    res.status(500).json({ error: 'Interner Serverfehler' });
});

// ---------------------------------------------
// 5. Start Server
// ---------------------------------------------
const PORT = 4000;
app.listen(PORT, () => {
    console.log(`🚀 Trading-Suite Backend läuft auf Port ${PORT}`);
    console.log(`📅 Trading-Date: ${getTradingDate()}`);
    console.log(`💻 Device-Host: ${os.hostname()}`);
});