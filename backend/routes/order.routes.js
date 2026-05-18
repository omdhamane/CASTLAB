const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");

const {
  createOrder,
  getMyOrders,
  getOrderById
} = require("../controllers/order.controller");

router.get("/", protect, getMyOrders);
router.get("/:id", protect, getOrderById);
router.post("/", protect, createOrder);

module.exports = router;