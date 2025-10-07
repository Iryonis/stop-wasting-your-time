/**
 * Background script for the extension.
 */
const countdownDefaultTime = 15 * 60; // Default value for the countdown in seconds
const resetHour = 3; // Hour of the day when the countdown resets (3 AM)

let countdownInterval = null; // Interval for the countdown
let isFinished = false; // Flag to track if the countdown has finished

/**
 * 1. Calls the function {@link handleCountdownState} with 'false' argument when the user leaves a Short tab.
 * It waits for the tab to be fully loaded before checking the URL.
 *
 * 2. If the URL contains "www.youtube.com" and the countdown HAS finished it injects the redirect script.
 *
 * 3. If the URL contains "www.youtube.com/shorts/" and the countdown HAS NOT finished, it injects the video checker script.
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // 1.
  if (changeInfo.status === "complete") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].id === tabId) {
        // Only handle if the new tab isn't a Shorts tab
        if (!tab.url || !tab.url.includes("www.youtube.com/shorts/")) {
          handleCountdownState(false);
        }
      }
    });

    // 2.
    if (isFinished) {
      if (tab.url && tab.url.includes("www.youtube.com")) {
        chrome.scripting
          .executeScript({
            target: { tabId: tabId },
            files: ["redirect.js"],
          })
          .catch((err) =>
            console.error("Injection error onUpdated -> redirect:", err)
          );
        // SHORTS HIDER
        chrome.scripting
          .executeScript({
            target: { tabId: tabId },
            files: ["shorts_hider.js"],
          })
          .catch((err) =>
            console.error("Injection error onUpdated -> shorts_hider:", err)
          );
      }
    } else {
      if (tab.url && tab.url.includes("www.youtube.com/shorts/")) {
        // 3.
        chrome.scripting
          .executeScript({
            target: { tabId: tabId },
            files: ["video_checker.js"],
          })
          .catch((err) =>
            console.error("Injection error onUpdated -> video_checker:", err)
          );
      }
    }
  }
});

/**
 * Handles the state of the countdown.
 * If the countdown has finished, it does nothing.
 * If the given paramemter is true, it starts or resumes the countdown.
 * If false, it pauses the countdown.
 *
 * @param {boolean} test - A boolean indicating whether to start/resume (true) or pause (false) the countdown.
 */
const handleCountdownState = async (test) => {
  if (isFinished) return; // If the countdown has finished, do nothing
  if (test) await startOrResumeCountdown();
  else await pauseCountdown();
};

/**
 * Handles the start, resume, or reset of the countdown based on the current state.
 *
 * 1. It checks if the countdown is active and if the last reset date matches today.
 *    If the last reset date does not match today and it is after {@link resetHour} AM, it resets the countdown and starts a new one.
 *
 * 2. If the countdown has already been finished during the day, it does nothing.
 *
 * 3. If the countdown is active and has remaining time, it resumes the countdown.
 *
 * 4. If the countdown is not active, it starts a new countdown with the duration set in storage.
 * @returns {Promise<void>} - Starts (/and reset) or resumes the countdown based on the current state.
 */
const startOrResumeCountdown = async () => {
  const storage = await chrome.storage.local.get([
    "countdownActive",
    "countdownRemaining",
    "lastResetDate",
    "isFinished",
  ]);
  const today = new Date();

  // 1.
  if (
    storage.lastResetDate !== today.toDateString() &&
    today.getHours() >= resetHour
  ) {
    await resetDailyCountdown();
    await startNewCountdown();
    return;
  }

  // 2.
  if (storage.isFinished) return; // If the countdown has already been finished during the day, do nothing

  // 3.
  if (storage.countdownActive && storage.countdownRemaining > 0) {
    await resumeCountdown();
  } else {
    // 4.
    await startNewCountdown();
  }
};

/**
 * Starts a new countdown with the duration set in storage.
 * If no duration is set, it defaults to 'countdownDefaultTime'.
 * It initializes the countdown state in local storage and starts the countdown ticker.
 *
 * All duration values are in seconds.
 */
const startNewCountdown = async () => {
  const data = await chrome.storage.sync.get(["countdownDurationNext"]);
  const duration = data.countdownDurationNext || countdownDefaultTime;

  await chrome.storage.local.set({
    countdownActive: true,
    countdownDuration: duration,
    countdownRemaining: duration,
    isPaused: false,
    isFinished: false,
    lastResetDate: new Date().toDateString(),
  });

  startCountdownTicker();
};

/**
 * Starts the countdown ticker that updates every second.
 * It checks if the countdown is paused before decrementing the remaining time.
 * If the remaining time reaches zero, it finishes the countdown.
 * If the countdown is still active, it decrements the remaining time by one second.
 */
