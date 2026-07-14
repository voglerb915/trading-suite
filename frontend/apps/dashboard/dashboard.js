// ======================================================
//  DASHBOARD — FINAL VERSION (Dashboard filtert, Cockpit liefert Daten)
// ======================================================

console.log("Dashboard NewStructure loaded");
let dashboardReady = false;

// ------------------------------------------------------
// 1. IMPORTS
// ------------------------------------------------------
import { renderDashboard } from "./js/structure/renderDashboard.js";
import { renderDashboardTools, renderActiveTab } from "./js/structure/renderDashboardTools.js";

// ------------------------------------------------------
// GLOBALER STOCK-CLICK-HANDLER (wie früher)
// ------------------------------------------------------
window.handleStockClick = function(ticker, industry, sector) {
    console.log("handleStockClick → Sende GET_STOCK_DETAILS:", ticker);

    window.parent.postMessage({
        type: "REQUEST",
        action: "GET_STOCK_DETAILS",
        payload: { ticker }
    }, "*");
};

// ------------------------------------------------------
// 2. GLOBAL STATE
// ------------------------------------------------------
// NEU
window.dashboardState = {
    
    stocks: [],
    stocksOriginal: [],

    sectors: [],
    industries: [],
    etfs: [],

    strategy: "none",
    strategyItems: {},

    index: "all",
    search: "",
    sector: null,
    industry: null,
    ticker: null,

    // Stocks / Sector / Industry (Buy / Sell)
    filterBuyStocks: false,
    filterSellStocks: false,
    filterBuyIndustries: false,
    filterSellIndustries: false,
    filterBuySectors: false,
    filterSellSectors: false,

    // Signalliste (BuySignals / SellSignals)
    filterBuySignals: false,
    filterSellSignals: false,

    // MidSignals (Long / Exit)
    filterLongMid: false,
    filterExitMid: false,
    
    
    

    midSignals: { stocks: {} },
    sparkSignals: { stocks: {}, sectors: {}, industries: {} },

    referenceStock: null
};
const dashboardState = window.dashboardState;

// ------------------------------------------------------
// 3. INIT REQUEST
// ------------------------------------------------------
let initSent = false;

function requestInit() {
    if (initSent) return;
    initSent = true;

    window.parent.postMessage({
        type: "REQUEST",
        action: "INIT",
        payload: {}
    }, "*");
}

requestInit();

// ------------------------------------------------------
// 4. REQUEST SENDER
// ------------------------------------------------------
function sendRequest(action, payload) {
    window.parent.postMessage({
        type: "REQUEST",
        action,
        payload
    }, "*");
}

