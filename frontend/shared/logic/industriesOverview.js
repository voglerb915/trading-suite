function calculateIndustryRanking(industries) {
    const result = {};
    const timeframes = ["week", "month", "quarter"];
    const names = Object.keys(industries);

    names.forEach(name => {
        result[name] = {};
    });

    timeframes.forEach(tf => {
        const days = industries[names[0]][tf].length;

        for (let i = 0; i < days; i++) {
            const entries = names.map(name => ({
                name,
                value: Number(industries[name][tf][i])
            }));

            entries.sort((a, b) => b.value - a.value);

            entries.forEach((entry, index) => {
                const rank = index + 1;

                if (!result[entry.name][`${tf}_rank_series`]) {
                    result[entry.name][`${tf}_rank_series`] = [];
                }

                result[entry.name][`${tf}_rank_series`].push(rank);
            });
        }
    });

    return result;
}

function countTop29BySector(industries, ranking, timeframe) {
    const result = {};

    Object.entries(industries).forEach(([name, ind]) => {
        const sector = ind.sector;
        if (!result[sector]) result[sector] = [0, 0, 0];

        const ranks = ranking[name][`${timeframe}_rank_series`];

        for (let i = 0; i < 3; i++) {
            if (ranks[i] <= 29) result[sector][i]++;
        }
    });

    return result;
}

export function buildIndustriesOverviewData(industries) {
    const ranking = calculateIndustryRanking(industries);

    const weekCounts    = countTop29BySector(industries, ranking, "week");
    const monthCounts   = countTop29BySector(industries, ranking, "month");
    const quarterCounts = countTop29BySector(industries, ranking, "quarter");

    const allSectors = new Set([
        ...Object.keys(weekCounts),
        ...Object.keys(monthCounts),
        ...Object.keys(quarterCounts)
    ]);

    const overview = [...allSectors].map(sector => {
        // Anzahl Industrien pro Sektor
        const industryCount = Object.values(industries)
            .filter(ind => ind.sector === sector)
            .length;

        // Anzahl Top-29 Industrien (aktueller Tag = Index 0)
        const topCount = (weekCounts[sector]?.[0] ?? 0);

        return {
            sector,
            industryCount,
            topCount,
            week:    weekCounts[sector]    ?? [0,0,0],
            month:   monthCounts[sector]   ?? [0,0,0],
            quarter: quarterCounts[sector] ?? [0,0,0]
        };
    });

    // Alphabetisch sortieren
    overview.sort((a, b) => a.sector.localeCompare(b.sector));

    return overview;
}
