const express = require("express");
const router = express.Router();
const Session = require("../models/Session");

router.get("/", async (req, res) => {
  try {
    const sessions = await Session.find();

    const totalFocusTime = sessions.reduce(
      (sum, s) => sum + (s.focused_time || s.focusedTime || 0),
      0
    );

    const sessionsTodayCount = sessions.length;

    res.json({
      totalFocusTime: totalFocusTime.toFixed(2),
      sessionsTodayCount
    });
  } catch (err) {
    console.error("Failed to fetch sessions:", err);
    res.status(500).json({ error: "Failed to fetch session data" });
  }
});

module.exports = router;