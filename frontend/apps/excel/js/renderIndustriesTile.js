export function renderIndustriesTile(industriesData) {
    const tile = document.createElement("div");
    tile.className = "sector-tile industries-tile"; // zusätzliche Klasse

    // 1) Header
    const header = document.createElement("div");
    header.className = "tile-header";
    header.textContent = "Industriezweige Top 20%";
    tile.appendChild(header);

    // 2) Tabelle
    const table = document.createElement("table");
    table.className = "matrix-table industries-table"; // zusätzliche Klasse

    // ============================
    // HEAD
    // ============================

    const thead = document.createElement("thead");

    const tr1 = document.createElement("tr");
    const thSector = document.createElement("th");
    thSector.rowSpan = 2;
    thSector.textContent = "Sector";
    thSector.className = "th-matrix-rank";
    tr1.appendChild(thSector);

    const thWeek = document.createElement("th");
    thWeek.colSpan = 3;
    thWeek.className = "th-matrix-group header-break";
    thWeek.textContent = "Week";
    tr1.appendChild(thWeek);

    const thMonth = document.createElement("th");
    thMonth.colSpan = 3;
    thMonth.className = "th-matrix-group header-break";
    thMonth.textContent = "Month";
    tr1.appendChild(thMonth);

    const thQuarter = document.createElement("th");
    thQuarter.colSpan = 3;
    thQuarter.className = "th-matrix-group";
    thQuarter.textContent = "Quarter";
    tr1.appendChild(thQuarter);

    thead.appendChild(tr1);

    table.appendChild(thead);

    // ============================
    // BODY
    // ============================

    const tbody = document.createElement("tbody");

    industriesData.forEach(row => {
        const tr = document.createElement("tr");

        const tdSector = document.createElement("td");
        tdSector.className = "excel-sector industries-sector-cell";
        tdSector.textContent = row.sector;
        tr.appendChild(tdSector);

        row.week.forEach(v => {
            const td = document.createElement("td");
            td.className = "excel-rank industries-value-cell";
            td.textContent = v;
            tr.appendChild(td);
        });

        row.month.forEach(v => {
            const td = document.createElement("td");
            td.className = "excel-rank industries-value-cell";
            td.textContent = v;
            tr.appendChild(td);
        });

        row.quarter.forEach(v => {
            const td = document.createElement("td");
            td.className = "excel-rank industries-value-cell";
            td.textContent = v;
            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    tile.appendChild(table);

    return tile;
}
