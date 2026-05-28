const User = require("../models/User");
const Subscriber = require("../models/Subscriber");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { validatePassword } = require("../utils/passwordValidation");
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendNewsletterWelcomeEmail
} = require("../utils/sendEmail");

// REGISTER
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) {
      return res.status(400).json({ message: pwCheck.errors[0] });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification token
    const verificationTokenStr = crypto.randomBytes(20).toString("hex");
    const hashedVerificationToken = crypto
      .createHash("sha256")
      .update(verificationTokenStr)
      .digest("hex");

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      isVerified: false,
      verificationToken: hashedVerificationToken
    });

    // Send verification email — always uses FRONTEND_URL
    const FRONTEND = process.env.FRONTEND_URL || "https://castlab-gold.vercel.app";
    const verifyUrl = `${FRONTEND}/verify-email.html?token=${verificationTokenStr}`;
    const localVerifyUrl = `http://localhost:5500/verify-email.html?token=${verificationTokenStr}`;
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📧 [DEBUG] Verification URL (Production):", verifyUrl);
    console.log("💻 [DEBUG] Verification URL (Local Dev) :", localVerifyUrl);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    try {
      await sendVerificationEmail(user.email, verifyUrl);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError.message);
      // Registration still succeeds even if email fails
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" } // Persistent sessions
    );

    res.status(201).json({
      message: "User registered. Please verify your email.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error("Register error:", error.message);
    res.status(500).json({ message: "Server error during registration" });
  }
};

// LOGIN
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate fields
    if (!email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    // ✅ FIXED: Check JWT_SECRET exists
    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET is not defined in .env");
      return res.status(500).json({ message: "Server configuration error" });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" } // Persistent sessions
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ message: "Server error during login" });
  }
};

// GET USER PROFILE
exports.getUserProfile = async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    console.error("Get profile error:", error.message);
    res.status(500).json({ message: "Server error fetching profile" });
  }
};

// UPDATE USER PROFILE
exports.updateUserProfile = async (req, res) => {
  try {
    const { name, phone, address, city, state, zipCode, country } = req.body;
    const user = req.user;

    user.name = name || user.name;
    user.phone = phone || user.phone;
    user.address = address || user.address;
    user.city = city || user.city;
    user.state = state || user.state;
    user.zipCode = zipCode || user.zipCode;
    user.country = country || user.country;

    const updatedUser = await user.save();

    res.json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address,
        city: updatedUser.city,
        state: updatedUser.state,
        zipCode: updatedUser.zipCode,
        country: updatedUser.country
      }
    });
  } catch (error) {
    console.error("Update profile error:", error.message);
    res.status(500).json({ message: "Server error updating profile" });
  }
};

// FORGOT PASSWORD
exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ message: "There is no user with that email" });
    }

    const resetToken = crypto.randomBytes(20).toString("hex");

    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await user.save();

    // Password reset link — always uses FRONTEND_URL
    const FRONTEND = process.env.FRONTEND_URL || "https://castlab-gold.vercel.app";
    const resetUrl = `${FRONTEND}/reset-password.html?token=${resetToken}`;
    const localResetUrl = `http://localhost:5500/reset-password.html?token=${resetToken}`;
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📧 [DEBUG] Password Reset URL (Production):", resetUrl);
    console.log("💻 [DEBUG] Password Reset URL (Local Dev) :", localResetUrl);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    try {
      await sendPasswordResetEmail(user.email, resetUrl);
      res.status(200).json({ message: "Password reset email sent" });
    } catch (err) {
      console.error("Reset email failed:", err.message);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      return res.status(500).json({ message: "Email could not be sent" });
    }
  } catch (error) {
    console.error("Forgot password error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// RESET PASSWORD
exports.resetPassword = async (req, res) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.resetToken)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Set new password
    user.password = await bcrypt.hash(req.body.password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Generate token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      message: "Password reset successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified
      },
    });
  } catch (error) {
    console.error("Reset password error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// VERIFY EMAIL
exports.verifyEmail = async (req, res) => {
  try {
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      verificationToken: hashedToken
    });

    const FRONTEND = process.env.FRONTEND_URL || "https://castlab-gold.vercel.app";

    if (req.method === "GET") {
      if (!user) {
        return res.redirect(`${FRONTEND}/login.html?verified=false&reason=invalid`);
      }
      user.isVerified = true;
      user.verificationToken = undefined;
      await user.save();
      
      try {
        await sendWelcomeEmail(user.email, user.name);
      } catch (e) {
        console.error("Failed to send welcome email:", e.message);
      }
      return res.redirect(`${FRONTEND}/login.html?verified=true`);
    }

    if (!user) {
      return res.status(400).json({ message: "Invalid verification token" });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();
    
    // Send welcome email (non-blocking)
    try {
      await sendWelcomeEmail(user.email, user.name);
    } catch (e) {
      console.error("Failed to send welcome email:", e.message);
    }

    // Generate fresh token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      message: "Email verified successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: true
      }
    });
  } catch (error) {
    console.error("Verify email error:", error.message);
    if (req.method === "GET") {
      const FRONTEND = process.env.FRONTEND_URL || "https://castlab-gold.vercel.app";
      return res.redirect(`${FRONTEND}/login.html?verified=false&reason=server_error`);
    }
    res.status(500).json({ message: "Server error during verification" });
  }
};