// ------------------------------------------------------
// 5. RESPONSE HANDLER
// ------------------------------------------------------
window.addEventListener("message", (event) => {
    console.log("RAW MESSAGE:", event.data);   // ⭐ MUSS erscheinen

    const msg = event.data;
    if (!msg || msg.type !== "RESPONSE") {
        console.log("IGNORED MESSAGE:", msg);  // ⭐ zeigt dir, ob STOCK_DETAILS falschen type hat
        return;
    }

    console.log("RESPONSE MESSAGE:", msg);     // ⭐ zeigt dir, ob STOCK_DETAILS überhaupt kommt


    switch (msg.action) {

case "INIT":
    console.log("INIT empfangen:", msg.payload);

    // Basisdaten
    dashboardState.stocksOriginal = msg.payload.stocks || [];
    dashboardState.stocks         = dashboardState.stocksOriginal;

    dashboardState.sectors    = msg.payload.sectors || [];
    dashboardState.industries = msg.payload.industries || [];
    dashboardState.etfs       = msg.payload.etfs || [];

    // StrategyItems
    dashboardState.strategyItems = msg.payload.strategyItems || {};

    // MidSignals normalisieren (Array → Map)
    const rawMid = msg.payload.midSignals || [];
    dashboardState.midSignals = {
        stocks: Array.isArray(rawMid)
            ? Object.fromEntries(rawMid.map(s => [s.ticker, s]))
            : (rawMid.stocks || rawMid)
    };

    // SparkSignals normalisieren (Objekt → garantierte Struktur)
    const rawSpark = msg.payload.sparkSignals || {};

    dashboardState.sparkSignals = {
        stocks: rawSpark.stocks || {},
        sectors: rawSpark.sectors || {},
        industries: rawSpark.industries || {}
    };

    // ⭐ WICHTIG: Alte Struktur wiederherstellen (Renderer erwartet das!)
    window.dataStore = window.dataStore || {};
    window.dataStore.sparkSignals = dashboardState.sparkSignals;
    window.dataStore.midSignals   = dashboardState.midSignals;

    console.log(
        "DEBUG: SparkSignals im Dashboard:",
        Object.keys(dashboardState.sparkSignals.stocks).length,
        "Stocks"
    );

    break;



case "COCKPIT_DATA": {
    console.log("Dashboard: COCKPIT_DATA empfangen:", msg.payload);

    dashboardState.stocksOriginal = msg.payload.stocks || [];
    dashboardState.stocks         = dashboardState.stocksOriginal;

    dashboardState.sectors    = msg.payload.sectors || [];
    dashboardState.industries = msg.payload.industries || [];
    dashboardState.etfs       = msg.payload.etfs || [];

    // MidSignals normalisieren
    const rawMid2 = msg.payload.midSignals || [];
    const midMap2 = Array.isArray(rawMid2)
        ? Object.fromEntries(rawMid2.map(s => [s.ticker, s]))
        : (rawMid2.stocks || rawMid2);

    dashboardState.midSignals = { stocks: midMap2 };

    // SparkSignals übernehmen
    const rawSpark2 = msg.payload.sparkSignals || {};
    dashboardState.sparkSignals = {
        stocks: rawSpark2.stocks || {},
        sectors: rawSpark2.sectors || {},
        industries: rawSpark2.industries || {}
    };

    renderAll();
    break;
}

case "STOCK_DETAILS":
    dashboardState.ticker   = msg.payload.ticker;
    dashboardState.sector   = msg.payload.stock.sector || msg.payload.stock.sector_name;
    dashboardState.industry = msg.payload.stock.industry || msg.payload.stock.industry_name;
    dashboardState.referenceStock = msg.payload.stock;

    window.dataStore = window.dataStore || {};
    window.dataStore.referenceStock = msg.payload.stock;

    console.log("STOCK_DETAILS STATE REF:", dashboardState.referenceStock);
    // ⭐ WICHTIG: Dashboard neu rendern
    renderDashboard(dashboardState);

    break;





        default:
            console.warn("Dashboard: Unbekannte Action ignoriert:", msg.action);
            return;
    }

   
});

// ------------------------------------------------------
// 6. RENDER ALL
// ------------------------------------------------------
function renderAll() {
    renderDashboard(dashboardState);
    renderDashboardTools(dashboardState);

 

    const activeTab = document.querySelector(".tab-header .tab-item.active");
    const tabContent = document.getElementById("tools-tab-content");

    if (activeTab && tabContent) {
        renderActiveTab(activeTab.getAttribute("data-tab"), dashboardState, tabContent);
    }

    // ⭐ ZENTRALE UI-SYNCHRONISATION
    const indexSelect = document.getElementById("index-select");
    if (indexSelect) {
        indexSelect.value = dashboardState.indexFilter || "all";
    }

    const strategySelect = document.getElementById("strategy-select");
    if (strategySelect) {
        strategySelect.value = dashboardState.strategy || "none";
    }
}
// ------------------------------------------------------
// 7. Strategy-Merge (lokal im Dashboard)
// ------------------------------------------------------
function mergeStrategies(baseStocks, strategyItemsMap, selectedStrategies) {
    const merged = baseStocks.map(stock => ({ ...stock }));

    for (const strategyName of selectedStrategies) {
        const items = strategyItemsMap[strategyName] || [];
        const map = new Map(items.map(s => [s.ticker, s]));

        for (const stock of merged) {
            const strat = map.get(stock.ticker);
            if (strat) {
                // DEBUG: Prüfen, ob wir hier überhaupt reinkommen
                console.log(`DEBUG: Strategie-Treffer für ${stock.ticker}:`, strategyName);
                
                if (!Array.isArray(stock.strategy)) {
                    stock.strategy = [];
                }
                stock.strategy.push(strategyName);
                stock.strategyValue = strat.strategyValue;
                stock.strategyRank  = strat.strategyRank;
            }
        }
    }
    return merged;
}
// ------------------------------------------------------
// 8. Lokale Filterlogik
// ------------------------------------------------------

