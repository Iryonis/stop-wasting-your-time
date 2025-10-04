/**
 * Background script for the extension.
 */

let countdownInterval = null; // Interval for the countdown
let countdownDefaultTime = 15 * 60; // Default value for the countdown in seconds
let isFinished = false; // Flag to track if the countdown has finished

/**
 * Calls the function 'handleTabChange' when the active tab changes.
 * This function checks the URL of the active tab and starts or pauses the countdown accordingly.
 */
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  if (isFinished) return; // If the countdown has finished, do not handle tab changes
  const tab = await chrome.tabs.get(activeInfo.tabId);
  handleTabChange(tab.url);
});

/**
 * 1. Calls the function 'handleTabChange' when the tab is changed or updated.
 * It waits for the tab to be fully loaded before checking the URL, and it checks if the countdown has finished.
 *
 * 2. If the URL contains "youtube.com" and the parameter 'redirectEnabled' (from chrome storage) is at 'true',
 * it injects the redirect script.
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // 1.
  if (changeInfo.status === "complete") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].id === tabId) {
        handleTabChange(tab.url);
      }
    });

    // 2.
    if (tab.url && tab.url.includes("youtube.com")) {
      chrome.storage.sync.get(["redirectEnabled"], (data) => {
        if (data.redirectEnabled) {
          chrome.scripting
            .executeScript({
              target: { tabId: tabId },
              files: ["redirect.js"],
            })
            .catch((err) => console.log("Injection error (onUpdated):", err));
        }
      });
    }
  }
});

/**
 * Handles the change of the active tab.
 * If the URL contains "youtube.com/shorts/", it starts or resumes the countdown.
 * If the URL does not contain "youtube.com/shorts/", it pauses the countdown.
 * @param {string} url - The URL of the active tab
 */
const handleTabChange = async (url) => {
  if (isFinished) return; // If the countdown has finished, do not handle tab changes
  if (url && url.includes("youtube.com/shorts/")) {
    console.log("On Shorts - start the countdown");
    await startOrResumeCountdown();
  } else {
    console.log("Not on Shorts - pause the countdown");
    await pauseCountdown();
  }
};

/**
 * Handles the start, resume, or reset of the countdown based on the current state.
 *
 * 1. It checks if the countdown is active and if the last reset date matches today.
 *    If the last reset date does not match today and it is after 3 AM, it resets the countdown and starts a new one.
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
  if (storage.lastResetDate !== today.toDateString() && today.getHours() >= 3) {
    await resetDailyCountdown();
    await startNewCountdown();
    console.log("Reset + start");
    return;
  }

  // 2.
  if (storage.isFinished) return; // If the countdown has already been finished during the day, do nothing

  // 3.
  if (storage.countdownActive && storage.countdownRemaining > 0) {
    await resumeCountdown();
    console.log("Resume");
  } else {
    // 4.
    await startNewCountdown();
    console.log("Start");
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
  console.log(`New countdown: ${duration / 60} minutes`);
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
  console.log("Countdown paused.");
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
  console.log("Countdown resumed.");
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
  console.log("Countdown finished - redirection enabled");

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
  console.log("Countdown reset - redirection disabled");
};

/**
 * Initializes the countdown.
 *
 * 1. If the last reset date does not match today and it is after 3 AM, it resets the countdown.
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
  if (storage.lastResetDate !== today.toDateString() && today.getHours() >= 3) {
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
    console.log("Countdown initialized and paused.");
  }
};

/**
 * Listens for messages from the popup or other parts of the extension.
 *
 * 'getCountdownStatus' action retrieves the current countdown status from local storage
 * and sends it back to the sender.
 * 'resetDailyCountdown' action resets the daily countdown and sends a success response.
 * 'closeCurrentTab' action closes the current tab from which the message was sent.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
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
 * Initializes the countdown and checks the current tab.
 */
initializeCountdown().then(() => {
  checkCurrentTab();
});

/**
 * Checks the current active tab and handles the URL change.
 * If the countdown has finished, it does not check the current tab.
 */
const checkCurrentTab = async () => {
  if (isFinished) return; // If the countdown has finished, do not check the current tab
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs[0]) {
    handleTabChange(tabs[0].url);
  }
};

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
          console.log(
            "Injection error (activateRedirectionOnExistingTabs):",
            err
          )
        );
    });
  });
};
