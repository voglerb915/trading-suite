import { sectorClasses } from "../../../../shared/logic/sectorColors.js";

export function renderStocksList(stocks, state) {
    const listUl = document.getElementById('stocks-list');
    if (!listUl) return;

    const limit = state?.displayLimit || 300;
    const visible = stocks.slice(0, limit);

    const html = visible.map((item, idx) => {
        const isSelected = item.ticker === state?.ticker;   // FIX

        const sectorClass = sectorClasses[item.sector] ?? "";

        return `
            <li class="stock-item ${sectorClass} ${isSelected ? 'highlight-ticker' : ''}"
                onclick="handleStockClick('${item.ticker}')">   <!-- FIX -->

                <div class="stock-row-inner">

                    <div class="stock-left">
                        <strong>${idx + 1}. ${item.ticker}</strong><br>   <!-- FIX -->
                        <span class="stock-sub">
                            ${item.sector ?? '—'} | ${item.industry ?? '—'}
                        </span>
                    </div>

                    <div class="stock-right">
                        Rank: ${item.rankWonDb ?? '—'}<br>
                        Score: ${(item.score ?? 0).toFixed(2)}
                    </div>

                </div>
            </li>
        `;
    }).join('');

    listUl.innerHTML = html;
}

