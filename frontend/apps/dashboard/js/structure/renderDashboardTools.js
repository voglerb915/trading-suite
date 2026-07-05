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
            // 1. Alle Tabs visuell deaktivieren
            tabHeaders.forEach(t => t.classList.remove("active"));
            this.classList.add("active");

            // 2. Ziel-Tab ermitteln
            const targetTab = this.getAttribute("data-tab");
            
            // 3. Zentrale Render-Funktion aufrufen
            console.log(`📊 Tab '${targetTab}' aktiv. Lade Daten...`);
            renderActiveTab(targetTab, state, tabContent);
        };
    });

    // 🟢 DOPPELBODEN: Beim initialen Laden (wenn schon eine Klasse 'active' im HTML ist)
    const activeTab = document.querySelector(".tab-header .tab-item.active");
    if (activeTab) {
        renderActiveTab(activeTab.getAttribute("data-tab"), state, tabContent);
    }
}

// ... import Statements ...

function renderActiveTab(tabName, state, content) {

    // Content leeren
    content.innerHTML = "";

    switch (tabName) {

case "signals": {
    // Hole die Daten direkt aus dem state, der an die Funktion übergeben wird
    // Das ist die gleiche Quelle, die auch die Hauptspalte 'stocks' nutzt
    const stocks = state.stocks || window.dataStore?.stocks || [];
    renderSignalsList(stocks, state, content);
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



