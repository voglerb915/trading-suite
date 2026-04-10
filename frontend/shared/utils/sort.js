export function sortBy(list, key, direction = "desc") {
    return [...list].sort((a, b) => {
        const A = a[key] || 0;
        const B = b[key] || 0;
        return direction === "desc" ? B - A : A - B;
    });
}
