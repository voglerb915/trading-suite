import { formatTimestamp } from "../../../shared/utils/time.js";

export function renderIndexes(containerId, data) {
    const html = `
        <table class="lab-table index-base-table">
            <thead>
                <tr>
                    <th>Index</th>
                    <th>Ticker</th>
                    <th>Kurs</th>
                    <th>Region</th>
                    <th>Land</th>
                    <th>Letzter Tag</th>
                    <th>Anzahl Tage</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(d => {
                    const last = d.history[0];
                    return `
                        <tr>
                            <td>${d.index_name}</td>
                            <td>${d.ticker}</td>
                            <td>${last?.close?.toFixed(2) ?? "-"}</td>
                            <td>${d.region}</td>
                            <td>${d.country}</td>
                            <td>${last?.date ? formatTimestamp(last.date) : "-"}</td>
                            <td>${d.history.length}</td>
                        </tr>
                    `;
                }).join("")}
            </tbody>
        </table>
    `;

    document.getElementById(containerId).innerHTML = html;
}
