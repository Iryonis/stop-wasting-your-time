/**
 * Shorts hider - Hide Shorts elements on YouTube once redirect is activated
 *
 * It first hides elements via CSS for immediate effect on page load,
 * then uses JavaScript and an Observer to hide any new Shorts elements that appear dynamically.
 */
if (!window.shortsHiderInjected) {
  window.shortsHiderInjected = true;

  /**
   * Hide Shorts elements on the page
   * It uses a MutationObserver to detect changes in the DOM and hide new Shorts elements as they appear.
   */
  const hideShortsElements = () => {
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
   * Observer to monitor DOM changes and hide new Shorts elements
   * @type {MutationObserver}
   */
  const observer = new MutationObserver((mutations) => {
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
  observer.observe(targetNode, {
    childList: true,
    subtree: true,
  });

  // Hide with CSS then with JS
  const init = () => {
    injectHidingCSSForInitialLoad();
    setTimeout(hideShortsElements, 100);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
  console.log("Shorts hider initialized");
}
