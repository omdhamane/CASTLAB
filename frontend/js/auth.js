async function login(e) {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const errEl = document.getElementById("authError");

  if (errEl) errEl.textContent = "";

  if (!email || !password) {
    if (errEl) errEl.textContent = "Email and password are required.";
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    if (errEl) errEl.textContent = "Enter a valid email address.";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.location.href = "shop.html";
    } else {
      if (errEl) errEl.textContent = data.message || "Login failed";
    }
  } catch {
    if (errEl) errEl.textContent = "Could not connect to server.";
  }
}

async function register(e) {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirm = document.getElementById("confirmPassword")?.value || "";
  const errEl = document.getElementById("authError");

  if (errEl) errEl.textContent = "";

  if (!name || !email || !password) {
    if (errEl) errEl.textContent = "All fields are required.";
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    if (errEl) errEl.textContent = "Enter a valid email address.";
    return;
  }

  const pwCheck = validatePassword(password);
  if (!pwCheck.valid) {
    if (errEl) errEl.textContent = pwCheck.errors[0];
    return;
  }

  if (password !== confirm) {
    if (errEl) errEl.textContent = "Passwords do not match.";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    if (res.ok) {
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        window.location.href = "shop.html";
      } else {
        alert("Registered successfully. Please login.");
        window.location.href = "login.html";
      }
    } else {
      if (errEl) errEl.textContent = data.message || "Registration failed";
    }
  } catch {
    if (errEl) errEl.textContent = "Could not connect to server.";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const pwInput = document.getElementById("password");
  const pwReqList = document.getElementById("passwordRequirements");

  if (pwInput && pwReqList) {
    renderPasswordRequirements(pwReqList, "");
    pwInput.addEventListener("input", () => {
      renderPasswordRequirements(pwReqList, pwInput.value);
    });
  }
});
