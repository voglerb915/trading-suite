// Globale Fetch-Bremse: Verhindert, dass IRGENDEIN Import heimlich das Netzwerk nutzt
const originalFetch = window.fetch;
window.fetch = function(url, options) {
    if (url.includes('/api/market/')) {
        console.warn(`🛑 BLOCKIERT: Ein Import wollte '${url}' fetchen! Umgeleitet auf RAM.`);
        
        const dataStore = window.parent.dataStore;
        if (!dataStore) {
            console.warn("⚠️ dataStore noch nicht bereit – gebe leeres Fallback zurück.");
            // Falls metrics aufgerufen wird, braucht das UI meist ein Objekt {}, kein Array []
            const defaultFallback = url.includes('metrics') || url.includes('won-db') ? {} : [];
            return Promise.resolve(new Response(JSON.stringify(defaultFallback)));
        }

        // 🟢 FIX: Strukturierte Fallbacks für ALLE deine API-Endpunkte
        let mockData = null;

        if (url.includes('stocks')) mockData = dataStore.baseStocks;
        if (url.includes('sectors')) mockData = dataStore.sectors;
        if (url.includes('industries')) mockData = dataStore.industries;
        if (url.includes('etfs')) mockData = dataStore.etfs;
        
        // Falls metrics oder won-db aufgerufen werden, ein leeres Objekt übergeben statt Array
        if (mockData === null) {
            mockData = url.includes('metrics') || url.includes('won-db') ? {} : [];
        }

        return Promise.resolve(new Response(JSON.stringify(mockData)));
    }
    return originalFetch(url, options);
};

console.log("🔴 DEBUG: dashboard.js MIT FETCH-BREMSE geladen!");
/*----------------------------------
1. GLOBALER STATE
----------------------------------*/
window.dashboardState = {
    sectors: [],
    industries: [],
    stocks: [],
    etfs: [],
    sector: null,
    industry: null,
    ticker: null,
    referenceStock: null,
    breadcrumbs: "Alle Sektoren",
    strategy: "none"
};

/*----------------------------------
2. IMPORTS
----------------------------------*/
import { renderDashboard } from "./js/structure/renderDashboard.js";
import "./js/helpers/renderHelpers.js";
import { renderDashboardHeaderLeft } from "./js/header/renderDashboardHeaderLeft.js";
import { renderDashboardHeaderCenter } from "./js/header/renderDashboardHeaderCenter.js";
import { renderDashboardHeaderRight } from "./js/header/renderDashboardHeaderRight.js";

/*----------------------------------
3. DATEN LADEN
----------------------------------*/
function loadDashboardData() {
    try {
        const cockpitData = window.parent.dataStore;
        const cockpitState = window.parent.cockpitState || {};

        // 🟢 FIX: Nicht nur prüfen, ob das Objekt existiert, sondern ob auch echte Daten drin sind!
        if (!cockpitData || !cockpitData.baseStocks || cockpitData.baseStocks.length === 0) {
            console.warn("⚠️ Cockpit DataStore oder baseStocks noch nicht bereit – Dashboard wartet.");
            return false;
        }

        window.dashboardState.sectors = cockpitData.sectors || [];
        window.dashboardState.industries = cockpitData.industries || [];
        window.dashboardState.etfs = cockpitData.etfs || [];

        // 1. Aktien aus dem RAM zuweisen
        window.dashboardState.stocks =
            cockpitState.stocks?.length > 0
                ? cockpitState.stocks
                : cockpitData.baseStocks;

        // Falls trotz allem die Stocks-Liste leer ankommt, brechen wir ab
        if (!window.dashboardState.stocks || window.dashboardState.stocks.length === 0) {
            return false;
        }

        // 2. Auto-Selection beim Start
        if (!window.dashboardState.referenceStock && window.dashboardState.stocks.length > 0) {
            window.dashboardState.referenceStock = window.dashboardState.stocks[0];
            console.log("🎯 Auto-Selection beim Start: ", window.dashboardState.referenceStock.ticker);
        }

        return true;

    } catch (err) {
        console.error("❌ Fehler beim Laden der Dashboard-Daten:", err);
        return false;
    }
}

/*----------------------------------
4. HEADER RENDERN
----------------------------------*/
function renderHeader() {
    renderDashboardHeaderLeft(window.dashboardState);
    renderDashboardHeaderCenter(window.dashboardState);
    renderDashboardHeaderRight(window.dashboardState);
}

/*----------------------------------
5. STOCK-KLICK-LOGIK
----------------------------------*/
function handleStockClick(ticker) {
    const state = window.dashboardState;
    const item = state.stocks.find(s => s.ticker === ticker);
    if (!item) return;

    window.dashboardState = {
        ...state,
        ticker: item.ticker,
        industry: item.industry,
        sector: item.sector,
        referenceStock: item,
        breadcrumbs: `${item.sector} › ${item.industry} › ${item.ticker}`
    };

    renderHeader();
    renderDashboard(window.dashboardState);
}

/*----------------------------------
6. EVENT DELEGATION FÜR STOCK-CLICKS
----------------------------------*/
document.addEventListener("click", (e) => {
    const row = e.target.closest("[data-stock]");
    if (!row) return;

    const ticker = row.getAttribute("data-stock");
    if (!ticker) return;

    handleStockClick(ticker);
});

/*----------------------------------
7. STRATEGY-WECHSEL
----------------------------------*/
document.addEventListener("dashboard:strategyChange", async (e) => {
    console.log("Dashboard received strategy change request:", e.detail);
    window.dashboardState.strategy = e.detail;

    if (window.parent.applyStrategy) {
        await window.parent.applyStrategy(e.detail);
    }

    loadDashboardData();
    renderHeader();
    renderDashboard(window.dashboardState);
});

/*----------------------------------
8. INITIALISIERUNG
----------------------------------*/
export function initDashboard() {
    const ok = loadDashboardData();
    if (!ok) {
        console.warn("⏳ Dashboard wartet auf Cockpit-Daten…");
        return;
    }

    renderHeader();
    renderDashboard(window.dashboardState);
    console.log("🟢 Dashboard erfolgreich gerendert!");
}

// Auf das Startsignal vom Cockpit warten
window.addEventListener("message", (event) => {
    if (event.data?.type === "COCKPIT_DATA_READY") {
        console.log("🚀 Cockpit-Daten sind stabil im RAM. Starte Dashboard Rendering.");
        initDashboard();
    }
});

// 🟢 DOPPELBODEN-FIX: Falls das postMessage-Signal wegen Cross-Origin (Port 3000) verpufft,
// triggern wir den Start nach 1,5 Sekunden einfach hart selbst!
setTimeout(() => {
    if (window.dashboardState.stocks.length === 0) {
        console.log("🔄 Handshake-Timeout: Versuche Direktstart aus dem Cockpit-RAM...");
        initDashboard();
    }
}, 1500);

// Sobald das iFrame-Skript läuft, klopfen wir beim Cockpit an
console.log("Dashboard iFrame initialisiert. Sende READY an Cockpit…");
try {
    window.parent.postMessage({ type: "DASHBOARD_READY" }, "*");
} catch(e) {
    console.error("PostMessage Fehler:", e);
}