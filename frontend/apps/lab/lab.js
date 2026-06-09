// apps/lab/lab.js

import { getVolumeMetrics } from "../../shared/api/volume.js";
import GlobalState from "../../shared/state/globalState.js";
import { renderVolumeTable } from "./render/renderVolumeTable.js";
import { renderIndexes } from "./render/renderIndexes.js";
import { renderVolumeExtract } from "./render/renderVolumeExtract.js";

/* --------------------------------------------------
   API: IndexHistory laden
-------------------------------------------------- */
async function loadIndexHistory() {
    const res = await fetch("http://localhost:4000/api/data/indexhistory");
    return await res.json();
}

/* --------------------------------------------------
   LAB INITIALISIERUNG
-------------------------------------------------- */
document.addEventListener("DOMContentLoaded", async () => {
    console.log("LAB: Start...");

    /* -----------------------------
       1) Volume-Daten laden
    ----------------------------- */
    const volume = await getVolumeMetrics();
    const filtered = volume.filter(v => v.turnover >= 10_000_000);

    GlobalState.set("volumeData", filtered);

    renderVolumeTable(filtered);
    renderVolumeExtract(filtered);

    /* -----------------------------
       2) Index-Basistabelle
    ----------------------------- */
    const indexData = await loadIndexHistory();

    indexData.sort((a, b) => {
        if (a.region < b.region) return 1;
        if (a.region > b.region) return -1;

        if (a.country < b.country) return 1;
        if (a.country > b.country) return -1;

        if (a.index_name < b.index_name) return 1;
        if (a.index_name > b.index_name) return -1;

        return 0;
    });

    renderIndexes("lab-index-base", indexData);

    /* -----------------------------
       3) Tabs
    ----------------------------- */
    const buttons = document.querySelectorAll(".tab-bar .tab");
    const contents = document.querySelectorAll(".tab-content");

    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            const target = btn.dataset.tab;

            buttons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            contents.forEach(c => {
                c.style.display = (c.id === `tab-${target}`) ? "block" : "none";
            });
        });
    });
});

/* --------------------------------------------------
   UPDATE_STOCKS vom Cockpit → LAB
-------------------------------------------------- */
window.addEventListener("message", (event) => {
    if (event.data?.type === "UPDATE_STOCKS") {

        const stocks = event.data.stocks;
        if (!Array.isArray(stocks)) return;

        // Daten speichern
        GlobalState.set("volumeData", stocks);

        // Render aktualisieren
        renderVolumeTable(stocks);
        renderVolumeExtract(stocks);
    }
});
