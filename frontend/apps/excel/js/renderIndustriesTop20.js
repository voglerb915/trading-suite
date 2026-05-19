// apps/lab/render/renderIndustriesTop20.js

import { renderSparklineRanking } from "./renderSparklineRanking.js";

import {
    getIndustryColor,
    getIndustryTextColor,
    rankIndustryColors
} from "../../../shared/logic/rankIndustryColors.js";

export function renderIndustriesTop20(targetId, industries, ranking, dates) {
    const container = document.getElementById(targetId);

    container.innerHTML = `
        <div class="excel-container">
            <h3 class="excel-title">Top 20% – Industries</h3>

            <div class="top20-row">
                <div id="top20-week" class="top20-col"></div>
                <div id="top20-month" class="top20-col"></div>
                <div id="top20-quarter" class="top20-col"></div>
            </div>
        </div>
    `;


    renderTop20("top20-week", "Top 20% – Week", industries, ranking, dates, "week");
    renderTop20("top20-month", "Top 20% – Month", industries, ranking, dates, "month");
    renderTop20("top20-quarter", "Top 20% – Quarter", industries, ranking, dates, "quarter");
}

function renderTop20(targetId, title, industries, ranking, dates, key) {
    const root = document.getElementById(targetId);

    // Industries in ein Array umwandeln
    const rows = Object.keys(industries).map(ind => {
        const series = ranking[ind][`${key}_rank_series`];

        // NEU: neuester Wert = Index 0
        const currentRank = series[0];

        return {
            industry: ind,
            sector: industries[ind],
            series,
            rank: currentRank
        };
    });

    // Sortierung nach Rank aufsteigend
    rows.sort((a, b) => a.rank - b.rank);

    // Top 20% berechnen
    const count = Math.max(1, Math.ceil(rows.length * 0.2));
    const top = rows.slice(0, count);

    root.innerHTML = `
        <h4 class="excel-title">${title}</h4>
        <table class="excel-table">
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Sparkline</th>
                    <th>Industry</th>
                    <th>Sector</th>
                </tr>
            </thead>
            <tbody>
                ${top.map(row => {
                    const bg = getIndustryColor(row.rank);
                    const fg = getIndustryTextColor(bg);

                    return `
                        <tr>
                            <td style="background:${bg}; color:${fg}; font-weight:bold">${row.rank}</td>

                            <td class="excel-spark">
                                <canvas width="120" height="30" id="spark-top20-${row.industry}-${key}"></canvas>
                            </td>

                            <td class="excel-sector">${row.industry}</td>
                            <td class="excel-sector">${row.sector}</td>
                        </tr>
                    `;
                }).join("")}
            </tbody>
        </table>
    `;

    // Sparklines zeichnen
    setTimeout(() => {
        top.forEach(row => {
            const canvas = document.getElementById(`spark-top20-${row.industry}-${key}`);
            if (!canvas) return;

            renderSparklineRanking(canvas, row.series, rankIndustryColors);
        });
    }, 0);
}
