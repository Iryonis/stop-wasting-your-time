/**
 * Redirect script for the extension.
 */

// Prevent multiple injections
if (!window.shortsRedirectInjected) {
  window.shortsRedirectInjected = true;

  /**
   * Extracts the short ID from a YouTube Shorts URL.
   * @param {string} url - The YouTube Shorts URL to extract the short ID from.
   * @returns {string|null} - The extracted short ID or null if not found
   */
  const extractShortId = (url) => {
    const match = url.match(/\/shorts\/([^/?]+)/);
    return match ? match[1] : null;
  };

  /**
   * Redirects to the redirect page if the URL contains "/shorts/".
   * @param {string} url - The current URL to check for "/shorts/"
   */
  const redirectIfShorts = (url) => {
    if (url.includes("/shorts/")) {
      try {
        const redirectUrl = chrome.runtime.getURL("redirect.html");
        /**
         * Replace the current history entry instead of adding a new one.
         * It prevents the user from going back to the Shorts URL.
         */
        window.location.replace(redirectUrl);
      } catch (error) {
        console.log("Redirect failed:", error.message);
      }
    }
  };

  /**
   * Checks the initial navigation and redirects if necessary.
   * This function is called immediately when the script is loaded.
   *
   * If the user is currently watching a Shorts, it will not redirect but if he came from another page
   * (like YouTube homepage), it will redirect.
   */
  const checkInitialNavigation = () => {
    // If the document referrer does not include "/shorts/", redirect immediately
    if (document.referrer && !document.referrer.includes("/shorts/")) {
      redirectIfShorts(location.href);
    }
  };

  checkInitialNavigation();

  /**
   * Redirect on URL change
   *
   * Observe URL changes in the SPA
   * This is necessary for single-page applications (like YouTube)
   * where the URL may change without a full page reload.
   */
  let lastUrl = location.href;
  let lastShortId = extractShortId(lastUrl);

  const urlWatcher = setInterval(() => {
    const currentUrl = location.href;
    const currentShortId = extractShortId(currentUrl);

    if (currentUrl !== lastUrl || currentShortId !== lastShortId) {
      lastUrl = currentUrl;
      lastShortId = currentShortId;
      redirectIfShorts(currentUrl);
    }
  }, 500); // Check every 500 milliseconds

  // Clean up on unload
  window.addEventListener("beforeunload", () => {
    clearInterval(urlWatcher);
  });
}
