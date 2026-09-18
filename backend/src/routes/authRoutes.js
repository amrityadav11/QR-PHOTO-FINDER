const express = require('express');
const router = express.Router();

const {
  register,
  login,
  logout,
  getMe,
  updateMe,
  changePassword,
} = require('../controllers/authController');

const { protect } = require('../middleware/auth');
const {
  registerValidators,
  loginValidators,
  validate,
} = require('../middleware/validate');
const {
  handleUpload,
  uploadProfileImage,
} = require('../middleware/uploadMiddleware');

// Public
router.post('/register', registerValidators, validate, register);
router.post('/login', loginValidators, validate, login);

// Protected
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/me', protect, handleUpload(uploadProfileImage), updateMe);
router.put('/change-password', protect, changePassword);

module.exports = router;
