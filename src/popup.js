let sliderValues = {
  0: 0,
  25: 15,
  50: 30,
  75: 60,
  100: 120,
};

let chronoTime = 30; // Valeur par défaut pour le chrono (en minutes)
let countdownInterval = null; // pour clearInterval plus tard

formatTextFromSlider = (sliderValue) => {
  return sliderValues[sliderValue] || 0;
};

formatTimeInString = (time) => {
  let hours = Math.floor(time / 60);
  let minutes = time % 60;
  let result = [];
  if (hours > 0) result.push(`${hours}h`);
  if (minutes > 0) result.push(`${minutes}m`);
  if (result.length === 0) return "0m";
  return result.join(" ");
};

// ➕ Affiche hh:mm:ss à partir de secondes
formatTimeFull = (totalSeconds) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((v) => v.toString().padStart(2, "0")).join(":");
};

// ➕ Lancer le chrono avec chronoTime (en minutes)
startCountdown = () => {
  if (countdownInterval) clearInterval(countdownInterval);

  const display = document.getElementById("countdown-display");
  const durationMs = chronoTime * 60 * 1000;
  const endTime = Date.now() + durationMs;

  function tick() {
    const now = Date.now();
    let remaining = Math.round((endTime - now) / 1000);
    if (remaining < 0) remaining = 0;

    display.textContent = formatTimeFull(remaining);

    if (remaining === 0) {
      clearInterval(countdownInterval);
      // ➕ Ajoute ton comportement ici (ex: redirection, popup...)
      alert("Temps écoulé !");
    }
  }

  tick(); // affichage immédiat
  countdownInterval = setInterval(tick, 1000);
};

document.addEventListener("DOMContentLoaded", () => {
  const slider = document.getElementById("slider-input");
  const valueText = document.getElementById("slider-value-text");
  // Suppression de chrono-input (inutile)

  function updateSliderText() {
    valueText.textContent = formatTimeInString(
      formatTextFromSlider(Number(slider.value))
    );
  }

  slider.addEventListener("input", updateSliderText);
  updateSliderText(); // Initialisation au chargement

  // Correction de updateChrono pour prendre la valeur du slider
  window.updateChrono = () => {
    chronoTime = formatTextFromSlider(Number(slider.value));
    startCountdown();
  };
});
