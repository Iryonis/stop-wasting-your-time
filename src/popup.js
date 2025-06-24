// Dictionary for slider values
let sliderValues = {
  0: 0.2,
  25: 15,
  50: 30,
  75: 60,
  100: 120,
};

let countdownDefaultTime = 15 * 60; // Default value for the countdown in minutes
let countdownTime; // Current countdown time in minutes
let displayUpdateInterval = null; // Display update interval
let isActive = false; // to track if the countdown is active

/**
 * Format the slider value to the corresponding time in minutes, using a dictionary.
 * If the value is not found, it defaults to 0.
 * @param {number} sliderValue - The value from the slider (0-100)
 * @returns {number} - The corresponding time in minutes
 */
const formatTextFromSlider = (sliderValue) => {
  return sliderValues[sliderValue] || 0;
};

/**
 * Format the time in minutes to a string representation (e.g., "1h 30m").
 * If the time is 0, it returns "0m".
 * @param {number} time - The time in minutes
 * @returns {string} - The formatted time string
 */
const formatTimeInString = (time) => {
  let hours = Math.floor(time / 60);
  let minutes = time % 60;
  let result = [];
  if (hours > 0) result.push(`${hours}h`);
  if (minutes > 0) result.push(`${minutes}m`);
  if (result.length === 0) return "0m";
  return result.join(" ");
};

/**
 * Format the time in seconds into a full time string (HH:MM:SS) (used by the countdown).
 * @param {number} time - The time in seconds
 * @returns {string} - The formatted time string in HH:MM:SS format
 */
const formatTimeFull = (time) => {
  const h = Math.floor(time / 3600);
  const m = Math.floor((time % 3600) / 60);
  const s = time % 60;
  return [h, m, s].map((v) => v.toString().padStart(2, "0")).join(":");
};

/**
 * Starts the display update interval to refresh the countdown display every second.
 * It retrieves the countdown status from the background script and updates the display accordingly.
 * If the countdown is active, it shows the remaining time with opacity to 1; if paused, it shows the time with opacity to 0.5;
 * if inactive, it shows the default time and stops the interval.
 */
const startDisplayUpdate = () => {
  if (displayUpdateInterval) clearInterval(displayUpdateInterval);

  displayUpdateInterval = setInterval(() => {
    chrome.runtime.sendMessage({ action: "getCountdownStatus" }, (status) => {
      if (!status) return;

      const display = document.getElementById("countdown-display");

      if (status.countdownActive) {
        const timeText = formatTimeFull(status.countdownRemaining || 0);
        if (status.isPaused) {
          // If paused, reduce opacity to 0.5
          display.textContent = timeText;
          display.classList.add("opacity-50");
        } else {
          // If active, put opacity to 1
          display.textContent = timeText;
          display.classList.remove("opacity-100");
        }
      } else {
        // If inactive, display the default time
        display.textContent = formatTimeFull(countdownTime * 60);
        stopDisplayUpdate();
      }
    });
  }, 1000);
};

/**
 * Stops the display update interval if it is currently running.
 * This is used to clean up the interval when the countdown is not active.
 */
const stopDisplayUpdate = () => {
  if (displayUpdateInterval) {
    clearInterval(displayUpdateInterval);
    displayUpdateInterval = null;
  }
};

/**
 * Get the slider value and updates the slider text based on the current value of the slider.
 * @param {element} slider - The slider input element
 * @param {element} valueText - The text element to display the slider value
 */
const updateSliderText = (slider, valueText) => {
  const time = formatTextFromSlider(Number(slider.value));
  valueText.textContent = formatTimeInString(time);
  countdownTime = time;
};

document.addEventListener("DOMContentLoaded", () => {
  // Get elements from the DOM
  const slider = document.getElementById("slider-input"); // Slider input element
  const valueText = document.getElementById("slider-value-text"); // Text to display the slider value
  const display = document.getElementById("countdown-display"); // Countdown display element
  const nextCountdown = document.getElementById("next-countdown"); // Next countdown element
  const updateButton = document.getElementById("update-button"); // Button to update the countdown

  // Initialize elements with default values
  display.textContent = formatTimeFull(countdownDefaultTime);
  updateSliderText(slider, valueText);

  /**
   * Retrieves the countdown duration selected by the user from storage and update the display and slider.
   *
   * If a countdown duration is found, it updates the display and slider to reflect the stored value.
   * If no countdown duration is found, it uses the default countdown time.
   * This is done to ensure that the countdown starts with the correct value when the popup is opened.
   */
  chrome.storage.sync.get(["countdownDurationNext"], (data) => {
    if (data.countdownDurationNext) {
      countdownTime = data.countdownDurationNext;
      nextCountdown.textContent = formatTimeFull(countdownTime);
      display.textContent = formatTimeFull(countdownTime);
      const sliderVal =
        Object.keys(sliderValues).find(
          (key) => sliderValues[key] === countdownTime / 60
        ) || 50;
      slider.value = sliderVal;
      updateSliderText(slider, valueText);
    }
  });

  chrome.runtime.sendMessage({ action: "getCountdownStatus" }, (status) => {
    if (status && status.countdownDuration) {
      countdownTime = status.countdownDuration;
      display.textContent = formatTimeFull(countdownTime);
    }
  });

  slider.addEventListener("input", (event) => {
    updateSliderText(slider, valueText);
  });

  /**
   * Event listener for the update button.
   *
   * When clicked, it retrieves the value from the slider
   * and formats it to seconds.
   * If the countdown is not active, it formats the time
   * to a full time string (HH:MM:SS) and updates the display.
   * It also updates the next countdown element with the formatted time.
   * Then it saves the new countdown time to storage.
   */
  updateButton.addEventListener("click", () => {
    // Retrieve the value from the slider and format it to seconds
    countdownTime = formatTextFromSlider(Number(slider.value)) * 60; // In seconds

    // If the countdown is not active, update the display with the formatted time
    if (!isActive) {
      const display = document.getElementById("countdown-display");
      display.textContent = formatTimeFull(countdownTime);
    }

    // Update the next countdown element with the formatted time
    nextCountdown.textContent = formatTimeFull(countdownTime);
    // Save the new countdown time to storage
    chrome.storage.sync.set({ countdownDurationNext: countdownTime });
  });

  /**
   * Checks the current countdown status from the background script.
   * If the countdown is active, it starts the display update interval and updates the button text.
   * If the countdown is not active, it stops the display update interval.
   * This ensures that the popup reflects the current state of the countdown when opened.
   */
  chrome.runtime.sendMessage({ action: "getCountdownStatus" }, (status) => {
    if (status && status.countdownActive) {
      startDisplayUpdate();
      isActive = true;
      const msg = chrome.i18n.getMessage("popup_button_next");
      if (msg) {
        updateButton.textContent = msg;
      }
    } else {
      stopDisplayUpdate();
    }
  });
});
