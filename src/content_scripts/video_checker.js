/**
 * Video checker - Enable the countdown to be precise
 */
if (!window.videoCheckerInjected) {
  window.videoCheckerInjected = true;

  let currentVideo = null;
  let videoCheckInterval = null;
  let isExtensionValid = true;

  /**
   * Sends the current video state (playing or paused) to the background script.
   * @param {boolean} isPlaying - Indicates whether the video is currently playing.
   */
  const sendVideoState = (isPlaying) => {
    if (!isExtensionValid) return;

    try {
      chrome.runtime.sendMessage({
        action: "videoStateChanged",
        isPlaying: isPlaying,
      });
    } catch (error) {
      if (error.message.includes("Extension context invalidated")) {
        isExtensionValid = false;

        if (videoCheckInterval) {
          clearInterval(videoCheckInterval);
          videoCheckInterval = null;
        }

        if (currentVideo) {
          currentVideo.removeEventListener("play", handlePlay);
          currentVideo.removeEventListener("pause", handlePause);
          currentVideo.removeEventListener("ended", handleEnded);
          currentVideo = null;
        }

        window.videoCheckerInjected = false;
      } else {
        console.error("Error sending video state:", error.message);
      }
    }
  };

  const handlePlay = () => sendVideoState(true);
  const handlePause = () => sendVideoState(false);
  const handleEnded = () => sendVideoState(false);

  /**
   * Check if the given video element is a valid Shorts video.
   * It checks for dimensions, duration, and visibility.
   * @param {HTMLVideoElement} video - The video element to validate.
   * @returns {boolean} - True if the video is valid, false otherwise.
   */
  const isValidShortsVideo = (video) => {
    if (!video) return false;

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      return false;
    }

    if (!video.duration || video.duration === 0) {
      return false;
    }

    if (video.offsetParent === null) {
      return false;
    }
    return true;
  };

  /**
   * Sets up event listeners for the video element and clean up previous listeners.
   */
  const setupVideoListeners = (video) => {
    if (!video || currentVideo === video || !isExtensionValid) return;

    // Check it's a valid Shorts video
    if (!isValidShortsVideo(video)) return;

    // Clean up old listeners
    if (currentVideo) {
      currentVideo.removeEventListener("play", handlePlay);
      currentVideo.removeEventListener("pause", handlePause);
      currentVideo.removeEventListener("ended", handleEnded);
    }

    currentVideo = video;
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);

    // Delay to ensure correct state is sent
    setTimeout(() => {
      const isPlaying = !video.paused && !video.ended;
      sendVideoState(isPlaying);
    }, 200);
  };

  /**
   * Search for new video elements on the page.
   * When a new valid video is found, set up event listeners on it.
   * @returns null
   */
  const checkForNewVideo = () => {
    if (!isExtensionValid) return;

    // Search for video elements
    const videos = document.querySelectorAll("video");

    if (videos.length === 0) {
      console.error("No video elements found");
      return;
    }

    // Stop at the first valid video found
    for (const video of videos) {
      if (video !== currentVideo && isValidShortsVideo(video)) {
        setupVideoListeners(video);
        return;
      }
    }
  };

  // Check every two seconds to find new videos
  videoCheckInterval = setInterval(checkForNewVideo, 2000);

  // Initial check with slight delay
  setTimeout(checkWithTimeout, 1000);

  // Before unload cleanup
  window.addEventListener("beforeunload", () => {
    if (videoCheckInterval) {
      clearInterval(videoCheckInterval);
      videoCheckInterval = null;
    }
    if (currentVideo) {
      currentVideo.removeEventListener("play", handlePlay);
      currentVideo.removeEventListener("pause", handlePause);
      currentVideo.removeEventListener("ended", handleEnded);
    }
  });
}
