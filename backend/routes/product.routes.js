const express = require("express");
const router = express.Router();

const {
  getProducts,
  getProductById,
  createProduct
} = require("../controllers/product.controller");

// Public routes
router.get("/", getProducts);
router.get("/:id", getProductById);

// Temporary (admin later)
router.post("/", createProduct);

module.exports = router;
