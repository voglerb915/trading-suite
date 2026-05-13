// apps/lab/lab.js

import { getVolumeMetrics } from "../../shared/api/volume.js";
import GlobalState from "../../shared/state/globalState.js";
import { renderVolumeTable } from "./render/renderVolumeTable.js";

import { calculateRanking } from "../../shared/logic/calculateRanking.js";
import { loadExcelRawData } from "../../shared/logic/loadExcelRawData.js";

import { renderExcelRawData } from "./render/renderExcelRawData.js";
import { renderRankingMatrix } from "./render/renderRankingMatrix.js";

document.addEventListener("DOMContentLoaded", async () => {
    console.log("LAB: Start...");

    // Volume
    const volume = await getVolumeMetrics();
    const filtered = volume.filter(v => v.turnover >= 10_000_000);
    GlobalState.set("volumeData", filtered);
    renderVolumeTable(filtered);

    // Excel-Daten laden (LOGIC)
    const { sectors, dates } = await loadExcelRawData();

    // Performance-Tab rendern (RENDER)
    renderExcelRawData("tab-performance", sectors, dates);

    // Ranking berechnen (LOGIC)
    const ranking = calculateRanking(sectors);

    // Ranking-Tab rendern (RENDER)
    renderRankingMatrix("tab-ranking", sectors, ranking, dates);


});

// Tab-Logik unverändert
document.addEventListener("click", (e) => {
    if (!e.target.classList.contains("tab-btn")) return;

    const tab = e.target.dataset.tab;

    document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
    e.target.classList.add("active");

    document.querySelectorAll(".tab-content").forEach(div => {
        div.style.display = "none";
    });

    document.getElementById(`tab-${tab}`).style.display = "block";
});
