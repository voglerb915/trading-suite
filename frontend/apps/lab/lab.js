// apps/lab/lab.js

import { getVolumeMetrics } from "../../shared/api/volume.js";
import GlobalState from "../../shared/state/globalState.js";
import { renderVolumeTable } from "./render/renderVolumeTable.js";

import { calculateRanking } from "../../shared/logic/calculateRanking.js";
import { loadExcelRawData } from "../../shared/logic/loadExcelRawData.js";

// SECTORS
import { renderSectorsPerformance } from "./render/renderSectorsPerformance.js";
import { renderSectorsRanking } from "./render/renderSectorsRanking.js";

// INDUSTRIES
import { renderIndustriesPerformance } from "./render/renderIndustriesPerformance.js";
import { renderIndustriesRanking } from "./render/renderIndustriesRanking.js";

import { renderTab5 } from "./render/renderTab5.js";


document.addEventListener("DOMContentLoaded", async () => {
    console.log("LAB: Start...");

    // -----------------------------
    // 1) Volume
    // -----------------------------
    const volume = await getVolumeMetrics();
    const filtered = volume.filter(v => v.turnover >= 10_000_000);
    GlobalState.set("volumeData", filtered);
    renderVolumeTable(filtered);

    // -----------------------------
    // 2) Excel-Daten laden
    // -----------------------------
    const { sectors, industries, dates } = await loadExcelRawData();

    // -----------------------------
    // 3) SECTORS – Performance
    // -----------------------------
    renderSectorsPerformance("tab-sectors-performance", sectors, dates);

    // -----------------------------
    // 4) SECTORS – Ranking
    // -----------------------------
    const rankingSectors = calculateRanking(sectors);
    renderSectorsRanking("tab-sectors-ranking", sectors, rankingSectors, dates);

    // -----------------------------
    // 5) INDUSTRIES – Performance
    // -----------------------------
    renderIndustriesPerformance("tab-industries-performance", industries, dates);

    // -----------------------------
    // 6) INDUSTRIES – Ranking
    // -----------------------------
    const rankingIndustries = calculateRanking(industries);
    renderIndustriesRanking("tab-industries-ranking", industries, rankingIndustries, dates);

    // -----------------------------
    // 7) Tab 5 (noch zu benennen)
    // -----------------------------
    renderTab5("tab-next-stage", sectors);

});


// ---------------------------------------------------------
// TAB-LOGIK (unverändert, nur IDs müssen stimmen)
// ---------------------------------------------------------
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
