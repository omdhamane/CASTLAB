const cloudinary = require("cloudinary").v2;

// Centralized Cloudinary SDK configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Reusable utility to upload a memory buffer directly to Cloudinary via streams
 * @param {Buffer} fileBuffer - The multer memory buffer
 * @param {string} folder - Target folder in Cloudinary (e.g., 'castlab/products')
 * @returns {Promise<object>} - Resolves to { url, public_id }
 */
const uploadToCloudinary = (fileBuffer, folder = "castlab/products") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        transformation: [
          { fetch_format: "auto", quality: "auto" } // Automatic format & quality optimizations (f_auto, q_auto)
        ]
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload_stream error:", error);
          return reject(error);
        }
        resolve({
          url: result.secure_url, // Secure, CDN-delivered URL
          public_id: result.public_id
        });
      }
    );

    // Write buffer directly to stream and end
    uploadStream.end(fileBuffer);
  });
};

module.exports = {
  cloudinary,
  uploadToCloudinary
};