const startCountdownTicker = () => {
  if (countdownInterval) clearInterval(countdownInterval);

  countdownInterval = setInterval(async () => {
    const storage = await chrome.storage.local.get([
      "countdownRemaining",
      "isPaused",
    ]);

    // If paused, do not decrement
    if (storage.isPaused) return;

    const remaining = storage.countdownRemaining - 1;

    if (remaining <= 0) {
      await finishCountdown();
    } else {
      await chrome.storage.local.set({ countdownRemaining: remaining });
    }
  }, 1000);
};

/**
 * Pauses the countdown.
 * It sets the 'isPaused' flag in local storage to true.
 */
const pauseCountdown = async () => {
  await chrome.storage.local.set({ isPaused: true });
};

/**
 * Resumes the countdown if it was paused.
 * It sets the 'isPaused' flag in local storage to false and starts the countdown ticker if it wasn't already running.
 */
const resumeCountdown = async () => {
  await chrome.storage.local.set({ isPaused: false });
  if (!countdownInterval) {
    startCountdownTicker();
  }
};

/**
 * Finishes the countdown.
 *
 * It clears the countdown interval, sets the countdown state in local storage to inactive,
 * and enables redirection for YouTube tabs.
 * It also activates the redirection script on existing YouTube tabs.
 */
const finishCountdown = async () => {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }

  await chrome.storage.local.set({
    countdownActive: false,
    countdownRemaining: 0,
    isPaused: false,
    isFinished: true,
  });
  isFinished = true;

  await chrome.storage.sync.set({ redirectEnabled: true });

  activateRedirectionOnExistingTabs();
};

/**
 * Resets the daily countdown.
 * It clears the countdown interval, sets the countdown state in local storage to inactive,
 * and resets the last reset date to today.
 */
const resetDailyCountdown = async () => {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }

  await chrome.storage.local.set({
    countdownActive: false,
    countdownRemaining: 0,
    isPaused: false,
    isFinished: false,
    lastResetDate: new Date().toDateString(),
  });
  isFinished = false;

  await chrome.storage.sync.set({ redirectEnabled: false });
};

/**
 * Initializes the countdown.
 *
 * 1. If the last reset date does not match today and it is after {@link resetHour} AM, it resets the countdown.
 * 2. If the countdown has already been finished during the day, it does nothing.
 * 3. If the countdown is active and has remaining time, it starts the countdown ticker and pause it.
 * @returns {Promise<void>} - Initializes the countdown by checking the last reset date and starting
 * the countdown if necessary.
 */
const initializeCountdown = async () => {
  const storage = await chrome.storage.local.get([
    "countdownActive",
    "countdownRemaining",
    "lastResetDate",
    "isFinished",
  ]);

  // 1.
  const today = new Date();
  if (
    storage.lastResetDate !== today.toDateString() &&
    today.getHours() >= resetHour
  ) {
    await resetDailyCountdown();
    return;
  }
  // 2.
  if (storage.isFinished) {
    isFinished = true;
    return;
  }

  // 3.
  if (storage.countdownActive && storage.countdownRemaining > 0) {
    await chrome.storage.local.set({ isPaused: true });
    startCountdownTicker();
  }
};

/**
 * Listens for messages from the popup or other parts of the extension.
 *
 * 'videoStateChanged' action calls the function {@link handleCountdownState} with the 'isPlaying' parameter.
 * 'getCountdownStatus' action retrieves the current countdown status from local storage
 * and sends it back to the sender.
 * 'resetDailyCountdown' action resets the daily countdown {@link resetDailyCountdown} and sends a success response.
 * 'closeCurrentTab' action closes the current tab from which the message was sent.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case "videoStateChanged":
      handleCountdownState(message.isPlaying);
      break;
    case "getCountdownStatus":
      chrome.storage.local.get(
        ["countdownActive", "countdownRemaining", "isPaused", "isFinished"],
        (data) => {
          sendResponse(data);
        }
      );
      return true;
    case "resetDailyCountdown":
      resetDailyCountdown().then(() => {
        sendResponse({ success: true });
      });
      return true;
    case "closeCurrentTab":
      if (sender.tab && sender.tab.id) {
        chrome.tabs.remove(sender.tab.id);
      }
      break;
  }
});

/**
 * Initializes the countdown.
 */
initializeCountdown();

/**
 * Activates the redirection script on all existing YouTube tabs.
 * It queries all tabs with a URL matching "www.youtube.com" and injects the redirect script into each of them.
 */
const activateRedirectionOnExistingTabs = () => {
  chrome.tabs.query({ url: "*://www.youtube.com/*" }, (tabs) => {
    tabs.forEach((tab) => {
      chrome.scripting
        .executeScript({
          target: { tabId: tab.id },
          files: ["redirect.js"],
        })
        .catch((err) =>
          console.error(
            "Injection error (activateRedirectionOnExistingTabs):",
            err
          )
        );
    });
  });
};
