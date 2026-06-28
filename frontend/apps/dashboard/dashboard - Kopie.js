document.addEventListener("dashboard:indexChange", (e) => {
    console.log("DEBUG INDEX EVENT:", e.detail);
});

/*----------------------------------
-1. MESSAGE BUFFER (MUSS GANZ OBEN SEIN)
----------------------------------*/
window._pendingMessages = [];
window.onmessage = (e) => {
    if (window._pendingMessages) {
        window._pendingMessages.push(e);
    }
};

/*----------------------------------
0. IMPORTS
----------------------------------*/
import { renderDashboard } from "./js/structure/renderDashboard.js";
import { renderDashboardHeaderLeft } from "./js/header/renderDashboardHeaderLeft.js";
import { renderDashboardHeaderCenter } from "./js/header/renderDashboardHeaderCenter.js";
import { renderDashboardHeaderRight } from "./js/header/renderDashboardHeaderRight.js";

/*----------------------------------
1. DASHBOARD READY SIGNAL
----------------------------------*/
console.log("Dashboard JS loaded");
window.parent.postMessage({ type: "DASHBOARD_READY" }, "*");

/*----------------------------------
2. FETCH-BREMSE (RAM-REDIRECT)
----------------------------------*/
const originalFetch = window.fetch;
window.fetch = function(url, options) {
    if (url.includes('/api/market/')) {
        const dataStore = window.parent.dataStore;
        let mockData = [];

        if (url.includes('stocks')) mockData = dataStore?.baseStocks || [];
        else if (url.includes('sectors')) mockData = dataStore?.sectors || [];
        else if (url.includes('industries')) mockData = dataStore?.industries || [];
        else if (url.includes('etfs')) mockData = dataStore?.etfs || [];
        else if (url.includes('metrics') || url.includes('won-db')) mockData = {};

        return Promise.resolve(new Response(JSON.stringify(mockData)));
    }
    return originalFetch(url, options);
};

/*----------------------------------
3. GLOBALER STATE
----------------------------------*/
window.dashboardState = {
    sectors: [],
    industries: [],
    stocks: [],
    etfs: [],
    signals: [],
    sector: null,
    industry: null,
    ticker: null,
    referenceStock: null,
    breadcrumbs: "Alle Sektoren",
    strategy: "none",
    indexFilter: "all",
    search: ""
};

/*----------------------------------
3b. START-SYNCHRONISATION
----------------------------------*/
window._dashboardReadyStocks = false;
window._dashboardReadySignals = false;

/*----------------------------------
4. LOAD DATA
----------------------------------*/
function loadDashboardData() {
    try {
        const cockpitData = window.parent.dataStore;
        const cockpitState = window.parent.cockpitState || {};

        if (!cockpitData || !Array.isArray(cockpitData.baseStocks) || cockpitData.baseStocks.length === 0) {
            console.log("loadDashboardData(): baseStocks im Cockpit NOCH NICHT verfügbar");
            return false;
        }

        console.log("loadDashboardData(): baseStocks LENGTH =", cockpitData.baseStocks.length);

        const currentStrategy = window.dashboardState.strategy;
        let stocks;

        if (currentStrategy !== "none") {
            const strategyStocks = cockpitState.stocks;
            if (Array.isArray(strategyStocks) && strategyStocks.length > 0) {
                stocks = strategyStocks;
            } else {
                stocks = cockpitData.baseStocks;
            }
        } else {
            stocks = cockpitData.baseStocks;
        }

        window.dashboardState = {
            ...window.dashboardState,
            strategy: currentStrategy,
            sectors: cockpitData.sectors || [],
            industries: cockpitData.industries || [],
            etfs: cockpitData.etfs || [],
            stocks
        };

        return true;

    } catch (err) {
        console.error("❌ Fehler beim Laden der Dashboard-Daten:", err);
        return false;
    }
}


/*----------------------------------
5. HEADER RENDERN
----------------------------------*/
function renderHeader() {
    renderDashboardHeaderLeft(window.dashboardState);
    renderDashboardHeaderCenter(window.dashboardState);
    renderDashboardHeaderRight(window.dashboardState);
}

/*----------------------------------
6. UPDATE + RENDER
----------------------------------*/
function updateAndRenderDashboard() {
    if (!Array.isArray(window.dashboardState.stocks)) {
        window.dashboardState.stocks = [];
    }

    renderHeader();
    renderDashboard(window.dashboardState);
}

/*----------------------------------
7. STRATEGY CHANGE
----------------------------------*/
document.addEventListener("dashboard:strategyChange", async (e) => {
    const strategy = e.detail;
    window.dashboardState.strategy = strategy;

    if (window.parent && typeof window.parent.applyStrategy === "function") {
        await window.parent.applyStrategy(strategy);
    }
});

/*----------------------------------
7.1 INDEX CHANGE
----------------------------------*/
document.addEventListener("dashboard:indexChange", (e) => {
    const index = e.detail;
    window.dashboardState.indexFilter = index;
    updateAndRenderDashboard();
});

/*----------------------------------
SEARCH + RESET
----------------------------------*/
document.addEventListener("dashboard:searchChange", (e) => {
    window.dashboardState.search = e.detail;
    updateAndRenderDashboard();
});

