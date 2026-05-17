document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  const profileForm = document.getElementById("profileForm");
  const errorEl = document.getElementById("profileError");
  const successEl = document.getElementById("profileSuccess");
  const btn = document.getElementById("saveProfileBtn");

  // Fetch current profile
  fetch(`${API_BASE}/api/auth/profile`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(user => {
      if (user.message) throw new Error(user.message);
      
      document.getElementById("name").value = user.name || "";
      document.getElementById("email").value = user.email || "";
      document.getElementById("phone").value = user.phone || "";
      document.getElementById("address").value = user.address || "";
      document.getElementById("city").value = user.city || "";
      document.getElementById("state").value = user.state || "";
      document.getElementById("zipCode").value = user.zipCode || "";
      document.getElementById("country").value = user.country || "";
    })
    .catch(err => {
      console.error(err);
      errorEl.textContent = "Failed to load profile details.";
      errorEl.classList.remove("hidden");
    });

  // Handle form submission
  profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.classList.add("hidden");
    successEl.classList.add("hidden");
    btn.disabled = true;
    btn.textContent = "Saving...";

    const profileData = {
      name: document.getElementById("name").value,
      phone: document.getElementById("phone").value,
      address: document.getElementById("address").value,
      city: document.getElementById("city").value,
      state: document.getElementById("state").value,
      zipCode: document.getElementById("zipCode").value,
      country: document.getElementById("country").value,
    };

    try {
      const res = await fetch(`${API_BASE}/api/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update profile");

      // Update local storage user data
      localStorage.setItem("user", JSON.stringify(data.user));
      // Re-init navbar to reflect name changes
      if (typeof initNavBadges === "function") initNavBadges();

      successEl.textContent = "Profile saved successfully!";
      successEl.classList.remove("hidden");
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.classList.remove("hidden");
    } finally {
      btn.disabled = false;
      btn.textContent = "Save Profile";
    }
  });
});
