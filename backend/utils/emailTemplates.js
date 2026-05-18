/**
 * Generates a premium dark-themed HTML email for CASTLAB
 * @param {string} title - The main heading
 * @param {string} body - The main content
 * @param {string} ctaText - The button text
 * @param {string} ctaLink - The button URL
 * @returns {string} HTML string
 */
const generatePremiumEmail = (title, body, ctaText, ctaLink) => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        background-color: #050505;
        color: #ffffff;
        -webkit-font-smoothing: antialiased;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 40px 20px;
        background-color: #050505;
      }
      .logo {
        font-size: 28px;
        font-weight: 800;
        letter-spacing: 4px;
        color: #ffffff;
        text-align: center;
        margin-bottom: 40px;
        text-decoration: none;
        display: block;
      }
      .card {
        background: #111111;
        border: 1px solid #222222;
        border-radius: 12px;
        padding: 40px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      }
      h1 {
        font-size: 24px;
        font-weight: 600;
        margin-top: 0;
        margin-bottom: 24px;
        color: #ffffff;
        text-align: center;
      }
      p {
        font-size: 16px;
        line-height: 1.6;
        color: #aaaaaa;
        margin-bottom: 24px;
        text-align: center;
      }
      .button-container {
        text-align: center;
        margin: 32px 0;
      }
      .btn {
        display: inline-block;
        background-color: #ffffff;
        color: #000000 !important;
        font-weight: 600;
        font-size: 16px;
        text-decoration: none;
        padding: 14px 32px;
        border-radius: 8px;
        transition: transform 0.2s ease;
      }
      .footer {
        margin-top: 40px;
        text-align: center;
        font-size: 12px;
        color: #666666;
      }
      .footer a {
        color: #888888;
        text-decoration: none;
      }
      @media only screen and (max-width: 600px) {
        .card { padding: 24px; }
        h1 { font-size: 20px; }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <a href="https://castlab.com" class="logo">CASTLAB</a>
      <div class="card">
        <h1>${title}</h1>
        <p>${body}</p>
        
        ${ctaText && ctaLink ? `
        <div class="button-container">
          <a href="${ctaLink}" class="btn" clicktracking="off">${ctaText}</a>
        </div>
        ` : ''}
        
        <p style="font-size: 14px; margin-top: 32px; margin-bottom: 0;">
          If you did not request this, you can safely ignore this email.
        </p>
      </div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} CASTLAB. All rights reserved.</p>
      </div>
    </div>
  </body>
  </html>
  `;
};

module.exports = {
  getVerificationEmail: (verifyUrl) => {
    return generatePremiumEmail(
      "Verify Your Email",
      "Welcome to CASTLAB. To unlock full access to our premium diecast marketplace and complete your registration, please verify your email address.",
      "Verify Email",
      verifyUrl
    );
  },
  getResetPasswordEmail: (resetUrl) => {
    return generatePremiumEmail(
      "Reset Your Password",
      "We received a request to reset your password. Click the button below to choose a new password. This link will expire in 10 minutes.",
      "Reset Password",
      resetUrl
    );
  },
  getWelcomeEmail: (name) => {
    return generatePremiumEmail(
      `Welcome, ${name}`,
      "Your email has been verified and your account is now active. Explore our exclusive collection of premium scale models.",
      "Shop Now",
      "http://localhost:5000/shop.html" // Replace with actual domain in prod
    );
  }
};
