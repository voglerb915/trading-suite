export function calculateRanking(sectors) {
    const result = {};
    const timeframes = ["week", "month", "quarter"];

    const sectorNames = Object.keys(sectors);

    // Grundstruktur
    sectorNames.forEach(sector => {
        result[sector] = {};
    });

    timeframes.forEach(tf => {
        const days = sectors[sectorNames[0]][tf].length;

        for (let i = 0; i < days; i++) {
            const entries = sectorNames.map(sector => ({
                sector,
                value: Number(sectors[sector][tf][i])
            }));

            // Sortieren DESC
            entries.sort((a, b) => b.value - a.value);

            entries.forEach((entry, index) => {
                const rank = 11 - index;

                if (!result[entry.sector][`${tf}_rank_series`]) {
                    result[entry.sector][`${tf}_rank_series`] = [];
                }

                result[entry.sector][`${tf}_rank_series`].push(rank);
            });
        }
    });

    return result;
}
