const CALC_STEPS = [
    { key: "short", label: "Short-Strategie" },
    { key: "metrics", label: "Update-Metrics" }
    // später: { key: "agg", label: "Aggregationen" }
    // später: { key: "market", label: "Marktstruktur" }
];


export function renderControlTiles() {
    const root = document.getElementById("control-center-root");

    // Modal direkt hier einfügen – root existiert sicher
    root.insertAdjacentHTML("beforebegin", `
        <div id="log-modal" class="log-modal hidden">
            <div class="log-modal-content">
                <h3 id="log-title"></h3>
                <pre id="log-body"></pre>
                <button id="log-close">Schließen</button>
            </div>
        </div>
    `);

    // Jetzt die Kacheln rendern
    root.innerHTML = `
        ${tile("downloads", "📥", "Downloads")}
        ${tile("calculations", "🧮", "Berechnungen")}
        ${tile("checks", "🔍", "Prüfungen")}
    `;

    setupTileEvents();
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
    simulateProgress(key);

    try {
        let response;

        if (key === "calculations") {
            response = await triggerCalculation();
        }

        updateTile(key, {
            status: "success",
            progress: 100,
            lastRun: new Date(),
            duration: response?.duration ?? "–"
        });

    } catch (err) {
        updateTile(key, {
            status: "error",
            progress: 100,
            lastRun: new Date(),
            duration: "Fehler"
        });
    }
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

    const res = await fetch("http://localhost:4000/api/calculations/short-strategy");

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
