import { getSectorClass, getDiffColor, formatDiff } 
    from "../helpers/renderHelpers.js";

export function renderIndustriesList(industries, state) {
    const column = document.getElementById("industries-won-db");
    const container = document.getElementById("industry-list-container");

    if (!column || !container) return;

    // KORREKT: Sortierung nach rsRank
    const sortedIndustries = [...industries].sort((a, b) => {
        const rankA = Number(a.rsRank ?? 999);
        const rankB = Number(b.rsRank ?? 999);
        return rankA - rankB;
    });

    const rowsHtml = sortedIndustries.map(item => {
        // KORREKT: Vergleich mit item.industry
        const isSelected = item.industry === state.industry;

        // KORREKT: Score-Feld
        const score = (item.rsScore ?? 0).toFixed(2);

        // KORREKT: Stock-Zählung
        const count = (state.stocks || [])
            .filter(s => s.industry === item.industry).length;

        return `
            <div class="grid-row-sector stock-item ${isSelected ? "highlight-sector" : ""}"
                onclick="handleIndustryClick('${item.industry}', '${item.sector}')">

                <div class="grid-cell ${getSectorClass(item.sector)}">
                    ${isSelected ? '▶ ' : ''}<strong>${item.rsRank ?? '—'}.</strong> ${item.industry} (${score})
                </div>

                <div class="grid-cell count-cell">[${count}]</div>

                <div class="grid-cell" style="color:${getDiffColor(item.diffD)};">
                    ${formatDiff(item.diffD)}
                </div>

                <div class="grid-cell" style="color:${getDiffColor(item.diffW)};">
                    ${formatDiff(item.diffW)}
                </div>

                <div class="grid-cell" style="color:${getDiffColor(item.diffM)};">
                    ${formatDiff(item.diffM)}
                </div>
            </div>
        `;
    }).join("");

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
