const mongoose = require('mongoose');

let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected) return;
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  isConnected = true;
};

// Define Task schema directly in the function
const TaskSchema = new mongoose.Schema({
  title: String,
  status: String,
  // Add other task fields as needed
});

const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema);

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    await connectToDatabase();

    if (event.httpMethod === 'GET') {
      const tasks = await Task.find();
      
      const completed = tasks.filter(t => t.status === "completed").length;
      const inProgress = tasks.filter(t => t.status === "in_progress").length;
      const overdue = tasks.filter(t => t.status === "overdue").length;
      
      const focusTime = 6.5;
      const productivity = tasks.length > 0 ? Math.floor((completed / tasks.length) * 100) : 0;

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
      body: JSON.stringify({ error: 'Failed to fetch tasks', details: error.message }),
    };
  }
};