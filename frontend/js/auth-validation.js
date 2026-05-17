/* Industry-standard password rules (OWASP-aligned) */

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;

const PASSWORD_REQUIREMENTS = [
  { id: "len", test: (p) => p.length >= PASSWORD_MIN_LENGTH, label: "At least 8 characters" },
  { id: "upper", test: (p) => /[A-Z]/.test(p), label: "One uppercase letter (A–Z)" },
  { id: "lower", test: (p) => /[a-z]/.test(p), label: "One lowercase letter (a–z)" },
  { id: "number", test: (p) => /[0-9]/.test(p), label: "One number (0–9)" },
  {
    id: "special",
    test: (p) => /[^A-Za-z0-9]/.test(p),
    label: "One special character (!@#$…)"
  }
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

function renderPasswordRequirements(container, password) {
  if (!container) return;

  container.innerHTML = PASSWORD_REQUIREMENTS.map(
    (rule) => `
    <li class="pw-req" data-rule="${rule.id}">
      <span class="pw-req-icon">○</span>
      <span>${rule.label}</span>
    </li>`
  ).join("");

  if (!password) return;

  container.querySelectorAll(".pw-req").forEach((li) => {
    const rule = PASSWORD_REQUIREMENTS.find((r) => r.id === li.dataset.rule);
    const pass = rule && rule.test(password);
    li.classList.toggle("met", pass);
    li.querySelector(".pw-req-icon").textContent = pass ? "✓" : "○";
  });
}

function getUserInitials(name) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
