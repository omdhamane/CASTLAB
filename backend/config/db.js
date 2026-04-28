const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    console.log("🔄 Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGODB_URI);

    // ✅ This will tell us which database is connected
    console.log("✅ MongoDB connected successfully");
    console.log("📦 Database name:", mongoose.connection.name);

  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;