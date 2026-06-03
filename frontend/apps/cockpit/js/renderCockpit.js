export function renderCockpit() {
    const container = document.getElementById("cockpit-root");
    if (!container) return;

    container.innerHTML = `
        <div id="cockpit-grid" 
            style="
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                grid-template-rows: auto auto;
                gap: 20px;
                padding: 20px;
            "
        >

            <!-- ⭐ 1/1 VolumeExtract -->
            <div id="col-1" style="background:#111; border:1px solid #333; border-radius:6px; padding:10px;">
            </div>

            <!-- ⭐ 1/2 Top 20 Stocks -->
            <div id="col-2" style="background:#111; border:1px solid #333; border-radius:6px; padding:10px;">
            </div>

            <!-- ⭐ 1/3 Systemstatus -->
            <div id="col-3" style="background:#111; border:1px solid #333; border-radius:6px; padding:10px;">
            </div>

            <!-- ⭐ 2/1 Index Performance -->
            <div id="col-4" style="background:#111; border:1px solid #333; border-radius:6px; padding:10px;">
            </div>

            <!-- ⭐ 2/2 Sector Overview -->
            <div id="col-5" style="background:#111; border:1px solid #333; border-radius:6px; padding:10px;">
            </div>

            <!-- ⭐ 2/3 Industries Overview -->
            <div id="col-6" style="background:#111; border:1px solid #333; border-radius:6px; padding:10px;">
            </div>

        </div>
    `;

    // ⭐ Render-Funktionen aufrufen
    // 1/1 VolumeExtract
    renderVolumeExtract(GlobalState.get("volumeData"));

    // 1/2 Top 20 Stocks
    renderVolumeTable(GlobalState.get("volumeData"), "col-2");

    // 1/3 Systemstatus
    renderSystemStatus("col-3");

    // 2/1 Index Performance
    renderIndexPerformance("col-4");

    // 2/2 Sector Overview
    renderSectorOverview("col-5");

    // 2/3 Industries Overview
    renderIndustryOverview("col-6");
}
