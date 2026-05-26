// WICHTIG: renderDashboard importieren
import { renderDashboard } from "../structure/renderDashboard.js";

export function renderDashboardHeaderCenter(state) {
    const container = document.getElementById("dashboard-header-center");
    if (!container) return;

    const parts = [];

    parts.push(`<span class="bc-link" data-bc="reset">All Sectors</span>`);

    if (state.sector) {
        parts.push(`<span class="bc-sep">›</span>`);
        parts.push(`<span class="bc-link" data-bc="sector">${state.sector}</span>`);
    }

    if (state.industry) {
        parts.push(`<span class="bc-sep">›</span>`);
        parts.push(`<span class="bc-link" data-bc="industry">${state.industry}</span>`);
    }

    if (state.ticker) {
        parts.push(`<span class="bc-sep">›</span>`);
        parts.push(`<span class="bc-item">${state.ticker}</span>`);
    }

    container.innerHTML = `
        <div class="breadcrumbs-block">
            <div class="page-title-small">RS Dashboard</div>

            <div id="breadcrumbs" class="breadcrumbs">
                ${parts.join("")}
            </div>

            <button id="reset-btn" class="reset-btn" data-bc="reset">Reset</button>
        </div>
    `;

    // ⭐ Event-Delegation
    container.addEventListener("click", async (ev) => {
        const action = ev.target.dataset?.bc;
        if (!action) return;

        if (action === "reset") {

            // 1) DashboardState zurücksetzen
            window.dashboardState = {
                ...window.dashboardState,
                sector: null,
                industry: null,
                ticker: null,
                strategy: "none",
                index: "all",
                search: ""
            };

            // 2) Cockpit informieren
            await window.applyStrategy("none");
            await window.applyIndex?.("all");
            await window.applySearch?.("");

            // 3) DashboardState aus Cockpit aktualisieren
            if (window.syncDashboardStateFromCockpit) {
                window.syncDashboardStateFromCockpit();
            }

            // 4) UI neu rendern
            renderDashboard(window.dashboardState);
            return;
        }

        if (action === "sector") {
            window.dashboardState = {
                ...window.dashboardState,
                industry: null,
                ticker: null
            };
        }

        if (action === "industry") {
            window.dashboardState = {
                ...window.dashboardState,
                ticker: null
            };
        }

        renderDashboard(window.dashboardState);
    });
}
