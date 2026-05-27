const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload.middleware");
const cloudinary = require("../config/cloudinary");
const { protect, authorizeRoles } = require("../middleware/auth.middleware");

// POST /api/upload
// Only admins can upload images
router.post("/", protect, authorizeRoles("admin", "superadmin"), upload.array("images", 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No images provided" });
    }

    // Since CloudinaryStorage is used, files are already uploaded to Cloudinary
    const uploadedImages = req.files.map((file) => ({
      url: file.path,          // The Cloudinary CDN secure URL
      public_id: file.filename // The Cloudinary public ID (includes path)
    }));

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
