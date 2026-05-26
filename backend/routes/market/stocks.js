// routes/stocks.js
const express = require('express');
const router = express.Router();
const stocksService = require('../../services/stocksService');

router.get('/', async (req, res, next) => {
    try {
        const data = await stocksService.getStocksForList();
        res.json(data);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
