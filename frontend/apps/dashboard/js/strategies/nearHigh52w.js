export function nearHigh52w(stocks) {
    return stocks
        .filter(s =>
            typeof s["52w_high"] === "number" &&
            s["52w_high"] >= -5 &&
            s["52w_high"] <= 0 &&
            s.industry !== "Shell Companies"
        )
        .sort((a, b) => b["52w_high"] - a["52w_high"]);
}
