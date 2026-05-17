export function createSectorTile(sectorName) {
    return `
        <div class="sector-tile" data-sector="${sectorName}">
            
            <div class="sector-header">
                ${sectorName}
            </div>

            <div class="sector-row">
                <div class="sector-cell rank-cell"></div>

                <canvas class="spark spark-week" width="120" height="30"></canvas>
                <canvas class="spark spark-month" width="120" height="30"></canvas>
                <canvas class="spark spark-quarter" width="120" height="30"></canvas>
            </div>

        </div>
    `;
}
