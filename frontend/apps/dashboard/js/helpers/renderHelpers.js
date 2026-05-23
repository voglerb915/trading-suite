import { sectorClasses } from "../../../../shared/logic/sectorColors.js";

export function getSectorClass(name) {
  return sectorClasses[name] ?? "sector-default";
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
  if (num > 0) return `+${num}`;
  if (num < 0) return `${num}`;
  return "0";
}

export function handleSectorClick(name) {
  const event = new CustomEvent("dashboard:sectorClick", { detail: name });
  document.dispatchEvent(event);
}
