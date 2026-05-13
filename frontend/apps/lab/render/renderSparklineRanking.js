export function renderSparklineRanking(canvas, ranks, rankColors) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    if (!ranks || !ranks.length) return;

    const baselineRank = 6;     // neue Basislinie
    const zeroY = h / 2;        // visuelle Mitte wie bei Performance
    const barWidth = w / ranks.length;

    // maximale Abweichung nach oben/unten
    const maxDelta = Math.max(
        ...ranks.map(r => Math.abs(r - baselineRank))
    );

    ranks.forEach((rank, i) => {
        const x = i * barWidth;

        // Abweichung vom Baseline-Rank
        const delta = rank - baselineRank;

        // Höhe relativ zur maximalen Abweichung
        const barHeight = Math.abs(delta) / maxDelta * (h / 2);

        // Farbe pro Balken
        const color = rankColors[rank] || "#000";
        ctx.fillStyle = color;

        if (delta >= 0) {
            // über der Baseline
            ctx.fillRect(x, zeroY - barHeight, barWidth - 1, barHeight);
        } else {
            // unter der Baseline
            ctx.fillRect(x, zeroY, barWidth - 1, barHeight);
        }
    });

    // Baseline zeichnen (Rank 6)
    ctx.strokeStyle = "#888";
    ctx.beginPath();
    ctx.moveTo(0, zeroY);
    ctx.lineTo(w, zeroY);
    ctx.stroke();
}
