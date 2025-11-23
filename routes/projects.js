const express = require("express");
const router = express.Router();

// Mock project data for timeline
const projects = [
  {
    project_id: "proj_001",
    project_name: "Website Redesign",
    project_progress: 75,
    project_status: "on_track"
  },
  {
    project_id: "proj_002",
    project_name: "Mobile App Launch",
    project_progress: 45,
    project_status: "at_risk"
  },
  {
    project_id: "proj_003",
    project_name: "Marketing Campaign",
    project_progress: 60,
    project_status: "delayed"
  }
];

router.get("/", (req, res) => {
  res.json(projects);
});

module.exports = router;