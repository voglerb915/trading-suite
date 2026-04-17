const CALC_STEPS = [
    { key: "short", label: "Short-Strategie" },
    { key: "metrics", label: "Update-Metrics" }
    // später: { key: "agg", label: "Aggregationen" }
    // später: { key: "market", label: "Marktstruktur" }
];


export async function renderControlTiles() {
    const root = document.getElementById("control-center-root");

    root.insertAdjacentHTML("beforebegin", `
        <div id="log-modal" class="log-modal hidden">
            <div class="log-modal-content">
                <h3 id="log-title"></h3>
                <pre id="log-body"></pre>
                <button id="log-close">Schließen</button>
            </div>
        </div>
    `);

    root.innerHTML = `
        ${tile("downloads", "📥", "Downloads")}
        ${tile("calculations", "🧮", "Berechnungen")}
        ${tile("checks", "🔍", "Prüfungen")}
    `;

    setupTileEvents();

    // 🔥 Persistenten Status laden
    await loadPersistedStatus();
}



function tile(key, icon, title) {
    const isCalc = key === "calculations";

    return `
        <div class="control-tile" id="tile-${key}">
            <div class="tile-icon">${icon}</div>
            <div class="tile-title">${title}</div>
            <div class="tile-status" id="status-${key}">Bereit</div>

            <div class="tile-progress">
                <div class="tile-progress-bar" id="progress-${key}"></div>
            </div>

            <!-- 🔍 HIER KOMMT DER CHECKS-BLOCK REIN -->
            ${key === "checks" ? `
                <div class="tile-results" id="results-checks"></div>
            ` : ""}

            ${isCalc ? `
                <div class="tile-steps" id="steps-${key}">
                    ${CALC_STEPS.map(s => `
                        <div class="tile-step" id="step-${s.key}">
                            <span class="step-label">${s.label}</span>
                            <span class="step-status" id="step-status-${s.key}">–</span>
                        </div>
                    `).join("")}
                </div>
            ` : ""}

            <div class="tile-meta">
                <div id="last-${key}">Letzter Lauf: –</div>
                <div id="duration-${key}">Dauer: –</div>
            </div>
        </div>
    `;
}




function setupTileEvents() {
    ["downloads", "calculations", "checks"].forEach(key => {
        document.getElementById(`tile-${key}`).addEventListener("click", () => {
            runTileProcess(key);
        });
    });
}

function openLogModal(title, body) {
    document.getElementById("log-title").textContent = title;
    document.getElementById("log-body").textContent = body;
    document.getElementById("log-modal").classList.remove("hidden");
}

document.addEventListener("click", (e) => {
    if (e.target.id === "log-close") {
        document.getElementById("log-modal").classList.add("hidden");
    }
});


async function runTileProcess(key) {
    updateTile(key, { status: "running", progress: 0 });

    // simulateProgress nur für calculations & checks
    if (key !== "downloads") {
        simulateProgress(key);
    }

    const startTime = Date.now();   // ⏱️ Startzeit für ALLE Tiles

    try {
        let response;

        if (key === "downloads") {
            response = await runDownloads();   // SSE übernimmt Fortschritt
        }

        if (key === "calculations") {
            response = await triggerCalculation();
        }

        if (key === "checks") {
            response = await runChecks();
        }

        // Falls die Funktion keine Dauer liefert → selbst berechnen
        const endTime = Date.now();
        const durationMs = endTime - startTime;
        const duration = response?.duration ?? formatDuration(durationMs);

                updateTile(key, {
            status: "success",
            progress: 100,
            lastRun: new Date(),
            duration
        });

        // 🔥 Status speichern
        await saveTileStatus(key, {
            status: "success",
            lastRun: new Date(),
            duration,
            ...(key === "checks" ? { sections: response.sections } : {}),
            ...(key !== "checks" ? { details: response.details ?? {} } : {})
        });


    } catch (err) {
        updateTile(key, {
            status: "error",
            progress: 100,
            lastRun: new Date(),
            duration: "Fehler"
        });

        await saveTileStatus(key, {
            status: "error",
            lastRun: new Date(),
            duration: "Fehler"
        });

    }
}

