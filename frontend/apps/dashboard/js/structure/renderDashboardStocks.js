// frontend/apps/dashboard/js/structure/renderDashboardStocks.js

import { renderStocksList } from "../lists/renderStocksList.js";

export function renderDashboardStocks(stocks, state) {
    const container = document.querySelector("#stocks-list-container");
    if (!container) return;

   
    renderStocksList(stocks, state);
}
