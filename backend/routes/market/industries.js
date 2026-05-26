const express = require("express");
const router = express.Router();
const { getIndustriesForList } = require("../../services/industriesService");

router.get("/", async (req, res) => {
    try {
        const data = await getIndustriesForList();
        res.json(data);
    } catch (err) {
        console.error("Fehler beim Laden der Industrien:", err);
        res.status(500).json({ error: "Fehler beim Laden der Industrien" });
    }
});

module.exports = router;
