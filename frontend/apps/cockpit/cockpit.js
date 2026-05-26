/*----------------------------------
1. Globaler State
----------------------------------*/
let currentToolId = 'cockpit'; // Start-Tool

// Globaler Cockpit-State
window.cockpitState = {
    stocks: [],
    sectors: [],
    industries: [],

    sector: null,
    industry: null,
    ticker: null,
    referenceStock: null,

    breadcrumbs: "Alle Sektoren"
};

// 🟢 NEU: DataLayer – zentrale Rohdaten
window.dataStore = {
    baseStocks: [],
    metrics: {},
    finviz: {},
    sectors: [],
    industries: [],
    etfs: [],
    strategyCache: new Map()
};

/*----------------------------------
2. Imports
----------------------------------*/
import { renderCockpit } from "./js/renderCockpit.js";


/*----------------------------------
3. Navigation (Host-System)
----------------------------------*/
function showTool(toolId) {
    console.log("Wechsle zu:", toolId);

    // Alle Views deaktivieren
    document.querySelectorAll('.tool-iframe').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tool-view').forEach(el => el.classList.remove('active'));

    // Navigation Optik
    document.querySelectorAll('#main-nav a').forEach(link => link.classList.remove('active-link'));
    const activeLink = document.querySelector(`#main-nav a[data-tool="${toolId}"]`);
    if (activeLink) activeLink.classList.add('active-link');

    // Cockpit (native View)
    if (toolId === 'cockpit') {
        document.getElementById('cockpit-ui')?.classList.add('active');
        currentToolId = toolId;
        return;
    }

    // Iframes
    const targetIframe = document.getElementById(`iframe-${toolId}`);
    if (targetIframe) {
        targetIframe.classList.add('active');
        currentToolId = toolId;
    } else {
        console.warn(`Kein Container für Tool-ID "${toolId}" gefunden`);
    }
}


/*----------------------------------
4. UI-Layer
----------------------------------*/
function updateHeaderSystemBadge(badge, text) {
    const el = document.getElementById("header-system-badge");
    if (!el) return;

    el.className = "";
    el.classList.add(`header-badge-${badge}`);
    el.textContent = text;
}


/*----------------------------------
5. Event-Handler
----------------------------------*/
document.addEventListener("click", (e) => {
    if (e.target.id === "header-system-badge") {
        showTool("control");
    }
});

/*----------------------------------
5b. Strategy-Handler (NEU)
----------------------------------*/

// 1) Strategy-Daten laden + cachen
async function loadStrategyStocks(strategyName) {
    if (window.dataStore.strategyCache.has(strategyName)) {
        return window.dataStore.strategyCache.get(strategyName);
    }

    const res = await fetch(`/api/strategy/${strategyName}`);
    const strategyItems = await res.json();

    window.dataStore.strategyCache.set(strategyName, strategyItems);
    return strategyItems;
}

// 2) Strategy + DataLayer mergen
function mergeStrategyWithDataLayer(strategyItems) {
    return strategyItems.map(item => {
        const base = window.dataStore.baseStocks.find(s => s.ticker === item.ticker);
        const m = window.dataStore.metrics[item.ticker] || {};
        const f = window.dataStore.finviz[item.ticker] || {};

        return {
            ...base,
            ...item,
            ...m,
            ...f
        };
    });
}

// 3) Strategy-Wechsel durchführen
export async function applyStrategy(strategyName) {
    console.log("Strategy-Wechsel:", strategyName);

    // Strategy laden
    const strategyItems = await loadStrategyStocks(strategyName);

    // Merge durchführen
    const enriched = mergeStrategyWithDataLayer(strategyItems);

    // Cockpit-State aktualisieren
    window.cockpitState.stocks = enriched;

    // UI neu rendern
    renderCockpit(window.cockpitState);
}

/*----------------------------------
5c. Filter & Sortierung (NEU)
----------------------------------*/

// 1) Filter anwenden
function filterStocks(state, stocks) {
    let result = [...stocks];

    // Sektor
    if (state.sector && state.sector !== "all") {
        result = result.filter(s => s.sector === state.sector);
    }

    // Industrie
    if (state.industry) {
        result = result.filter(s => s.industry === state.industry);
    }

    // Index
    if (state.index && state.index !== "all") {
        result = result.filter(s => Array.isArray(s.index) && s.index.includes(state.index));
    }

    // Volume > 2x VMA20
    if (state.volFilterActive) {
        result = result.filter(s => {
            const vol = Number(s.volume || 0);
            const vma = Number(s.vma_20 || 0);
            return vma > 0 && vol > vma * 2;
        });
    }

    // Suche
    if (state.search && state.search.length > 1) {
        const q = state.search.toLowerCase();
        result = result.filter(s =>
            s.ticker.toLowerCase().includes(q) ||
            s.name?.toLowerCase().includes(q)
        );
    }

    return result;
}

