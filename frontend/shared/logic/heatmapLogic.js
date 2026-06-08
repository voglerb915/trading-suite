// ---------------------------------------------------------
// heatmapLogic.js
// Universelle Heatmap-Farb-Logik für Overview + SectorTiles
// ---------------------------------------------------------

/**
 * Berechnet den Prozentwert (0–1) aus absolutem Wert und Sektorgröße.
 */
export function calculatePercent(value, industryCount) {
    if (!industryCount || industryCount === 0) return 0;
    return value / industryCount;
}

/**
 * Mappt Prozentwerte (0–1) auf 7 Buckets (0–6).
 * Diese Buckets entsprechen deiner Heatmap-Farbskala.
 */
export function percentToBucket(percent) {
    if (percent <= 0.10) return 0;   // sehr schwach
    if (percent <= 0.25) return 1;   // schwach
    if (percent <= 0.40) return 2;   // mittel
    if (percent <= 0.55) return 3;   // neutral
    if (percent <= 0.70) return 4;   // gut
    if (percent <= 0.85) return 5;   // stark
    return 6;                        // sehr stark
}

/**
 * Kombiniert Prozentberechnung + Bucket-Mapping
 * und liefert direkt die CSS-Klasse "hm-X".
 */
export function getHeatmapClass(value, industryCount) {
    const percent = calculatePercent(value, industryCount);
    const bucket = percentToBucket(percent);
    return `hm-${bucket}`;
}
