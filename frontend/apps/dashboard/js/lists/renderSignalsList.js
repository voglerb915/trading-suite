import { sectorClasses } from "../../../../shared/logic/sectorColors.js";
import { renderRankCircle } from "../helpers/renderHelpers.js";
import { passesMultiSignalFilter } from "../helpers/filterHelpersSignals.js";

export function renderSignalsList(stocks, state, container) {
    // HARDCODED DEBUG
    const testTicker = "EDIT";
    const found = window.dataStore?.signals?.find(s => s.ticker === testTicker);
    console.log("DEBUG: Suche nach EDIT in store:", found);
    console.log("DEBUG: Suche in stocks vorhanden?", stocks.some(s => s.ticker === testTicker));
    // ---
    
    if (!container) return;
    // ...

    // 1. Filter anwenden
    const filtered = (stocks || []).filter(s => passesMultiSignalFilter(s.ticker, state));

    // 2. Pillen im Tools-Bereich aktualisieren (Zentraler Block)
    const pillContainer = document.getElementById("tools-pill-container");
    if (pillContainer) {
        pillContainer.innerHTML = `
            <span class="pill pill-count">${filtered.length}</span>
            
            <!-- Kurzfristig (Spark) -->
            <span class="pill ${state.filterEntryStocks ? 'active' : ''}" 
                  data-type="filterEntryStocks">Entry</span>
            <span class="pill ${state.filterExitStocks ? 'active' : ''}" 
                  data-type="filterExitStocks">Exit</span>
            
            <!-- Mittelfristig (Mid-Term) -->
            <span class="pill ${state.filterMidLong ? 'active' : ''}" 
                  data-type="filterMidLong">Long</span>
            <span class="pill ${state.filterMidExit ? 'active' : ''}" 
                  data-type="filterMidExit">Mid-Exit</span>
        `;
    }

    // 3. Liste rendern
    if (filtered.length === 0) {
        container.innerHTML = `<ul><li class="stock-item empty">Keine Treffer für Signale</li></ul>`;
        return;
    }

    const html = filtered.map((item, idx) => {
        // ... (dein restlicher Code ab hier bleibt gleich)
        const isSelected = item.ticker === state?.ticker;
        const sectorClass = sectorClasses[item.sector] ?? "";
        const position = idx + 1;
        const displaySector = item.sector ?? "—";
        const displayIndustry = item.industry ?? "—";
        const clickHandler = `onclick="handleStockClick('${item.ticker}', '${item.industry}', '${item.sector}')"`;

        const globalRank = item.globalRank ?? item.rsRank ?? item.rank ?? null;
        const bottomValue = globalRank != null ? `Global: ${globalRank}` : "Global: —";

        const rawTop = item.strategyValue ?? item.value ?? item.rsScore ?? item.score ?? null;
        let topValue;
        
        if (rawTop != null) {
            const formatted = (item.strategyValue != null || item.value != null)
                ? `${rawTop.toFixed(2)}%`
                : rawTop.toFixed(2);

            topValue = state.strategy && state.strategy !== "none"
                ? `<strong class="strategy-value-strong">${formatted}</strong>`
                : `<span class="score-value">${formatted}</span>`;
        } else {
            topValue = "—";
        }

        return `
            <li class="stock-item ${sectorClass} ${isSelected ? 'highlight-ticker' : ''}"
                data-stock="${item.ticker}" ${clickHandler}>
                <div class="stock-row-inner">
                    <div class="stock-left">
                        ${isSelected ? '▶ ' : ''}
                        ${renderRankCircle(position, window.dataStore?.sparkSignals?.stocks?.[item.ticker])}
                        <span class="stock-ticker">${item.ticker}</span><br>
                        <span class="stock-sub">${displaySector} | ${displayIndustry}</span>
                    </div>
                    <div class="stock-right">
                        ${topValue}<br>
                        ${bottomValue}
                    </div>
                </div>
            </li>
        `;
    }).join('');

    container.innerHTML = `<ul>${html}</ul>`;
}