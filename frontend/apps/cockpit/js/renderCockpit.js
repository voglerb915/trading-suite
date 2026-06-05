// js/renderCockpit.js

import { HeaderTile } from "../tiles/instances/headerTile.js";
import { Top20Tile } from "../tiles/instances/top20Tile.js";
import { IndexPerformanceTile } from "../tiles/instances/indexPerformanceTile.js";
import { SectorOverviewTile } from "../tiles/instances/sectorOverviewTile.js";

export function renderCockpit(state) {
    
    // 1) Header
    const headerEl = document.getElementById("cockpit-header");
    if (headerEl) {
        headerEl.innerHTML = HeaderTile(state);
    }

    // 2) Top 20
    const top20El = document.getElementById("cockpit-top20");
    if (top20El) {
        top20El.innerHTML = Top20Tile(state);
    }

    // 3) Index Performance
    const indexEl = document.getElementById("cockpit-index-performance");
    if (indexEl) {
        indexEl.innerHTML = IndexPerformanceTile(state);
    }

    // 4) Sector Overview
    const sectorEl = document.getElementById("cockpit-sectors");
    if (sectorEl) {
        sectorEl.innerHTML = SectorOverviewTile(state);
    }
}
