// ---------------------------------------------------------
// renderSectorStats.js
// Rendert den rechten Statistik-Block in jedem SectorTile.
// ---------------------------------------------------------

export function renderSectorStats(root, stats) {

    // Root ist das SectorTile-Element
    if (!root) return;

    // Falls bereits ein Stats-Block existiert → löschen
    const old = root.querySelector(".sector-stats");
    if (old) old.remove();

    // Hauptcontainer
    const container = document.createElement("div");
    container.className = "sector-stats tile-font";


    // -----------------------------------------------------
    // 1. Header: Industrieanzahl + Prozent
    // -----------------------------------------------------
    const header = document.createElement("div");
    header.className = "stats-header";

    const countEl = document.createElement("div");
    countEl.className = "stats-count";
    countEl.textContent = `${stats.top29Count} / ${stats.industryCount}`;


    const percentEl = document.createElement("div");
    percentEl.className = "stats-percent";
    percentEl.textContent = `${Math.round(stats.top29Percent * 100)}%`;

    header.appendChild(countEl);
    header.appendChild(percentEl);

    // -----------------------------------------------------
    // 2. Säule (einfarbig, Heatmap-Klasse)
    // -----------------------------------------------------
    const column = document.createElement("div");
    column.className = `stats-column ${stats.heatmapClass}`;

    // Höhe der Säule (für Positionierung)
    const COLUMN_HEIGHT = 100; // px → muss zu CSS passen

    // -----------------------------------------------------
    // 3. Min / Avg / Max Striche
    // -----------------------------------------------------

    // Hilfsfunktion für Striche
    function createLine(className, normValue) {
        const line = document.createElement("div");
        line.className = className;

        // Position: normValue (0–1) * Höhe
        const y = normValue * COLUMN_HEIGHT;
        line.style.top = `${y}px`;

        return line;
    }

    const lineMin = createLine("line-min", stats.minNorm);
    const lineAvg = createLine("line-avg", stats.avgNorm);
    const lineMax = createLine("line-max", stats.maxNorm);

    column.appendChild(lineMin);
    column.appendChild(lineAvg);
    column.appendChild(lineMax);

    // -----------------------------------------------------
    // 4. Zusammenbauen
    // -----------------------------------------------------
    container.appendChild(header);
    container.appendChild(column);

    // Rechts im Tile einfügen
    root.appendChild(container);
}
