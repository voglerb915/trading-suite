// ---------------------------------------------------------
// renderSectorRankBar.js
// Zeichnet den farbigen Balken + min/max/avg-Pfeile
// ---------------------------------------------------------

export function renderSectorRankBar(container, stats) {
    const { minRank, maxRank, avgRank, heatmapClass } = stats;

    const barHeight = 150;

    container.innerHTML = `
        <div class="sector-rank-bar ${heatmapClass || ""}" 
             style="height:${barHeight}px; position:relative; border-radius:4px;">
        </div>
    `;

    const bar = container.querySelector(".sector-rank-bar");

    const mapRankToY = (rank) => {
        return ((rank - 1) / (144 - 1)) * barHeight;
    };

    const minMarker = document.createElement("div");
    minMarker.className = "rank-marker marker-left";
    minMarker.style.borderRightColor = "#00aa00";
    minMarker.style.top = `${mapRankToY(minRank)}px`;
    bar.appendChild(minMarker);

    const avgMarkerLeft = document.createElement("div");
    avgMarkerLeft.className = "rank-marker marker-left";
    avgMarkerLeft.style.borderRightColor = "#000000";
    avgMarkerLeft.style.top = `${mapRankToY(avgRank)}px`;
    bar.appendChild(avgMarkerLeft);

    const avgMarkerRight = document.createElement("div");
    avgMarkerRight.className = "rank-marker marker-right";
    avgMarkerRight.style.borderLeftColor = "#000000";
    avgMarkerRight.style.top = `${mapRankToY(avgRank)}px`;
    bar.appendChild(avgMarkerRight);

    const maxMarker = document.createElement("div");
    maxMarker.className = "rank-marker marker-right";
    maxMarker.style.borderLeftColor = "#cc0000";
    maxMarker.style.top = `${mapRankToY(maxRank)}px`;
    bar.appendChild(maxMarker);
}
