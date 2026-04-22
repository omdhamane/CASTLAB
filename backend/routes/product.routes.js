const express = require("express");
const router = express.Router();

// import controllers
const {
  getProducts,
  getProductById,
  createProduct,
  searchProducts
} = require("../controllers/product.controller");

// 🔍 SEARCH ROUTE (IMPORTANT: keep this ABOVE :id)
router.get("/search", searchProducts);

// Public routes
router.get("/", getProducts);
router.get("/:id", getProductById);

// Temporary (admin later)
router.post("/", createProduct);

module.exports = router;
