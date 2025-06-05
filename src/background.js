chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url.includes("youtube.com")) {
    chrome.storage.sync.get(["redirectEnabled"], (data) => {
      if (data.redirectEnabled) {
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ["redirect.js"],
        });
      }
    });
  }
});
