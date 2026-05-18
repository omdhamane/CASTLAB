const multer = require("multer");

// We use memory storage because we want to upload directly to Cloudinary
// without saving to the local disk first.
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per image
  },
  fileFilter,
});

module.exports = upload;
