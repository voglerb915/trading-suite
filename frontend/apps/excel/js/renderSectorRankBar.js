export function renderSectorRankBar(container, stats) {
    const { minRank, maxRank, avgRank, heatmapClass } = stats;
    const barHeight = 144;

    // 1. Balken finden oder einmalig erstellen
    let bar = container.querySelector(".sector-rank-bar");
    if (!bar) {
        bar = document.createElement("div");
        bar.className = `sector-rank-bar ${heatmapClass || ""}`; // Lädt das CSS-Design!
        bar.style.height = `${barHeight}px`;
        bar.style.position = "relative";
        container.appendChild(bar);
    }

    // 2. Marker entfernen, damit sie nicht doppelt/falsch gerendert werden
    const existingMarkers = bar.querySelectorAll(".rank-marker");
    existingMarkers.forEach(m => m.remove());

    const mapRankToY = (rank) => ((rank - 1) / 143) * barHeight;

    // 3. Marker korrekt erstellen
// 3. Marker korrekt erstellen (Richtung korrigiert)
    const addMarker = (rank, color, side) => {
    const m = document.createElement("div");
    // Wir geben ihm die Klasse für die Position
    m.className = side === "left" ? "rank-marker marker-left" : "rank-marker marker-right";
    
    m.style.position = "absolute";
    m.style.top = `${mapRankToY(rank)}px`;
    
    // Die Farbe erzwingen wir hier direkt
    if (side === "left") {
        m.style.borderRightColor = color;
    } else {
        m.style.borderLeftColor = color;
    }
    
    // WENN SIE JETZT NOCH NACH AUSSEN ZEIGEN, DANN DREHEN WIR SIE:
    m.classList.add("pfeil-gedreht"); 

    bar.appendChild(m);
};

    addMarker(minRank, "#00aa00", "left");
    addMarker(avgRank, "#000000", "left");
    addMarker(avgRank, "#000000", "right");
    addMarker(maxRank, "#cc0000", "right");
}