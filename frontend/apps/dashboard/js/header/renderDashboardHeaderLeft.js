import { sectorClasses } from "../../../../shared/logic/sectorColors.js";

export function renderDashboardHeaderLeft(state) {
    const box = document.getElementById("dashboard-header-left");
    if (!box) return;

    const ref = state?.referenceStock;

    // Keine Auswahl → Default
    if (!ref) {
        box.className = "reference-box";
        box.innerHTML = `
            <div class="ref-header">
                <h2>No Selection</h2>
                <div class="company-name">—</div>
            </div>

            <div class="ref-row">
                <div><strong>Sector:</strong> —</div><div></div>
                <div><strong>Industry:</strong> —</div><div></div>
            </div>

            <div class="ref-row">
                <div><strong>Strategy Rank:</strong> —</div><div></div>
                <div><strong>Global Rank:</strong> —</div><div></div>
            </div>

            <div class="ref-row">
                <div><strong>Price:</strong> —</div><div></div>
                <div><strong>Strategy:</strong> none</div><div></div>
            </div>

            <div class="ref-row">
                <div><strong>Last Update:</strong> —</div><div></div>
                <div><strong>Score:</strong> —</div><div></div>
            </div>
        `;
        return;
    }

    // ⭐ Sector-Klasse für Balken (border-left)
    const sectorClass = sectorClasses[ref.sector] ?? "";

    // ⭐ Balken an der gesamten Box (wie im alten Dashboard)
    box.className = `reference-box ${sectorClass}`;

    const finvizDate = ref.anl_datum?.substring(0, 10) ?? "—";
    const score = ref.score?.toFixed(2) ?? "—";

    box.innerHTML = `
        <div class="ref-header">
            <h2>${ref.ticker}</h2>
            <div class="company-name">${ref.name}</div>
        </div>

        <div class="ref-row">
            <div>
                <strong>Sector:</strong> ${ref.sector}
            </div>
            <div></div>

            <div>
                <strong>Industry:</strong> ${ref.industry}
            </div>
            <div></div>
        </div>

        <div class="ref-row">
            <div><strong>Strategy Rank:</strong> —</div><div></div>
            <div><strong>Global Rank:</strong> ${ref.rankWonDb ?? "—"}</div><div></div>
        </div>

        <div class="ref-row">
            <div><strong>Price:</strong> —</div><div></div>
            <div><strong>Strategy:</strong> none</div><div></div>
        </div>

        <div class="ref-row">
            <div><strong>Last Update:</strong> ${finvizDate}</div><div></div>
            <div><strong>Score:</strong> ${score}</div><div></div>
        </div>
    `;
}