function filterStocksUI() {
    // ⭐ FIX: Wir starten IMMER beim Original-Datensatz.
    // So werden alle Filter bei jedem Aufruf frisch auf den vollen Datenbestand angewendet.
    let filtered = [...dashboardState.stocksOriginal];

    console.log("DEBUG: Filter startet. Strategie:", dashboardState.strategy, "Index:", dashboardState.indexFilter);

    // 1. Strategy Filter
    // WICHTIG: Da stocksOriginal keine Strategie-Daten hat, 
    // muss dieser Block die Daten VOR dem Filtern einbeziehen.
    if (dashboardState.strategy && dashboardState.strategy !== "none") {
        const merged = mergeStrategies(
            filtered,
            dashboardState.strategyItems,
            [dashboardState.strategy]
        );
        filtered = merged.filter(s => {
            const strategySource = s.strategy || [];
            return Array.isArray(strategySource) && strategySource.includes(dashboardState.strategy);
        });
    }

    // 2. Sector
    if (dashboardState.sector && dashboardState.sector !== "all") {
        filtered = filtered.filter(s =>
            (s.sector || s.sector_name) === dashboardState.sector
        );
    }

    // 3. Industry
    if (dashboardState.industry) {
        filtered = filtered.filter(s =>
            (s.industry || s.industry_name) === dashboardState.industry
        );
    }

    // 4. Index
    if (dashboardState.indexFilter && dashboardState.indexFilter !== "all") {
        filtered = filtered.filter(s =>
            Array.isArray(s.index) &&
            s.index.includes(dashboardState.indexFilter)
        );
    }

    // 5. Search
    if (dashboardState.search && dashboardState.search.length > 0) {
        const q = dashboardState.search.toLowerCase();
        filtered = filtered.filter(s =>
            s.ticker?.toLowerCase().includes(q) ||
            s.name?.toLowerCase().includes(q)
        );
    }

    // Ergebnis im globalen State speichern
    dashboardState.stocks = filtered;
    console.log("DEBUG Filter - Finales Ergebnis:", filtered.length);
}

window.filterStocksUI = filterStocksUI;
// ------------------------------------------------------
// 9. StrategyChange Handler
// ------------------------------------------------------
function handleStrategyChange(e) {
    const selectedStrategy = e.detail; // "none" oder "52wHigh"
    dashboardState.strategy = selectedStrategy;

    if (selectedStrategy === "none") {
        // WICHTIG: Setze stocks auf das Original zurück, 
        // ABER verlasse dich nicht darauf, dass der Filter schon stimmt.
        dashboardState.stocks = [...dashboardState.stocksOriginal];
    } else {
        const merged = mergeStrategies(
            dashboardState.stocksOriginal,
            dashboardState.strategyItems,
            [selectedStrategy]
        );
        dashboardState.stocks = merged;
    }

    // ⭐ DER FIX:
    // Wir rufen filterStocksUI() auf. Da wir stocksOriginal als Basis in 
    // filterStocksUI verwenden, werden alle anderen aktiven Filter 
    // (Sektor, Industrie, etc.) jetzt sauber neu berechnet.
    filterStocksUI();
    renderAll();
}

