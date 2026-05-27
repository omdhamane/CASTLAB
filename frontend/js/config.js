const API_BASE = (window.location.hostname === "localhost" || 
                  window.location.hostname === "127.0.0.1" || 
                  window.location.hostname === "")
  ? "http://localhost:5000"
  : "https://castlab-i3hm.onrender.com";

const API_URL = API_BASE + "/api"; // used by auth pages
