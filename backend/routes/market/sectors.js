const express = require("express");
const router = express.Router();
const { getSectorsForList } = require("../../services/sectorsService");

router.get("/", async (req, res) => {
    try {
        const data = await getSectorsForList();
        res.json(data);
    } catch (err) {
        console.error("Fehler beim Laden der Sektoren:", err);
        res.status(500).json({ error: "Fehler beim Laden der Sektoren" });
    }
});

module.exports = router;
