const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  // ✅ Check authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    try {
      // Extract token
      token = req.headers.authorization.split(" ")[1];

      // ✅ FIXED: Check JWT_SECRET exists
      if (!process.env.JWT_SECRET) {
        return res.status(500).json({ message: "Server configuration error" });
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user to request
      req.user = await User.findById(decoded.userId).select("-password");
      if (!req.user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      next();

    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token expired, please login again" });
      }
      if (error.name === "JsonWebTokenError") {
        return res.status(401).json({ message: "Invalid token" });
      }
      return res.status(401).json({ message: "Not authorized" });
    }
  } else {
    return res.status(401).json({ 
      message: "No token provided. Use: Authorization: Bearer <token>" 
    });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Role ${req.user.role} is not authorized to access this route` });
    }
    next();
  };
};

module.exports = { protect, authorizeRoles };