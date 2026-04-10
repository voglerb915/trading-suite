import { getVolumeMetrics, getExecutedTrades } from "../../shared/api/journal.js";
import { globalState } from "../../shared/state/globalState.js";
import { sortBy } from "../../shared/utils/sort.js";
import { fmt } from "../../shared/utils/format.js";

import { renderVolumeTable } from "./render/renderVolumeTable.js";
import { renderJournalTable } from "./render/renderJournalTable.js";

document.addEventListener("DOMContentLoaded", async () => {
    console.log("LAB: Start...");

    const volume = await getVolumeMetrics();
    globalState.volumeData = volume.filter(v => v.turnover >= 10_000_000);
    renderVolumeTable(globalState.volumeData);

    const trades = await getExecutedTrades();
    globalState.journalData = trades;
    renderJournalTable(trades);
});
