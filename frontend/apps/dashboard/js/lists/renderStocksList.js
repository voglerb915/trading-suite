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

    const limit = state?.displayLimit || 300;
    const visible = stocks.slice(0, limit);

    const isStrategyMode = state?.strategy && state.strategy !== "none";

    const html = visible.map((item, idx) => {
        const isSelected = item.ticker === state?.ticker;
        const sectorClass = sectorClasses[item.sector] ?? "";

        const displayValue = isStrategyMode
            ? `<strong>${item.strategyValue ?? "—"}</strong>`
            : (typeof item.rsScore === "number" ? item.rsScore.toFixed(2) : "—");

        // 🟢 Hier greift der Standard-Modus jetzt sauber auf rsRank zu
        const displayRank = isStrategyMode
            ? (item.strategyRank ?? "—")
            : (item.rsRank ?? "—");

        const displaySector = isStrategyMode ? "—" : (item.sector ?? "—");
        const displayIndustry = isStrategyMode ? "—" : (item.industry ?? "—");

        const clickHandler = isStrategyMode
            ? ""
            : `onclick="handleStockClick('${item.ticker}', '${item.industry}', '${item.sector}')"`;

        return `
            <li class="stock-item ${sectorClass} ${isSelected ? 'highlight-ticker' : ''}"
                ${clickHandler}>

                <div class="stock-row-inner">

                    <div class="stock-left">
                        ${isSelected ? '▶ ' : ''}<strong>${idx + 1}. ${item.ticker}</strong><br>
                        <span class="stock-sub">
                            ${displaySector} | ${displayIndustry}
                        </span>
                    </div>

                    <div class="stock-right">
                        Score: ${displayValue}<br>
                        Rank: ${displayRank}
                    </div>

                </div>
            </li>
        `;
    }).join('');

    listUl.innerHTML = html;
}