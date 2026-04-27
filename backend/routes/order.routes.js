const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth.middleware");

const { createOrder } = require("../controllers/order.controller");

// POST /api/orders (protected - requires login)
router.post("/", protect, createOrder);

module.exports = router;