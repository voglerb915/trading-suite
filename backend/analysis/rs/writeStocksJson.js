// analysis/rs/writeStocksJson.js
const fs = require("fs");
const path = require("path");
const { buildStockRsSnapshot } = require('./rsPipelineStocks');
const { buildEtfRsSnapshot } = require('./rsPipelineEtfs');

async function writeStocksJson() {
    console.log("▶ RS Stocks Writer gestartet");

    // ⭐ Beide Pipelines nacheinander (keine doppelte SQL-Last)
    const stocks = await buildStockRsSnapshot();
    const etfs   = await buildEtfRsSnapshot();

    fs.writeFileSync(
        path.join(__dirname, "../../json/rs_stocks.json"),
        JSON.stringify(stocks, null, 2)
    );

    fs.writeFileSync(
        path.join(__dirname, "../../json/rs_etfs.json"),
        JSON.stringify(etfs, null, 2)
    );

    console.log(`✅ Stocks: ${stocks.length} Einträge`);
    console.log(`📦 ETFs:   ${etfs.length} Einträge`);

    return { stocks, etfs };
}

module.exports = { writeStocksJson };
