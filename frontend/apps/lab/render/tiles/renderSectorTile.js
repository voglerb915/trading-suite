import { renderSparklineRanking } from "../renderSparklineRanking.js";


export function renderSectorTile(root, sectorName, rankingData) {

    const tile = root.querySelector(`.sector-tile[data-sector="${sectorName}"]`);

    const rank = rankingData[sectorName].week_rank_series.at(-1);

    // Rank-Farbe setzen
    const rankCell = tile.querySelector(".rank-cell");
    rankCell.textContent = rank;
    rankCell.style.background = sectorRankColors[rank];

    // Sparkline Week
    const weekCanvas = tile.querySelector(".spark-week");
    renderSparklineRanking(
        weekCanvas,
        rankingData[sectorName].week_rank_series,
        sectorRankColors
    );

    // Sparkline Month
    const monthCanvas = tile.querySelector(".spark-month");
    renderSparklineRanking(
        monthCanvas,
        rankingData[sectorName].month_rank_series,
        sectorRankColors
    );

    // Sparkline Quarter
    const quarterCanvas = tile.querySelector(".spark-quarter");
    renderSparklineRanking(
        quarterCanvas,
        rankingData[sectorName].quarter_rank_series,
        sectorRankColors
    );
}
