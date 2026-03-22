/**
 * YouTubeTVAdapter handles YouTube TV-specific DOM interactions
 * and provides utility functions for working with the YouTube TV environment
 */
export class YouTubeTVAdapter {
  /**
   * Wait for YouTube TV player to load
   * YouTube TV uses dynamic rendering (React/Polymer) so we need to wait
   * @returns {Promise<Element>} The player container element
   */
  static async waitForPlayerLoad(maxWaitTime = 30000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      // Try to find player immediately
      const player = this.findPlayerElement();
      if (player) {
        resolve(player);
        return;
      }

      // Watch for DOM changes
      const observer = new MutationObserver(() => {
        const player = this.findPlayerElement();
        if (player) {
          observer.disconnect();
          resolve(player);
        }

        // Check timeout
        if (Date.now() - startTime > maxWaitTime) {
          observer.disconnect();
          reject(new Error('YouTube TV player did not load within timeout'));
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      // Fallback timeout
      setTimeout(() => {
        observer.disconnect();
        reject(new Error('YouTube TV player load timeout'));
      }, maxWaitTime);
    });
  }

  /**
   * Find the YouTube TV player element
   * YouTube TV uses various container names, try multiple selectors
   * @returns {Element|null} Player element or null if not found
   * @private
   */
  static findPlayerElement() {
    // Try common YouTube TV player container selectors
    const selectors = [
      'ytlr-player',
      '.ytlr-player',
      '.player-container',
      '[class*="player"]',
      'video',
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && this.isValidPlayerElement(element)) {
        return element;
      }
    }

    return null;
  }

  /**
   * Validate that element is a proper player container
   * @param {Element} element - Element to validate
   * @returns {boolean}
   * @private
   */
  static isValidPlayerElement(element) {
    // Check if element is visible and has reasonable size
    const rect = element.getBoundingClientRect();
    return rect.width > 200 && rect.height > 200 && rect.width < window.innerWidth && rect.height < window.innerHeight;
  }

  /**
   * Check if YouTube TV is in fullscreen mode
   * @returns {boolean}
   */
  static isFullscreen() {
    return (
      document.fullscreenElement !== null ||
      document.webkitFullscreenElement !== null ||
      document.mozFullScreenElement !== null ||
      document.msFullscreenElement !== null
    );
  }

  /**
   * Watch for fullscreen changes
   * @param {Function} callback - Called with boolean (isFullscreen)
   * @returns {Function} Unwatch function
   */
  static watchFullscreen(callback) {
    const handleFullscreenChange = () => {
      callback(this.isFullscreen());
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    // Return unwatch function
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }

  /**
   * Check if content is live vs DVR/recorded
   * YouTube TV shows a live indicator badge for live content
   * @returns {boolean}
   */
  static isLiveContent() {
    // Look for live badge indicators
    const liveBadges = [
      'ytlr-badge[label="LIVE"]',
      '[aria-label*="LIVE"]',
      '.live-badge',
      '[class*="live"]',
    ];

    for (const selector of liveBadges) {
      if (document.querySelector(selector)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get safe position for widget based on current state
   * Avoids overlapping with YouTube TV controls
   * @returns {Object} {top, right, adjustments}
   */
  static getSafeWidgetPosition() {
    const isFS = this.isFullscreen();

    return {
      top: isFS ? 80 : 20, // Lower in fullscreen to avoid controls
      right: 20,
      position: 'fixed',
      zIndex: 9999,
    };
  }

  /**
   * Watch for player state changes (play, pause, fullscreen)
   * @param {Function} callback - Called with player state
   * @returns {Function} Unwatch function
   */
  static watchPlayerState(callback) {
    // Watch video element for play/pause
    const videoElement = document.querySelector('video');
    if (!videoElement) {
      console.warn('[YouTubeTVAdapter] Video element not found');
      return () => {};
    }

    const handlePlayPause = () => {
      callback({
        playing: !videoElement.paused,
        muted: videoElement.muted,
        volume: videoElement.volume,
      });
    };

    videoElement.addEventListener('play', handlePlayPause);
    videoElement.addEventListener('pause', handlePlayPause);

    // Return unwatch function
    return () => {
      videoElement.removeEventListener('play', handlePlayPause);
      videoElement.removeEventListener('pause', handlePlayPause);
    };
  }

  /**
   * Get current video title (for debugging/identification)
   * @returns {string|null}
   */
  static getVideoTitle() {
    // Try common YouTube title selectors
    const selectors = ['h1', 'yt-formatted-string[role="heading"]', '[class*="title"]'];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent) {
        return element.textContent.trim();
      }
    }

    return null;
  }

  /**
   * Detect if page is YouTube TV
   * @returns {boolean}
   */
  static isYouTubeTV() {
    return window.location.hostname === 'tv.youtube.com';
  }

  /**
   * Get viewport dimensions
   * @returns {Object} {width, height}
   */
  static getViewport() {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }

  /**
   * Watch for viewport changes
   * @param {Function} callback - Called with {width, height}
   * @returns {Function} Unwatch function
   */
  static watchViewport(callback) {
    const handleResize = () => {
      callback(this.getViewport());
    };

    window.addEventListener('resize', handleResize);

    // Return unwatch function
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }
}

export default YouTubeTVAdapter;
