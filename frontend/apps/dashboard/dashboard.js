import { renderDashboardOverview } from "./render/renderDashboard.js";

/*----------------------------------
1. Globaler State
----------------------------------*/
const GlobalState = {
    data: [],
    selectedTicker: null,
    view: 'overview'
};

/*----------------------------------
2. Data-Layer
----------------------------------*/
async function loadDashboardData() {
    try {
        const res = await fetch("http://localhost:4000/api/volume-metrics");
        if (!res.ok) throw new Error("Dashboard-Daten konnten nicht geladen werden");

        const data = await res.json();
        GlobalState.data = data;

        renderDashboardOverview(data);
        return data;
    } catch (err) {
        console.error("Fehler im Dashboard Data-Layer:", err);
        return [];
    }
}

/*----------------------------------
3. Navigation
----------------------------------*/
function switchDashboardView(viewId) {
    GlobalState.view = viewId;
}

/*----------------------------------
4. Controller
----------------------------------*/
async function initDashboardSync() {
    await loadDashboardData();
}

/*----------------------------------
5. Event-Handler
----------------------------------*/
document.addEventListener("dashboard:cardClick", (e) => {
    const ticker = e.detail;
    GlobalState.selectedTicker = ticker;
    console.log("Dashboard-Detail für:", ticker);
});

/*----------------------------------
6. Initialisierung
----------------------------------*/
document.addEventListener("DOMContentLoaded", () => {
    console.log("New Dashboard initialisiert...");
    initDashboardSync();
});
