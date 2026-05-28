import { renderStocksList } from "../lists/renderStocksList.js";

export function renderDashboardStocks(stocks, state) {
    // Log-Brücke zur Fehlerdiagnose
    console.log("🔍 VIEW: renderDashboardStocks aufgerufen mit stocks.length:", stocks ? stocks.length : "NULL");

    const container = document.querySelector("#stocks-list-container");
    if (!container) {
        console.error("❌ FEHLER: Container #stocks-list-container nicht gefunden!");
        return;
    }
    
    // Die eigentliche Arbeit
    renderStocksList(stocks, state);
    console.log("✅ VIEW: Liste erfolgreich gerendert.");
}