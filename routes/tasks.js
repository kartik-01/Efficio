const express = require("express");
const router = express.Router();
const Task = require("../models/Task");

router.get("/", async (req, res) => {
  try {
    const tasks = await Task.find();

    const completed = tasks.filter(t => t.status === "completed").length;
    const inProgress = tasks.filter(t => t.status === "in_progress").length;
    const overdue = tasks.filter(t => t.status === "overdue").length;

    // Simulate focus time and productivity score (or calculate based on real task fields later)
    const focusTime = 6.5;
    const productivity = Math.floor((completed / tasks.length) * 100);

    res.json({ completed, inProgress, overdue, focusTime, productivity });
  } catch (err) {
    console.error("Failed to fetch tasks:", err);
    res.status(500).json({ error: "Failed to fetch task summary" });
  }
});

module.exports = router;