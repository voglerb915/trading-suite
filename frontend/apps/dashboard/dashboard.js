// ⭐ GLOBALER STATE INITIAL
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


// ⭐ Imports
import { renderDashboard } from "./js/structure/renderDashboard.js";
import "./js/helpers/renderHelpers.js";

import { renderDashboardHeaderLeft } from "./js/header/renderDashboardHeaderLeft.js";
import { renderDashboardHeaderCenter } from "./js/header/renderDashboardHeaderCenter.js";
import { renderDashboardHeaderRight } from "./js/header/renderDashboardHeaderRight.js";


// ⭐ Daten laden
async function loadDashboardData() {
    try {
        window.dashboardState.sectors    = await fetch("/api/sectors/won-db").then(r => r.json());
        window.dashboardState.industries = await fetch("/api/industries/won-db").then(r => r.json());

        // Strategy wird hier korrekt an die API gesendet
        window.dashboardState.stocks = await fetch(`/api/stocks/won-db?strategy=${window.dashboardState.strategy}`)
            .then(r => r.json());

        window.dashboardState.etfs       = await fetch("/api/etfs/won-db").then(r => r.json());
    } catch (err) {
        console.error("Fehler beim Laden der Dashboard-Daten:", err);
    }
}


// ⭐ Header rendern
function renderHeader(state) {
    renderDashboardHeaderLeft(state);
    renderDashboardHeaderCenter(state);
    renderDashboardHeaderRight(state);
}


// ⭐ Klick-Logik für Stocks
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

    renderHeader(window.dashboardState);
    renderDashboard(window.dashboardState);
}


// ⭐ Event-Delegation für Stock-Clicks
document.addEventListener("click", (e) => {
    const row = e.target.closest("[data-stock]");
    if (!row) return;

    const ticker = row.getAttribute("data-stock");
    if (!ticker) return;

    handleStockClick(ticker);
});


// ⭐ Strategy-Wechsel (GLOBAL, KORREKT)
document.addEventListener("dashboard:strategyChange", (e) => {
    console.log("Dashboard received strategy:", e.detail);

    window.dashboardState.strategy = e.detail;

    loadDashboardData().then(() => {
        renderHeader(window.dashboardState);
        renderDashboard(window.dashboardState);
    });
});


// ⭐ Dashboard initialisieren
export async function initDashboard() {
    await loadDashboardData();
    renderHeader(window.dashboardState);
    renderDashboard(window.dashboardState);
}

document.addEventListener("DOMContentLoaded", initDashboard);