function formatDuration(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
}



function updateStepStatus(stepKey, status) {
    const el = document.getElementById(`step-status-${stepKey}`);
    el.textContent = status === "pending" ? "–" :
                     status === "running" ? "⏳" :
                     status === "success" ? "✔️" :
                     status === "error" ? "❌" : status;

    el.className = `step-status ${status}`;
}


async function triggerCalculation() {
    const start = performance.now();

    // Schritt 1: Short-Strategie
    updateStepStatus("short", "running");
    await runShortStrategy();
    updateStepStatus("short", "success");
    updateTile("calculations", { progress: 50 });

    // Schritt 2: Update-Metrics
    updateStepStatus("metrics", "running");
    await runUpdateMetrics();
    updateStepStatus("metrics", "success");
    updateTile("calculations", { progress: 100 });

    const end = performance.now();
    return { duration: ((end - start) / 1000).toFixed(2) + "s" };
}


// ----------------------------------------------------
// Die beiden Prozessfunktionen kommen DIREKT hier drunter
// ----------------------------------------------------

async function runShortStrategy() {
    console.log("Short-Strategie gestartet...");

    const res = await fetch("http://localhost:4000/api/short-strategy-1/update-short-strategy");

    if (!res.ok) {
        throw new Error(await res.text());
    }

    return await res.text();
}




async function runUpdateMetrics() {
    console.log("Update-Metrics gestartet...");

    const res = await fetch("http://localhost:4000/api/calculations/update-metrics");

    if (!res.ok) {
        throw new Error(await res.text());
    }

    return await res.text();
}

// Downloads
async function runDownloads() {
    return new Promise((resolve, reject) => {
        const evtSource = new EventSource("/api/downloads/stream");

        evtSource.addEventListener("progress", (e) => {
            const data = JSON.parse(e.data);
            const percent = Math.round((data.current / data.total) * 100);

            updateTile("downloads", {
                progress: percent,
                status: `Lade ${data.current}/${data.total} (${data.ticker})`
            });
        });

        // ❗ Fehler NICHT als Abbruch behandeln
        evtSource.addEventListener("error", (e) => {
            console.warn("SSE warning:", e);
            // NICHT parsen, NICHT abbrechen, NICHT anzeigen
            // EventSource bleibt offen und läuft weiter
        });

        evtSource.addEventListener("done", (e) => {
            evtSource.close();
            resolve({ duration: "–" });
        });
    });
}



// Prüfungen
async function runChecks() {
    console.log("Prüfungen gestartet...");

    const res = await fetch("http://localhost:4000/api/checks/all");

    if (!res.ok) {
        openLogModal("Prüfungen – Fehler", await res.text());
        throw new Error("Fehler bei Prüfungen");
    }

    const json = await res.json();

    // ----------------------------------------------------
    // 1) Alte Struktur (json.results) → neue Struktur (sections)
    // ----------------------------------------------------
    const sections = {
        finviz: {
            title: "Finviz-Daten",
            status: "success",
            items: []
        },
        yahoo: {
            title: "Yahoo-Daten + Berechnungen",
            status: "success",
            items: []
        },
        journal: {
            title: "Trading-Journal",
            status: "success",
            items: []
        }
    };

    for (const db of json.results) {
        const dbName = db.database.toLowerCase();

        let target = null;
        if (dbName.includes("finviz")) target = sections.finviz;
        if (dbName.includes("yahoo")) target = sections.yahoo;
        if (dbName.includes("journal")) target = sections.journal;

        if (!target) continue;

        for (const t of db.tables) {
            target.items.push({
                name: t.table,
                status: t.ok ? "success" : "error",
                lastDate: t.lastDateStr ?? null,
                totalCount: t.totalCount ?? null,
                countAtLastDate: t.countAtLastDate ?? null
            });

            if (!t.ok) {
                target.status = "error";
            }
        }
    }

    // ----------------------------------------------------
    // 2) Ergebnisse in der Kachel anzeigen (Option C)
    // ----------------------------------------------------
    renderCheckSections(sections);

    // ----------------------------------------------------
    // 3) Fehler-Popup nur bei Fehlern
    // ----------------------------------------------------
    if (!json.ok) {
        openLogModal("Prüfungen – Fehler", JSON.stringify(json, null, 2));
    }

    // ----------------------------------------------------
    // 4) sections zurückgeben → wird in saveTileStatus gespeichert
    // ----------------------------------------------------
    return { sections };
}


