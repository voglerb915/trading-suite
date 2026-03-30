/*----------------------------------
1. Globaler State
----------------------------------*/
const GlobalState = {
    volumeData: [],
    journalData: [],
    sortConfig: { key: null, direction: 'desc' } // 'desc' für absteigend, 'asc' für aufsteigend
};

/*----------------------------------
2. Data-Layer
----------------------------------*/
async function fetchVolumeData() {
    const res = await fetch("/api/volume-metrics");
    if (!res.ok) throw new Error("Fehler Volume API");
    return await res.json();
}

async function fetchJournalData() {
    const res = await fetch("/api/journal/executed");
    if (!res.ok) throw new Error("Fehler Journal API");
    return await res.json();
}

/*----------------------------------
3. Navigation (Dashboard-Interne Ansichten)
----------------------------------*/
// Aktuell keine internen Ansichten definiert

/*----------------------------------
4. UI-Layer (Rendering)
----------------------------------*/

function renderVolumeTable(list) {
    const container = document.getElementById("col-1");
    if (!container) return;

    const cols = "0.5fr 0.8fr 0.8fr 0.8fr 1.5fr 1.1fr";
    
    // Hilfsfunktion für das Pfeil-Symbol im Header
    const getIcon = (key) => {
        if (GlobalState.sortConfig.key !== key) return '↕';
        return GlobalState.sortConfig.direction === 'desc' ? '↓' : '↑';
    };

    container.innerHTML = `
        <h2 style="font-size: 1rem; color: #ffa500; margin-bottom: 12px; padding-left: 5px; font-family: sans-serif; text-transform: uppercase; letter-spacing: 1px;">
            Huge Volume
        </h2>
        
        <div id="volume-table" style="font-family: sans-serif;">
            <div id="volume-table" style="font-family: sans-serif;">
            <div style="display:grid; grid-template-columns:${cols}; font-weight:bold; color:#888; border-bottom:1px solid #444; padding:8px 5px; font-size: 0.85rem; text-transform: uppercase;">
                <div>R#</div>
                <div>Ticker</div>
                <div style="text-align:right;">Preis</div>
                
                <div style="text-align:right; cursor:pointer; color:#58a6ff;" onclick="handleSort('ratio')">
                    Ratio ${getIcon('ratio')}
                </div>
                
                <div style="text-align:right; cursor:pointer; color:#58a6ff;" onclick="handleSort('volume')">
                    Volumen ${getIcon('volume')}
                </div>
                
                <div style="text-align:right; cursor:pointer; color:#58a6ff;" onclick="handleSort('turnover')">
                    Umsatz ${getIcon('turnover')}
                </div>
            </div>
            <div id="volume-rows">
                ${list.map((item, idx) => `
                    <div style="display:grid; grid-template-columns:${cols}; border-bottom:1px solid #222; padding:6px 5px; color:#fff; font-size: 0.9rem; align-items:center;">
                        <div style="color:#ffa500; font-size: 0.8rem;">${item.ratioRank || idx + 1}.</div>
                        <div style="font-weight:bold;">${item.ticker}</div>
                        <div style="text-align:right;">${item.close ? Number(item.close).toFixed(2) : '0.00'} $</div>
                        <div style="text-align:right; color: #00ff00;">${item.ratio ? item.ratio.toFixed(1) : '0'}x</div>
                        <div style="text-align:right; color: #aaa;">${Number(item.volume).toLocaleString('de-DE')}</div>
                        <div style="text-align:right; color:#58a6ff;">${Math.round(item.turnover/1000000)}M $</div>
                    </div>`).join('')}
            </div>
        </div>`;
}

function renderJournalTable(trades) {
    const container = document.getElementById("col-2");
    if (!container) return;

    // 7 Spalten Journal Layout
    const cols = "0.9fr 0.6fr 0.7fr 0.7fr 0.7fr 0.4fr 0.8fr";

    container.innerHTML = `
        <h2 style="font-size: 1rem; color: #ffa500; margin-bottom: 12px; padding-left: 5px; font-family: sans-serif; text-transform: uppercase; letter-spacing: 1px;">
            Executed Trades
        </h2>

        <div id="journal-table" style="font-family: sans-serif;">
            <div style="display:grid; grid-template-columns:${cols}; font-weight:bold; color:#888; border-bottom:1px solid #444; padding:8px 5px; font-size: 0.85rem; text-transform: uppercase; background: rgba(255,255,255,0.03);">
                <div>Datum</div><div>ID</div><div>Ticker</div><div style="text-align:right;">Entry</div><div style="text-align:right;">Exit</div><div style="text-align:right;">R</div><div style="text-align:right;">Status</div>
            </div>
            <div id="journal-rows">
                ${trades.map(t => {
                    const statusColor = t.order_status?.toLowerCase().includes('fill') ? '#00ff00' : '#ffa500';
                    return `
                    <div style="display:grid; grid-template-columns:${cols}; border-bottom:1px solid #222; padding:6px 5px; color:#fff; font-size: 0.9rem; align-items:center;">
                        <div style="color:#aaa; font-size: 0.8rem;">${t.entry_date ? new Date(t.entry_date).toLocaleDateString('de-DE') : '---'}</div>
                        <div style="color:#555; font-size: 0.75rem;">${t.order_id || '---'}</div>
                        <div style="font-weight:bold; color:#fff;">${t.ticker || '---'}</div>
                        <div style="text-align:right;">${t.entry_price ? Number(t.entry_price).toFixed(2) : '0.00'} $</div>
                        <div style="text-align:right; color:#666;">---</div>
                        <div style="text-align:right; color:#666;">-</div>
                        <div style="text-align:right; color:${statusColor}; font-weight:bold; font-size: 0.8rem; text-transform: uppercase;">
                            ${t.order_status || 'N/A'}
                        </div>
                    </div>`;
                }).join('')}
            </div>
        </div>`;
}

/*----------------------------------
5. Controller
----------------------------------*/
async function initDashboard() {
    try {
        const vData = await fetchVolumeData();
        GlobalState.volumeData = vData;
        renderVolumeTable(vData);

        const jData = await fetchJournalData();
        GlobalState.journalData = jData;
        renderJournalTable(jData);
    } catch (err) {
        console.error("Controller Error:", err);
    }
}
// Neue Funktion im Controller Bereich
function handleSort(key) {
    const config = GlobalState.sortConfig;

    // Wenn bereits nach diesem Key sortiert wird, ändere die Richtung
    if (config.key === key) {
        config.direction = config.direction === 'desc' ? 'asc' : 'desc';
    } else {
        // Neuer Key gewählt -> starte immer mit absteigend (desc)
        config.key = key;
        config.direction = 'desc';
    }

    // Sortierung ausführen
    GlobalState.volumeData.sort((a, b) => {
        const valA = a[key] || 0;
        const valB = b[key] || 0;
        return config.direction === 'desc' ? valB - valA : valA - valB;
    });

    // Neu rendern
    renderVolumeTable(GlobalState.volumeData);
}

// Damit die Funktion global für das onclick verfügbar ist:
window.handleSort = handleSort;

/*----------------------------------
6. Event-Handler
----------------------------------*/
// Hier können Klick-Events für Ticker etc. rein

/*----------------------------------
7. Initialisierung
----------------------------------*/
document.addEventListener("DOMContentLoaded", () => {
    console.log("LAB: Start...");
    initDashboard();
});