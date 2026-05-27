const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// Initialize Cloudinary storage engine
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Dynamic folder assignment based on request path/context
    let folder = "castlab/products";
    if (
      req.baseUrl.includes("users") || 
      req.path.includes("user") || 
      req.path.includes("avatar") || 
      req.path.includes("profile")
    ) {
      folder = "castlab/users";
    } else if (
      req.baseUrl.includes("reviews") || 
      req.path.includes("review")
    ) {
      folder = "castlab/reviews";
    }

    // Determine target format (support jpg, jpeg, png, webp)
    const fileFormat = file.mimetype.split("/")[1];
    const allowedFormats = ["jpeg", "jpg", "png", "webp"];
    const targetFormat = allowedFormats.includes(fileFormat) ? fileFormat : "jpg";

    return {
      folder: folder,
      format: targetFormat,
      transformation: [
        { fetch_format: "auto", quality: "auto" } // Automatic optimization (f_auto, q_auto)
      ]
    };
  }
});

// Safe file filter to validate image file types
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPG, JPEG, PNG, and WEBP image formats are supported!"), false);
  }
};

// Reusable upload middleware config
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

module.exports = upload;
