/**
 * Shorts hider - Version optimisée avec suppression des titres
 */
if (!window.shortsHiderInjected) {
  window.shortsHiderInjected = true;

  console.log("🙈 Shorts hider initialized");

  /**
   * Cache les éléments Shorts (version optimisée)
   */
  const hideShortsElements = () => {
    let hiddenCount = 0;

    // ✅ Utiliser hidden pour être plus sémantique
    const hideElement = (element) => {
      if (!element.hasAttribute("data-shorts-hidden")) {
        element.hidden = true;
        element.setAttribute("data-shorts-hidden", "true");
        hiddenCount++;
      }
    };

    // Sélecteurs simplifiés mais efficaces
    document.querySelectorAll("ytd-reel-shelf-renderer").forEach(hideElement);

    // ✅ NOUVEAU : Cacher les sections complètes contenant "Shorts"
    document
      .querySelectorAll("ytd-rich-section-renderer")
      .forEach((section) => {
        const titleElement = section.querySelector(
          "h2, [role='heading'], ytd-rich-shelf-header-renderer"
        );
        if (
          titleElement &&
          titleElement.textContent.toLowerCase().includes("shorts")
        ) {
          hideElement(section);
        }
      });

    // ✅ NOUVEAU : Cacher les shelves avec titre "Shorts"
    document.querySelectorAll("ytd-shelf-renderer").forEach((shelf) => {
      const titleElement = shelf.querySelector(
        "#title-text, h3, [role='heading']"
      );
      if (
        titleElement &&
        titleElement.textContent.toLowerCase().includes("shorts")
      ) {
        hideElement(shelf);
      }
    });

    document.querySelectorAll('[href*="/shorts/"]').forEach((link) => {
      // Cacher le conteneur parent
      const container = link.closest(
        "ytd-video-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer, ytd-rich-item-renderer"
      );
      if (container) hideElement(container);
    });

    // Sidebar Shorts
    document
      .querySelectorAll(
        "ytd-guide-entry-renderer, ytd-mini-guide-entry-renderer"
      )
      .forEach((entry) => {
        if (entry.textContent.toLowerCase().includes("shorts")) {
          hideElement(entry);
        }
      });

    if (hiddenCount > 0) {
      console.log(`🙈 Hidden ${hiddenCount} Shorts sections`);
    }
  };

  /**
   * CSS pour masquage immédiat et robuste
   */
  const injectHidingCSS = () => {
    if (document.getElementById("shorts-hider-style")) return;

    const style = document.createElement("style");
    style.id = "shorts-hider-style";
    style.textContent = `
      /* ✅ CSS prioritaire pour masquage immédiat */
      ytd-reel-shelf-renderer,
      [data-shorts-hidden="true"] {
        display: none !important;
        visibility: hidden !important;
      }
      
      /* ✅ NOUVEAU : Sections avec titre Shorts */
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

      /* ✅ NOUVEAU : Masquer bouton/tab Shorts */
      [role="tab"]:has([title*="Shorts" i]),
      a[title="Shorts"],
      button[aria-label*="Shorts" i] {
        display: none !important;
      }
    `;

    document.head.appendChild(style);
    console.log("🙈 Shorts hiding CSS injected");
  };

  /**
   * Observer optimisé - se déclenche seulement quand nécessaire
   */
  const observer = new MutationObserver((mutations) => {
    let shouldProcess = false;

    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === 1) {
          // Element
          // ✅ Vérifications plus précises + nouvelles sections
          if (
            node.tagName === "YTD-REEL-SHELF-RENDERER" ||
            node.tagName === "YTD-VIDEO-RENDERER" ||
            node.tagName === "YTD-RICH-ITEM-RENDERER" ||
            node.tagName === "YTD-RICH-SECTION-RENDERER" || // ✅ NOUVEAU
            node.tagName === "YTD-SHELF-RENDERER" || // ✅ NOUVEAU
            (node.querySelector && node.querySelector('[href*="/shorts/"]'))
          ) {
            shouldProcess = true;
            break;
          }
        }
      }
      if (shouldProcess) break;
    }

    if (shouldProcess) {
      // ✅ Délai minimal pour éviter trop d'appels
      setTimeout(hideShortsElements, 50);
    }
  });

  // ✅ Observer seulement les zones importantes
  const targetNode = document.querySelector("ytd-app") || document.body;
  observer.observe(targetNode, {
    childList: true,
    subtree: true,
  });

  // ✅ Initialisation sans interval
  const init = () => {
    injectHidingCSS();
    setTimeout(hideShortsElements, 100);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  console.log("✅ Shorts hider ready");
}
