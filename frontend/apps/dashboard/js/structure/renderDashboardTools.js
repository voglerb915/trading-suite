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

    // Wir entfernen alte Listener (Cleanup), falls die Spalte neu rendert
    tabHeaders.forEach(tab => {
        // Neuen Klick-Listener registrieren
        tab.onclick = function() {
            // 1. Alle Tabs visuell deaktivieren
            tabHeaders.forEach(t => t.classList.remove("active"));
            
            // 2. Geklickten Tab aktivieren
            this.classList.add("active");

            // 3. Welcher Tab wurde geklickt?
            const targetTab = this.getAttribute("data-tab");

            // 4. Inhalts-Wechsel loggen & steuern
            if (targetTab === "etfs") {
                console.log("📊 Tab ETFs aktiv. Hole Daten aus dem Dashboard-State...");
                
                // 🟢 Hier rufen wir deine renderEtfsList auf und füttern sie mit den RAM-Daten
                renderEtfsList(state.etfs || [], tabContent);
            } else {
                // Platzhalter für deine anderen Tabs (Signals, Watch, Open, Active)
                tabContent.innerHTML = `<p>Inhalt für '${targetTab}' wird geladen...</p>`;
            }
        };
    });

    // 🟢 DOPPELBODEN: Falls beim kompletten Dashboard-Neu-Render der ETF-Tab 
    // bereits als 'active' markiert ist, rendern wir die Daten direkt rein!
    const activeTab = document.querySelector(".tab-header .tab-item.active");
    if (activeTab && activeTab.getAttribute("data-tab") === "etfs") {
        renderEtfsList(state.etfs || [], tabContent);
    }
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
            renderEtfsList(window.dataStore.etfs, content);
            break;

        default:
            content.innerHTML = "<p>Unbekannter Tab.</p>";
    }
}
