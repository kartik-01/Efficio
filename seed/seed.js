require("dotenv").config();
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI;

const seedData = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB for seeding");

    // Tasks
    const tasks = [
      {
        task_id: "task_001",
        task_title: "Landing Page Design",
        task_description: "Create UI in Figma",
        priority: "high",
        status: "in_progress",
        due_date: new Date(),
        category: "Design",
        assigned_to: "user_001",
        is_completed: false,
        tags: ["UI", "Design"]
      },
      {
        task_id: "task_002",
        task_title: "API Integration",
        task_description: "Connect dashboard to backend",
        priority: "medium",
        status: "completed",
        due_date: new Date(),
        category: "Development",
        assigned_to: "user_002",
        is_completed: true,
        tags: ["API", "Backend"]
      }
    ];

    // Sessions
    const sessions = [
      {
        session_id: "sess_001",
        user_id: "user_001",
        current_task_name: "Build Dashboard",
        session_duration: "01:45:00",
        session_type: "deep_work",
        daily_goal: 8,
        total_tracked_today: 5.75,
        focused_time: 4.2,
        distraction_time: 0.5,
        efficiency_percentage: 87
      },
      {
        session_id: "sess_002",
        user_id: "user_002",
        current_task_name: "Write API tests",
        session_duration: "01:00:00",
        session_type: "admin",
        daily_goal: 8,
        total_tracked_today: 3.5,
        focused_time: 3.0,
        distraction_time: 0.3,
        efficiency_percentage: 80
      }
    ];

    // Team
    const team = [
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

    // Sprints
    const sprints = [
      { day: "Mon", ideal: 40, actual: 38 },
      { day: "Tue", ideal: 35, actual: 30 },
      { day: "Wed", ideal: 30, actual: 26 },
      { day: "Thu", ideal: 25, actual: 21 },
      { day: "Fri", ideal: 20, actual: 15 },
      { day: "Sat", ideal: 15, actual: 10 }
    ];

    // Projects
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

    await mongoose.connection.db.collection("tasks").deleteMany({});
    await mongoose.connection.db.collection("tasks").insertMany(tasks);
    console.log("✅ Tasks seeded");

    await mongoose.connection.db.collection("sessions").deleteMany({});
    await mongoose.connection.db.collection("sessions").insertMany(sessions);
    console.log("✅ Sessions seeded");

    await mongoose.connection.db.collection("team").deleteMany({});
    await mongoose.connection.db.collection("team").insertMany(team);
    console.log("✅ Team seeded");

    await mongoose.connection.db.collection("sprints").deleteMany({});
    await mongoose.connection.db.collection("sprints").insertMany(sprints);
    console.log("✅ Sprints seeded");

    await mongoose.connection.db.collection("projects").deleteMany({});
    await mongoose.connection.db.collection("projects").insertMany(projects);
    console.log("✅ Projects seeded");

    process.exit();
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
};

seedData();
