const { strategy52wHigh } = require("./strategies/strategy52wHigh.js");

/**
 * StrategyEngine
 *
 * Führt eine ausgewählte Strategie aus und merged die Ergebnisse
 * in die bestehende Stock-Liste.
 *
 * @param {Array} stocks - vollständige Stockliste
 * @param {String} strategyName - z. B. "52wHigh" oder "none"
 * @returns {Array} stocks mit strategyRank & strategyValue
 */
function runStrategy(stocks, strategyName = "none") {

    // 1) Keine Strategy ausgewählt → Stocks unverändert zurückgeben
    if (!strategyName || strategyName === "none") {
        return stocks.map(s => ({
            ...s,
            strategyRank: null,
            strategyValue: null
        }));
    }

    // 2) Strategy auswählen
    let strategyFn = null;

    switch (strategyName) {
        case "52wHigh":
            strategyFn = strategy52wHigh;
            break;

        default:
            console.warn(`Strategy '${strategyName}' nicht gefunden.`);
            return stocks.map(s => ({
                ...s,
                strategyRank: null,
                strategyValue: null
            }));
    }

    // 3) Strategy ausführen
    const results = strategyFn(stocks);

    // 4) Ergebnisse in Map für schnelles Lookup
    const resultMap = new Map();
    results.forEach(r => resultMap.set(r.ticker, r));

    // 5) Strategy-Werte in Stocks mergen
    const merged = stocks.map(stock => {
        const strat = resultMap.get(stock.ticker);

        return {
            ...stock,

            strategyRank: strat?.strategyRank ?? null,
            strategyValue: strat?.strategyValue ?? null,

            // globalRank bleibt wie er ist
            globalRank: stock.rankWonDb ?? stock.globalRank ?? null
        };
    });

    // 6) Sortierung: StrategyRank zuerst, dann globalRank
    merged.sort((a, b) => {
        const srA = a.strategyRank ?? Infinity;
        const srB = b.strategyRank ?? Infinity;

        if (srA !== srB) return srA - srB;

        const grA = a.globalRank ?? Infinity;
        const grB = b.globalRank ?? Infinity;

        return grA - grB;
    });

    return merged;
}

module.exports = { runStrategy };
