// apps/dashboard/js/header/renderDashboardHeaderLeft.js

export function renderDashboardHeaderLeft(state) {
    const box = document.getElementById("dashboard-header-left");
    if (!box) return;

    box.className = "reference-box";

    box.innerHTML = `
        <div class="ref-header">
            <h2>No Selection</h2>
            <div class="company-name">—</div>
        </div>

        <div class="ref-row">
            <div><strong>Sector:</strong> —</div>
            <div></div>
            <div><strong>Industry:</strong> —</div>
            <div></div>
        </div>

        <div class="ref-row">
            <div><strong>Strategy Rank:</strong> —</div>
            <div></div>
            <div><strong>Global Rank:</strong> —</div>
            <div></div>
        </div>

        <div class="ref-row">
            <div><strong>Price:</strong> —</div>
            <div></div>
            <div><strong>Strategy:</strong> none</div>
            <div></div>
        </div>

        <div class="ref-row">
            <div><strong>Last Update:</strong> —</div>
            <div></div>
            <div><strong>Yahoo:</strong> —</div>
            <div></div>
        </div>
    `;
}
