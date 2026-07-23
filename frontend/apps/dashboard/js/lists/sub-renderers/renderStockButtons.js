export function renderStockButtons() {
    const btnContainer = document.getElementById("stocks-button-container");
    if (btnContainer && btnContainer.children.length === 0) {
        btnContainer.innerHTML = `
            <button class="export-btn" id="btn-to-watchlist" title="Send to Watchlist">
                <svg viewBox="0 0 24 24" style="fill:#6A1B9A; width:20px; height:20px;"><path d="M3 4v16h18V4H3zm2 2h14v12H5V6zm2 2v2h10V8H7zm0 4v2h6v-2H7z"/></svg>
            </button>
            <button class="export-btn" id="export-tv" title="Export for TradingView">
                <svg viewBox="0 0 36 28" xmlns="http://www.w3.org/2000/svg" style="width:22px; height:18px; vertical-align: middle;">
                    <path d="M14 22H7V11H0V4h14v18zM28 22h-8l7.5-18h8L28 22z" fill="currentColor"/>
                    <circle cx="20" cy="8" r="4" fill="currentColor"/>
                </svg>
            </button>
            <button class="export-btn" id="export-hp" title="Export for Homepage">
                <svg viewBox="0 0 24 24" style="fill:#43A047; width:20px; height:20px;"><path d="M12 3l9 8h-3v10h-12v-10h-3z"/></svg>
            </button>
            <button class="export-btn" id="export-analyse" title="Analysis-Export">
                <svg viewBox="0 0 24 24" style="fill:#FB8C00; width:20px; height:20px;"><path d="M5 4h3v16h-3zm6 6h3v10h-3zm6-4h3v14h-3z"/></svg>
            </button>
        `;
    }
}