const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema({
  task_id: String,
  task_title: String,
  task_description: String,
  priority: String,
  status: String,
  due_date: Date,
  category: String,
  assigned_to: String,
  is_completed: Boolean,
  tags: [String]
});

module.exports = mongoose.model("Task", TaskSchema);