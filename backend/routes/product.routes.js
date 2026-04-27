const express = require("express");
const router = express.Router();

const {
  getProducts,
  getProductById,
  createProduct,
  searchProducts
} = require("../controllers/product.controller");

// ✅ SEARCH must be ABOVE /:id (already correct!)
// GET /api/products/search?q=something
router.get("/search", searchProducts);

// GET /api/products
router.get("/", getProducts);

// GET /api/products/:id
router.get("/:id", getProductById);

// POST /api/products
router.post("/", createProduct);

module.exports = router;