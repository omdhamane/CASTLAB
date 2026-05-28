const express = require("express");
const router = express.Router();
const { protect, authorizeRoles } = require("../middleware/auth.middleware");
const { getDashboardStats } = require("../controllers/analytics.controller");

// GET /api/analytics
router.get("/", protect, authorizeRoles("admin", "superadmin"), getDashboardStats);

module.exports = router;
