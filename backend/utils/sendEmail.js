const { Resend } = require('resend');

// Initialize Resend with the API key from environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send an email using Resend API
 * @param {Object} options 
 * @param {string} options.email - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content for the email
 */
const sendEmail = async (options) => {
  if (!process.env.RESEND_API_KEY) {
    console.warn("⚠️  RESEND_API_KEY is not defined. Email will not be sent.");
    return;
  }

  try {
    const data = await resend.emails.send({
      // Resend requires a verified domain. 
      // During development/testing, you can use 'onboarding@resend.dev'
      // which allows sending ONLY to the email address registered with your Resend account.
      from: 'CASTLAB <onboarding@resend.dev>',
      to: options.email,
      subject: options.subject,
      html: options.html,
    });

    if (data.error) {
      throw new Error(data.error.message);
    }

    console.log("Message sent via Resend: %s", data.data.id);
    return data;
  } catch (error) {
    console.error("Resend Error:", error.message);
    throw new Error("Email could not be sent");
  }
};

module.exports = sendEmail;
