/**
 * Internationalization support for the extension.
 */

/**
 * Applies translations to the specified root element.
 * @param {HTMLElement} root
 */
const applyTranslations = (root = document.body) => {
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_ELEMENT,
    null,
    false
  );

  while (walker.nextNode()) {
    const node = walker.currentNode;

    // Translates elements with 'i18n-translate' attribute
    if (node.hasAttribute("i18n-content")) {
      const key = node.getAttribute("i18n-content");
      const msg = chrome.i18n.getMessage(key);
      if (msg) {
        node.textContent = msg;
      }
    }
  }
};

document.addEventListener("DOMContentLoaded", () => {
  applyTranslations();
});
