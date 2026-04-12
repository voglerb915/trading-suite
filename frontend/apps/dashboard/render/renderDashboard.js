export function renderDashboardOverview(data) {
    const container = document.getElementById("dashboard-content");
    if (!container) return;

    const topPerformers = data
        .filter(item => item.ratio > 2)
        .sort((a, b) => b.ratio - a.ratio)
        .slice(0, 8);

    container.innerHTML = `
        <div class="dashboard-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; padding: 20px;">
            ${topPerformers.map(item => `
                <div class="dash-card" data-ticker="${item.ticker}"
                     style="background: #1e1e1e; border: 1px solid #333; padding: 15px; border-radius: 8px; cursor: pointer;">
                    <div style="color: #ffa500; font-weight: bold; font-size: 1.2rem;">${item.ticker}</div>
                    <div style="font-size: 0.9rem; color: #ccc; margin-top: 5px;">Ratio: ${Number(item.ratio).toFixed(1)}x</div>
                    <div style="font-size: 1.1rem; margin-top: 10px;">${item.close ? item.close.toFixed(2) : '---'} $</div>
                </div>
            `).join('')}
        </div>
    `;

    container.querySelectorAll('.dash-card').forEach(card => {
        card.addEventListener('click', () => {
            const ticker = card.getAttribute('data-ticker');
            document.dispatchEvent(new CustomEvent("dashboard:cardClick", { detail: ticker }));
        });
    });
}