document.addEventListener("dashboard:reset", () => {
    window.dashboardState = {
        ...window.dashboardState,
        sector: null,
        industry: null,
        ticker: null,
        strategy: "none",
        indexFilter: "all",
        search: ""
    };

    document.dispatchEvent(new CustomEvent("dashboard:searchChange", { detail: "" }));
    updateAndRenderDashboard();
});

/*----------------------------------
8. CLICK EVENTS
----------------------------------*/
document.addEventListener("click", (e) => {

    const stockRow = e.target.closest("[data-stock]");
    if (stockRow) {
        const ticker = stockRow.dataset.stock;
        const item = window.dashboardState.stocks.find(s => s.ticker === ticker);
        if (!item) return;

        window.dashboardState.sector = item.sector || item.sector_name;
        window.dashboardState.industry = item.industry || item.industry_name;
        window.dashboardState.ticker = ticker;
        window.dashboardState.referenceStock = item;

        document.querySelectorAll('.stock-item').forEach(el =>
            el.classList.toggle('highlight-ticker', el.dataset.stock === ticker)
        );

        renderHeader();
        if (typeof window.renderChart === 'function') {
            window.renderChart(ticker);
        }
        return;
    }

    const filterEl = e.target.closest("[data-sector]") || e.target.closest("[data-industry]");
    if (filterEl) {
        const type = filterEl.hasAttribute("data-sector") ? "sector" : "industry";
        const val = filterEl.getAttribute(`data-${type}`);
        const isBreadcrumb = filterEl.classList.contains('bc-link');

        if (type === "sector") {
            window.dashboardState.sector = isBreadcrumb ? val : 
                (window.dashboardState.sector === val ? null : val);
            window.dashboardState.industry = null;
        }

        if (type === "industry") {
            window.dashboardState.industry = isBreadcrumb ? val :
                (window.dashboardState.industry === val ? null : val);

            if (window.dashboardState.industry) {
                const allStocks = window.parent?.dataStore?.baseStocks || [];
                const sample = allStocks.find(s => 
                    (s.industry || s.industry_name) === val
                );
                if (sample) {
                    window.dashboardState.sector = sample.sector || sample.sector_name;
                }
            }
        }

        window.dashboardState.ticker = null;
        updateAndRenderDashboard();
    }
});

/*----------------------------------
9. INITIALISIERUNG
----------------------------------*/
function setupHeaderListeners() {
    const container = document.getElementById("dashboard-header-center");
    if (!container) return;

    if (!container.dataset.listenerAttached) {
        container.dataset.listenerAttached = "true";

        container.addEventListener("click", (ev) => {
            if (ev.target.dataset?.bc === "reset") {
                Object.assign(window.dashboardState, {
                    sector: null,
                    industry: null,
                    ticker: null,
                    strategy: "none"
                });

                document.querySelectorAll('.stock-item')
                    .forEach(el => el.classList.remove('highlight-ticker'));

                updateAndRenderDashboard();
            }
        });
    }
}

export function initDashboard() {
    console.log("initDashboard() START");

    if (!loadDashboardData()) {
        console.log("initDashboard() ABGEBROCHEN: loadDashboardData() → false");
        return;
    }

    console.log("initDashboard() → Daten geladen, render jetzt");
    setupHeaderListeners();
    updateAndRenderDashboard();
}

/*----------------------------------
10. MESSAGE HANDLER
----------------------------------*/
window.addEventListener("message", (e) => {
    const { type, stocks, signals, strategy, payload } = e.data || {};
    console.log(`📥 Message empfangen: ${type}`);

    const finalSignals = Array.isArray(signals)
        ? signals
        : (Array.isArray(payload?.signals) ? payload.signals : null);

    // UPDATE_STOCKS / UPDATE_DASHBOARD
    if (type === "UPDATE_STOCKS" || type === "UPDATE_DASHBOARD") {

        if (typeof strategy === "string") {
            window.dashboardState.strategy = strategy;
        }

        if (Array.isArray(stocks)) {
            window.dashboardState.stocks = stocks;
        }

        if (finalSignals !== null) {
            console.log("✅ Signale erfolgreich gesetzt:", finalSignals.length);
            window.dashboardState.signals = finalSignals;
        } else {
            console.log("⚠️ UPDATE_STOCKS erhalten, aber KEINE Signale gefunden.");
        }

        updateAndRenderDashboard();
        return;
    }

    // COCKPIT_DATA_READY
    if (type === "COCKPIT_DATA_READY") {
        if (window.dashboardState.strategy !== "none") return;
        initDashboard();
        return;
    }
});


/*----------------------------------
12. MESSAGE BUFFER FLUSH
----------------------------------*/
if (window._pendingMessages) {
    for (const msg of window._pendingMessages) {
        window.dispatchEvent(new MessageEvent("message", msg));
    }
    window._pendingMessages = null;
}

/*----------------------------------
13. POLLING (SAFE FALLBACK)
----------------------------------
let pollCounter = 0;
const dataPoller = setInterval(() => {

    // Cockpit hat Daten → Dashboard initialisieren
    if (window.parent?.dataStore?.baseStocks?.length) {
        if (window.dashboardState.stocks.length === 0) {
            initDashboard();
        }
        clearInterval(dataPoller);
        return;
    }

    // Nach 10 Sekunden abbrechen (20 Polls)
    pollCounter++;
    if (pollCounter > 20) {
        clearInterval(dataPoller);
    }

}, 500);
*/