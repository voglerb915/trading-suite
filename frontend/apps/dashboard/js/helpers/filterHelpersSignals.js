export function passesMultiSignalFilter(ticker, state) {
    // 1. Sicherheits-Check: Prüfe, ob window.dataStore überhaupt existiert
    if (typeof window === 'undefined' || !window.dataStore) {
        return false; // Oder true, wenn du sicher bist, dass alles angezeigt werden soll
    }

    // 2. Sicheres Extrahieren
    const allSignals = window.dataStore?.signals || [];
    
    // 3. Suche
    const match = allSignals.find(s => {
        if (!s.ticker) return false;
        return String(s.ticker).trim().toUpperCase() === String(ticker).trim().toUpperCase();
    });

    return !!match;
}