const express = require("express");
const router = express.Router();
const User = require("../models/User");

// Helper to extract auth0 ID and user info from JWT
const getAuthInfo = (req) => {
  const sub = req.user && req.user.sub;
  const email = req.user && (req.user.email || req.user["https://example.com/email"]);
  const name = req.user && (req.user.name || req.user["https://example.com/name"]);
  const picture = req.user && (req.user.picture || req.user["https://example.com/picture"]);
  return { sub, email, name, picture };
};

// GET /api/users/me - get or create user
router.get('/me', async (req, res) => {
  try {
    const { sub, email, name, picture } = getAuthInfo(req);
    if (!sub) return res.status(401).json({ message: 'Missing auth sub' });

    let user = await User.findOne({ auth0Id: sub });
    let reactivated = false;
    if (!user) {
      user = await User.create({ auth0Id: sub, email, name, picture, lastLogin: new Date() });
    } else if (!user.isActive) {
      user.isActive = true;
      reactivated = true;
      user.lastLogin = new Date();
      await user.save();
    } else {
      user.lastLogin = new Date();
      await user.save();
    }

    return res.json({ data: user, reactivated });
  } catch (err) {
    console.error('Failed to get/create user', err);
    return res.status(500).json({ message: 'Failed to get or create user' });
  }
});

// GET /api/users/profile
router.get('/profile', async (req, res) => {
  try {
    const { sub } = getAuthInfo(req);
    if (!sub) return res.status(401).json({ message: 'Missing auth sub' });

    const user = await User.findOne({ auth0Id: sub });
    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.json({ data: user });
  } catch (err) {
    console.error('Failed to fetch profile', err);
    return res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

// PUT /api/users/profile
router.put('/profile', async (req, res) => {
  try {
    const { sub } = getAuthInfo(req);
    if (!sub) return res.status(401).json({ message: 'Missing auth sub' });

    const updates = req.body || {};
    updates.updatedAt = new Date();

    const user = await User.findOneAndUpdate({ auth0Id: sub }, { $set: updates }, { new: true, upsert: true });

    return res.json({ data: user });
  } catch (err) {
    console.error('Failed to update profile', err);
    return res.status(500).json({ message: 'Failed to update profile' });
  }
});

// POST /api/users/profile/picture
router.post('/profile/picture', async (req, res) => {
  try {
    const { sub } = getAuthInfo(req);
    if (!sub) return res.status(401).json({ message: 'Missing auth sub' });

    const { imageBase64 } = req.body || {};
    if (!imageBase64) return res.status(400).json({ message: 'Missing imageBase64 in body' });

    // For now store the base64 string as customPicture (in production store in S3 or similar)
    const user = await User.findOneAndUpdate({ auth0Id: sub }, { customPicture: imageBase64, updatedAt: new Date() }, { new: true });

    return res.json({ data: { customPicture: user.customPicture } });
  } catch (err) {
    console.error('Failed to upload profile picture', err);
    return res.status(500).json({ message: 'Failed to upload profile picture' });
  }
});

// POST /api/users/deactivate
router.post('/deactivate', async (req, res) => {
  try {
    const { sub } = getAuthInfo(req);
    if (!sub) return res.status(401).json({ message: 'Missing auth sub' });

    const user = await User.findOneAndUpdate({ auth0Id: sub }, { isActive: false, updatedAt: new Date() }, { new: true });

    return res.json({ data: user });
  } catch (err) {
    console.error('Failed to deactivate account', err);
    return res.status(500).json({ message: 'Failed to deactivate account' });
  }
});

// DELETE /api/users/account
router.delete('/account', async (req, res) => {
  try {
    const { sub } = getAuthInfo(req);
    if (!sub) return res.status(401).json({ message: 'Missing auth sub' });

    // Remove user and related tasks/sessions if desired. For now just remove user.
    await User.deleteOne({ auth0Id: sub });

    return res.json({ message: 'Account deleted' });
  } catch (err) {
    console.error('Failed to delete account', err);
    return res.status(500).json({ message: 'Failed to delete account' });
  }
});

module.exports = router;