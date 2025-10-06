/**
 * Video checker - Enable the countdown to be precise
 *
 * Content script that checks the state of the Shorts video (playing or paused)
 * and sends messages to the background script accordingly.
 */
if (!window.videoCheckerInjected) {
  window.videoCheckerInjected = true;

  let currentVideo = null;

  /**
   * Sends the current video state (playing or paused) to the background script.
   * @param {boolean} isPlaying - Indicates whether the video is currently playing.
   */
  const sendVideoState = (isPlaying) => {
    try {
      chrome.runtime.sendMessage({
        action: "videoStateChanged",
        isPlaying: isPlaying,
      });
    } catch (error) {
      if (error.message.includes("Extension context invalidated")) {
        console.log("Extension reloaded -> extension context invalidated");
      } else {
        console.error("Error sending video state:", error.message);
      }
    }
  };

  /**
   * Sets up event listeners for the video element to detect play/pause state changes, and
   * calls {@link sendVideoState} accordingly.
   * @param {HTMLVideoElement} video - The video element to monitor.
   * @returns {void}
   */
  const setupVideoListeners = (video) => {
    if (!video || currentVideo === video) return;

    currentVideo = video;
    video.addEventListener("play", () => sendVideoState(true));
    video.addEventListener("pause", () => sendVideoState(false));
    video.addEventListener("ended", () => sendVideoState(false));

    // Initial state
    sendVideoState(!video.paused && !video.ended);
  };

  /**
   * Checks for new video elements on the page and sets up listeners for them.
   * This is necessary because YouTube Shorts is a single-page application (SPA)
   * where the video element may change without a full page reload.
   */
  const checkForNewVideo = () => {
    const video = document.querySelector("video");
    if (video && video !== currentVideo) {
      setupVideoListeners(video);
    }
  };

  /**
   * Set an interval to check for new video elements every 500 milliseconds.
   */
  setInterval(checkForNewVideo, 500);

  // Initial check
  setTimeout(checkForNewVideo, 500);
}
