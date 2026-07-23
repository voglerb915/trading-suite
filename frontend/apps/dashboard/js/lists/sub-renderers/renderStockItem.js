import { sectorClasses } from "../../../../shared/logic/sectorColors.js";
import { renderRankCircle } from "../helpers/renderHelpers.js";
import { renderStockTooltip } from "./renderStockTooltip.js";

export function renderStockItem(mergedItem, idx, state) {
    const isSelected = mergedItem.ticker === state?.ticker;
    const sectorClass = sectorClasses[mergedItem.sector] ?? "";
    const position = idx + 1;

    const displaySector = mergedItem.sector ?? "—";
    const displayIndustry = mergedItem.industry ?? "—";
    const clickHandler = `onclick="handleStockClick('${mergedItem.ticker}', '${mergedItem.industry}', '${mergedItem.sector}')"`;

    // Global Rank
    const globalRank = mergedItem.globalRank ?? mergedItem.rsRank ?? mergedItem.rank ?? null;
    const bottomValue = globalRank != null ? `Global: ${globalRank}` : "Global: —";

    // Top Value ermitteln
    let rawTop = null;
    switch (state.strategy) {
        case "high52w":
        case "nearhigh52":
            rawTop = mergedItem.strategyValue ?? mergedItem.value ?? null;
            break;
        case "insideday52w":
            rawTop = mergedItem.strategyValue ?? mergedItem.tightness ?? mergedItem.value ?? null;
            break;
        case "stage3topping":
            rawTop = mergedItem.strategyValue ?? mergedItem.score ?? mergedItem.totalScore ?? null;
            break;
        case "none":
        default:
            rawTop = mergedItem.strategyValue ?? mergedItem.value ?? mergedItem.rsScore ?? mergedItem.score ?? null;
            break;
    }

    let topValue;
    if (rawTop != null) {
        const percentStrategies = ["high52w", "insideday52w", "nearhigh52"];
        const formatted = percentStrategies.includes(state.strategy)
            ? `${rawTop.toFixed(2)}%`
            : rawTop.toFixed(2);

        topValue = state.strategy && state.strategy !== "none"
            ? `<strong class="strategy-value-strong">${formatted}</strong>`
            : `<span class="score-value">${formatted}</span>`;
    } else {
        topValue = "—";
    }

    const tooltipHtml = renderStockTooltip(mergedItem, state.strategy);

    return `
        <li class="stock-item ${sectorClass} ${isSelected ? 'highlight-ticker' : ''}"
            data-stock="${mergedItem.ticker}"
            ${clickHandler}>

            <div class="stock-row-inner">
                <!-- LINKS -->
                <div class="stock-left">
                    ${isSelected ? '▶ ' : ''}
                    ${renderRankCircle(position, window.dataStore?.sparkSignals?.stocks?.[mergedItem.ticker])}
                    <span class="stock-ticker">${mergedItem.ticker}</span><br>
                    <span class="stock-sub">${displaySector} | ${displayIndustry}</span>
                </div>

                <!-- RECHTS -->
                <div class="stock-right">
                    <div style="display: grid; grid-template-columns: auto 1fr; align-items: center; font-weight: bold; color: #444; font-size: 1rem; white-space: nowrap; text-align: right;">
                        ${tooltipHtml}
                        <span>${topValue}</span>
                    </div>
                    <div>${bottomValue}</div>
                </div>
            </div>
        </li>
    `;
}