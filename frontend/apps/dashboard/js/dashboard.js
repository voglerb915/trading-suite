// apps/dashboard/js/dashboard.js

import { renderDashboard } from "./structure/renderDashboard.js";

// ⭐ Header-Renderer importieren
import { renderDashboardHeaderLeft } from "./header/renderDashboardHeaderLeft.js";
import { renderDashboardHeaderCenter } from "./header/renderDashboardHeaderCenter.js";
import { renderDashboardHeaderRight } from "./header/renderDashboardHeaderRight.js";

const dashboardState = {
    sectors: [],
    industries: [],
    stocks: [],
    selectedSector: null,
    selectedIndustry: null,
    selectedStock: null,
    breadcrumbs: "Alle Sektoren"
};

// ⭐ Daten laden
async function loadDashboardData() {
    try {
        dashboardState.sectors = await fetch("/api/sectors/won-db").then(r => r.json());
        dashboardState.industries = await fetch("/api/industries/won-db").then(r => r.json());
        dashboardState.stocks = await fetch("/api/stocks/won-db").then(r => r.json());
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

// ⭐ Dashboard initialisieren
export async function initDashboard() {
    await loadDashboardData();
    renderHeader(dashboardState);      // <-- Header zuerst
    renderDashboard(dashboardState);   // <-- dann die 4 Spalten
}

document.addEventListener("DOMContentLoaded", initDashboard);
