/*
stocksList/
├── renderStocksList.js          # Haupt-Orchestrator (analog zu renderDashboard)
├── stocksFilterLogic.js         # Filter- und Sortier-Logik
├── sub-renderers/
│   ├── renderStockItem.js       # Rendert eine einzelne Tabellenzeile (li)
│   ├── renderStockTooltip.js    # Kapselt die komplexen Tooltips (Stage 3 / Inside Day)
│   ├── renderStockPills.js      # Rendert den Zähler und die Buy/Sell-Pillen
│   └── renderStockButtons.js    # Rendert die 4 Export-Buttons im Header
*/

import { filterAndSortStocks } from "./stocksFilterLogic.js";
import { renderStockPills } from "./sub-renderers/renderStockPills.js";
import { renderStockButtons } from "./sub-renderers/renderStockButtons.js";
import { renderStockItem } from "./sub-renderers/renderStockItem.js";

export function renderStocksList(stocks, state) {
    const listUl = document.getElementById('stocks-list');
    if (!listUl) return;

    // 1. 🛠️ FILTER & SORTIERUNG AUSLAGERN
    const processedStocks = filterAndSortStocks(stocks, state);

    if (!processedStocks || processedStocks.length === 0) {
        listUl.innerHTML = `
            <li class="stock-item empty">
                Keine Treffer für Strategy '${state?.strategy || "none"}'
            </li>
        `;
        return;
    }

    // 2. 🟢 PILLEN IM HEADER AKTUALISIEREN
    renderStockPills(processedStocks.length, state);

    // 3. 🟢 EXPORT-BUTTONS IM HEADER INITIALISIEREN (Einmalig)
    renderStockButtons();

    // 4. 📋 LISTEN-ELEMENTE RENDERN
    const html = processedStocks.map((item, idx) => {
        return renderStockItem(item, idx, state);
    }).join('');

    listUl.innerHTML = html;
}