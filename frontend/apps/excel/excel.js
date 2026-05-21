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
    // IndustriesData für Overview (Top 20% je Sektor)
    // -----------------------------
    const industryNames = Object.keys(rankingIndustries);
    const sectorNamesSet = new Set(
        industryNames.map(ind => industries[ind].sector)
    );
    const sectorNames = Array.from(sectorNamesSet);

    // Anzahl Industries für Top-20%-Schwelle
    const topThreshold = Math.floor(industryNames.length * 0.2);

    // wir nehmen die letzten 3 Tage
    const sampleIndustry = rankingIndustries[industryNames[0]];
    const lenWeek = sampleIndustry.week_rank_series.length;
    const lastIdx = lenWeek - 1;
    const dayIdx = [lastIdx, lastIdx - 1, lastIdx - 2]; // D0, D-1, D-2

    const industriesData = sectorNames.map(sectorName => {
        const week = [0, 0, 0];
        const month = [0, 0, 0];
        const quarter = [0, 0, 0];

        industryNames.forEach(ind => {
            if (industries[ind].sector !== sectorName) return;

            const wSeries = rankingIndustries[ind].week_rank_series;
            const mSeries = rankingIndustries[ind].month_rank_series;
            const qSeries = rankingIndustries[ind].quarter_rank_series;

            dayIdx.forEach((idx, pos) => {
                if (idx < 0) return;

                if (wSeries[idx] <= topThreshold) week[pos]++;
                if (mSeries[idx] <= topThreshold) month[pos]++;
                if (qSeries[idx] <= topThreshold) quarter[pos]++;
            });
        });

        return {
            sector: sectorName,
            week,
            month,
            quarter
        };
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
    renderSectorsOverview("tab-sectors-overview", sectors, industriesData);

    // -----------------------------
    // TAB-LOGIK
    // -----------------------------
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
});
