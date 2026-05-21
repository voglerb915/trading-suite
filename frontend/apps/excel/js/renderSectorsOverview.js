import { renderSectorTile } from "./renderSectorsTile.js";
import { renderIndustriesTile } from "./renderIndustriesTile.js";
import { calculateRanking } from "../../../shared/logic/calculateRanking.js";

export function renderSectorsOverview(targetId, sectors, industriesData) {
    const container = document.getElementById(targetId);
    container.innerHTML = "";

    // 1) Wir bauen ein neues, geschütztes Zwischen-Element (Wrapper)
    const gridWrapper = document.createElement("div");
    gridWrapper.className = "matrix-dashboard-wrapper"; // Nutzt das unkaputtbare Grid

    // 2) Ränge berechnen
    const rankingData = calculateRanking(sectors);
    const sectorNames = Object.keys(rankingData);

    // 3) Die 11 Sektoren erzeugen und in den WRAPPER hängen
    sectorNames.forEach(sectorName => {
        const data = rankingData[sectorName];
        const tile = renderSectorTile(sectorName, data);
        gridWrapper.appendChild(tile);
    });

    // 4) Industries-Kachel einbauen
    
    const industriesTile = renderIndustriesTile(industriesData);
    gridWrapper.appendChild(industriesTile);


    // 5) Erst jetzt hängen wir den kompletten Wrapper in den echten Tab-Container
    container.appendChild(gridWrapper);
}