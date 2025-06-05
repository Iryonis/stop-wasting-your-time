let redirectUrl = "redirect.html";

function redirectIfShorts(url) {
  if (url.includes("/shorts/")) {
    window.location.replace(redirectUrl);
  }
}

// Redirige au chargement initial
redirectIfShorts(window.location.href);

// Observe les changements d’URL dans la SPA
let lastUrl = location.href;
new MutationObserver(() => {
  const currentUrl = location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    redirectIfShorts(currentUrl);
  }
}).observe(document, { subtree: true, childList: true });
