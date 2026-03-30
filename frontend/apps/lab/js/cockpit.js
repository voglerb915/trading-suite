/*----------------------------------
1. Globaler State
----------------------------------*/
let currentToolId = 'dashboard'; // Start-Tool (entspricht deiner index.html active)

const GlobalState = {
    volumeData: [],
    filters: {}
};

/*----------------------------------
2. Data-Layer
----------------------------------*/
async function loadCockpitData() {
    try {
        const res = await fetch("/api/volume-metrics");
        if (!res.ok) throw new Error("Fehler beim Abruf vom Server");

        const data = await res.json();
        console.log("DEBUG: Daten geladen (Länge):", data.length);

        if (!data || data.length === 0) {
            console.warn("DEBUG: Das empfangene Array ist leer.");
            return [];
        }

        renderTurnoverMetrics(data);
        return data;

    } catch (err) {
        console.error("Fehler in loadCockpitData:", err);
        return [];
    }
}

/*----------------------------------
3. Navigation (Optimiert für alle Tools)
----------------------------------*/
function showTool(toolId) {
    console.log("Wechsle zu:", toolId);
    
    // 1. Alle Container (Iframes & Native Views) deaktivieren
    document.querySelectorAll('.tool-iframe').forEach(iframe => {
        iframe.classList.remove('active');
    });
    document.querySelectorAll('.tool-view').forEach(view => {
        view.classList.remove('active');
    });

    // 2. Spezialfall: Natives Cockpit UI
    if (toolId === 'cockpit') {
        const cockpitUI = document.getElementById('cockpit-ui');
        if (cockpitUI) cockpitUI.classList.add('active');
        currentToolId = toolId;
        return;
    }

    // 3. Standardfall: Iframes (lab, dashboard, new-dashboard, journal, etc.)
    const targetIframe = document.getElementById(`iframe-${toolId}`);
    if (targetIframe) {
        targetIframe.classList.add('active');
        currentToolId = toolId;
    } else {
        console.warn(`Kein Container für Tool-ID "${toolId}" gefunden (ID: iframe-${toolId})`);
    }
}

/*----------------------------------
4. UI-Layer (Rendering)
----------------------------------*/
function renderTurnoverMetrics(list) {
    const container = document.getElementById("col-1");
    if (!container) return;

    // Globales Ratio-Ranking berechnen (vor dem Filter)
    const rankingList = [...list].sort((a, b) => b.ratio - a.ratio);
    rankingList.forEach((item, index) => {
        item.ratioRank = index + 1;
    });

    // Filter + Sortierung für Anzeige
    const cols = "0.5fr 0.8fr 0.8fr 0.8fr 1.5fr 1.1fr";
    const filteredAndSorted = list
        .filter(item => item.turnover >= 1000000 && item.volume > 1000000)
        .sort((a, b) => b.turnover - a.turnover);

    container.innerHTML = `
        <div id="turnover-table">
            <div class="vt-header" style="display:grid; grid-template-columns:${cols}; font-weight:bold; padding:10px 5px; border-bottom:2px solid #555;">
                <div>R#</div>
                <div>Ticker</div>
                <div style="text-align:right;">Preis</div>
                <div style="text-align:right;">Ratio</div>
                <div style="text-align:right;">Volumen</div>
                <div style="text-align:right; padding-right:5px;">Umsatz</div>
            </div>
            <div id="turnover-rows">
                ${filteredAndSorted.map(item => {
                    const turnoverMio  = Math.round(item.turnover / 1000000);
                    const volFormatted = Number(item.volume).toLocaleString('de-DE');
                    const ratioFormatted = item.ratio ? Number(item.ratio).toFixed(1) + 'x' : '0.0x';
                    return `
                    <div class="vt-row" data-ticker="${item.ticker}"
                         style="display:grid; grid-template-columns:${cols}; border-bottom:1px solid #333; padding:8px 5px; cursor:pointer; align-items:center;">
                        <div style="color:#ffa500; font-weight:bold;">${item.ratioRank}.</div>
                        <div style="font-weight:bold;">${item.ticker}</div>
                        <div style="text-align:right;">${item.close ? Number(item.close).toFixed(2) : '---'} $</div>
                        <div style="text-align:right; color:#ccc;">${ratioFormatted}</div>
                        <div style="text-align:right;">${volFormatted}</div>
                        <div style="text-align:right; color:#58a6ff; font-weight:bold; padding-right:5px;">${turnoverMio}M $</div>
                    </div>`;
                }).join('')}
            </div>
        </div>`;

    // Click-Handler auf Rows
    container.querySelectorAll('.vt-row').forEach(row => {
        row.addEventListener('click', () => {
            const ticker = row.getAttribute('data-ticker');
            handleVolumeClick(ticker);
        });
    });

    console.log(`DEBUG Cockpit: ${filteredAndSorted.length} Ticker angezeigt.`);
}

/*----------------------------------
5. Controller
----------------------------------*/
async function syncUI() {
    try {
        const data = await loadCockpitData();
        if (data && data.length > 0) {
            GlobalState.volumeData = data;
        }
    } catch (err) {
        console.error("Sync Fehler:", err);
    }
}

/*----------------------------------
6. Event-Handler
----------------------------------*/
function handleVolumeClick(ticker) {
    console.log("Ticker im Cockpit ausgewählt:", ticker);
    // Hier kann später eine globale Funktion aufgerufen werden (z.B. Chart-Wechsel)
}

/*----------------------------------
7. Initialisierung
----------------------------------*/
document.addEventListener("DOMContentLoaded", () => {
    console.log("Cockpit Initialisierung gestartet...");

    // Navigation – EventListener für alle Menüpunkte
    document.querySelectorAll('#main-nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tool = link.getAttribute('data-tool'); // Holt z.B. "new-dashboard"
            if (tool) showTool(tool);
        });
    });

    // Daten für das native Cockpit-UI laden
    syncUI();
});