// frontend/apps/dashboard/js/structure/renderDashboardTools.js

import { renderSignalsList } from "../lists/renderSignalsList.js";
import { renderWatchlist } from "../lists/renderWatchlist.js";
import { renderOpenOrders } from "../lists/renderOpenOrders.js";
import { renderActiveOrders } from "../lists/renderActiveOrders.js";
import { renderEtfsList } from "../lists/renderEtfsList.js";

export function renderDashboardTools(state) {
    const content = document.getElementById("tools-tab-content");
    const tabs = document.querySelectorAll(".tab-item");

    if (!content || !tabs.length) return;

    // Default: Signals
    let activeTab = "signals";

    tabs.forEach(tab => {
        tab.onclick = () => {
            tabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");

            activeTab = tab.dataset.tab;
            renderActiveTab(activeTab, state, content);
        };
    });

    renderActiveTab(activeTab, state, content);
}

function renderActiveTab(tabName, state, content) {
    switch (tabName) {
        case "signals":
            renderSignalsList(state, content);
            break;

        case "watchlist":
            renderWatchlist(state, content);
            break;

        case "open-orders":
            renderOpenOrders(state, content);
            break;

        case "active-orders":
            renderActiveOrders(state, content);
            break;

        case "etfs":
            renderEtfsList(state.etfs, content);
            break;

        default:
            content.innerHTML = "<p>Unbekannter Tab.</p>";
    }
}
