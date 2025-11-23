const mongoose = require("mongoose");

const SessionSchema = new mongoose.Schema({
  session_id: String,
  user_id: String,
  current_task_name: String,
  session_duration: String,
  session_type: String,
  daily_goal: Number,
  total_tracked_today: Number,
  focused_time: Number,
  distraction_time: Number,
  efficiency_percentage: Number
});

module.exports = mongoose.model("Session", SessionSchema);