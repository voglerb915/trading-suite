// ===============================
// IMPORTS
// ===============================
import { HeaderTile } from "../tiles/instances/headerTile.js";
import { Top20Tile } from "../tiles/instances/top20Tile.js";
import { IndexPerformanceTile } from "../tiles/instances/indexPerformanceTile.js";
import { SectorOverviewTile } from "../tiles/instances/sectorOverviewTile.js";


// ===============================
// RENDER-FUNKTION
// ===============================
export function renderCockpit(state) {

    // State cachen, damit spätere Tiles darauf zugreifen können
    window.lastCockpitState = state;

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


/*----------------------------------
MESSAGE-LISTENER (OPTIMIERT)
----------------------------------*/
window.addEventListener("message", (event) => {
    // 1. Prüfe auf den neuen Typ 'COCKPIT_DATA_READY'
    // 2. Wir akzeptieren auch den alten Typ 'COCKPIT_DATA' für Kompatibilität
    if (event.data?.type === "COCKPIT_DATA_READY" || event.data?.type === "COCKPIT_DATA") {
        console.log("IFRAME: Render mit Nachricht vom Typ:", event.data.type);
        
        // WICHTIG: Wenn du das neue Komplettpaket sendest, heißt die Variable 'state' 
        // vielleicht anders oder ist direkt in event.data enthalten. 
        // Falls du in cockpit.js alles unter 'state' schickst, passt das so:
        const dataToRender = event.data.state || event.data; 
        
        renderCockpit(dataToRender);
    }
});