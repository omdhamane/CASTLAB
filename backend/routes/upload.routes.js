const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload.middleware");
const { cloudinary, uploadToCloudinary } = require("../config/cloudinary");
const { protect, authorizeRoles } = require("../middleware/auth.middleware");

// POST /api/upload
// Only admins can upload images
router.post("/", protect, authorizeRoles("admin", "superadmin"), upload.array("images", 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No images provided" });
    }

    // Upload memory buffers to Cloudinary in parallel
    const uploadPromises = req.files.map((file) => {
      // Determine folder dynamically based on context
      let folder = "castlab/products";
      if (req.baseUrl.includes("users") || req.path.includes("avatar")) {
        folder = "castlab/users";
      } else if (req.baseUrl.includes("reviews") || req.path.includes("review")) {
        folder = "castlab/reviews";
      }
      return uploadToCloudinary(file.buffer, folder);
    });

    const uploadedImages = await Promise.all(uploadPromises);

    res.status(200).json({
      message: "Images uploaded successfully",
      images: uploadedImages
    });

  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Server error during image upload", error: error.message });
  }
});

// DELETE /api/upload/:public_id
// Route to delete an image from Cloudinary
router.delete("/:public_id", protect, authorizeRoles("admin", "superadmin"), async (req, res) => {
  try {
    const { public_id } = req.params;
    
    // Cloudinary expects the raw public_id (including folders)
    const result = await cloudinary.uploader.destroy(public_id);
    
    if (result.result === "ok" || result.result === "not found") {
      res.status(200).json({ message: "Image deleted successfully", result });
    } else {
      res.status(400).json({ message: "Failed to delete image", result });
    }
  } catch (error) {
    console.error("Delete image error:", error);
    res.status(500).json({ message: "Server error during image deletion", error: error.message });
  }
});

module.exports = router;
