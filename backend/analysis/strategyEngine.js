const { strategy52wHigh } = require("./strategies/strategy52wHigh.js");

function runStrategy(stocks, strategyName = "none") {

    // 1) Keine Strategy → leere Trefferliste
    if (!strategyName || strategyName === "none") {
        return [];
    }

    // 2) Strategy auswählen
    let strategyFn = null;

    switch (strategyName) {
        case "52wHigh":
            strategyFn = strategy52wHigh;
            break;

        default:
            console.warn(`Strategy '${strategyName}' nicht gefunden.`);
            return [];
    }

    // 3) Strategy ausführen → liefert Trefferliste
    const results = strategyFn(stocks);

    // 4) StrategyEngine sortiert NUR nach strategyRank
    results.sort((a, b) => {
        const srA = a.strategyRank ?? Infinity;
        const srB = b.strategyRank ?? Infinity;
        return srA - srB;
    });

    // 5) StrategyEngine gibt NUR Strategy-Daten zurück
    return results;
}

module.exports = { runStrategy };
