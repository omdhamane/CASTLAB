const express = require("express");
const router = express.Router();
const { protect, authorizeRoles } = require("../middleware/auth.middleware");
const upload = require("../middleware/upload.middleware");

const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  getProductBrands,
  toggleProductWishlistCount
} = require("../controllers/product.controller");

router.get("/brands", getProductBrands);
router.get("/search", searchProducts);
router.get("/", getProducts);
router.get("/:id", getProductById);
router.post("/:id/wishlist", toggleProductWishlistCount);

router.post("/", protect, authorizeRoles("admin", "superadmin"), upload.single("image"), createProduct);
router.put("/:id", protect, authorizeRoles("admin", "superadmin"), upload.single("image"), updateProduct);
router.delete("/:id", protect, authorizeRoles("admin", "superadmin"), deleteProduct);

module.exports = router;
