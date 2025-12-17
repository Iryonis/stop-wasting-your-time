/**
 * Shorts hider - Hide Shorts elements on YouTube once redirect is activated
 */
if (!window.shortsHiderInjected) {
  window.shortsHiderInjected = true;

  let isProcessing = false;
  let currentUrl = window.location.href;
  let urlObserver = null;
  let shortsObserver = null;

  /**
   * Helper function to check if we're on history page
   */
  const isHistoryPage = () => {
    return currentUrl.includes("www.youtube.com/feed/history");
  };

  /**
   * Updates the body class based on the current page type
   */
  const updateBodyClass = () => {
    if (isHistoryPage()) {
      document.body.classList.add("history-page");
      document.body.classList.remove("shorts-hidden-page");
    } else {
      document.body.classList.remove("history-page");
      document.body.classList.add("shorts-hidden-page");
    }
  };

  /**
   * Hide Shorts elements on the page
   */
  const hideShortsElements = () => {
    if (isProcessing) return;
    isProcessing = true;

    if (!isHistoryPage()) {
      // 1. "Shorts" title sections
      document
        .querySelectorAll("ytd-rich-section-renderer, ytd-shelf-renderer")
        .forEach((section) => {
          const titleElement = section.querySelector(
            "h2, [role='heading'], ytd-rich-shelf-header-renderer, #title-text, h3"
          );
          if (
            titleElement &&
            titleElement.textContent.toLowerCase().includes("shorts") &&
            !section.hidden
          ) {
            section.hidden = true;
          }
        });

      // 2. Shelf renderer Shorts (homepage)
      document.querySelectorAll("ytd-reel-shelf-renderer").forEach((shelf) => {
        if (!shelf.hidden) {
          shelf.hidden = true;
        }
      });
    } else {
      document
        .querySelectorAll("ytd-rich-section-renderer, ytd-shelf-renderer")
        .forEach((section) => {
          section.hidden = false;
        });

      document.querySelectorAll("ytd-reel-shelf-renderer").forEach((shelf) => {
        shelf.hidden = false;
      });
    }

    // 3. Sidebar Shorts (always hide)
    document
      .querySelectorAll(
        "ytd-guide-entry-renderer, ytd-mini-guide-entry-renderer"
      )
      .forEach((entry) => {
        if (
          entry.textContent.toLowerCase().includes("shorts") &&
          !entry.hidden
        ) {
          entry.hidden = true;
        }
      });

    isProcessing = false;
  };

  /**
   * Hide Shorts elements via CSS for initial load
   */
  const injectHidingCSSForInitialLoad = () => {
    if (document.getElementById("shorts-hider-style")) return;

    const style = document.createElement("style");
    style.id = "shorts-hider-style";
    style.textContent = `
      body.shorts-hidden-page ytd-reel-shelf-renderer {
        display: none !important;
      }
      
      body.shorts-hidden-page ytd-rich-section-renderer:has(h2:contains("Shorts")),
      body.shorts-hidden-page ytd-rich-section-renderer:has([role="heading"]:contains("Shorts")),
      body.shorts-hidden-page ytd-shelf-renderer:has(#title-text:contains("Shorts")) {
        display: none !important;
      }
      
      /* Sidebar Shorts - always hide */
      ytd-guide-entry-renderer:has([title="Shorts" i]),
      ytd-mini-guide-entry-renderer:has([title="Shorts" i]) {
        display: none !important;
      }
      
      body.history-page ytd-reel-shelf-renderer {
        display: block !important;
      }
      
      body.history-page ytd-rich-section-renderer,
      body.history-page ytd-shelf-renderer {
        display: block !important;
      }
    `;

    document.head.appendChild(style);
  };

  /**
   * MutationObserver to detect URL changes in the SPA
   */
  const setupUrlObserver = () => {
    if (urlObserver) urlObserver.disconnect();

    urlObserver = new MutationObserver(() => {
      const newUrl = window.location.href;

      if (newUrl !== currentUrl) {
        console.log(`🔄 URL changed: ${currentUrl} → ${newUrl}`);
        currentUrl = newUrl;

        updateBodyClass();
        setTimeout(hideShortsElements, 100);
      }
    });

    urlObserver.observe(document.documentElement, {
      attributes: true,
      subtree: true,
    });
  };

  /**
   * MutationObserver to detect addition of Shorts elements in the DOM
   */
  const setupShortsObserver = () => {
    shortsObserver = new MutationObserver((mutations) => {
      let shouldProcess = false;

      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === 1) {
            if (
              node.tagName === "YTD-REEL-SHELF-RENDERER" ||
              node.tagName === "YTD-RICH-SECTION-RENDERER" ||
              node.tagName === "YTD-SHELF-RENDERER" ||
              node.tagName === "YTD-GUIDE-ENTRY-RENDERER"
            ) {
              shouldProcess = true;
              break;
            }
          }
        }
        if (shouldProcess) break;
      }

      if (shouldProcess) {
        setTimeout(hideShortsElements, 50);
      }
    });

    const targetNode = document.querySelector("ytd-app") || document.body;
    shortsObserver.observe(targetNode, {
      childList: true,
      subtree: true,
    });
  };

  // Hide with CSS then with JS
  const init = () => {
    updateBodyClass();

    injectHidingCSSForInitialLoad();
    setTimeout(hideShortsElements, 100);

    setupUrlObserver();
    setupShortsObserver();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Cleanup on page unload
  window.addEventListener("beforeunload", () => {
    if (urlObserver) urlObserver.disconnect();
    if (shortsObserver) shortsObserver.disconnect();
  });
}
