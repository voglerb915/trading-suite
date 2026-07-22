// ======================================================
//  COCKPIT CONTROLLER — neue Engine (bereinigt)
// ======================================================

console.log("CockpitController geladen (parallel aktiv).");

import { computeVolumeExtract } from "./shared/utils/volumeExtract.js";

// ------------------------------------------------------
// 1. Engine State
// ------------------------------------------------------
const controllerState = {
    baseStocks: [],
    stocks: [],
    sectors: [],
    industries: [],
    etfs: [],

    midSignals: {},
    sparkSignals: {},

    strategies: {},
    volumeExtract: null,

    strategyItems: {}   // Strategy-Daten für Dashboard
};

// ------------------------------------------------------
// 2. Initial Load
// ------------------------------------------------------
async function controllerInit() {

    console.log("controllerInit START");

    // 1) Basisdaten laden
    const [
        stocks,
        sectors,
        industries,
        etfs,
        midSignalsData,
        sparkSignalsDataRaw
    ] = await Promise.all([
        fetch("/api/market/stocks").then(r => r.json()),
        fetch("/api/market/sectors").then(r => r.json()),
        fetch("/api/market/industries").then(r => r.json()),
        fetch("/api/market/etfs").then(r => r.json()),

        fetch("/api/signals/mid-signal")
            .then(r => r.ok ? r.json() : [])
            .catch(() => []),

        fetch("/api/sparklinesignals")
            .then(r => r.ok ? r.json() : ({ stocks: {}, sectors: {}, industries: {} }))
            .catch(() => ({ stocks: {}, sectors: {}, industries: {} }))
    ]);

    let sparkSignalsData = sparkSignalsDataRaw;

    if (Array.isArray(sparkSignalsData)) {
        sparkSignalsData = {
            stocks: Object.fromEntries(
                sparkSignalsData.map(s => [s.ticker, s])
            ),
            sectors: {},
            industries: {}
        };
    }

    controllerState.baseStocks   = stocks;
    controllerState.stocks       = stocks;
    controllerState.sectors      = sectors;
    controllerState.industries   = industries;
    controllerState.etfs         = etfs;
    controllerState.midSignals   = midSignalsData;
    controllerState.sparkSignals = sparkSignalsData;


// ------------------------------------------------------
    // 3) Strategy-Daten laden (Stage 3 & InsideDay52w)
    // ------------------------------------------------------
    const strategyNames = ["stage3topping", "insideday52w"];

    const strategyItemsMap = {};
    for (const name of strategyNames) {
        try {
            const items = await loadStrategyStocks(name);
            strategyItemsMap[name] = items;
        } catch (err) {
            console.warn("Strategy Load Error:", name, err);
            strategyItemsMap[name] = [];
        }
    }

    controllerState.strategyItems = strategyItemsMap;
    console.log("DEBUG Cockpit strategyItems (alt):", controllerState.strategyItems);


    // ------------------------------------------------------
    // 3a) Reader-Daten holen (Endpoints abfragen)
    // ------------------------------------------------------
    let stage3ReaderData = [];
    try {
        const res = await fetch("/api/strategy/stage3topping");
        const json = await res.json();
        stage3ReaderData = json.signals || [];
        console.log("COCKPIT → STAGE3 READER LENGTH:", stage3ReaderData.length);
    } catch (err) {
        console.warn("Stage3 Reader Fetch Error:", err);
    }

    let insideDayReaderData = [];
    try {
        const res = await fetch("/api/strategy/insideday52w");
        const json = await res.json();
        insideDayReaderData = json.data || json.signals || [];
        console.log("COCKPIT → INSIDEDAY READER LENGTH:", insideDayReaderData.length);
    } catch (err) {
        console.warn("InsideDay Reader Fetch Error:", err);
    }


    // ------------------------------------------------------
    // 3b) StrategyItems mit Reader-Daten & Basisdaten anreichern (Stage 3)
    // ------------------------------------------------------
    try {
        const baseItems = controllerState.strategyItems["stage3topping"] || [];

        const enriched = baseItems.map(stock => {
            const base = 
                controllerState.baseStocks.find(s => s.ticker === stock.ticker) ||
                controllerState.etfs.find(e => e.ticker === stock.ticker) ||
                {};
            const r = stage3ReaderData.find(x => x.ticker === stock.ticker);
            if (!r) return { ...base, ...stock };

            return {
                ...base,
                ...stock,
                // RAW-Werte
                stateActive: r.stateActive,
                daysAbove: r.daysAbove,
                slopeVal: r.slopeVal,
                indRank: r.indRank,
                smaDist: r.smaDist,
                triggerDate: r.triggerDate,
                totalScore: r.totalScore,

                // SCORE-Werte
                score_stateActive: r.score_stateActive ?? 0,
                score_age: r.score_age ?? 0,
                score_slope: r.score_slope ?? 0,
                score_indRank: r.score_indRank ?? 0,
                score_smaDist: r.score_smaDist ?? 0,

                sector: base.sector || stock.sector || "—",
                industry: base.industry || stock.industry || "—"
            };
        });

        controllerState.strategyItems["stage3topping"] = enriched;
        console.log("DEBUG Cockpit strategyItems (enriched):", controllerState.strategyItems);

    } catch (err) {
        console.warn("Stage3 Reader Merge Error:", err);
    }


// ------------------------------------------------------
    // 3c) StrategyItems mit Reader-Daten & Basisdaten anreichern (InsideDay52w)
    // ------------------------------------------------------
    try {
        // Nutze die Reader-Daten als Basis, falls loadStrategyStocks nichts lieferte
        const baseItems = controllerState.strategyItems["insideday52w"].length > 0 
            ? controllerState.strategyItems["insideday52w"] 
            : insideDayReaderData;

        const enriched = baseItems.map(stock => {
            const base = 
                controllerState.baseStocks.find(s => s.ticker === stock.ticker) ||
                controllerState.etfs.find(e => e.ticker === stock.ticker) ||
                {};
            const r = insideDayReaderData.find(x => x.ticker === stock.ticker);
            if (!r) return { ...base, ...stock };

             return {
                    ...base,
                    ...stock,
                    // InsideDay52w DB-Felder gemappt
                    tightness: r.s2_tightness,
                    volRatio: r.s2_vol_ratio,
                    isGreenInt: r.s2_is_green_int,
                    highVortag: r.s2_high_vortag,
                    lowVortag: r.s2_low_vortag,
                    setupStatus: r.s2_setup_status,
                    anchorHigh: r.s2_anchor_high,
                    anchorLow: r.s2_anchor_low,

                    // Renderer Top-Wert
                    strategyValue: r.s2_tightness,
                    value: r.s2_tightness,

                    sector: base.sector || stock.sector || "—",
                    industry: base.industry || stock.industry || "—"
                };
        });

        controllerState.strategyItems["insideday52w"] = enriched;
        console.log("DEBUG Cockpit InsideDay52w (enriched):", controllerState.strategyItems["insideday52w"]);

    } catch (err) {
        console.warn("InsideDay Reader Merge Error:", err);
    }

    // 4) Volume Extract
    controllerState.volumeExtract = computeVolumeExtract(stocks);

    // 5) Initiale Daten an Cockpit + Dashboard senden
    sendCockpitData();
    console.log("SEND DASHBOARD INIT SPARK:", controllerState.sparkSignals);

    sendDashboardInit();
}


