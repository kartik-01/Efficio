const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "✅ Productivity route is working!" });
});

module.exports = router;