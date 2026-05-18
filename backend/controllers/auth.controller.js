const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validatePassword } = require("../utils/passwordValidation");

const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const { getVerificationEmail, getResetPasswordEmail, getWelcomeEmail } = require("../utils/emailTemplates");

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

    // Send verification email
    const frontendUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get("host")}`;
    const verifyUrl = `${frontendUrl}/verify-email.html?token=${verificationTokenStr}`;
    
    try {
      await sendEmail({
        email: user.email,
        subject: "Verify Your CASTLAB Account",
        html: getVerificationEmail(verifyUrl)
      });
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // We don't fail registration if email fails, but we should note it
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

    const frontendUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get("host")}`;
    const resetUrl = `${frontendUrl}/reset-password.html?token=${resetToken}`;

    try {
      await sendEmail({
        email: user.email,
        subject: "CASTLAB - Password Reset",
        html: getResetPasswordEmail(resetUrl)
      });

      res.status(200).json({ message: "Email sent" });
    } catch (err) {
      console.error(err);
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

    if (!user) {
      return res.status(400).json({ message: "Invalid verification token" });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();
    
    // Optional Welcome Email
    try {
      await sendEmail({
        email: user.email,
        subject: "Welcome to CASTLAB",
        html: getWelcomeEmail(user.name)
      });
    } catch (e) {
      console.error("Failed to send welcome email", e);
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
    res.status(500).json({ message: "Server error during verification" });
  }
};

// RESEND VERIFICATION EMAIL
exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      // Return success to prevent email enumeration
      return res.status(200).json({ message: "If an account exists, a verification email has been sent." });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Account is already verified" });
    }

    const verificationTokenStr = crypto.randomBytes(20).toString("hex");
    const hashedVerificationToken = crypto
      .createHash("sha256")
      .update(verificationTokenStr)
      .digest("hex");

    user.verificationToken = hashedVerificationToken;
    await user.save();

    const verifyUrl = `${req.protocol}://${req.get("host")}/verify-email.html?token=${verificationTokenStr}`;
    
    await sendEmail({
      email: user.email,
      subject: "Verify Your CASTLAB Account",
      html: getVerificationEmail(verifyUrl)
    });

    res.status(200).json({ message: "Verification email sent" });
  } catch (error) {
    console.error("Resend verification error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};