// ------------------------------------------------------
// 3. Cockpit-Bridge (ALT)
// ------------------------------------------------------
function sendCockpitData() {
    sendResponse("COCKPIT_DATA", {
        stocks: controllerState.stocks,
        sectors: controllerState.sectors,
        industries: controllerState.industries,
        etfs: controllerState.etfs,
        midSignals: controllerState.midSignals,
        sparkSignals: controllerState.sparkSignals
    });
}

// ------------------------------------------------------
// 4. Dashboard INIT (NEU)
// ------------------------------------------------------
function sendDashboardInit() {
    const dashboardFrame = document.getElementById("iframe-new-dashboard");

    if (dashboardFrame?.contentWindow) {
        dashboardFrame.contentWindow.postMessage({
            type: "RESPONSE",
            action: "INIT",
            payload: {
                stocks: controllerState.stocks,
                sectors: controllerState.sectors,
                industries: controllerState.industries,
                etfs: controllerState.etfs,
                midSignals: controllerState.midSignals,
                sparkSignals: controllerState.sparkSignals,
                volumeExtract: controllerState.volumeExtract,
                strategyItems: controllerState.strategyItems
            }
        }, "*");
    }
}

// ------------------------------------------------------
// 5. Response Helper
// ------------------------------------------------------
function sendResponse(action, payload) {
    window.postMessage({
        type: "RESPONSE",
        action,
        payload
    }, "*");
}

// ------------------------------------------------------
// 6. REQUEST Handler
// ------------------------------------------------------
console.log("controllerInit wird jetzt aufgerufen");
controllerInit();

window.addEventListener("message", (event) => {
    const msg = event.data;
    if (!msg || msg.type !== "REQUEST") return;

    console.log("CockpitController: REQUEST erhalten:", msg.action);

    switch(msg.action) {

        case "INIT":
            // ❗ sendCockpitData() raus
            sendDashboardInit();
            break;

        case "FILTER_STOCKS":
            handleFilterStocks(msg.payload);
            // ❗ sendCockpitData() raus
            break;

        case "FILTER_SIGNALS":
            handleFilterSignals(msg.payload);
            // ❗ sendCockpitData() raus
            break;

        case "UPDATE_SIGNALS":
            controllerState.midSignals   = msg.payload.midSignals;
            controllerState.sparkSignals = msg.payload.sparkSignals;
            break;

        case "GET_STOCK_DETAILS":
            handleStockDetails(msg.payload);
            break;

        case "GET_LIST":
            handleList(msg.payload);
            break;

        case "GET_FOCUS_VIEW":
            handleFocusView(msg.payload);
            break;

        default:
            console.warn("Unbekannte Action:", msg.action);
    }
});


