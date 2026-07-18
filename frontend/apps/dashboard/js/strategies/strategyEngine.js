// ======================================================
//  STRATEGY ENGINE (Frontend)
//  - zentrale Registrierung aller Frontend-Strategien
//  - Dashboard ruft nur noch strategyEngine[name](stocks) auf
// ======================================================

import { nearHigh52w } from "./nearHigh52w.js";
import { stage3topping } from "./stage3topping.js";



export const strategyEngine = {
    nearhigh52: nearHigh52w,
    //insideday52w: insideDay52w,
    stage3topping: (stocks) => stage3topping(stocks, dashboardState.industryMap, dashboardState.totalInd)
};

