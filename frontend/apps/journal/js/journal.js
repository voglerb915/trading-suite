/*----------------------------------
1. Globaler State
----------------------------------*/
const GlobalState = {
    journalData: [],
    // Platzhalter für zukünftige Filter oder Statistiken
    filters: { strategy: 'all', status: 'all' }
}; [cite: 1]

/*----------------------------------
2. Data-Layer
----------------------------------*/
async function fetchJournalData() {
    const res = await fetch("/api/journal/executed");
    if (!res.ok) throw new Error("Fehler beim Laden der Journal-Daten");
    return await res.json();
} [cite: 1]

/*----------------------------------
3. Navigation (Dashboard-Interne Ansichten)
----------------------------------*/
// Hier können Funktionen zur Umschaltung zwischen Journal, Stats oder Archiv stehen
function switchView(viewName) {
    console.log("Wechsle Ansicht zu:", viewName);
} [cite: 1]

/*----------------------------------
4. UI-Layer (Rendering)
----------------------------------*/
function renderVolumeTable(list = []) {
    const container = document.getElementById("col-1");
    if (!container) return;

    const cols = "0.5fr 0.8fr 0.8fr 0.8fr 1.5fr 1.1fr";
    container.innerHTML = `
        <div id="volume-table-container" style="font-family: sans-serif; position: relative;">
            <div style="position: sticky; top: 0; z-index: 100; background: #121212; padding-top: 20px;">
                <h2 style="font-size: 1rem; color: #ffa500; margin: 0; padding: 0 5px 8px 5px; text-transform: uppercase; letter-spacing: 1px; background: #121212;">
                    Huge Volume
                </h2>
                <div style="display:grid; grid-template-columns:${cols}; font-weight:bold; color:#888; border-bottom:1px solid #444; padding:8px 5px; font-size: 0.85rem; text-transform: uppercase; background: #1a1a1a;">
                    <div>R#</div><div>Ticker</div><div style="text-align:right;">Preis</div>
                    <div style="text-align:right;">Ratio</div><div style="text-align:right;">Volumen</div><div style="text-align:right;">Umsatz</div>
                </div>
            </div>
            <div id="volume-rows" style="background: #121212;">
                ${list.length === 0 ? '<div style="padding: 10px; color: #555;">Keine Daten</div>' : ''}
            </div>
        </div>`;
} [cite: 1]

function renderJournalTable(trades) {
    const container = document.getElementById("col-2");
    if (!container) return;

    const cols = "1.1fr 0.5fr 0.7fr 0.5fr 0.7fr 0.7fr 0.5fr 0.5fr 1.2fr 1.2fr";
    container.innerHTML = `
        <div id="journal-table" style="font-family: sans-serif; position: relative;">
            <div style="position: sticky; top: 0; z-index: 100; background: #121212; padding-top: 20px;">
                <h2 style="font-size: 1rem; color: #ffa500; margin: 0; padding: 0 5px 8px 5px; text-transform: uppercase; letter-spacing: 1px; background: #121212;">
                    Executed Trades
                </h2>
                <div style="display:grid; grid-template-columns:${cols}; font-weight:bold; color:#888; border-bottom:1px solid #444; padding:8px 5px; font-size: 0.85rem; text-transform: uppercase; background: #1a1a1a;">
                    <div>Datum</div><div>ID</div><div>Ticker</div><div>PID</div>
                    <div style="text-align:right;">Entry</div><div style="text-align:right;">Exit</div>
                    <div style="text-align:right;">Qty</div><div style="text-align:right;">R</div>
                    <div style="text-align:right;">Status</div><div style="text-align:center;">Strat</div>
                </div>
            </div>
            <div id="journal-rows" style="background: #121212;">
                ${/* Map-Logik für trades hier einfügen */ ''}
            </div>
        </div>`;
} [cite: 1]

/*----------------------------------
5. Controller
----------------------------------*/
async function initDashboard() {
    try {
        renderVolumeTable([]); // Leere Struktur für Col-1
        const jData = await fetchJournalData();
        GlobalState.journalData = jData;
        renderJournalTable(jData);
    } catch (err) {
        console.error("Controller Error:", err);
    }
} [cite: 1]

/*----------------------------------
6. Event-Handler
----------------------------------*/
// Platz für Sortier-Klicks, Filter-Dropdowns oder Ticker-Details
function setupEventListeners() {
    console.log("Events initialisiert.");
} [cite: 1]

/*----------------------------------
7. Initialisierung
----------------------------------*/
document.addEventListener("DOMContentLoaded", () => {
    initDashboard();
    setupEventListeners();
}); [cite: 1]