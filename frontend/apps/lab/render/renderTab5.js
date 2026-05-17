import { createSectorTile } from "./tiles/createSectorTile.js";
import { renderSectorTile } from "./tiles/renderSectorTile.js";

export function renderTab5(targetId, rankingData) {
    const root = document.getElementById(targetId);

    root.innerHTML = `<div id="sector-tiles"></div>`;
    const container = root.querySelector("#sector-tiles");

    // Kachel 1: Basic Materials
    container.innerHTML += createSectorTile("Basic Materials");

    renderSectorTile(container, "Basic Materials", rankingData);
}
