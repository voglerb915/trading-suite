import { updateTile, updateStepStatus } from "../logic.js";

export const CALC_STEPS = [
    { key: "short", label: "Short-Strategie" },
    { key: "metrics", label: "Update-Metrics" }
];

export async function triggerCalculation() {
    const start = performance.now();

    updateStepStatus("short", "running");
    await runShortStrategy();
    updateStepStatus("short", "success");
    updateTile("calculations", { progress: 50 });

    updateStepStatus("metrics", "running");
    await runUpdateMetrics();
    updateStepStatus("metrics", "success");
    updateTile("calculations", { progress: 100 });

    const end = performance.now();
    return { duration: ((end - start) / 1000).toFixed(2) + "s" };
}

async function runShortStrategy() {
    const res = await fetch("http://localhost:4000/api/short-strategy-1/update-short-strategy");
    if (!res.ok) throw new Error(await res.text());
    return await res.text();
}

async function runUpdateMetrics() {
    const res = await fetch("http://localhost:4000/api/calculations/update-metrics");
    if (!res.ok) throw new Error(await res.text());
    return await res.text();
}
