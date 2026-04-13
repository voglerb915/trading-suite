import { getSectorClass, getDiffColor, formatDiff, handleSectorClick } 
  from "./renderHelpers.js";

export function renderSectorsList(sectors, state) {
  // Wir greifen uns das ÜBERGEORDNETE Element der Spalte
  const column = document.getElementById('sectors-won-db');
  const container = document.getElementById('sector-list-container');
  
  if (!column || !container) return;

  const sortedSectors = [...sectors].sort((a, b) => {
    const rankA = Number(a.rankWonDb || a.rank || 999);
    const rankB = Number(b.rankWonDb || b.rank || 999);
    return rankA - rankB;
  });

  const rowsHtml = sortedSectors.map(item => {
    const isSelected = item.name === state.sector;
    const score = (item.score ?? 0).toFixed(2);
    const count = (state.stocks || []).filter(s => s.sector === item.name).length;

    return `
      <div class="grid-row-sector stock-item ${isSelected ? 'highlight-sector' : ''}"
           onclick="handleSectorClick('${item.name}')">
        <div class="grid-cell ${getSectorClass(item.name)}">
          <strong>${item.rankWonDb || '—'}.</strong> ${item.name} (${score})
        </div>
        <div class="grid-cell count-cell">[${count}]</div>
        <div class="grid-cell" style="color:${getDiffColor(item.diffW)};">${formatDiff(item.diffW)}</div>
        <div class="grid-cell" style="color:${getDiffColor(item.diffM)};">${formatDiff(item.diffM)}</div>
        <div class="grid-cell" style="color:${getDiffColor(item.diffQ)};">${formatDiff(item.diffQ)}</div>
      </div>`;
  }).join('');

  // Jetzt bauen wir die EINE Zeile, die du willst
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