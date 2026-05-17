const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;

const PASSWORD_REQUIREMENTS = [
  { test: (p) => p.length >= PASSWORD_MIN_LENGTH, label: "At least 8 characters" },
  { test: (p) => /[A-Z]/.test(p), label: "One uppercase letter (A–Z)" },
  { test: (p) => /[a-z]/.test(p), label: "One lowercase letter (a–z)" },
  { test: (p) => /[0-9]/.test(p), label: "One number (0–9)" },
  { test: (p) => /[^A-Za-z0-9]/.test(p), label: "One special character (!@#$…)" }
];

function validatePassword(password) {
  const errors = [];

  if (!password || typeof password !== "string") {
    return { valid: false, errors: ["Password is required"] };
  }

  if (password.length > PASSWORD_MAX_LENGTH) {
    errors.push(`Password must be at most ${PASSWORD_MAX_LENGTH} characters`);
  }

  PASSWORD_REQUIREMENTS.forEach((rule) => {
    if (!rule.test(password)) errors.push(rule.label);
  });

  return { valid: errors.length === 0, errors };
}

module.exports = { validatePassword, PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH };
