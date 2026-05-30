import { sectorClasses } from "../../../../shared/logic/sectorColors.js";

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
    // 🟦 Index-Filter aktivieren
    if (state.indexFilter && state.indexFilter !== "all") {
    stocks = stocks.filter(s =>
        Array.isArray(s.index) &&
        s.index.includes(state.indexFilter)
    );
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
                        <strong>${position}. ${item.ticker}</strong><br>
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
