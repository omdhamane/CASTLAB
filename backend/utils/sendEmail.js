const nodemailer = require("nodemailer");

// ─── Env var audit (runs on module load) ─────────────────────────────────────
console.log("━━━━━ SMTP CONFIG CHECK ━━━━━");
console.log("EMAIL_USER  :", process.env.EMAIL_USER  || "❌ NOT SET");
console.log("EMAIL_PASS  :", process.env.EMAIL_PASS  ? `✅ Loaded (${process.env.EMAIL_PASS.length} chars)` : "❌ NOT SET");
console.log("FRONTEND_URL:", process.env.FRONTEND_URL || "❌ NOT SET");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

// ─── Gmail SMTP transporter ───────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,  // Must be a 16-char App Password, NOT Gmail login password
  },
});

// ─── Verify SMTP connection on startup ───────────────────────────────────────
transporter.verify((error, success) => {
  if (error) {
    console.error("━━━━━ SMTP VERIFY FAILED ━━━━━");
    console.error("Code   :", error.code);
    console.error("Message:", error.message);
    console.error("Stack  :", error.stack);
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  } else {
    console.log("✅ SMTP connection verified — Gmail SMTP ready to send");
  }
});


/**
 * Core send helper — all email functions route through here.
 * @param {string} to      - Recipient address
 * @param {string} subject - Email subject
 * @param {string} html    - HTML body
 */
