// frontend/apps/dashboard/js/structure/renderDashboardTools.js

import { renderSignalsList } from "../lists/renderSignalsList.js";
import { renderWatchlist } from "../lists/renderWatchlist.js";
import { renderOpenOrders } from "../lists/renderOpenOrders.js";
import { renderActiveOrders } from "../lists/renderActiveOrders.js";
import { renderEtfsList } from "../lists/renderEtfsList.js";

export function renderDashboardTools(state) {
    const tabHeaders = document.querySelectorAll(".tab-header .tab-item");
    const tabContent = document.getElementById("tools-tab-content");

    if (!tabHeaders || !tabContent) return;

    tabHeaders.forEach(tab => {
        tab.onclick = function() {
            tabHeaders.forEach(t => t.classList.remove("active"));
            this.classList.add("active");
            const targetTab = this.getAttribute("data-tab");
            renderActiveTab(targetTab, state, tabContent);
        };
    });

    // 🟢 HIER: Warte auf das Event aus der cockpit.js, statt sofort zu rendern
    window.addEventListener("dataStoreReady", () => {
        console.log("🚀 Daten bereit, initialisiere Rendering...");
        const activeTab = document.querySelector(".tab-header .tab-item.active");
        if (activeTab) {
            renderActiveTab(activeTab.getAttribute("data-tab"), state, tabContent);
        }
    });
}

export function renderActiveTab(tabName, state, content) {

    // Content leeren
    content.innerHTML = "";

    switch (tabName) {

case "signals": {
    const allStocks = state.stocks || window.dataStore?.baseStocks || [];
    
    // DEBUG: Was ist im Store?
    console.log("DEBUG: renderDashboardTools - Store Inhalt:", window.dataStore.midSignals);
    
    const midSignalsMap = window.dataStore?.midSignals?.stocks || {};
    
    const stocksWithSignals = allStocks.filter(stock => {
        // Wir prüfen hier direkt, ob es den Ticker gibt
        return midSignalsMap.hasOwnProperty(stock.ticker);
    });

    console.log(`📊 Signals-Tab: ${stocksWithSignals.length} Stocks gefunden.`);
    
    renderSignalsList(stocksWithSignals, state, content);
    break;
}

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
            renderEtfsList(state.etfs || [], content);
            break;

        default:
            content.innerHTML = "<p>Unbekannter Tab.</p>";
    }
}



