import { sectorClasses } from "../../../../shared/logic/sectorColors.js";

export function renderStocksList(stocks, state) {
    const listUl = document.getElementById('stocks-list');
    if (!listUl) return;

    const limit = state?.displayLimit || 300;
    const visible = stocks.slice(0, limit);

    const html = visible.map((item, idx) => {
        const isSelected = item.ticker === state?.ticker;

        const sectorClass = sectorClasses[item.sector] ?? "";

        // 🔥 Robuste Fallback-Logik:
        // Wenn keine Strategy aktiv ODER kein StrategyValue vorhanden → Score anzeigen
        const hasStrategy = state?.strategy && state.strategy !== "none";
        const hasStrategyValue = item.strategyValue !== undefined && item.strategyValue !== null;

        const displayScore = (hasStrategy && hasStrategyValue)
            ? `<strong>${item.strategyValue}</strong>`
            : (item.score ?? 0).toFixed(2);

        return `
            <li class="stock-item ${sectorClass} ${isSelected ? 'highlight-ticker' : ''}"
                onclick="handleStockClick('${item.ticker}', '${item.industry}', '${item.sector}')">

                <div class="stock-row-inner">

                    <div class="stock-left">
                        ${isSelected ? '▶ ' : ''}<strong>${idx + 1}. ${item.ticker}</strong><br>
                        <span class="stock-sub">
                            ${item.sector ?? '—'} | ${item.industry ?? '—'}
                        </span>
                    </div>

                    <div class="stock-right">
                        Score: ${displayScore}<br>
                        Rank: ${item.rankWonDb ?? '—'}
                    </div>

                </div>
            </li>
        `;
    }).join('');

    listUl.innerHTML = html;
}
