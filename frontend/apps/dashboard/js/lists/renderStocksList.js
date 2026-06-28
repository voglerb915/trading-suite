import { sectorClasses } from "../../../../shared/logic/sectorColors.js";
import { getSectorClass, getDiffColor, formatDiff, renderRankCircle } 
    from "../helpers/renderHelpers.js";

import { passesSignalFilter } 
    from "../helpers/filterHelpers.js";



export function renderStockSignalDot(ticker) {
    const store = window.dataStore || {};
    const signals = store.sparkSignals?.stocks || {};
    const sig = signals[ticker];

    if (!sig) return "";
    if (sig.signal === "entry") return `<span class="sig-dot entry"></span>`;
    if (sig.signal === "exit")  return `<span class="sig-dot exit"></span>`;
    return "";
}

window.renderStockSignalDot = renderStockSignalDot;


export function renderStocksList(stocks, state) {
    const listUl = document.getElementById('stocks-list');
    if (!listUl) return;

    if (!stocks || stocks.length === 0) {
        listUl.innerHTML = `
            <li class="stock-item empty">
                Keine Treffer für Strategy '${state?.strategy || "none"}'
            </li>
        `;
        return;
    }

// 1. Sector
if (state.sector && state.sector !== "all") {
    stocks = stocks.filter(s => s.sector === state.sector);
}

// 2. Industry
if (state.industry && state.industry !== "all") {
    stocks = stocks.filter(s => s.industry === state.industry);
}

// 3. Index
if (state.indexFilter && state.indexFilter !== "all") {
    stocks = stocks.filter(s =>
        Array.isArray(s.index) &&
        s.index.includes(state.indexFilter)
    );
}

// 4. Search
if (state.search && state.search.length > 0) {
    const q = state.search.toUpperCase().split(" ");

    stocks = stocks.filter(s => {
        const ticker = s.ticker?.toUpperCase() || "";
        const company = s.company?.toUpperCase() || "";

        return q.every(part =>
            ticker.includes(part) ||
            company.includes(part)
        );
    });
}

// ⭐ 5. Signal-Filter (Entry / Exit)
stocks = stocks.filter(s =>
    passesSignalFilter(
        window.dataStore?.sparkSignals?.stocks?.[s.ticker],
        state.filterEntryStocks,
        state.filterExitStocks
    )
);


    // 🟢 Stocks-Pille aktualisieren (nach allen Filtern!)
    const pillContainer = document.getElementById("stocks-pill-container");
    if (pillContainer) {
       pillContainer.innerHTML = `
    <span class="pill pill-count">${stocks.length}</span>

    <span class="pill pill-entry ${state.filterEntryStocks ? 'active' : ''}"
          data-type="entry-stocks">Entry</span>

    <span class="pill pill-exit ${state.filterExitStocks ? 'active' : ''}"
          data-type="exit-stocks">Exit</span>
`;

    }

    const visible = stocks;

    const html = visible.map((item, idx) => {
        const isSelected = item.ticker === state?.ticker;
        const sectorClass = sectorClasses[item.sector] ?? "";

        const position = idx + 1;

        const displaySector = item.sector ?? "—";
        const displayIndustry = item.industry ?? "—";

        const clickHandler = `onclick="handleStockClick('${item.ticker}', '${item.industry}', '${item.sector}')"`;


        // 🔹 Global Rank (immer unten)
        const globalRank =
            item.globalRank ??
            item.rsRank ??
            item.rank ??
            null;

        const bottomValue = globalRank != null
            ? `Global: ${globalRank}`
            : "Global: —";

        // 🔥 OBERER WERT – StrategyValue hat Vorrang + FETT bei Strategy
        const rawTop =
            item.strategyValue ??
            item.value ??
            item.rsScore ??
            item.score ??
            null;

        let topValue;
        if (rawTop != null) {
            const formatted = (item.strategyValue != null || item.value != null)
                ? `${rawTop.toFixed(2)}%`
                : rawTop.toFixed(2);

            topValue = state.strategy && state.strategy !== "none"
                ? `<strong class="strategy-value-strong">${formatted}</strong>`
                : formatted;
        } else {
            topValue = "—";
        }

        return `
            <li class="stock-item ${sectorClass} ${isSelected ? 'highlight-ticker' : ''}"
                data-stock="${item.ticker}"
                ${clickHandler}>

                <div class="stock-row-inner">

                    <!-- LINKS -->
                <div class="stock-left">
                    ${isSelected ? '▶ ' : ''}

                    ${renderRankCircle(
                        item.rsRank,
                        window.dataStore?.sparkSignals?.stocks?.[item.ticker]
                    )}

                    ${item.ticker}<br>

                    <span class="stock-sub">
                        ${displaySector} | ${displayIndustry}
                    </span>
                </div>


                    <!-- RECHTS -->
                    <div class="stock-right">
                        ${topValue}<br>
                        ${bottomValue}
                    </div>

                </div>
            </li>
        `;
    }).join('');

    listUl.innerHTML = html;
}
