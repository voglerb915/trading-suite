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
 
 */

function strategy52wHigh(finvizRows) {
    const candidates = finvizRows
        .filter(row =>
            row._52w_high > 0 &&
            !(row.sector === "Financial" && row.industry === "Exchange Traded Fund")
        )
        .sort((a, b) => (b._52w_high ?? 0) - (a._52w_high ?? 0));

    return candidates.map((row, index) => ({
        ticker: row.ticker,
        strategyRank: index + 1,
        strategyValue: row._52w_high
    }));
}

module.exports = { strategy52wHigh };
