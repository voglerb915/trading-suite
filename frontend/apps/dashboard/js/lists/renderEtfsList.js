// frontend/apps/dashboard/js/lists/renderEtfsList.js

export function renderEtfsList(etfs, container) {
    container.innerHTML = "";

    if (!etfs || etfs.length === 0) {
        container.innerHTML = "<p>Keine ETF-Daten verfügbar.</p>";
        return;
    }

    etfs.forEach(etf => {
        const row = document.createElement("div");
        row.className = "etf-row";

        row.innerHTML = `
            <div class="etf-left">
                <div class="etf-ticker">${etf.ticker}</div>
                <div class="etf-name">${etf.name}</div>
            </div>

            <div class="etf-right">
                <div class="etf-rank">Rank: ${etf.rankWonDb}</div>
                <div class="etf-score">Score: ${etf.score.toFixed(2)}</div>
            </div>
        `;

        row.onclick = () => openChartModal(etf.ticker);

        container.appendChild(row);
    });
}
