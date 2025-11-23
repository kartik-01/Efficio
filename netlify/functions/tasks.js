const mongoose = require('mongoose');

// MongoDB connection
let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected) return;
  
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  isConnected = true;
};

// Import your Task model (adjust path as needed)
const Task = require('../../models/Task');

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    await connectToDatabase();

    if (event.httpMethod === 'GET') {
      const tasks = await Task.find();
      
      const completed = tasks.filter(t => t.status === "completed").length;
      const inProgress = tasks.filter(t => t.status === "in_progress").length;
      const overdue = tasks.filter(t => t.status === "overdue").length;
      
      const focusTime = 6.5;
      const productivity = Math.floor((completed / tasks.length) * 100);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ completed, inProgress, overdue, focusTime, productivity }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch tasks' }),
    };
  }
};