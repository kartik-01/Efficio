const express = require("express");
const router = express.Router();

// Mock data - can later fetch from MongoDB
const teamData = [
  {
    user_id: "user_001",
    user_name: "Alice",
    hours_logged: 35,
    tasks_completed: 12
  },
  {
    user_id: "user_002",
    user_name: "Bob",
    hours_logged: 28,
    tasks_completed: 9
  },
  {
    user_id: "user_003",
    user_name: "Charlie",
    hours_logged: 40,
    tasks_completed: 15
  }
];

router.get("/", (req, res) => {
  res.json(teamData);
});

module.exports = router;