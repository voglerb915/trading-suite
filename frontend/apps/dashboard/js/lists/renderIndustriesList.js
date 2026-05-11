// apps/dashboard/js/lists/renderIndustriesList.js

import { getSectorClass, getDiffColor, formatDiff } 
    from "../helpers/renderHelpers.js";

export function renderIndustriesList(industries, state) {
    const column = document.getElementById("industries-won-db");
    const container = document.getElementById("industry-list-container");

    if (!column || !container) return;

    // Sortierung identisch zu Sectors
    const sortedIndustries = [...industries].sort((a, b) => {
        const rankA = Number(a.rankWonDb || a.rank || 999);
        const rankB = Number(b.rankWonDb || b.rank || 999);
        return rankA - rankB;
    });

    const rowsHtml = sortedIndustries.map(item => {
        const isSelected = item.name === state.industry;
        const score = (item.score ?? 0).toFixed(2);

        // Anzahl Stocks in dieser Industry
        const count = (state.stocks || [])
            .filter(s => s.industry === item.name).length;

        return `
            <div class="grid-row-sector stock-item ${isSelected ? "highlight-sector" : ""}"
                 onclick="handleIndustryClick('${item.name}')">

                <div class="grid-cell ${getSectorClass(item.sector)}">
                    <strong>${item.rankWonDb || "—"}.</strong> ${item.name} (${score})
                </div>

                <div class="grid-cell count-cell">[${count}]</div>

                <div class="grid-cell" style="color:${getDiffColor(item.diffW)};">
                    ${formatDiff(item.diffW)}
                </div>

                <div class="grid-cell" style="color:${getDiffColor(item.diffM)};">
                    ${formatDiff(item.diffM)}
                </div>

                <div class="grid-cell" style="color:${getDiffColor(item.diffQ)};">
                    ${formatDiff(item.diffQ)}
                </div>
            </div>
        `;
    }).join("");

    // Header identisch zu Sectors
    container.innerHTML = `
        <div class="sectors-header">
            <div class="sectors-header-title">
                Industries (${sortedIndustries.length})
            </div>
            <div class="sectors-header-diffs">
                <div>∑ Stocks</div>
                <div>D</div>
                <div>W</div>
                <div>M</div>
            </div>
        </div>

        <div class="grid-table">
            ${rowsHtml}
        </div>
    `;
}
