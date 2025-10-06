/**
 *  Script for the redirection page.
 */

document.addEventListener("DOMContentLoaded", () => {
  const closeButton = document.getElementById("close-button");

  closeButton.addEventListener("click", () => {
    // Send a message to the background script to close the current tab
    chrome.runtime.sendMessage({
      action: "closeCurrentTab",
      reason: "user_clicked_close",
    });
  });
});