document.addEventListener("dashboard:strategyChange", handleStrategyChange);
if (window.parent && window.parent !== window) {
    window.parent.document.addEventListener("dashboard:strategyChange", handleStrategyChange);
}

// ------------------------------------------------------
// 10. Index, Search, Reset
// ------------------------------------------------------


// In dashboard.js, Abschnitt 10
document.addEventListener("dashboard:indexChange", (e) => {
    console.log("📌 dashboard.js: Event empfangen mit Wert:", e.detail); // WICHTIG: Erscheint das hier?
    
    dashboardState.indexFilter = e.detail; 
    
    // Prüfe, ob die Daten überhaupt existieren
    console.log("DEBUG: Aktueller Index-Filter Wert:", dashboardState.indexFilter);
    
    filterStocksUI();
    renderAll();
});

document.addEventListener("dashboard:searchChange", (e) => {
    dashboardState.search = e.detail;
    filterStocksUI();
    renderAll();
});

document.addEventListener("dashboard:reset", () => {
    dashboardState.sector = null;
    dashboardState.industry = null;
    dashboardState.ticker = null;

    dashboardState.strategy = "none";
    dashboardState.indexFilter = "all";       // ⭐ FIX
    dashboardState.search = "";

    dashboardState.filterEntryStocks = false;
    dashboardState.filterExitStocks = false;
    dashboardState.filterMidLong = false;
    dashboardState.filterMidExit = false;

    dashboardState.referenceStock = null;

    dashboardState.stocks = dashboardState.stocksOriginal;

    filterStocksUI();
    renderAll();
});


// ------------------------------------------------------
// 11. CLICK HANDLER
// ------------------------------------------------------
// ------------------------------------------------------
// 11. CLICK HANDLER
// ------------------------------------------------------
document.addEventListener("click", (e) => {

    // 1. Pillen → Dynamischer Toggle (einfach, sauber, wartbar)
    const pill = e.target.closest(".pill");
    if (pill) {
        const type = pill.dataset.type;
        
        // Prüft, ob der data-type eine gültige Eigenschaft im dashboardState ist
        if (dashboardState.hasOwnProperty(type)) {
            dashboardState[type] = !dashboardState[type];
            
            filterStocksUI();
            renderAll();
        }
        return; // Hier beenden, da die Pille behandelt wurde
    }

    // 2. Stock Click
    const stockRow = e.target.closest("[data-stock]");
    if (stockRow) {
        const ticker = stockRow.dataset.stock;
        const item = dashboardState.stocks.find(s => s.ticker === ticker);
        if (!item) return;

        dashboardState.sector   = item.sector || item.sector_name;
        dashboardState.industry = item.industry || item.industry_name;
        dashboardState.ticker   = ticker;

        filterStocksUI();
        renderAll();
        return;
    }

    // 3. Sector Click
    const sectorEl = e.target.closest("[data-sector]");
    if (sectorEl) {
        const val = sectorEl.getAttribute("data-sector");

        dashboardState.sector   = dashboardState.sector === val ? null : val;
        dashboardState.industry = null;
        dashboardState.ticker   = null;

        filterStocksUI();
        renderAll();
        return;
    }

    // 4. Industry Click
    const industryEl = e.target.closest("[data-industry]");
    if (industryEl) {
        const val = industryEl.getAttribute("data-industry");

        dashboardState.industry = dashboardState.industry === val ? null : val;

        if (dashboardState.industry) {
            const sample = dashboardState.stocks.find(s =>
                (s.industry || s.industry_name) === val
            );
            if (sample) {
                dashboardState.sector = sample.sector || sample.sector_name;
            }
        }

        dashboardState.ticker = null;

        filterStocksUI();
        renderAll();
        return;
    }
});

// ------------------------------------------------------
// 12. READY
// ------------------------------------------------------
console.log("Dashboard NewStructure ready.");
