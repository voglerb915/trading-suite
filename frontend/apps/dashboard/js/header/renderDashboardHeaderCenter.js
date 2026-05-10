// apps/dashboard/js/structure/header/renderDashboardHeaderCenter.js

export function renderDashboardHeaderCenter(state) {
    const container = document.getElementById("dashboard-header-center");

    container.innerHTML = `
        <div class="breadcrumbs-block">
            <div class="page-title-small">RS Dashboard</div>
            <div id="breadcrumbs" class="breadcrumbs">
                ${state.breadcrumbs || "Alle Sektoren"}
            </div>
            <button id="reset-btn">Reset</button>
        </div>
    `;

    document.getElementById("reset-btn").addEventListener("click", () => {
        document.dispatchEvent(new CustomEvent("dashboard:reset"));
    });
}
