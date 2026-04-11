import GlobalState from "../../shared/state/globalState.js";
import { getExecutedTrades } from "../../shared/api/journal.js";
import { renderJournalTable } from "./render/renderJournalTable.js";

document.addEventListener("DOMContentLoaded", async () => {
    try {
        const trades = await getExecutedTrades();
        GlobalState.set("journalData", trades);
        renderJournalTable(trades);
    } catch (err) {
        console.error("Journal Init Error:", err);
    }
});
