import { getSectorClass, getDiffColor, formatDiff, handleSectorClick }
  from "../helpers/renderHelpers.js";

export function renderSectorsList(sectors, state) {
  const column = document.getElementById('sectors-won-db');
  const container = document.getElementById('sector-list-container');
  
  if (!column || !container) return;

  // KORREKT: Sortierung nach rsRank
  const sortedSectors = [...sectors].sort((a, b) => {
    const rankA = Number(a.rsRank ?? 999);
    const rankB = Number(b.rsRank ?? 999);
    return rankA - rankB;
  });

  const rowsHtml = sortedSectors.map(item => {
    // KORREKT: Vergleich mit item.sector
    const isSelected = item.sector === state.sector;
    const activeClass = isSelected ? "active-marker" : "";

    // KORREKT: Score-Feld
    const score = (item.rsScore ?? 0).toFixed(2);

    // KORREKT: Stock-Zählung
    const count = (state.stocks || []).filter(s => s.sector === item.sector).length;

    return `
      <div class="grid-row-sector stock-item ${activeClass} ${isSelected ? 'highlight-sector' : ''}"
           onclick="handleSectorClick('${item.sector}')">

        <div class="grid-cell ${getSectorClass(item.sector)}">
          ${isSelected ? '▶ ' : ''}<strong>${item.rsRank ?? '—'}.</strong> ${item.sector} (${score})
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

      </div>`;
  }).join('');

  container.innerHTML = `
    <div class="sectors-header">
      <div class="sectors-header-title">
        Sectors (${sortedSectors.length})
      </div>
      <div class="sectors-header-diffs">
        <div>∑ Stocks</div>
        <div>W</div>
        <div>M</div>
        <div>Q</div>
      </div>
    </div>
    <div class="grid-table">
      ${rowsHtml}
    </div>
  `;
}
