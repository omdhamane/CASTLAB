const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const cloudinary = require("../utils/cloudinary");
const { protect, authorizeRoles } = require("../middleware/auth.middleware");

// POST /api/upload
// Only admins can upload images
router.post("/", protect, authorizeRoles("admin", "superadmin"), upload.array("images", 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No images provided" });
    }

    const uploadPromises = req.files.map((file) => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "castlab_products",
            transformation: [{ width: 1200, crop: "limit" }] // Optimization
          },
          (error, result) => {
            if (error) return reject(error);
            resolve({
              url: result.secure_url,
              public_id: result.public_id
            });
          }
        );
        uploadStream.end(file.buffer);
      });
    });

    const uploadedImages = await Promise.all(uploadPromises);

    res.status(200).json({
      message: "Images uploaded successfully",
      images: uploadedImages
    });

  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Server error during image upload" });
  }
});

// DELETE /api/upload/:public_id
// Route to delete an image from Cloudinary
router.delete("/:public_id", protect, authorizeRoles("admin", "superadmin"), async (req, res) => {
  try {
    const { public_id } = req.params;
    
    // Cloudinary separates folders with '/', but URLs encode it. 
    // We expect the frontend to send the decoded public_id
    const result = await cloudinary.uploader.destroy(public_id);
    
    if (result.result === "ok") {
      res.status(200).json({ message: "Image deleted successfully" });
    } else {
      res.status(400).json({ message: "Failed to delete image", result });
    }
  } catch (error) {
    console.error("Delete image error:", error);
    res.status(500).json({ message: "Server error during image deletion" });
  }
});

module.exports = router;
