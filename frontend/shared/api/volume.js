export async function getVolumeMetrics() {
    const res = await fetch("/api/volume-metrics");
    if (!res.ok) throw new Error("Volume API Error");
    return res.json();
}
