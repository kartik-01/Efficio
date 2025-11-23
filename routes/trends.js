const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    // Mock trend data: Weekly productivity, quality, speed scores
    const trends = [
      { week: "W1", productivity: 88, quality: 91, speed: 86 },
      { week: "W2", productivity: 92, quality: 89, speed: 88 },
      { week: "W3", productivity: 85, quality: 93, speed: 82 },
      { week: "W4", productivity: 90, quality: 90, speed: 84 },
      { week: "W5", productivity: 95, quality: 92, speed: 89 },
      { week: "W6", productivity: 91, quality: 94, speed: 87 }
    ];

    res.json(trends);
  } catch (err) {
    console.error("❌ Failed to fetch productivity trends:", err);
    res.status(500).json({ error: "Failed to fetch trends" });
  }
});

module.exports = router;