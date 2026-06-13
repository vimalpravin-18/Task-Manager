const express = require('express');
const { register, login, getMe, updateProfile, changePassword, deleteAccount, socialLogin } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, changePassword);
router.delete('/account', protect, deleteAccount);
router.post('/social-login', socialLogin);

// User Preferences
router.get('/preferences', protect, async (req, res) => {
  try {
    const preferences = await User.getPreferences(req.user.id);
    res.json({
      success: true,
      data: preferences || {
        theme: 'light',
        accent_color: '#7c6ff7',
        default_view: 'list',
        default_sort: 'newest'
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/preferences', protect, async (req, res) => {
  try {
    const preferences = await User.savePreferences(req.user.id, req.body);
    res.json({ success: true, data: preferences });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
