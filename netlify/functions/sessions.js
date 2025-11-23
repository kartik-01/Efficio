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

// Define Session schema directly in the function
const SessionSchema = new mongoose.Schema({
  duration: Number,
  date: Date,
  // Add other session fields as needed
});

const Session = mongoose.models.Session || mongoose.model('Session', SessionSchema);

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
      const sessions = await Session.find();
      
      // Calculate total focus time and sessions today
      const totalFocusTime = sessions.reduce((sum, session) => sum + (session.duration || 0), 0);
      const sessionsToday = sessions.filter(session => {
        const today = new Date().toDateString();
        return new Date(session.date).toDateString() === today;
      }).length;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          totalFocusTime: totalFocusTime.toFixed(2), 
          sessionsToday: sessionsToday 
        }),
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
      body: JSON.stringify({ error: 'Failed to fetch sessions', details: error.message }),
    };
  }
};