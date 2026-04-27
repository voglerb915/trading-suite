// ======================================================
//  RENDERCONTROLTILES.JS – Minimaler Einstiegspunkt
//  Rendert die 3 Tiles und bindet Events
// ======================================================

import { loadPersistedStatus, simulateProgress, updateTile } from "./logic.js";
import { runSystemStatus } from "./tiles/system.js";
import { runChecks } from "./tiles/checks.js";
import { triggerCalculation } from "./tiles/calculations.js";
import { runIndexHistory, runDailyHistory } from "./tiles/downloads.js";


// ------------------------------------------------------
// 1) TILE-HTML-GENERATOR
// ------------------------------------------------------
function tile(key, icon, title, extra = "") {
    return `
        <div class="control-tile" id="tile-${key}">
            <div class="tile-header">
                <span class="tile-icon">${icon}</span>
                <span class="tile-title">${title}</span>
            </div>

            <div class="tile-status" id="status-${key}">Bereit</div>

            <div class="tile-progress">
                <div class="tile-progress-bar" id="progress-${key}"></div>
            </div>

            ${extra}

            <div class="tile-meta">
                <div id="last-${key}">Letzter Lauf: –</div>
                <div id="duration-${key}">Dauer: –</div>
            </div>
        </div>
    `;
}


// ------------------------------------------------------
// 2) HAUPTFUNKTION: Tiles rendern
// ------------------------------------------------------
export async function renderControlTiles() {
    const root = document.getElementById("control-center-root");

    // Log-Modal einfügen
    root.insertAdjacentHTML("beforebegin", `
        <div id="log-modal" class="log-modal hidden">
            <div class="log-modal-content">
                <h3 id="log-title"></h3>
                <pre id="log-body"></pre>
                <button id="log-close">Schließen</button>
            </div>
        </div>
    `);

    // Tiles einfügen
    root.innerHTML = `
        ${tile("system", "🖥️", "System", `
            <div class="tile-results" id="results-system"></div>
        `)}

        ${tile("downloads", "📥", "Yahoo-Downloads", `
            <div class="tile-results" id="results-downloads"></div>
        `)}

        ${tile("calculations", "🧮", "Berechnungen", `
            <div class="tile-steps" id="steps-calculations">
                <div class="tile-step" id="step-short">
                    <span class="step-label">Short-Strategie</span>
                    <span class="step-status" id="step-status-short">–</span>
                </div>
                <div class="tile-step" id="step-metrics">
                    <span class="step-label">Update-Metrics</span>
                    <span class="step-status" id="step-status-metrics">–</span>
                </div>
            </div>
        `)}

        ${tile("checks", "🔍", "Prüfungen", `
            <div class="tile-results" id="results-checks"></div>
        `)}
    `;

    setupTileEvents();

    // System-Status automatisch laden
    document.getElementById("tile-system").click();

// Persistenten Status laden
await loadPersistedStatus();

}



// ------------------------------------------------------
// 3) TILE-EVENTS
// ------------------------------------------------------
function setupTileEvents() {
    // System
        document.getElementById("tile-system").addEventListener("click", async () => {
            updateTile("system", { status: "running", progress: 0 });
            simulateProgress("system");

            const result = await runSystemStatus();

            // WICHTIG: HTML in die Kachel schreiben
            document.getElementById("results-system").innerHTML = result.html;

            updateTile("system", {
                status: result.ok ? "success" : "error",
                progress: 100,
                lastRun: new Date(),
                duration: "–"
            });
        });


    // Downloads → nur Klick auf die Tabelle, nicht die Kachel
    document.getElementById("tile-downloads").addEventListener("click", () => {
        // Downloads laufen NICHT über runTileProcess
        // sondern über die Download-Tabelle selbst
    });

    // Calculations
    document.getElementById("tile-calculations").addEventListener("click", async () => {
        updateTile("calculations", { status: "running", progress: 0 });
        simulateProgress("calculations");

        const result = await triggerCalculation();

        updateTile("calculations", {
            status: "success",
            progress: 100,
            lastRun: new Date(),
            duration: result.duration
        });
    });

    // Checks
    document.getElementById("tile-checks").addEventListener("click", async () => {
        updateTile("checks", { status: "running", progress: 0 });
        simulateProgress("checks");

        const result = await runChecks();

        updateTile("checks", {
            status: "success",
            progress: 100,
            lastRun: new Date(),
            duration: "–",
            sections: result.sections
        });
    });
}

renderControlTiles();
