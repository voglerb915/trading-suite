const express = require('express');
const router = express.Router();
const { journalPool, journalConnect } = require('../db/connection'); 

router.get('/executed', async (req, res) => {
    try {
        await journalConnect; 
        
        // Wir nutzen explizite Aliase (E für Executed, C für Creation)
        const result = await journalPool.request().query(`
            SELECT 
                E.execution_time AS entry_date, 
                E.ib_order_id AS order_id, 
                E.avg_fill_price AS entry_price,
                C.ticker AS ticker,
                C.status AS order_status,      -- Hier von order_role auf status geändert
                0 AS exit_price,
                0 AS r_multiple
            FROM dbo.ExecutedOrders E
            LEFT JOIN dbo.OrderCreation C ON E.pending_id = C.pending_id
            ORDER BY E.execution_time DESC
        `);
        
        res.json(result.recordset);
    } catch (err) {
        // Schau in dein Terminal, hier steht jetzt die exakte Ursache!
        console.error("!!! SQL FEHLER IM JOURNAL !!!");
        console.error("Nachricht:", err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;