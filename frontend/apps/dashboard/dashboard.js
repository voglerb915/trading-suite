/*----------------------------------
1. IMPORTS
----------------------------------*/
import { renderDashboard } from "./js/structure/renderDashboard.js";
import { renderDashboardHeaderLeft } from "./js/header/renderDashboardHeaderLeft.js";
import { renderDashboardHeaderCenter } from "./js/header/renderDashboardHeaderCenter.js";
import { renderDashboardHeaderRight } from "./js/header/renderDashboardHeaderRight.js";


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
    sector: null,
    industry: null,
    ticker: null,
    referenceStock: null,
    breadcrumbs: "Alle Sektoren",
    strategy: "none"   // 🔥 WICHTIG: Strategy bleibt persistent
};


/*----------------------------------
4. LOAD DATA (KORREKT, FIXED)
----------------------------------*/
function loadDashboardData() {
    try {
        const cockpitData = window.parent.dataStore;
        const cockpitState = window.parent.cockpitState || {};

        if (!cockpitData) return false;

        let stocks;

        // 🔥 Strategy aktiv → IMMER Cockpit-Stocks
        if (window.dashboardState.strategy !== "none") {
            stocks = cockpitState.stocks || [];
        } 
        // 🔥 Normalmodus → BaseStocks
        else {
            stocks = cockpitData.baseStocks || [];
        }

        // 🔥 Strategy NICHT überschreiben!
        window.dashboardState = {
            ...window.dashboardState,
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
    const result = window.dashboardState.stocks;

    window.dashboardState.stocks = result;

    renderHeader();
    renderDashboard(window.dashboardState);
}


/*----------------------------------
7. STRATEGY CHANGE (FIXED)
----------------------------------*/
document.addEventListener("dashboard:strategyChange", async (e) => {
    window.dashboardState.strategy = e.detail;

    if (window.parent.applyStrategy) {
        await window.parent.applyStrategy(e.detail);
    }

    const freshStocks = window.parent.cockpitState?.stocks || [];
    window.dashboardState.stocks = freshStocks;

    updateAndRenderDashboard();
});


/*----------------------------------
8. CLICK EVENTS
----------------------------------*/
document.addEventListener("click", (e) => {
    const stockRow = e.target.closest("[data-stock]");
    if (stockRow) {
        const ticker = stockRow.getAttribute("data-stock");
        const item = window.dashboardState.stocks.find(s => s.ticker === ticker);

        if (item) {
            window.dashboardState.sector = item.sector || item.sector_name;
            window.dashboardState.industry = item.industry || item.industry_name;
            window.dashboardState.ticker = item.ticker;
            window.dashboardState.referenceStock = item;

            document.querySelectorAll('.stock-item').forEach(el =>
                el.classList.toggle('highlight-ticker', el.dataset.stock === ticker)
            );

            renderHeader();
            if (typeof window.renderChart === 'function') window.renderChart(ticker);
        }
        return;
    }

    const filterEl = e.target.closest("[data-sector]") || e.target.closest("[data-industry]");
    if (filterEl) {
        const type = filterEl.hasAttribute("data-sector") ? "sector" : "industry";
        const val = filterEl.getAttribute(`data-${type}`);
        const isBreadcrumb = filterEl.classList.contains('bc-link');

        if (type === "sector") {
            window.dashboardState.sector = isBreadcrumb ? val : ((window.dashboardState.sector === val) ? null : val);
            window.dashboardState.industry = null;
        }

        if (type === "industry") {
            window.dashboardState.industry = isBreadcrumb ? val : ((window.dashboardState.industry === val) ? null : val);

            if (window.dashboardState.industry) {
                const allStocks = window.parent?.dataStore?.baseStocks || [];
                const sample = allStocks.find(s => (s.industry || s.industry_name) === val);
                if (sample) window.dashboardState.sector = sample.sector || sample.sector_name;
            }
        }

        window.dashboardState.ticker = null;
        updateAndRenderDashboard();
    }
});


/*----------------------------------
9. INITIALISIERUNG (FIXED)
----------------------------------*/
function setupHeaderListeners() {
    const container = document.getElementById("dashboard-header-center");
    container?.addEventListener("click", (ev) => {
        if (ev.target.dataset?.bc === "reset") {
            Object.assign(window.dashboardState, {
                sector: null,
                industry: null,
                ticker: null,
                strategy: "none"
            });
            updateAndRenderDashboard();
            document.querySelectorAll('.stock-item').forEach(el => el.classList.remove('highlight-ticker'));
        }
    });
}

export function initDashboard() {
    if (!loadDashboardData()) return;
    renderHeader();
    renderDashboard(window.dashboardState);
    setupHeaderListeners();
}


/*----------------------------------
10. MESSAGE HANDLER (FIXED)
----------------------------------*/
window.addEventListener("message", (e) => {
    console.log("📥 RAW MESSAGE IM DASHBOARD:", e.data);

    if (e.data?.type === "UPDATE_STOCKS") {
        console.log("📥 UPDATE_STOCKS EMPFANGEN");
        window.dashboardState.stocks = e.data.stocks;
        renderDashboard(window.dashboardState);
    }
});


/*----------------------------------
11. COCKPIT_DATA_READY (FIXED)
----------------------------------*/
window.addEventListener("message", (e) => {
    if (e.data?.type === "COCKPIT_DATA_READY" && window.dashboardState.strategy === "none") {
        initDashboard();
    }
});


/*----------------------------------
12. POLLING (FIXED)
----------------------------------*/
const dataPoller = setInterval(() => {
    if (window.parent?.dataStore?.baseStocks?.length && window.dashboardState.stocks.length === 0) {
        initDashboard();
        clearInterval(dataPoller);
    }
}, 500);
