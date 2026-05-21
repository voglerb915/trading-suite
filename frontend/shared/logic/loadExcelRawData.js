export async function loadExcelRawData(long = false) {
    const url = long ? '/api/excel/rawdata?long=1' : '/api/excel/rawdata';
    const res = await fetch(url);
    const json = await res.json();

    if (!json.success) throw new Error("Keine Excel-Daten");

    return {
        sectors: json.sectors,
        industries: json.industries,
        dates: json.dates
    };
}
