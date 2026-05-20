// apps/excel/excel.js

import { calculateRanking } from "../../shared/logic/calculateRanking.js";
import { loadExcelRawData } from "../../shared/logic/loadExcelRawData.js";

// SECTORS
import { renderSectorsPerformance } from "./js/renderSectorsPerformance.js";
import { renderSectorsRanking } from "./js/renderSectorsRanking.js";

// INDUSTRIES
import { renderIndustriesPerformance } from "./js/renderIndustriesPerformance.js";
import { renderIndustriesRanking } from "./js/renderIndustriesRanking.js";
import { renderIndustriesTop20 } from "./js/renderIndustriesTop20.js";

// SECTORS OVERVIEW (ehemals Tab5)
import { renderSectorsOverview } from "./js/renderSectorsOverview.js";

document.addEventListener("DOMContentLoaded", async () => {
    console.log("EXCEL: Start...");

    // 1) Excel-Daten laden (gleich wie LAB)
    const { sectors, industries, dates } = await loadExcelRawData();

    // 2) SECTORS – Performance
    renderSectorsPerformance("tab-sectors-performance", sectors, dates);

    // 3) SECTORS – Ranking
    const rankingSectors = calculateRanking(sectors);
    renderSectorsRanking("tab-sectors-ranking", sectors, rankingSectors, dates);

    // 4) INDUSTRIES – Performance
    renderIndustriesPerformance("tab-industries-performance", industries, dates);

    // 5) INDUSTRIES – Ranking
    const rankingIndustries = calculateRanking(industries);
    renderIndustriesRanking("tab-industries-ranking", industries, rankingIndustries, dates);

    // ⬅️ Sector ins Ranking übernehmen
    Object.keys(rankingIndustries).forEach(ind => {
        rankingIndustries[ind].sector = industries[ind].sector;
    });
    
    // 6) INDUSTRIES – Top 20%
    renderIndustriesTop20("tab-industries-top20", industries, rankingIndustries, dates);
    
    // 7) SECTORS – Overview
    renderSectorsOverview("tab-sectors-overview", sectors);
    
});

// Tab-Logik 1:1 wie in LAB, nur andere IDs (aber Pattern gleich)
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
