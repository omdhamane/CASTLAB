const video = document.getElementById("introVideo");
const skipBtn = document.getElementById("skipBtn");

// Force 2x speed
video.playbackRate = 2;

// Redirect after video ends
video.addEventListener("ended", () => {
  window.location.href = "index.html";
});

// Skip button
skipBtn.addEventListener("click", () => {
  window.location.href = "index.html";
});
