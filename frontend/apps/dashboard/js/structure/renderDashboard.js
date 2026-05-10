// frontend/apps/dashboard/js/structure/renderDashboard.js

import { renderDashboardSectors } from "./renderDashboardSectors.js";
import { renderDashboardIndustries } from "./renderDashboardIndustries.js";
import { renderDashboardStocks } from "./renderDashboardStocks.js";
import { renderDashboardTools } from "./renderDashboardTools.js";

export function renderDashboard(state) {
    // WICHTIG:
    // Wir erzeugen KEIN neues Layout.
    // Wir nutzen die vorhandene HTML-Struktur aus index.html.

    // Spalte 1: Sectors
    renderDashboardSectors(state.sectors, state);

    // Spalte 2: Industries
    renderDashboardIndustries(state.industries, state);

    // Spalte 3: Stocks
    renderDashboardStocks(state.stocks, state);

    // Spalte 4: Tools & Lists
    renderDashboardTools(state);
}
