const express = require("express");
const router = express.Router();
const adminProtect = require("../middleware/admin.middleware");

const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts
} = require("../controllers/product.controller");

router.get("/search", searchProducts);
router.get("/", getProducts);
router.get("/:id", getProductById);

router.post("/", adminProtect, createProduct);
router.put("/:id", adminProtect, updateProduct);
router.delete("/:id", adminProtect, deleteProduct);

module.exports = router;
