// apps/dashboard/js/structure/header/renderDashboardHeaderRight.js

export function renderDashboardHeaderRight(state) {
    const container = document.getElementById("dashboard-header-right");

    container.innerHTML = `
        <div class="control-block">

            <div class="strategy-row">
                <label for="strategy-select">Strategy:</label>
                <select id="strategy-select">
                    <option value="none">none</option>
                    <option value="high52">52-week High</option>
                    <option value="insideday52w">Inside Day @ 52W-High</option>
                    <option value="nearhigh52">Max. 5% below High</option>
                    <option value="stage3topping">Stage3 to Stage4</option>
                </select>
            </div>

            <div class="strategy-row">
                <label for="index-select">Index:</label>
                <select id="index-select">
                    <option value="all">All</option>
                    <option value="DJIA">DJIA</option>
                    <option value="NDX">NASDAQ-100</option>
                    <option value="S&P 500">S&P 500</option>
                    <option value="RUT">Russell 2000</option>
                </select>
            </div>

            <div id="ticker-search-container">
                <input id="ticker-search" type="text" placeholder="Ticker search..." autocomplete="off" />
                <button id="search-btn">Search</button>
                <div id="search-suggestions" class="suggestions"></div>
            </div>

        </div>
    `;

    // -----------------------------------------
    // EVENTS (werden später erweitert)
    // -----------------------------------------

    document.getElementById("strategy-select").addEventListener("change", (e) => {
        document.dispatchEvent(new CustomEvent("dashboard:strategyChange", {
            detail: e.target.value
        }));
    });

    document.getElementById("index-select").addEventListener("change", (e) => {
        document.dispatchEvent(new CustomEvent("dashboard:indexChange", {
            detail: e.target.value
        }));
    });

    document.getElementById("search-btn").addEventListener("click", () => {
        const value = document.getElementById("ticker-search").value.trim();
        if (value.length > 0) {
            document.dispatchEvent(new CustomEvent("dashboard:search", {
                detail: value
            }));
        }
    });
}
