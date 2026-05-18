async function login(e) {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const errEl = document.getElementById("authError");

  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.innerText;

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

  submitBtn.disabled = true;
  submitBtn.innerText = "Authenticating...";

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
      
      if (data.user && data.user.isVerified === false) {
        window.location.href = "verify-email.html";
      } else {
        window.location.href = "shop.html";
      }
    } else {
      if (errEl) errEl.textContent = data.message || "Login failed";
      submitBtn.disabled = false;
      submitBtn.innerText = originalBtnText;
    }
  } catch {
    if (errEl) errEl.textContent = "Could not connect to server.";
    submitBtn.disabled = false;
    submitBtn.innerText = originalBtnText;
  }
}

async function register(e) {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirm = document.getElementById("confirmPassword")?.value || "";
  const errEl = document.getElementById("authError");

  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.innerText;
  
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

  submitBtn.disabled = true;
  submitBtn.innerText = "Creating Account...";

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
        
        // Redirect to verification page since they just registered
        if (!data.user.isVerified) {
          window.location.href = "verify-email.html";
        } else {
          window.location.href = "shop.html";
        }
      } else {
        alert("Registered successfully. Please login.");
        window.location.href = "login.html";
      }
    } else {
      if (errEl) errEl.textContent = data.message || "Registration failed";
      submitBtn.disabled = false;
      submitBtn.innerText = originalBtnText;
    }
  } catch {
    if (errEl) errEl.textContent = "Could not connect to server.";
    submitBtn.disabled = false;
    submitBtn.innerText = originalBtnText;
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
