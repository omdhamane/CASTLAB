const video = document.getElementById("introVideo");
const skipBtn = document.getElementById("skipBtn");

// Set playback speed to 2x
video.playbackRate = 2;

// When video ends → go to homepage
video.addEventListener("ended", () => {
  window.location.href = "index.html";
});

// Skip button
skipBtn.addEventListener("click", () => {
  window.location.href = "index.html";
});
