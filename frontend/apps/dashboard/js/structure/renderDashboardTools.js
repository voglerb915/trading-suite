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
        tab.onclick = function(e) {
            e.stopPropagation(); // verhindert Stocks-Renderer

            tabHeaders.forEach(t => t.classList.remove("active"));
            this.classList.add("active");

            const targetTab = this.getAttribute("data-tab");
            renderActiveTab(targetTab, state, tabContent);
        };
    });

    window.addEventListener("dataStoreReady", () => {
        const activeTab = document.querySelector(".tab-header .tab-item.active");
        if (activeTab) {
            renderActiveTab(activeTab.getAttribute("data-tab"), state, tabContent);
        }
    });
}

export function renderActiveTab(tabName, state, content) {

    content.innerHTML = "";

    const pillContainer = document.getElementById("tools-pill-container");
    if (pillContainer) pillContainer.innerHTML = "";

    switch (tabName) {

        case "signals": {

            if (pillContainer) {
                pillContainer.innerHTML = `
                    <span class="pill pill-count">0</span>

                    <span class="pill ${state.filterEntryStocks ? 'active' : ''}" data-type="filterEntryStocks">Spark LONG</span>
                    <span class="pill ${state.filterExitStocks ? 'active' : ''}" data-type="filterExitStocks">Spark EXIT</span>

                    <span class="pill ${state.filterMidLong ? 'active' : ''}" data-type="filterMidLong">Midterm LONG</span>
                    <span class="pill ${state.filterMidExit ? 'active' : ''}" data-type="filterMidExit">Midterm EXIT</span>
                `;

                pillContainer.querySelectorAll(".pill").forEach(btn => {
                    btn.addEventListener("click", (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.stopImmediatePropagation();   // WICHTIG: verhindert Router + Cockpit

                        const type = btn.dataset.type;

                        state.filterEntryStocks = type === "filterEntryStocks";
                        state.filterExitStocks  = type === "filterExitStocks";
                        state.filterMidLong     = type === "filterMidLong";
                        state.filterMidExit     = type === "filterMidExit";

                        renderActiveTab("signals", state, content);
                    });

                });
            }

            // ⭐⭐⭐ DUAL-MODE FIX (NEUES SYSTEM + ALTES SYSTEM)
            const allStocks =
                state.stocks ||
                window.dataStore?.baseStocks ||
                [];

            const midSignalsMap =
                state.midSignals?.stocks ||
                window.dataStore?.midSignals?.stocks ||
                {};

            // ⭐ Filter Stocks mit Midterm-Signalen
            const stocksWithSignals = allStocks.filter(stock =>
                midSignalsMap.hasOwnProperty(stock.ticker)
            );

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
