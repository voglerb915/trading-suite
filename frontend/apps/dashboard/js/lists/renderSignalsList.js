import { sectorClasses } from "../../../../shared/logic/sectorColors.js";

export function renderSignalsList(signals = [], state = {}) {
    const listEl = document.getElementById("tools-tab-content");
    const pillContainer = document.getElementById("tools-pill-container");

    if (!listEl) return;

    // 🟢 Pille aktualisieren (Anzahl Signale)
    if (pillContainer) {
        pillContainer.innerHTML = `
            <span class="pill pill-small">${signals.length}</span>
        `;
    }

    // 🟡 Keine Signale
    if (!signals.length) {
        listEl.innerHTML = `
            <li class="stock-item empty">Keine Signale verfügbar</li>
        `;
        return;
    }

    // 🟢 Sortierung nach signal_age_index
    const sorted = [...signals].sort(
        (a, b) => Number(a.signal_age_index) - Number(b.signal_age_index)
    );

    // 🟢 Liste rendern
    const html = sorted.map(item => {
        const ticker = item.ticker ?? "—";
        const sector = item.sector ?? "";
        const industry = item.industry ?? "—";
        const isSelected = ticker === state.ticker;

        const sectorClass = sectorClasses[sector] ?? "";

        // Phase Badge
        const phase = item.market_phase ?? "—";
        const phaseColor = item.phase_color ?? "gray";

        // Age Bars
        const bars = [1, 2, 3, 4, 5].map(i => {
            const active = i === Number(item.signal_age_index);
            const color = active
                ? (item.signal_type === "LONG" ? "bg-green" : "bg-red")
                : "";
            return `<div class="bar bar-${i} ${color}"></div>`;
        }).join("");

        return `
            <li class="stock-item ${sectorClass} ${isSelected ? "highlight-ticker" : ""}"
                onclick="handleStockClick('${ticker}')">

                <div class="stock-row-inner">

                    <!-- LINKS -->
                    <div class="stock-left">
                        ${isSelected ? "▶ " : ""}
                        <strong>${ticker}</strong>

                        <span class="signal-chart-icon" title="Chart öffnen">
                            <i class="fa-solid fa-chart-line"></i>
                        </span>

                        <br>
                        <span class="stock-sub">${sector} | ${industry}</span>
                    </div>

                    <!-- RECHTS -->
                    <div class="stock-right signal-right">
                        <div class="phase-badge bg-${phaseColor}"
                             onclick="event.stopPropagation(); handleMarketPhaseClick('${phase}')">
                             ${phase}
                        </div>

                        <div class="signal-visual">${bars}</div>
                    </div>

                </div>
            </li>
        `;
    }).join("");

    listEl.innerHTML = html;

    // 🟢 Chart‑Icons aktivieren
    listEl.querySelectorAll(".signal-chart-icon").forEach(icon => {
        icon.addEventListener("click", e => {
            e.stopPropagation();
            const ticker = icon.closest("li").querySelector("strong").innerText.trim();
            updateChart(ticker);
        });
    });
}
