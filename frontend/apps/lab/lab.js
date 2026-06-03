// apps/lab/lab.js

import { getVolumeMetrics } from "../../shared/api/volume.js";
import GlobalState from "../../shared/state/globalState.js";
import { renderVolumeTable } from "./render/renderVolumeTable.js";
import { renderIndexes } from "./render/renderIndexes.js";
import { renderVolumeExtract } from "./render/renderVolumeExtract.js";

// --------------------------------------------------
// API: IndexHistory laden
// --------------------------------------------------
async function loadIndexHistory() {
    const res = await fetch("http://localhost:4000/api/data/indexhistory");
    return await res.json();
}


// --------------------------------------------------
// LAB Start
// --------------------------------------------------
document.addEventListener("DOMContentLoaded", async () => {
    console.log("LAB: Start...");

    // -----------------------------
    // 1) Volume
    // -----------------------------
    const volume = await getVolumeMetrics();
    const filtered = volume.filter(v => v.turnover >= 10_000_000);
    GlobalState.set("volumeData", filtered);
    renderVolumeTable(filtered);          // col-1 (sortierbar)
    renderVolumeExtract(filtered);   // col-2 (1:1 Kopie)

    // -----------------------------
    // 2) Index-Basistabelle
    // -----------------------------
    const indexData = await loadIndexHistory();

// ---------------------------------------------
// Sortierung: zuerst Region DESC, dann Country DESC
// ---------------------------------------------
    indexData.sort((a, b) => {
        // Region DESC
        if (a.region < b.region) return 1;
        if (a.region > b.region) return -1;

        // Country DESC
        if (a.country < b.country) return 1;
        if (a.country > b.country) return -1;

        // Indexname DESC
        if (a.index_name < b.index_name) return 1;
        if (a.index_name > b.index_name) return -1;

        return 0;
    });

    renderIndexes("lab-index-base", indexData);

});

// ------------------------------------------------------
// LAB Tabs – korrigierte Selektoren
// ------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    // Suche nach der Klasse, nicht nach der ID
    const buttons = document.querySelectorAll(".lab-tabs .tab-btn");
    // Suche direkt nach allen Elementen mit der Klasse tab-content
    const contents = document.querySelectorAll(".tab-content");

    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            const target = btn.dataset.tab;

            // Buttons umschalten
            buttons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            // Inhalte umschalten
            contents.forEach(c => {
                // Hier prüfen wir, ob die ID des Inhalts "tab-" + das Ziel ist
                c.style.display = (c.id === `tab-${target}`) ? "block" : "none";
            });
        });
    });
});
