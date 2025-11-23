const express = require("express");
const router = express.Router();

// Mock sprint burndown data
const sprintBurndown = [
  { day: "Mon", ideal: 40, actual: 38 },
  { day: "Tue", ideal: 35, actual: 30 },
  { day: "Wed", ideal: 30, actual: 26 },
  { day: "Thu", ideal: 25, actual: 21 },
  { day: "Fri", ideal: 20, actual: 15 },
  { day: "Sat", ideal: 15, actual: 10 }
];

router.get("/", (req, res) => {
  res.json(sprintBurndown);
});

module.exports = router;