function redirectIfShorts(url) {
  if (url.includes("/shorts/")) {
    // Alternative : construire l'URL manuellement
    const extensionId = chrome.runtime.id;
    const redirectUrl = `chrome-extension://${extensionId}/redirect.html`;
    window.location.href = redirectUrl;
  }
}

// Redirige au chargement initial
redirectIfShorts(window.location.href);

// Observe les changements d'URL dans la SPA
let lastUrl = location.href;
new MutationObserver(() => {
  const currentUrl = location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    redirectIfShorts(currentUrl);
  }
}).observe(document, { subtree: true, childList: true });
