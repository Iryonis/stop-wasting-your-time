/**
 * Shorts hider - Hide Shorts elements on YouTube once redirect is activated
 *
 * It first hides elements via CSS for immediate effect on page load,
 * then uses scroll events to hide any new Shorts elements that appear when scrolling.
 */
if (!window.shortsHiderInjected) {
  window.shortsHiderInjected = true;

  let isProcessing = false; // Prevent multiple simultaneous processing

  /**
   * Hide Shorts elements on the page
   */
  const hideShortsElements = () => {
    if (isProcessing) return;
    isProcessing = true;

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

    // 3. Sidebar Shorts
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
      ytd-reel-shelf-renderer {
        display: none !important;
      }
      
      ytd-rich-section-renderer:has(h2:contains("Shorts")),
      ytd-rich-section-renderer:has([role="heading"]:contains("Shorts")),
      ytd-shelf-renderer:has(#title-text:contains("Shorts")) {
        display: none !important;
      }
      
      /* Sidebar Shorts */
      ytd-guide-entry-renderer:has([title="Shorts" i]),
      ytd-mini-guide-entry-renderer:has([title="Shorts" i]) {
        display: none !important;
      }
    `;

    document.head.appendChild(style);
  };

  /**
   * Throttled scroll handler to hide new Shorts elements
   */
  let scrollTimeout = null;
  const handleScroll = () => {
    // Throttle scroll events to avoid excessive processing
    if (scrollTimeout) return;

    scrollTimeout = setTimeout(() => {
      hideShortsElements();
      scrollTimeout = null;
    }, 200); // Process scroll events maximum every 200ms
  };

  // Hide with CSS then with JS
  const init = () => {
    injectHidingCSSForInitialLoad();

    // Initial hide after page load
    setTimeout(hideShortsElements, 100);

    // Listen to scroll events for new content
    window.addEventListener("scroll", handleScroll, { passive: true });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Cleanup on page unload
  window.addEventListener("beforeunload", () => {
    window.removeEventListener("scroll", handleScroll);
  });
}
