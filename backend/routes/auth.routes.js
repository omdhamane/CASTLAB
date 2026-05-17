const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth.middleware");

const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile
} = require("../controllers/auth.controller");

// POST /api/auth/register
router.post("/register", registerUser);

// POST /api/auth/login
router.post("/login", loginUser);

// GET /api/auth/profile
router.get("/profile", protect, getUserProfile);

// PUT /api/auth/profile
router.put("/profile", protect, updateUserProfile);

module.exports = router;