// RESEND VERIFICATION EMAIL
// POST /api/auth/resend-verification
exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // Prevent email enumeration — always return 200 if user not found
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If an account exists with that email, a verification link has been sent."
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "This account is already verified. Please log in."
      });
    }

    // Generate new token
    const verificationTokenStr = crypto.randomBytes(20).toString("hex");
    user.verificationToken = crypto
      .createHash("sha256")
      .update(verificationTokenStr)
      .digest("hex");
    await user.save();

    // Build frontend verification URL
    const FRONTEND = process.env.FRONTEND_URL || "https://castlab-gold.vercel.app";
    const verifyUrl = `${FRONTEND}/verify-email.html?token=${verificationTokenStr}`;
    const localVerifyUrl = `http://localhost:5500/verify-email.html?token=${verificationTokenStr}`;
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📧 [DEBUG] Resend Verification URL (Production):", verifyUrl);
    console.log("💻 [DEBUG] Resend Verification URL (Local Dev) :", localVerifyUrl);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    try {
      await sendVerificationEmail(user.email, verifyUrl);
    } catch (emailErr) {
      console.error("SMTP error on resend:", emailErr.message);
      return res.status(500).json({
        success: false,
        message: "Failed to send verification email. Please try again later."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Verification email sent. Please check your inbox."
    });
  } catch (error) {
    console.error("resendVerification error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again later."
    });
  }
};

// VERIFY ADMIN KEY AND UPGRADE ROLE
exports.verifyAdminKey = async (req, res) => {
  try {
    const { adminKey } = req.body;
    const expected = process.env.ADMIN_KEY || "castlab-admin";

    if (!adminKey || adminKey !== expected) {
      return res.status(401).json({ message: "Invalid admin key" });
    }

    const user = req.user; // populated by protect middleware
    user.role = "admin";
    await user.save();

    // Generate a fresh token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d"
    });

    res.json({
      message: "Admin access granted. Account upgraded to admin.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error("Verify admin key error:", error.message);
    res.status(500).json({ message: "Server error during admin verification" });
  }
};

// SUBSCRIBE NEWSLETTER
exports.subscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if already subscribed
    const existing = await Subscriber.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ message: "You are already subscribed to our newsletter!" });
    }

    // Save subscription
    await Subscriber.create({ email: normalizedEmail });

    // Send newsletter welcome email
    try {
      await sendNewsletterWelcomeEmail(normalizedEmail);
    } catch (e) {
      console.error("Failed to send newsletter welcome email:", e.message);
    }

    res.status(201).json({
      message: "Successfully joined the lab! Check your inbox for a confirmation. 🧪"
    });
  } catch (error) {
    console.error("Subscribe newsletter error:", error.message);
    res.status(500).json({ message: "Failed to subscribe. Please try again later." });
  }
};