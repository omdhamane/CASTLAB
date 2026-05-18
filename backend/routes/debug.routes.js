const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

/**
 * POST /api/debug/test-email
 * Body: { "to": "someone@example.com" }
 *
 * Bypasses the auth system entirely.
 * Sends a plain test email and returns full SMTP result.
 * REMOVE THIS ROUTE BEFORE GOING TO PRODUCTION.
 */
router.all("/test-email", async (req, res) => {
  // Support both POST (body) and GET (query) so it can be tested in a browser
  const to = req.body?.to || req.query?.to;

  if (!to) {
    return res.status(400).json({ success: false, message: "Provide { to: 'email@example.com' } in request body" });
  }

  // Log env state at request time
  const envReport = {
    EMAIL_USER   : process.env.EMAIL_USER   || "❌ NOT SET",
    EMAIL_PASS   : process.env.EMAIL_PASS   ? `✅ Loaded (${process.env.EMAIL_PASS.length} chars)` : "❌ NOT SET",
    FRONTEND_URL : process.env.FRONTEND_URL || "❌ NOT SET",
  };
  console.log("[DEBUG ROUTE] /api/debug/test-email called. Env:", envReport);

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // First verify the connection
  try {
    await new Promise((resolve, reject) => {
      transporter.verify((err, success) => {
        if (err) reject(err);
        else resolve(success);
      });
    });
    console.log("[DEBUG ROUTE] SMTP verify: OK");
  } catch (verifyErr) {
    console.error("[DEBUG ROUTE] SMTP verify FAILED:", verifyErr.message);
    return res.status(500).json({
      success: false,
      stage: "smtp_verify",
      error: verifyErr.message,
      code: verifyErr.code,
      envReport,
    });
  }

  // Then attempt the send
  try {
    const info = await transporter.sendMail({
      from: `"CASTLAB Debug" <${process.env.EMAIL_USER}>`,
      to,
      subject: "CASTLAB SMTP Debug Test",
      html: `<h2>SMTP Test</h2><p>If you received this, Gmail SMTP is working correctly on Render. ✅</p><p>Sent at: ${new Date().toISOString()}</p>`,
    });

    console.log("[DEBUG ROUTE] Email sent successfully:", info.messageId);
    return res.json({
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
      envReport,
    });
  } catch (sendErr) {
    console.error("[DEBUG ROUTE] sendMail FAILED:", sendErr.message);
    return res.status(500).json({
      success: false,
      stage: "send_mail",
      error: sendErr.message,
      code: sendErr.code,
      command: sendErr.command,
      envReport,
    });
  }
});

module.exports = router;
