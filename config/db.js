require('dotenv').config();
const mongoose = require('mongoose');

// Mask credentials in the URI for safe debug logging
function maskMongoUri(uri) {
  if (!uri) return '<not set>';
  // replace user:password@ with user:*****@
  return uri.replace(/(mongodb(?:\+srv)?:\/\/)(.*?:)(.*?)(@)/, (m, p1, user, pass, p4) => {
    return p1 + user + '*****' + p4;
  });
}

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  console.log('MongoDB URI (masked):', maskMongoUri(uri));

  if (!uri) {
    console.error('MongoDB connection error: MONGO_URI is not set. Ensure your .env file contains MONGO_URI and dotenv is loaded before the DB module.');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected (primary)');
  } catch (error) {
    // Provide actionable messages for common failures without exposing secrets
    const msg = error && error.message ? error.message : String(error);

    // If DNS SRV lookup failed and a fallback is provided, try fallback URI
    if ((/ENOTFOUND|EAI_AGAIN/.test(msg) || error.code === 'ENOTFOUND') && process.env.MONGO_URI_FALLBACK) {
      console.error('MongoDB connection error: DNS lookup failed for SRV record. Trying fallback connection...');
      console.log('Fallback MongoDB URI (masked):', maskMongoUri(process.env.MONGO_URI_FALLBACK));
      try {
        await mongoose.connect(process.env.MONGO_URI_FALLBACK);
        console.log('MongoDB connected (fallback)');
        return;
      } catch (fbErr) {
        console.error('Fallback MongoDB connection failed:', fbErr && fbErr.message ? fbErr.message : fbErr);
        // fall through to original error handling below
      }
    }

    if (/ENOTFOUND|EAI_AGAIN/.test(msg) || error.code === 'ENOTFOUND') {
      console.error('MongoDB connection error: DNS lookup failed for SRV record.');
      console.error(' - This commonly happens for mongodb+srv URIs when your network or DNS cannot resolve Atlas SRV records.');
      console.error(' - Try: switching network, adding Google DNS (8.8.8.8), or using the non-SRV (mongodb://) connection string from Atlas.');
    } else if (/Authentication failed|auth failed|bad auth/.test(msg) || (error.name === 'MongoServerError' && msg.toLowerCase().includes('authentication'))) {
      console.error('MongoDB connection error: authentication failed.');
      console.error(' - Check username/password in your MONGO_URI and URL-encode any special characters in the password.');
    } else {
      console.error('MongoDB connection error:', msg);
    }

    process.exit(1);
  }
};

connectDB();
module.exports = mongoose;
