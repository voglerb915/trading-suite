export async function loadExcelRawData() {
    const res = await fetch('/api/excel/rawdata');
    const json = await res.json();

    if (!json.success || !json.data) {
        throw new Error("Keine Excel-Daten");
    }

    return {
        sectors: json.data,
        dates: json.dates
    };
}
