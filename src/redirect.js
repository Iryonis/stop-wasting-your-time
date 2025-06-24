/**
 * Redirect script for the extension.
 */

// Prevent multiple injections
if (!window.shortsRedirectInjected) {
  window.shortsRedirectInjected = true;

  /**
   * Redirects to the redirect page if the URL contains "/shorts/".
   * @param {string} url - The current URL to check for "/shorts/"
   */
  const redirectIfShorts = (url) => {
    if (url.includes("/shorts/")) {
      const extensionId = chrome.runtime.id;
      const redirectUrl = `chrome-extension://${extensionId}/redirect.html`;
      window.location.href = redirectUrl;
    }
  };

  // Redirect on initial load
  redirectIfShorts(window.location.href);

  /**
   * Observe URL changes in the SPA
   * This is necessary for single-page applications (like YouTube)
   * where the URL may change without a full page reload.
   */
  let lastUrl = location.href;
  new MutationObserver(() => {
    const currentUrl = location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      redirectIfShorts(currentUrl);
    }
  }).observe(document, { subtree: true, childList: true });
}
