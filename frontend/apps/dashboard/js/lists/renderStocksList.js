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
    const isFiltered =
        isStrategyMode ||
        state?.sector ||
        state?.industry ||
        state?.index ||
        state?.search;

    const html = visible.map((item, idx) => {
        const isSelected = item.ticker === state?.ticker;
        const sectorClass = sectorClasses[item.sector] ?? "";

        // Position links (immer)
        const position = idx + 1;

        // GlobalRank nur anzeigen, wenn Filter aktiv
        const globalRank = item.globalRank ?? item.rsRank ?? null;
        const showGlobalRank = isFiltered && globalRank != null;

        // Score rechts
        const scoreValue = isStrategyMode
            ? (item.strategyValue != null ? `${item.strategyValue}%` : "—")
            : (typeof item.rsScore === "number" ? item.rsScore.toFixed(2) : "—");

        // Score-Label abhängig vom Modus
        const scoreLabel = isStrategyMode ? "Strategy" : "Score";

        const displaySector = item.sector ?? "—";
        const displayIndustry = item.industry ?? "—";

        const clickHandler = isStrategyMode
            ? ""
            : `onclick="handleStockClick('${item.ticker}', '${item.industry}', '${item.sector}')"`;

        return `
            <li class="stock-item ${sectorClass} ${isSelected ? 'highlight-ticker' : ''}"
                ${clickHandler}>

                <div class="stock-row-inner">

                    <!-- LINKS -->
                    <div class="stock-left">
                        <strong>${position}. ${item.ticker}</strong><br>
                        <span class="stock-sub">
                            ${displaySector} | ${displayIndustry}
                        </span>
                    </div>

                    <!-- RECHTS -->
                    <div class="stock-right">
                        ${showGlobalRank ? `Global: ${globalRank}<br>` : ""}
                        ${scoreLabel}: ${scoreValue}
                    </div>

                </div>
            </li>
        `;
    }).join('');

    listUl.innerHTML = html;
}
