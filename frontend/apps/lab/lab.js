// apps/lab/lab.js

import { getVolumeMetrics } from "../../shared/api/volume.js";
import GlobalState from "../../shared/state/globalState.js";
import { renderVolumeTable, handleSort } from "./render/renderVolumeTable.js";
import { initSqlStatus } from "./render/sql-status.js";


document.addEventListener("DOMContentLoaded", async () => {
    console.log("LAB: Start...");

    // Volume
    const volume = await getVolumeMetrics();
    const filtered = volume.filter(v => v.turnover >= 10_000_000);

    GlobalState.set("volumeData", filtered);
    renderVolumeTable(filtered);

    // SQL-Status erst NACHDEM das DOM existiert
    initSqlStatus();
});
