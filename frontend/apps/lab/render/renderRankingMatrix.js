import { renderSparkline } from "./renderSparkline.js";
import { renderSparklineRanking } from "./renderSparklineRanking.js";   // ← FEHLT BEI DIR

/* ================================
   Ranking-Farbskala 1–11
   ================================ */
const rankColors = {
    1:  "#b30000",
    2:  "#cc0000",
    3:  "#e60000",
    4:  "#ff1a1a",
    5:  "#ff4d4d",
    6:  "#ff944d",
    7:  "#ffd24d",
    8:  "#e6ff4d",
    9:  "#b3ff66",
    10: "#80ff80",
    11: "#33cc33"
};

export function renderRankingMatrix(targetId, sectors, ranking, dates) {
    const container = document.getElementById(targetId);

    container.innerHTML = `
        <div class="excel-container">
            <h3 class="excel-title">Ranking – Sectors × 15 Tage</h3>

            <div id="ranking-matrix-week"></div>
            <div id="ranking-matrix-month" style="margin-top: 40px;"></div>
            <div id="ranking-matrix-quarter" style="margin-top: 40px;"></div>
        </div>
    `;

    renderRankingTable("ranking-matrix-week", "Weekly Ranking", sectors, ranking, dates, "week");
    renderRankingTable("ranking-matrix-month", "Monthly Ranking", sectors, ranking, dates, "month");
    renderRankingTable("ranking-matrix-quarter", "Quarterly Ranking", sectors, ranking, dates, "quarter");
}

function renderRankingTable(targetId, title, sectors, ranking, dates, key) {
    const root = document.getElementById(targetId);

    root.innerHTML = `
        <h4 class="excel-title">${title}</h4>
        <table class="excel-table">
            <thead>
                <tr>
                    <th>Sector</th>
                    <th>Sparkline</th>
                    ${dates.map(d => `<th>${formatDate(d)}</th>`).join("")}
                </tr>
            </thead>
            <tbody>
                ${Object.keys(sectors).map(sector => {
                    const series = ranking[sector][`${key}_rank_series`];

                    return `
                        <tr>
                            <td class="excel-sector">${sector}</td>

                            <td class="excel-spark">
                                <canvas width="120" height="30" id="spark-rank-${sector}-${key}"></canvas>
                            </td>

                            ${series.map(v => `<td class="excel-rank rank-${v}">${v}</td>`).join("")}
                        </tr>
                    `;
                }).join("")}
            </tbody>
        </table>
    `;

    // Sparkline zeichnen
    setTimeout(() => {
        Object.keys(sectors).forEach(sector => {
            const series = ranking[sector][`${key}_rank_series`];
            const canvas = document.getElementById(`spark-rank-${sector}-${key}`);

            if (!canvas || !series) return;

            // letzter Wert = aktueller Rank
            const lastRank = series[series.length - 1];

            // passende Farbe aus der Skala
            const color = rankColors[lastRank] || "#000";

            // Sparkline mit Farbe zeichnen
            renderSparklineRanking(canvas, series, rankColors);

        });
    }, 0);

}


function formatDate(d) {
    const date = new Date(d);
    return date.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" });
}
