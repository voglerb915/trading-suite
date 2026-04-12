export function getSectorClass(name) {
  const map = {
    "Basic Materials": "sector-basic-materials",    // War: sector-basic
    "Communication Services": "sector-communication",
    "Consumer Cyclical": "sector-consumer-cyclical", // War: sector-cyclical
    "Consumer Defensive": "sector-consumer-defensive", // War: sector-defensive
    "Energy": "sector-energy",
    "Financial": "sector-financial",        // War: Financial (Mapping angepasst)
    "Healthcare": "sector-healthcare",               // War: sector-health
    "Industrials": "sector-industrials",             // War: sector-industrial
    "Real Estate": "sector-real-estate",             // War: sector-realestate
    "Technology": "sector-tech",
    "Utilities": "sector-utilities"
  };
  return map[name] || "sector-default";
}

export function getDiffColor(value) {
  if (value == null) return "#999";
  if (value > 0) return "#4caf50";
  if (value < 0) return "#f44336";
  return "#999";
}

export function formatDiff(value) {
  if (value == null) return "—";
  const num = Number(value);
  if (isNaN(num)) return "—";
  return num > 0 ? `+${num.toFixed(2)}%` : `${num.toFixed(2)}%`;
}

export function handleSectorClick(name) {
  const event = new CustomEvent("dashboard:sectorClick", { detail: name });
  document.dispatchEvent(event);
}
