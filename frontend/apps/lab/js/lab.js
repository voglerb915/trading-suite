/*----------------------------------
1. Globaler State (Lab)
----------------------------------*/
const GlobalState = {
    volumeData: [],
    journalData: []
};

/*----------------------------------
2. Data-Layer (API Abrufe)
----------------------------------*/

// Spalte 1: Volumen-Daten
async function loadVolumeData() {
    try {
        const res = await fetch("/api/volume-metrics");
        if (!res.ok) throw new Error("Fehler beim Abruf der Volumen-Daten");
        const data = await res.json();
        GlobalState.volumeData = data;
        renderTurnoverMetrics(data);
    } catch (err) {
        console.error("Fehler loadVolumeData:", err);
    }
}

// Spalte 2: Journal-Daten (Executed Orders)
async function loadExecutedOrders() {
    try {
        const res = await fetch("http://localhost:4000/api/journal/executed");
        if (!res.ok) throw new Error("Fehler beim Abruf der Journal-Daten");
        const data = await res.json();
        GlobalState.journalData = data;
        renderJournalInCol2(data);
    } catch (err) {
        console.error("Fehler loadExecutedOrders:", err);
        document.getElementById("col-2").innerHTML = "<p style='padding:20px; color:red;'>Fehler beim Laden der Datenbank.</p>";
    }
}

/*----------------------------------
4. UI-Layer (Rendering)
----------------------------------*/

// Rendering Spalte 1 (Volumen)
function renderTurnoverMetrics(list) {
    const container = document.getElementById("col-1");
    if (!container) return;

    const rankingList = [...list].sort((a, b) => b.ratio - a.ratio);
    rankingList.forEach((item, index) => { item.ratioRank = index + 1; });

    // ZURÜCK AUF DAS ORIGINAL-LAYOUT FÜR SPALTE 1 (6 Spalten)
    const cols = "0.5fr 0.8fr 0.8fr 0.8fr 1.5fr 1.1fr";
    
    const filtered = list
        .filter(item => item.turnover >= 1000000 && item.volume > 1000000)
        .sort((a, b) => b.turnover - a.turnover);

    container.innerHTML = `
        <h2 style="font-size: 1.2rem; color: #ffa500; margin-bottom: 15px; padding-left: 5px;">
            Huge Volume (Dashboard Lab)
        </h2>

        <div id="turnover-table">
            <div class="vt-header" style="display:grid; grid-template-columns:${cols}; font-weight:bold; padding:10px 5px; border-bottom:2px solid #555; font-size: 1.1rem;">
                <div>R#</div><div>Ticker</div><div style="text-align:right;">Preis</div><div style="text-align:right;">Ratio</div><div style="text-align:right;">Volumen</div><div style="text-align:right; padding-right:5px;">Umsatz</div>
            </div>
            <div id="turnover-rows">
                ${filtered.map(item => `
                    <div class="vt-row" data-ticker="${item.ticker}" style="display:grid; grid-template-columns:${cols}; border-bottom:1px solid #333; padding:8px 5px; cursor:pointer;">
                        <div style="color:#ffa500;">${item.ratioRank}.</div>
                        <div style="font-weight:bold;">${item.ticker}</div>
                        <div style="text-align:right;">${item.close ? Number(item.close).toFixed(2) : '---'} $</div>
                        <div style="text-align:right;">${item.ratio ? item.ratio.toFixed(1) : '0.0'}x</div>
                        <div style="text-align:right;">${Number(item.volume).toLocaleString('de-DE')}</div>
                        <div style="text-align:right; color:#58a6ff;">${Math.round(item.turnover/1000000)}M $</div>
                    </div>`).join('')}
            </div>
        </div>`;
}

// Rendering Spalte 2 (Journal)
function renderJournalInCol2(trades) {
    const container = document.getElementById("col-2");
    if (!container) return;

    // Grid auf 7 Spalten erweitert (letzte Spalte für Status)
    const journalCols = "0.9fr 0.6fr 0.7fr 0.7fr 0.7fr 0.4fr 0.8fr";

    container.innerHTML = `
        <h2 style="font-size: 1.2rem; color: #ffa500; margin-bottom: 15px; padding-left: 5px;">
            Executed Trades (Journal Lab)
        </h2>

        <div id="journal-table">
            <div class="jt-header" style="display:grid; grid-template-columns:${journalCols}; font-weight:bold; padding:10px 5px; border-bottom:2px solid #555; font-size: 1.1rem; background: #1a1a1a;">
                <div>Datum</div>
                <div>ID</div>
                <div>Ticker</div>
                <div style="text-align:right;">Entry</div>
                <div style="text-align:right;">Exit</div>
                <div style="text-align:right;">R</div>
                <div style="text-align:right; padding-right:5px;">Status</div>
            </div>

            <div id="journal-rows">
                    ${trades.map(trade => {
                    const dateStr = trade.entry_date ? new Date(trade.entry_date).toLocaleDateString('de-DE') : '---';
                    const entryPrice = trade.entry_price ? Number(trade.entry_price).toFixed(2) : '0.00';
                    
                    // Wir nutzen jetzt trade.order_status (wie im SQL-Alias oben definiert)
                    const currentStatus = trade.order_status || '---';
                    
                    // Optionale farbliche Hervorhebung
                    let statusColor = '#aaa'; 
                    if (currentStatus.toLowerCase().includes('filled')) statusColor = '#00ff00';
                    if (currentStatus.toLowerCase().includes('entry')) statusColor = '#ffa500';

                    return `
                    <div class="jt-row" style="display:grid; grid-template-columns:${journalCols}; border-bottom:1px solid #333; padding:8px 5px; align-items:center;">
                        <div style="color:#aaa; font-size: 0.85rem;">${dateStr}</div>
                        <div style="color:#666; font-size: 0.8rem;">${trade.order_id}</div>
                        <div style="font-weight:bold; color:#fff;">${trade.ticker}</div>
                        <div style="text-align:right;">${entryPrice} $</div>
                        <div style="text-align:right; color:#888;">---</div>
                        <div style="text-align:right; color:#888;">-</div>
                        <div style="text-align:right; color:${statusColor}; font-weight:bold; padding-right:5px; font-size: 0.85rem;">
                            ${currentStatus}
                        </div>
                    </div>`;
                }).join('')}
            </div>
        </div>`;
}

/*----------------------------------
7. Initialisierung
----------------------------------*/
document.addEventListener("DOMContentLoaded", () => {
    console.log("LAB: Initialisierung gestartet...");
    
    // Daten laden
    setTimeout(() => {
        loadVolumeData();    // Spalte 1
        loadExecutedOrders(); // Spalte 2
    }, 500); 
});