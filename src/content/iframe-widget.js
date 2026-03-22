/**
 * Iframe Widget JavaScript
 * Handles all UI logic for the Polymarket odds widget
 */

console.log('[IframeWidget] Script loaded');

// MESSAGE TYPES
const MESSAGE_TYPES = {
  GET_MARKETS: 'GET_MARKETS',
  SELECT_GAME: 'SELECT_GAME',
  GET_ODDS: 'GET_ODDS',
  ODDS_UPDATED: 'ODDS_UPDATED',
  FIND_MARKET_BY_URL: 'FIND_MARKET_BY_URL',
};

// Utility Functions
function formatOddsPercentage(probability) {
  if (typeof probability !== 'number' || probability < 0 || probability > 1) {
    return 'N/A';
  }
  return `${(probability * 100).toFixed(1)}%`;
}

function getTimeAgo(timestamp) {
  if (!timestamp) return 'never';
  const now = Date.now();
  const seconds = Math.floor((now - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

function sanitizeText(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Send message to background
function sendMessage(type, data = {}) {
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage({ type, data }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response || {});
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

// Listen for messages from background
function listenForMessages(handlers) {
  chrome.runtime.onMessage.addListener((message) => {
    if (handlers[message.type]) {
      try {
        handlers[message.type](message.data);
      } catch (error) {
        console.error(`[IframeWidget] Error in listener for ${message.type}:`, error);
      }
    }
  });
}

// Main Widget Class
class IframeWidget {
  constructor() {
    console.log('[IframeWidget] Constructor starting...');

    this.widget = document.querySelector('#polymarket-odds-widget');
    this.oddsContent = document.querySelector('.pm-odds-content');
    this.currentTheme = 'dark';
    this.currentMarketSlug = null;
    this.showActivity = true;

    // Validate all elements exist
    if (!this.widget || !this.oddsContent) {
      console.error('[IframeWidget] ERROR: Missing required DOM elements');
      return;
    }

    console.log('[IframeWidget] All DOM elements found, setting up...');

    this.setupEventListeners();
    this.initialize();
  }

  setupEventListeners() {
    console.log('[IframeWidget] Setting up event listeners');

    listenForMessages({
      [MESSAGE_TYPES.ODDS_UPDATED]: (data) => {
        console.log('[IframeWidget] Odds updated');
      },
    });
  }

  async initialize() {
    console.log('[IframeWidget] Initialize called');

    // Render the URL input form for the user to paste a Polymarket URL
    this.renderOdds();
  }


  attachUrlInputListeners() {
    const urlInput = this.oddsContent.querySelector('#polymarket-url-input');
    const urlButton = this.oddsContent.querySelector('#polymarket-url-button');

    if (urlButton && urlInput) {
      urlButton.addEventListener('click', () => {
        const url = urlInput.value.trim();
        if (url) {
          this.handlePolymarketUrl(url);
        }
      });

      urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          const url = urlInput.value.trim();
          if (url) {
            this.handlePolymarketUrl(url);
          }
        }
      });
    }
  }

  attachCloseListener() {
    const closeBtn = this.oddsContent.querySelector('#polymarket-close-btn');
    console.log('[IframeWidget] attachCloseListener called, closeBtn:', closeBtn);
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        console.log('[IframeWidget] Close button click event fired');
        this.closeWidget();
      });
      console.log('[IframeWidget] Close button listener attached');
    } else {
      console.error('[IframeWidget] Close button not found!');
    }
  }

  closeWidget() {
    // Send message to parent to remove the iframe
    console.log('[IframeWidget] Close button clicked, sending remove message');
    const message = { type: 'REMOVE_WIDGET' };
    console.log('[IframeWidget] Posting message:', message);
    console.log('[IframeWidget] window.parent:', window.parent);
    try {
      window.parent.postMessage(message, '*');
      console.log('[IframeWidget] Message posted to parent');
    } catch (e) {
      console.error('[IframeWidget] Error posting message:', e);
    }
  }

  attachThemeToggleListener() {
    const themeBtn = this.oddsContent.querySelector('#polymarket-theme-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        console.log('[IframeWidget] Theme toggle clicked');
        this.toggleTheme();
      });
    }
  }

  toggleTheme() {
    // Toggle between dark and light theme
    this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    console.log('[IframeWidget] Theme toggled to:', this.currentTheme);

    // Re-render the embed with new theme
    if (this.currentMarketSlug) {
      this.renderPolymarketEmbed(this.currentMarketSlug);
    }
  }

  attachActivityToggleListener() {
    const activityBtn = this.oddsContent.querySelector('#polymarket-activity-btn');
    if (activityBtn) {
      activityBtn.addEventListener('click', () => {
        console.log('[IframeWidget] Activity toggle clicked');
        this.toggleActivity();
      });
    }
  }

  toggleActivity() {
    // Toggle activity display
    this.showActivity = !this.showActivity;
    console.log('[IframeWidget] Activity toggled to:', this.showActivity);

    // Re-render the embed with new activity state
    if (this.currentMarketSlug) {
      this.renderPolymarketEmbed(this.currentMarketSlug);
    }
  }

  renderOdds() {
    // Show URL input form for user to paste a Polymarket URL with darker background
    this.widget.classList.add('pm-widget-with-input');

    this.oddsContent.innerHTML = `
      <button class="pm-close-btn" id="polymarket-close-btn" title="Close"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6.00081 17.9992M17.9992 18L6 6.00085" /></svg></button>
      <div class="pm-url-input-section">
        <label class="pm-url-label">📋 Paste Polymarket URL</label>
        <input class="pm-url-input" type="text" placeholder="https://polymarket.com/sports/cbb/..." id="polymarket-url-input">
        <button class="pm-url-button" id="polymarket-url-button">Load Odds</button>
      </div>
    `;

    this.attachUrlInputListeners();
    this.attachCloseListener();
  }

  extractMarketSlug(url) {
    // Extract market slug from Polymarket URL
    // Input: https://polymarket.com/sports/cbb/cbb-mia-pur-2026-03-22
    // Output: cbb-mia-pur-2026-03-22
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(p => p);
      const marketSlug = pathParts[pathParts.length - 1];
      console.log('[IframeWidget] Extracted market slug:', marketSlug);
      return marketSlug;
    } catch (error) {
      console.error('[IframeWidget] Failed to extract market slug:', error);
      return null;
    }
  }

  renderPolymarketEmbed(marketSlug) {
    // Store the market slug for re-rendering on theme change
    this.currentMarketSlug = marketSlug;

    // Render the official Polymarket embed iframe
    const embedUrl = `https://embed.polymarket.com/sports?market=${marketSlug}&height=250&buttons=false&theme=${this.currentTheme}`;
    console.log('[IframeWidget] Rendering embed from:', embedUrl);

    // Update classes for embed state
    this.widget.classList.remove('pm-widget-with-input');
    this.widget.classList.add('pm-widget-with-embed');

    // SVG icons for theme toggle
    const sunIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
    const moonIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;

    // SVG icons for activity toggle
    const activityOnIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" color="currentColor" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21.5 4.5C21.5 5.60457 20.6046 6.5 19.5 6.5C18.3954 6.5 17.5 5.60457 17.5 4.5C17.5 3.39543 18.3954 2.5 19.5 2.5C20.6046 2.5 21.5 3.39543 21.5 4.5Z" /><path d="M20.4711 9.40577C20.5 10.2901 20.5 11.3119 20.5 12.5C20.5 16.7426 20.5 18.864 19.182 20.182C17.864 21.5 15.7426 21.5 11.5 21.5C7.25736 21.5 5.13604 21.5 3.81802 20.182C2.5 18.864 2.5 16.7426 2.5 12.5C2.5 8.25736 2.5 6.13604 3.81802 4.81802C5.13604 3.5 7.25736 3.5 11.5 3.5C12.6881 3.5 13.7099 3.5 14.5942 3.52895" /><path d="M5.5 12.5H8L10 8.5L13 16.5L15 12.5H17.5" /></svg>`;
    const activityOffIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" color="currentColor" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4.31802 19.682C3 18.364 3 16.2426 3 12C3 7.75736 3 5.63604 4.31802 4.31802C5.63604 3 7.75736 3 12 3C16.2426 3 18.364 3 19.682 4.31802C21 5.63604 21 7.75736 21 12C21 16.2426 21 18.364 19.682 19.682C18.364 21 16.2426 21 12 21C7.75736 21 5.63604 21 4.31802 19.682Z" /><path d="M6 12H8.5L10.5 8L13.5 16L15.5 12H18" /></svg>`;

    const themeIcon = this.currentTheme === 'dark' ? sunIcon : moonIcon;
    const activityIcon = this.showActivity ? activityOnIcon : activityOffIcon;

    this.oddsContent.innerHTML = `
      <button class="pm-activity-btn" id="polymarket-activity-btn" title="Toggle activity">${activityIcon}</button>
      <button class="pm-theme-btn" id="polymarket-theme-btn" title="Toggle theme">${themeIcon}</button>
      <button class="pm-close-btn" id="polymarket-close-btn" title="Close"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6.00081 17.9992M17.9992 18L6 6.00085" /></svg></button>
      <iframe
        title="Polymarket Live Odds"
        src="${embedUrl}"
        width="450"
        height="250"
        frameborder="0"
        allowtransparency="true"
        style="border: none; display: block;">
      </iframe>
    `;

    this.attachCloseListener();
    this.attachThemeToggleListener();
    this.attachActivityToggleListener();
  }

  async handlePolymarketUrl(url) {
    console.log('[IframeWidget] Processing URL:', url);

    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      alert('Invalid URL. Please paste a valid Polymarket URL.');
      return;
    }

    // Extract market slug
    const marketSlug = this.extractMarketSlug(url);
    if (!marketSlug) {
      this.oddsContent.innerHTML = `
        <div class="pm-url-input-section">
          <label class="pm-url-label">📋 Paste Polymarket URL</label>
          <input class="pm-url-input" type="text" placeholder="https://polymarket.com/sports/cbb/..." value="${sanitizeText(url)}">
          <button class="pm-url-button">Load Odds</button>
        </div>
        <div class="pm-odds-error">
          <strong>Invalid URL</strong><br>
          Could not extract market slug from URL.<br><br>
          <small>Please use a URL like: https://polymarket.com/sports/cbb/cbb-mia-pur-2026-03-22</small>
        </div>
      `;
      this.attachUrlInputListeners();
      return;
    }

    // Render the embed directly with the extracted slug
    console.log('[IframeWidget] Rendering embed for slug:', marketSlug);
    this.renderPolymarketEmbed(marketSlug);
  }

}

// Initialize when DOM is ready
console.log('[IframeWidget] Document readyState:', document.readyState);

function initWidget() {
  console.log('[IframeWidget] Initializing widget...');
  const widget = new IframeWidget();
  console.log('[IframeWidget] Widget initialized successfully');
}

if (document.readyState === 'loading') {
  console.log('[IframeWidget] Waiting for DOMContentLoaded...');
  document.addEventListener('DOMContentLoaded', initWidget);
} else {
  console.log('[IframeWidget] DOM already loaded, initializing now');
  initWidget();
}
