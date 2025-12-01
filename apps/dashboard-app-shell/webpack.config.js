const path = require("path");
const createWebpackConfig = require("../../configs/createWebpackConfig");

const isProduction = process.env.NODE_ENV === "production";

// Cache busting for development - forces reload of remote modules
const cacheBuster = Date.now();

module.exports = createWebpackConfig({
  appName: "dashboard-app-shell",
  port: process.env.PORT || 3000,
  moduleFederation: {
    name: "app_shell",
    remotes: isProduction
      ? {
          task_manager: "task_manager@https://go-efficio-task.netlify.app/remoteEntry.js",
          time_tracker: "time_tracker@https://go-efficio-time.netlify.app/remoteEntry.js",
          analytics: "analytics@https://go-efficio-analytics.netlify.app/remoteEntry.js"
        }
      : {
          task_manager: `task_manager@http://localhost:3001/remoteEntry.js?v=${cacheBuster}`,
          time_tracker: `time_tracker@http://localhost:3002/remoteEntry.js?v=${cacheBuster}`,
          analytics: `analytics@http://localhost:3003/remoteEntry.js?v=${cacheBuster}`
        }
  }
});