const sendMail = async (to, subject, html) => {
  console.log(`[SMTP] Attempting to send → TO: ${to} | SUBJECT: ${subject}`);
  console.log(`[SMTP] FROM: ${process.env.EMAIL_USER}`);

  try {
    const info = await transporter.sendMail({
      from: `"CASTLAB" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("━━━━━ EMAIL SENT SUCCESSFULLY ━━━━━");
    console.log("messageId :", info.messageId);
    console.log("accepted  :", info.accepted);
    console.log("rejected  :", info.rejected);
    console.log("response  :", info.response);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    return info;
  } catch (err) {
    console.error("━━━━━ EMAIL SEND FAILED ━━━━━");
    console.error("TO      :", to);
    console.error("Code    :", err.code);
    console.error("Command :", err.command);
    console.error("Message :", err.message);
    console.error("Stack   :", err.stack);
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    throw err; // re-throw so callers can handle it
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// Public helpers
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Send account verification email.
 * @param {string} toEmail
 * @param {string} verifyUrl  - Full frontend URL with ?token=...
 */
const sendVerificationEmail = (toEmail, verifyUrl) => {
  const html = `
  <!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    body{margin:0;padding:0;background:#050505;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#fff}
    .wrap{max-width:600px;margin:0 auto;padding:40px 20px}
    .logo{font-size:28px;font-weight:800;letter-spacing:4px;color:#fff;text-align:center;display:block;margin-bottom:40px;text-decoration:none}
    .card{background:#111;border:1px solid #222;border-radius:12px;padding:40px;box-shadow:0 10px 30px rgba(0,0,0,.5)}
    h1{font-size:24px;font-weight:600;margin:0 0 20px;text-align:center}
    p{font-size:16px;line-height:1.6;color:#aaa;text-align:center;margin:0 0 24px}
    .btn{display:inline-block;background:#fff;color:#000!important;font-weight:600;font-size:16px;text-decoration:none;padding:14px 32px;border-radius:8px}
    .footer{margin-top:32px;text-align:center;font-size:12px;color:#555}
  </style></head><body>
  <div class="wrap">
    <a href="https://castlab-gold.vercel.app" class="logo">CASTLAB</a>
    <div class="card">
      <h1>Verify Your Email</h1>
      <p>Welcome to CASTLAB. Click the button below to verify your email address and activate your account.</p>
      <div style="text-align:center;margin:32px 0">
        <a href="${verifyUrl}" class="btn" clicktracking="off">Verify Email</a>
      </div>
      <p style="font-size:14px;margin:0">This link expires in 24 hours. If you did not sign up, ignore this email.</p>
    </div>
    <div class="footer"><p>&copy; ${new Date().getFullYear()} CASTLAB. All rights reserved.</p></div>
  </div>
  </body></html>`;

  return sendMail(toEmail, "Verify Your CASTLAB Account", html);
};

/**
 * Send password reset email.
 * @param {string} toEmail
 * @param {string} resetUrl - Full frontend URL with ?token=...
 */
const sendPasswordResetEmail = (toEmail, resetUrl) => {
  const html = `
  <!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    body{margin:0;padding:0;background:#050505;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#fff}
    .wrap{max-width:600px;margin:0 auto;padding:40px 20px}
    .logo{font-size:28px;font-weight:800;letter-spacing:4px;color:#fff;text-align:center;display:block;margin-bottom:40px;text-decoration:none}
    .card{background:#111;border:1px solid #222;border-radius:12px;padding:40px;box-shadow:0 10px 30px rgba(0,0,0,.5)}
    h1{font-size:24px;font-weight:600;margin:0 0 20px;text-align:center}
    p{font-size:16px;line-height:1.6;color:#aaa;text-align:center;margin:0 0 24px}
    .btn{display:inline-block;background:#fff;color:#000!important;font-weight:600;font-size:16px;text-decoration:none;padding:14px 32px;border-radius:8px}
    .footer{margin-top:32px;text-align:center;font-size:12px;color:#555}
  </style></head><body>
  <div class="wrap">
    <a href="https://castlab-gold.vercel.app" class="logo">CASTLAB</a>
    <div class="card">
      <h1>Reset Your Password</h1>
      <p>We received a request to reset your password. Click the button below — this link expires in 10 minutes.</p>
      <div style="text-align:center;margin:32px 0">
        <a href="${resetUrl}" class="btn" clicktracking="off">Reset Password</a>
      </div>
      <p style="font-size:14px;margin:0">If you did not request this, you can safely ignore this email.</p>
    </div>
    <div class="footer"><p>&copy; ${new Date().getFullYear()} CASTLAB. All rights reserved.</p></div>
  </div>
  </body></html>`;

  return sendMail(toEmail, "CASTLAB — Password Reset", html);
};

/**
 * Send welcome email after account verification.
 * @param {string} toEmail
 * @param {string} name
 */
const sendWelcomeEmail = (toEmail, name) => {
  const html = `
  <!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    body{margin:0;padding:0;background:#050505;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#fff}
    .wrap{max-width:600px;margin:0 auto;padding:40px 20px}
    .logo{font-size:28px;font-weight:800;letter-spacing:4px;color:#fff;text-align:center;display:block;margin-bottom:40px;text-decoration:none}
    .card{background:#111;border:1px solid #222;border-radius:12px;padding:40px;box-shadow:0 10px 30px rgba(0,0,0,.5)}
    h1{font-size:24px;font-weight:600;margin:0 0 20px;text-align:center}
    p{font-size:16px;line-height:1.6;color:#aaa;text-align:center;margin:0 0 24px}
    .btn{display:inline-block;background:#fff;color:#000!important;font-weight:600;font-size:16px;text-decoration:none;padding:14px 32px;border-radius:8px}
    .footer{margin-top:32px;text-align:center;font-size:12px;color:#555}
  </style></head><body>
  <div class="wrap">
    <a href="https://castlab-gold.vercel.app" class="logo">CASTLAB</a>
    <div class="card">
      <h1>Welcome, ${name}!</h1>
      <p>Your email has been verified and your CASTLAB account is fully active. Explore our exclusive collection of premium diecast scale models.</p>
      <div style="text-align:center;margin:32px 0">
        <a href="https://castlab-gold.vercel.app/shop.html" class="btn">Shop Now</a>
      </div>
    </div>
    <div class="footer"><p>&copy; ${new Date().getFullYear()} CASTLAB. All rights reserved.</p></div>
  </div>
  </body></html>`;

  return sendMail(toEmail, "Welcome to CASTLAB", html);
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail };
