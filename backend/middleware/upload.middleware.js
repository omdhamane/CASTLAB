const multer = require("multer");

// Configure multer to use memory storage instead of disk storage
const storage = multer.memoryStorage();

// Safe file filter to validate image mime types
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPG, JPEG, PNG, and WEBP image formats are supported!"), false);
  }
};

// Reusable upload middleware utilizing in-memory buffers
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  },
  fileFilter: fileFilter
});

module.exports = upload;
