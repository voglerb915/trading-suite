import { calculateRanking } from "../../shared/logic/calculateRanking.js";
import { loadExcelRawData } from "../../shared/logic/loadExcelRawData.js";

// SECTORS
import { renderSectorsPerformance } from "./js/renderSectorsPerformance.js";
import { renderSectorsRanking } from "./js/renderSectorsRanking.js";

// INDUSTRIES
import { renderIndustriesPerformance } from "./js/renderIndustriesPerformance.js";
import { renderIndustriesRanking } from "./js/renderIndustriesRanking.js";
import { renderIndustriesTop20 } from "./js/renderIndustriesTop20.js";

// SECTORS OVERVIEW
import { renderSectorsOverview } from "./js/renderSectorsOverview.js";

document.addEventListener("DOMContentLoaded", async () => {
    console.log("EXCEL: Start...");

    // -----------------------------
    // LOAD DATA 
    // -----------------------------
    const { sectors, industries, dates } = await loadExcelRawData();

    const rankingSectors = calculateRanking(sectors);
    const rankingIndustries = calculateRanking(industries);

    // Sector-Name in rankingIndustries einfügen
    Object.keys(rankingIndustries).forEach(ind => {
        rankingIndustries[ind].sector = industries[ind].sector;
    });

    

    // -----------------------------
    // RENDER ALL TABS
    // -----------------------------
    renderSectorsPerformance("tab-sectors-performance", sectors, dates);
    renderSectorsRanking("tab-sectors-ranking", sectors, rankingSectors, dates);

    renderIndustriesPerformance("tab-industries-performance", industries, dates);
    renderIndustriesRanking("tab-industries-ranking", industries, rankingIndustries, dates);

    renderIndustriesTop20("tab-industries-top20", industries, rankingIndustries, dates);

    // Overview mit Industries-Kachel
    renderSectorsOverview("tab-sectors-overview", sectors, industries);

    // -----------------------------
    // TAB-LOGIK (ANGESPASST AN NEUE STRUKTUR)
    // -----------------------------
    document.addEventListener("click", (e) => {
        // Wir suchen jetzt nach der Klasse "tab" statt "tab-btn"
        if (!e.target.classList.contains("tab")) return;

        const tab = e.target.dataset.tab;

        // Alle Tabs deaktivieren
        document.querySelectorAll(".tab").forEach(btn => btn.classList.remove("active"));
        e.target.classList.add("active");

        // Alle Inhalte verstecken
        document.querySelectorAll(".tab-content").forEach(div => {
            div.style.display = "none";
        });

        // Den gewählten Tab anzeigen
        const targetTab = document.getElementById(`tab-${tab}`);
        if (targetTab) {
            targetTab.style.display = "block";
        }
    });
});
