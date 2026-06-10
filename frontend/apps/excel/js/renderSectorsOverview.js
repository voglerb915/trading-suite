import { renderSectorTile } from "./renderSectorsTile.js";
import { renderIndustriesTile } from "./renderIndustriesTile.js";
import { calculateRanking } from "../../../shared/logic/calculateRanking.js";
import { buildIndustriesOverviewData } from "../../../shared/logic/industriesOverview.js";

import { calculateSectorStats } from "../../../shared/logic/sectorStats.js";
import { renderSectorStats } from "./renderSectorStats.js";

export function renderSectorsOverview(targetId, sectors, industries) {
    
    const container = document.getElementById(targetId);
    container.innerHTML = "";

    // 1) Industries in Array umwandeln
    const industriesArray = Object.values(industries);

    // 2) Industries normalisieren
    const normalizedIndustries = industriesArray.map(ind => ({
        ...ind,
        week_rank_series: ind.week,
        month_rank_series: ind.month,
        quarter_rank_series: ind.quarter
    }));

    // 2b) Industries-Overview DATEN berechnen (nur Daten!)
    // *** EINZIGE ÄNDERUNG ***
    const industriesOverview = buildIndustriesOverviewData(industries);

    const gridWrapper = document.createElement("div");
    gridWrapper.className = "matrix-dashboard-wrapper";

    // 3) Sektoren-Ranking
    const rankingData = calculateRanking(sectors);
    const sectorNames = Object.keys(rankingData);

    sectorNames.forEach(sectorName => {
        const data = rankingData[sectorName];

        const tile = renderSectorTile(sectorName, data);

        const sectorIndustries = normalizedIndustries.filter(
            ind => ind.sector === sectorName
        );

        const overviewEntry = industriesOverview.find(o => o.sector === sectorName);

        const top29Count = overviewEntry.topCount;

        const stats = calculateSectorStats(sectorIndustries, top29Count);

        renderSectorStats(tile, stats);

        gridWrapper.appendChild(tile);
    });

    // 8) IndustriesTile GANZ AM ENDE rendern
    const industriesTile = renderIndustriesTile(industriesOverview);
    gridWrapper.appendChild(industriesTile);

    container.appendChild(gridWrapper);
}
