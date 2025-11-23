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

// Define Project schema directly in the function
const ProjectSchema = new mongoose.Schema({
  name: String,
  description: String,
  status: String,
  // Add other project fields as needed
});

const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);

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
      const projects = await Project.find();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(projects),
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
      body: JSON.stringify({ error: 'Failed to fetch projects', details: error.message }),
    };
  }
};