const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");

const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  verifyAdminKey,
  subscribeNewsletter
} = require("../controllers/auth.controller");

// POST /api/auth/register
router.post("/register", registerUser);

// POST /api/auth/login
router.post("/login", loginUser);

// GET /api/auth/profile
router.get("/profile", protect, getUserProfile);

// PUT /api/auth/profile
router.put("/profile", protect, updateUserProfile);

// POST /api/auth/forgotpassword
router.post("/forgotpassword", forgotPassword);

// PUT /api/auth/resetpassword/:resetToken
router.put("/resetpassword/:resetToken", resetPassword);

// POST /api/auth/verifyemail/:token
router.post("/verifyemail/:token", verifyEmail);

// GET /api/auth/verifyemail/:token (for direct browser clicks/redirects)
router.get("/verifyemail/:token", verifyEmail);

// POST /api/auth/resend-verification
router.post("/resend-verification", resendVerification);

// POST /api/auth/verify-admin-key
router.post("/verify-admin-key", protect, verifyAdminKey);

// POST /api/auth/subscribe
router.post("/subscribe", subscribeNewsletter);

module.exports = router;