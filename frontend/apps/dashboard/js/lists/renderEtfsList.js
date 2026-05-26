export function renderEtfsList(etfs, container) {
    container.innerHTML = "";

    if (!etfs || etfs.length === 0) {
        container.innerHTML = "<p>Keine ETF-Daten verfügbar.</p>";
        return;
    }

    etfs.forEach(etf => {
        const row = document.createElement("div");
        row.className = "etf-row";

        // 🟢 Kein Durcheinander mehr: Identische Feldnamen wie im gesamten System!
        const ticker = etf.ticker || "—";
        const companyName = etf.company || "—";
        const rank = etf.rsRank ?? "—";
        const score = typeof etf.rsScore === "number" ? etf.rsScore.toFixed(2) : "—";

        row.innerHTML = `
            <div class="etf-left">
                <div class="etf-ticker">${ticker}</div>
                <div class="etf-name">${companyName}</div>
            </div>

            <div class="etf-right">
                <div class="etf-rank">Rank: ${rank}</div>
                <div class="etf-score">Score: ${score}</div>
            </div>
        `;

        row.onclick = () => {
            if (typeof window.openChartModal === "function") {
                window.openChartModal(ticker);
            }
        };

        container.appendChild(row);
    });
}