function formatSqlDate(date) {
    const d = new Date(date);
    return d.getFullYear() + "-" +
           String(d.getMonth() + 1).padStart(2, "0") + "-" +
           String(d.getDate()).padStart(2, "0");
}

function renderCheckResults(data) {
    const root = document.getElementById("results-checks");
    if (!root) return;

    root.innerHTML = data.results.map(db => `
        <div class="check-db-block">
            <div class="check-db-title">${db.database}</div>
            <div class="check-table-list">
                ${db.tables.map(t => `
                    <div class="check-table-row ${t.ok ? "ok" : "fail"}">
                        <span>${t.table}</span>
                        <span>${t.ok ? "✔️" : "❌"}</span>
                    </div>

                    ${t.ok && t.lastDate ? `
                        <div class="check-table-details">
                            <div>Datum: ${t.lastDateStr ?? "–"}</div>
                            <div>Gesamt: ${t.totalCount}</div>
                            <div>Letzter Tag: ${t.countAtLastDate}</div>
                        </div>
                    ` : ""}
                `).join("")}
            </div>
        </div>
    `).join("");
}


function simulateProgress(key) {
    let p = 0;
    const interval = setInterval(() => {
        p += 8;
        updateTile(key, { progress: p });
        if (p >= 90) clearInterval(interval);
    }, 120);
}

function updateTile(key, data) {
    const tile = document.getElementById(`tile-${key}`);
    const status = document.getElementById(`status-${key}`);
    const progress = document.getElementById(`progress-${key}`);

    if (data.status) {
        tile.className = `control-tile ${data.status}`;
        status.textContent = data.status;
    }

    if (data.progress !== undefined) {
        progress.style.width = data.progress + "%";
    }

    if (data.lastRun) {
        document.getElementById(`last-${key}`).textContent =
            "Letzter Lauf: " + data.lastRun.toLocaleString();
    }

    if (data.duration) {
        document.getElementById(`duration-${key}`).textContent =
            "Dauer: " + data.duration;
    }
}

async function loadPersistedStatus() {
    try {
        const res = await fetch("/api/cockpit/status");
        if (!res.ok) return;

        const status = await res.json();

        // Downloads
        if (status.downloads) {
            updateTile("downloads", status.downloads);
        }

        // Calculations
        if (status.calculations) {
            updateTile("calculations", status.calculations);
        }

        // Checks
        if (status.checks) {
            updateTile("checks", status.checks);

            if (status.checks.sections) {
                renderCheckSections(status.checks.sections);
            }
        }

    } catch (err) {
        console.warn("Status konnte nicht geladen werden:", err);
    }
}


async function saveTileStatus(tile, payload) {
    try {
        await fetch(`/api/cockpit/status/${tile}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
    } catch (err) {
        console.warn("Status konnte nicht gespeichert werden:", err);
    }
}

function renderCheckSections(sections) {
    const root = document.getElementById("results-checks");
    if (!root) return;

    const ICONS = {
        finviz: "📊",
        yahoo: "📈",
        journal: "📘"
    };

    root.innerHTML = Object.entries(sections).map(([key, sec]) => `
        <div class="check-section">
            <div class="check-section-title">
                <span class="check-icon">${ICONS[key]}</span>
                <span>${sec.title}</span>
            </div>

            <div class="check-section-box ${sec.status}">
                ${sec.items.map(item => `
                    <div class="check-row ${item.status}">
                        <span>${item.name}</span>
                        <span>${item.status === "success" ? "✔️" : "❌"}</span>
                    </div>
                `).join("")}
            </div>
        </div>
    `).join("");
}
