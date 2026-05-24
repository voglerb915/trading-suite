/**
 * Strategy: 52-Week-High (Finviz-Logik)
 *
 * Finviz liefert KEINEN echten 52W-Hochpreis.
 * Stattdessen liefert Finviz:
 *
 *   _52w_high = Tagesgewinn in %, aber nur,
 *               wenn die Aktie HEUTE ein neues 52W-Hoch gemacht hat.
 *
 * Diese Strategy filtert:
 *   → Nur Aktien mit neuem 52W-Hoch (s._52w_high > 0)
 *   → Sortiert nach Tagesgewinn (stärkste zuerst)
 *
 * Output:
 *   - strategyRank
 *   - strategyValue (z. B. "+2.91%")
 *   - globalRank (aus deinem Hauptsystem)
 */

function strategy52wHigh(stocks) {

    // 1) Kandidaten filtern
    const candidates = stocks
        .filter(s => s._52w_high != null && s._52w_high > 0)
        .sort((a, b) =>
            (b._52w_high ?? 0) - (a._52w_high ?? 0) ||
            a.ticker.localeCompare(b.ticker)
        );

    // 2) Strategy-Objekte erzeugen
    return candidates.map((stock, index) => ({
        ticker: stock.ticker,
        sector: stock.sector,
        industry: stock.industry,

        strategyRank: index + 1,
        strategyValue: `${stock._52w_high.toFixed(2)}%`,

        globalRank: stock.rankWonDb ?? null,

        price: stock.price ?? null,
        data: stock.data ?? [],
        anl_datum: stock.anl_datum ?? null
    }));
}

module.exports = { strategy52wHigh };
