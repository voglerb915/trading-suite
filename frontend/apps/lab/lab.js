// apps/lab/lab.js

import { getVolumeMetrics } from "../../shared/api/volume.js";
import { getExecutedTrades } from "../../shared/api/journal.js";

import GlobalState from "../../shared/state/globalState.js";

import { renderVolumeTable, handleSort } from "./render/renderVolumeTable.js";
import { renderJournalTable } from "./render/renderJournalTable.js";

document.addEventListener("DOMContentLoaded", async () => {
    console.log("LAB: Start...");

    // Volume
    const volume = await getVolumeMetrics();
    const filtered = volume.filter(v => v.turnover >= 10_000_000);

    GlobalState.set("volumeData", filtered);
    renderVolumeTable(filtered);

    // Journal
    const trades = await getExecutedTrades();
    GlobalState.set("journalData", trades);
    renderJournalTable(trades);
});