// 2) Sortierung anwenden
function sortStocks(state, stocks) {
    const dir = state.sortDirection === "asc" ? 1 : -1;

    return [...stocks].sort((a, b) => {
        const valA = a.rank ?? a.strategyRank ?? 99999;
        const valB = b.rank ?? b.strategyRank ?? 99999;
        return (valA - valB) * dir;
    });
}

// 3) Filter + Sortierung kombinieren
function applyFiltersAndSort() {
    const filtered = filterStocks(window.cockpitState, window.cockpitState.stocks);
    const sorted = sortStocks(window.cockpitState, filtered);

    // UI aktualisieren
    renderCockpit({
        ...window.cockpitState,
        stocks: sorted
    });
}

/*----------------------------------
6. Initialisierung
----------------------------------*/

async function loadBaseData() {
    const [stocksRes, sectorsRes, industriesRes, etfsRes] = await Promise.all([
        fetch("/api/market/stocks"),
        fetch("/api/market/sectors"),
        fetch("/api/market/industries"),
        fetch("/api/market/etfs")
    ]);

    window.dataStore.baseStocks  = await stocksRes.json();
    window.dataStore.sectors     = await sectorsRes.json();
    window.dataStore.industries  = await industriesRes.json();
    window.dataStore.etfs        = await etfsRes.json();

    window.dataStore.metrics = {};
    window.dataStore.finviz  = {};
}

// Globaler Marker, ob die Daten im RAM liegen
let isCockpitDataReady = false;

document.addEventListener("DOMContentLoaded", async () => {
    console.log("Cockpit Initialisierung gestartet...");

    // 🟢 1. iFrame-Datenabrufe und System-Status zentral abfangen
    window.addEventListener("message", (event) => {
        if (event.data?.type === "system-status-update") {
            updateHeaderSystemBadge(event.data.badge, event.data.text);
        }

        // Dashboard iFrame meldet sich, dass es bereit ist
        if (event.data?.type === "DASHBOARD_READY") {
            console.log("📥 Dashboard-iFrame hat sich gemeldet.");
            // Wenn die Daten schon da sind, sofort das Startsignal zurückschicken
            if (isCockpitDataReady) {
                event.source.postMessage({ type: "COCKPIT_DATA_READY" }, "*");
            }
        }
    });

    // Geräteerkennung
    fetch('/api/device-info')
        .then(res => res.json())
        .then(data => {
            const logoDiv = document.querySelector('.logo');
            if (!logoDiv) return;

            const deviceInfo = document.createElement('div');
            deviceInfo.id = 'device-status-info';
            deviceInfo.style.color = 'white';
            deviceInfo.style.marginTop = '2px';
            deviceInfo.style.opacity = '0.7';
            deviceInfo.style.textTransform = 'uppercase';

            const mode = data.isLaptop ? 'Mobile Mode' : 'Stationary';
            deviceInfo.innerHTML = `${data.deviceName} | ${mode} <span id="header-system-badge"></span>`;

            logoDiv.appendChild(deviceInfo);
            logoDiv.style.display = 'flex';
            logoDiv.style.flexDirection = 'column';
        });

    // Navigation
    document.querySelectorAll('#main-nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tool = link.getAttribute('data-tool');
            if (tool) showTool(tool);
        });
    });

    // 🟢 2. Alle Basisdaten laden
    await loadBaseData();
    isCockpitDataReady = true; // Daten sind jetzt im RAM!

    // 🟢 Cockpit-State initialisieren
    window.cockpitState.stocks = window.dataStore.baseStocks;

    // 🟢 Cockpit rendern
    renderCockpit(window.cockpitState);

    // 🟢 Cockpit als Startansicht aktivieren
    showTool("cockpit");
    
    // 🟢 3. Falls das Dashboard schon gewartet hat, schießen wir das Signal jetzt ab
    const dbIframe = document.getElementById("iframe-dashboard");
    if (dbIframe && dbIframe.contentWindow) {
        dbIframe.contentWindow.postMessage({ type: "COCKPIT_DATA_READY" }, "*");
    }
});
