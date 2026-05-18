const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send a transactional email via Resend API
 * @param {Object} options
 * @param {string} options.email   - Recipient address
 * @param {string} options.subject - Email subject line
 * @param {string} options.html    - HTML body
 */
const sendEmail = async (options) => {
  if (!process.env.RESEND_API_KEY) {
    console.error("❌ RESEND_API_KEY is not set. Email not sent.");
    return;
  }

  // RESEND_FROM_EMAIL must be an address from a VERIFIED domain in your Resend account.
  // e.g. "CASTLAB <noreply@yourdomain.com>"
  // During testing with onboarding@resend.dev you can ONLY send to your own Resend account email.
  const fromAddress = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  console.log(`[DEBUG] Sending email FROM: ${fromAddress}  TO: ${options.email}`);

  try {
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: options.email,
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      console.error("Resend API error:", JSON.stringify(error));
      throw new Error(error.message);
    }

    console.log("✅ Email sent via Resend. ID:", data.id);
    return data;
  } catch (err) {
    console.error("sendEmail failed:", err.message);
    throw new Error("Email could not be sent");
  }
};

module.exports = sendEmail;
