export function passesMultiSignalFilter(ticker, state) {
    // 1. Direkter Zugriff ohne Suchen
    const midSignal = window.dataStore?.midSignals?.stocks?.[ticker];
    const sparkSignal = window.dataStore?.sparkSignals?.stocks?.[ticker];

    // 2. Deine Filter-Logik
    // Wenn keine Pille aktiv ist, zeigen wir ALLES mit Signal (wie gewünscht)
    const filterActive = state.filterEntryStocks || state.filterExitStocks || 
                         state.filterMidLong || state.filterMidExit;

    if (!filterActive) {
        // Zeige alles, was IRGENDEIN Signal hat (Mid oder Spark)
        return !!midSignal || !!sparkSignal;
    }

    // 3. Wenn Pillen aktiv sind, prüfen wir exakt
    if (state.filterEntryStocks && sparkSignal?.signal === 'entry') return true;
    if (state.filterExitStocks && sparkSignal?.signal === 'exit') return true;
    if (state.filterMidLong && midSignal?.signal === 'long') return true;
    if (state.filterMidExit && midSignal?.signal === 'exit') return true;

    return false;
}