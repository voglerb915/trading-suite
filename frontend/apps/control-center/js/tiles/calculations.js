import { updateTile, saveTileStatus, loadPersistedStatus } from "../logic.js";
import { formatTimestamp } from "../../../../shared/utils/time.js";

export function renderCalculationsTable(state = {}) {
    const root = document.getElementById("results-calculations");
    if (!root) return;

    const rows = [
        { key: "RS_Sectors", label: "RS Sectors JSON", action: "rssectors" },
        { key: "RS_Industries", label: "RS Industries JSON", action: "rsindustries" },
        { key: "RS_Stocks", label: "RS Stocks JSON", action: "rsstocks" },
        { key: "ShortStrategy", label: "Short-Strategie", action: "short" },
        { key: "Metrics", label: "Update-Metrics", action: "metrics" }
    ];

    root.innerHTML = `
        <table class="downloads-table">
            <colgroup>
                <col><col><col><col><col>
            </colgroup>

            <thead>
                <tr>
                    <th>Berechnung</th>
                    <th style="text-align: center;">Status</th>
                    <th style="text-align: center;">Letzter Lauf</th>
                    <th style="text-align: center;">Dauer</th>
                    <th style="text-align: center;">Aktion</th>
                </tr>
            </thead>

            <tbody>
                ${rows.map(r => {
                    const s = state[r.key] || {};

                    // 🔥 NEUE STATUS-LOGIK (status + ok unterstützt)
                    const ok = s.ok === true || s.status === "success";
                    const isError = s.ok === false || s.status === "error";

                    return `
                        <tr class="${ok ? "success" : (isError ? "error" : "")}">
                            <td>${r.label}</td>
                            <td>${ok ? "✔️" : (isError ? "❌" : "–")}</td>
                            <td>${s.lastRun ? formatTimestamp(s.lastRun) : "–"}</td>
                            <td>${s.duration || "–"}</td>
                            <td class="calc-action" data-action="${r.action}" style="cursor: pointer;">⚙️</td>
                        </tr>
                    `;
                }).join("")}
            </tbody>
        </table>
    `;

    // EINZIGER Event-Handler (Delegation)
    root.onclick = (e) => {
        const el = e.target.closest(".calc-action");
        if (!el) return;

        const action = el.dataset.action;
        el.style.opacity = "0.5";

        let promise;

        if (action === "short") {
            promise = runShortStrategyAction();
        }

        if (action === "metrics") {
            promise = runMetricsAction();
        }

        if (action === "rssectors") {
            promise = runRsSectorsWriter();
        }

        if (action === "rsindustries") {
            promise = runRsIndustriesWriter();
        }

        if (action === "rsstocks") {
            promise = runRsStocksWriter();
        }

        promise.finally(() => {
            el.style.opacity = "1";
            renderCalculationsTable(window.__persistedState.calculations);
        });
    };
}

/* ============================================================
   ACTION: SHORT-STRATEGIE
============================================================ */
async function runShortStrategyAction() {
    const start = performance.now();

    try {
        const res = await fetch("http://localhost:4000/api/short-strategy-1/update-short-strategy");
        if (!res.ok) throw new Error(await res.text());

        await saveTileStatus("calculations", {
            ShortStrategy: {
                status: "success",
                lastRun: new Date(),
                duration: ((performance.now() - start) / 1000).toFixed(1) + "s"
            }
        });

    } catch (err) {
        await saveTileStatus("calculations", {
            ShortStrategy: {
                status: "error",
                lastRun: new Date(),
                duration: "–"
            }
        });
    }

    await loadPersistedStatus();
}

/* ============================================================
   ACTION: METRICS
============================================================ */
async function runMetricsAction() {
    const start = performance.now();

    try {
        const res = await fetch("http://localhost:4000/api/calculations/update-metrics");
        if (!res.ok) throw new Error(await res.text());

        await saveTileStatus("calculations", {
            Metrics: {
                status: "success",
                lastRun: new Date(),
                duration: ((performance.now() - start) / 1000).toFixed(1) + "s"
            }
        });

    } catch (err) {
        await saveTileStatus("calculations", {
            Metrics: {
                status: "error",
                lastRun: new Date(),
                duration: "–"
            }
        });
    }

    await loadPersistedStatus();
}

/* ============================================================
   ACTION: RS Sectors WRITER
============================================================ */
async function runRsSectorsWriter() {
    const start = performance.now();

    try {
        const res = await fetch("http://localhost:4000/api/rs/write-sectors");
        const data = await res.json();

        await saveTileStatus("calculations", {
            RS_Sectors: {
                status: data.success ? "success" : "error",
                lastRun: new Date(),
                duration: ((performance.now() - start) / 1000).toFixed(1) + "s"
            }
        });

    } catch (err) {
        await saveTileStatus("calculations", {
            RS_Sectors: {
                status: "error",
                lastRun: new Date(),
                duration: "–"
            }
        });
    }

    await loadPersistedStatus();
}

/* ============================================================
   ACTION: RS Industries WRITER (Platzhalter)
============================================================ */
async function runRsIndustriesWriter() {
    const start = performance.now();

    try {
        const res = await fetch("http://localhost:4000/api/rs/write-industries");
        const data = await res.json();

        await saveTileStatus("calculations", {
            RS_Industries: {
                status: data.success ? "success" : "error",
                lastRun: new Date(),
                duration: ((performance.now() - start) / 1000).toFixed(1) + "s"
            }
        });

    } catch (err) {
        await saveTileStatus("calculations", {
            RS_Industries: {
                status: "error",
                lastRun: new Date(),
                duration: "–"
            }
        });
    }

    await loadPersistedStatus();
}

/* ============================================================
   ACTION: RS Stocks WRITER (Platzhalter)
============================================================ */
async function runRsStocksWriter() {
    const start = performance.now();

    try {
        const res = await fetch("http://localhost:4000/api/rs/write-stocks");
        const data = await res.json();

        await saveTileStatus("calculations", {
            RS_Stocks: {
                status: data.success ? "success" : "error",
                lastRun: new Date(),
                duration: ((performance.now() - start) / 1000).toFixed(1) + "s"
            }
        });

    } catch (err) {
        await saveTileStatus("calculations", {
            RS_Stocks: {
                status: "error",
                lastRun: new Date(),
                duration: "–"
            }
        });
    }

    await loadPersistedStatus();
}
