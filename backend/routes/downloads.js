const express = require("express");
const router = express.Router();
const { loadIndexes } = require("../services/downloads/loadIndexes");

router.get("/run", async (req, res) => {
    const result = await loadIndexes();
    res.json(result);
});

module.exports = router;