// ------------------------------------------------------
//  HANDLE FILTER SIGNALS
// ------------------------------------------------------
function handleFilterSignals(payload) {

    const { sparkLong, sparkExit, midLong, midExit } = payload;

    const sparkMap = controllerState.sparkSignals?.stocks || {};
    const midMap   = controllerState.midSignals?.stocks || {};

    const filteredStocks = controllerState.stocks.filter(stock => {

        const spark = sparkMap[stock.ticker];
        const mid   = midMap[stock.ticker];

        if (!sparkLong && !sparkExit && !midLong && !midExit) return true;

        if (sparkLong && (!spark || spark.signal !== "entry")) return false;
        if (sparkExit && (!spark || spark.signal !== "exit")) return false;

        if (midLong && (!mid || mid.signal_type !== "LONG")) return false;
        if (midExit && (!mid || mid.signal_type !== "EXIT")) return false;

        return true;
    });

    controllerState.stocks = filteredStocks;
}

// ------------------------------------------------------
//  Strategy Loader
// ------------------------------------------------------
async function loadStrategyStocks(strategyName) {
    const res = await fetch(`/api/strategy/${strategyName}`);
    const json = await res.json();
    return json.signals || [];
}


// ------------------------------------------------------
//  Strategy Merge (nur Cockpit)
// ------------------------------------------------------
function mergeStrategyWithDataLayer(strategyItems) {
    return strategyItems.map(item => {
        const base =
            controllerState.baseStocks.find(s => s.ticker === item.ticker) ||
            controllerState.etfs.find(e => e.ticker === item.ticker) ||
            {};

        return {
            ...base,
            ticker: item.ticker,
            strategyRank: item.strategyRank,
            strategyValue: item.strategyValue,
            sector_name: base.sector_name || item.sector || null,
            industry_name: base.industry_name || item.industry || null
        };
    });
}

// ------------------------------------------------------
//  FILTER STOCKS (Cockpit)
// ------------------------------------------------------
async function handleFilterStocks(payload) {

    const {
        strategy,
        index,
        search,
        sector,
        industry,
        sparkLong,
        sparkExit,
        midLong,
        midExit
    } = payload;

    const sparkMap = controllerState.sparkSignals?.stocks || {};
    const midMap   = controllerState.midSignals?.stocks || {};

    let filtered;

    if (!strategy || strategy === "none") {
        filtered = controllerState.baseStocks;
    } else {
        const strategyItems = await loadStrategyStocks(strategy);
        const merged = mergeStrategyWithDataLayer(strategyItems);
        filtered = merged;
    }

    if (index && index !== "all") {
        filtered = filtered.filter(s =>
            Array.isArray(s.index) && s.index.includes(index)
        );
    }

    if (search && search.length > 0) {
        const term = search.toUpperCase();
        filtered = filtered.filter(s =>
            s.ticker.toUpperCase().includes(term)
        );
    }

    if (sector) {
        filtered = filtered.filter(s => s.sector === sector);
    }

    if (industry) {
        filtered = filtered.filter(s => s.industry === industry);
    }

    filtered = filtered.filter(stock => {
        const spark = sparkMap[stock.ticker];
        const mid   = midMap[stock.ticker];

        if (!sparkLong && !sparkExit && !midLong && !midExit) return true;

        if (sparkLong && (!spark || spark.signal !== "entry")) return false;
        if (sparkExit && (!spark || spark.signal !== "exit")) return false;

        if (midLong && (!mid || mid.signal_type !== "LONG")) return false;
        if (midExit && (!mid || mid.signal_type !== "EXIT")) return false;

        return true;
    });

    controllerState.stocks = filtered;
}

// ------------------------------------------------------
//  STOCK DETAILS
// ------------------------------------------------------
function handleStockDetails(payload) {
    const ticker = payload?.ticker;
    if (!ticker) return;

    const stock = controllerState.stocks.find(s => s.ticker === ticker);
    if (!stock) return;

    sendResponse("STOCK_DETAILS", {
        ticker,
        stock,
        spark: controllerState.sparkSignals?.stocks?.[ticker] || null,
        mid: controllerState.midSignals?.stocks?.[ticker] || null
    });
}

// ------------------------------------------------------
//  LIST
// ------------------------------------------------------
function handleList(payload) {
    const { listType } = payload;

    let data = [];

    switch(listType) {
        case "stocks":     data = controllerState.stocks; break;
        case "sectors":    data = controllerState.sectors; break;
        case "industries": data = controllerState.industries; break;
        case "etfs":       data = controllerState.etfs; break;
        default:
            console.warn("handleList: unbekannter listType:", listType);
            return;
    }

    sendResponse("LIST_DATA", { listType, data });
}

// ------------------------------------------------------
//  FOCUS VIEW
// ------------------------------------------------------
function handleFocusView(payload) {
    const { ticker } = payload;

    const stock = controllerState.stocks.find(s => s.ticker === ticker);
    if (!stock) return;

    sendResponse("FOCUS_VIEW_DATA", {
        ticker,
        stock,
        spark: controllerState.sparkSignals?.stocks?.[ticker] || null,
        mid: controllerState.midSignals?.stocks?.[ticker] || null
    });
}
