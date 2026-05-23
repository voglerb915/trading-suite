import { renderDashboardHeaderCenter } from "../header/renderDashboardHeaderCenter.js";
import { renderDashboardSectors } from "./renderDashboardSectors.js";
import { renderDashboardIndustries } from "./renderDashboardIndustries.js";
import { renderDashboardStocks } from "./renderDashboardStocks.js";
import { renderDashboardTools } from "./renderDashboardTools.js";

export function renderDashboard(state) {

    // ⭐ GLOBALEN STATE AKTUALISIEREN
    window.dashboardState = state;

    // ⭐ HEADER AKTUALISIEREN
    renderDashboardHeaderCenter(state);

    // =====================================================
    // 1) SECTORS
    // =====================================================
    renderDashboardSectors(state.sectors, state);

    // =====================================================
    // 2) INDUSTRIES
    // =====================================================
    const industriesFiltered = state.sector
        ? state.industries.filter(ind => ind.sector === state.sector)
        : state.industries;

    renderDashboardIndustries(industriesFiltered, state);

    // =====================================================
    // 3) STOCKS
    // =====================================================
    let stocksFiltered = state.stocks;

    if (state.sector) {
        stocksFiltered = stocksFiltered.filter(s => s.sector === state.sector);
    }

    if (state.industry) {
        stocksFiltered = stocksFiltered.filter(s => s.industry === state.industry);
    }

    renderDashboardStocks(stocksFiltered, state);

    // =====================================================
    // 4) TOOLS
    // =====================================================
    renderDashboardTools(state);
}
