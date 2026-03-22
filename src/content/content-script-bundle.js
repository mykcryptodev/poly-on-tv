/**
 * Bundled content script for YouTube TV Polymarket overlay
 * All code inlined to avoid ES6 module issues in content scripts
 */

// IMMEDIATE LOG AT SCRIPT START - MUST APPEAR
try {
  console.log('[CONTENT-SCRIPT-BUNDLE] 🚀 SCRIPT STARTED - FIRST LINE OF EXECUTION');
  console.error('[CONTENT-SCRIPT-BUNDLE] ERROR TEST - This is a test error log');
  console.warn('[CONTENT-SCRIPT-BUNDLE] WARNING TEST - This is a test warning');
} catch (e) {
  console.error('Failed to log script start:', e);
}

// ============================================================================
// MESSAGE TYPES & HELPERS
// ============================================================================

const MESSAGE_TYPES = {
  GET_MARKETS: 'GET_MARKETS',
  SELECT_GAME: 'SELECT_GAME',
  GET_ODDS: 'GET_ODDS',
  GET_STATE: 'GET_STATE',
  STATE_UPDATE: 'STATE_UPDATE',
  MARKETS_UPDATED: 'MARKETS_UPDATED',
  ODDS_UPDATED: 'ODDS_UPDATED',
  ERROR: 'ERROR',
  STATUS: 'STATUS',
};

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

function listenForMessages(listeners) {
  chrome.runtime.onMessage.addListener((message) => {
    if (listeners[message.type]) {
      try {
        listeners[message.type](message.data);
      } catch (error) {
        console.error(`[Messaging] Error in listener for ${message.type}:`, error);
      }
    }
  });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

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
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function sanitizeText(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatGameDate(isoString) {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return 'Date TBD';
  }
}

// ============================================================================
// YOUTUBE TV ADAPTER
// ============================================================================

class YouTubeTVAdapter {
  static async waitForPlayerLoad(maxWaitTime = 30000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      let attemptCount = 0;

      console.log('[YouTubeTVAdapter] Starting player detection...');

      // Try to find player immediately
      const player = this.findPlayerElement();
      if (player) {
        console.log('[YouTubeTVAdapter] Found player immediately');
        resolve(player);
        return;
      }

      console.log('[YouTubeTVAdapter] Player not found immediately, watching for DOM changes...');

      const observer = new MutationObserver(() => {
        attemptCount++;

        const player = this.findPlayerElement();
        if (player) {
          console.log('[YouTubeTVAdapter] Found player after', attemptCount, 'attempts');
          observer.disconnect();
          resolve(player);
          return;
        }

        const elapsed = Date.now() - startTime;
        if (elapsed > maxWaitTime) {
          console.error('[YouTubeTVAdapter] Player detection timeout after', maxWaitTime, 'ms');
          observer.disconnect();
          reject(new Error('YouTube TV player did not load within timeout'));
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });

      // Fallback timeout - just inject widget anyway after timeout
      setTimeout(() => {
        observer.disconnect();
        console.warn('[YouTubeTVAdapter] Player detection timed out, using document.body as fallback');
        // Use body as fallback
        resolve(document.body);
      }, maxWaitTime);
    });
  }

  static findPlayerElement() {
    const selectors = [
      'ytlr-player',
      '.ytlr-player',
      'video',
      '.player-container',
      '[data-player-id]',
      'div[role="region"]',
      '.html5-video-container',
      '#movie_player',
      '.player',
      'main',
    ];

    for (const selector of selectors) {
      try {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
          if (this.isValidPlayerElement(element)) {
            console.log('[YouTubeTVAdapter] Found valid player with selector:', selector);
            return element;
          }
        }
      } catch (e) {
        // Invalid selector, skip
      }
    }

    return null;
  }

  static isValidPlayerElement(element) {
    const rect = element.getBoundingClientRect();
    return rect.width > 200 && rect.height > 200 && rect.width < window.innerWidth && rect.height < window.innerHeight;
  }

  static isFullscreen() {
    return document.fullscreenElement !== null || document.webkitFullscreenElement !== null || document.mozFullScreenElement !== null;
  }

  static watchFullscreen(callback) {
    const handleFullscreenChange = () => {
      callback(this.isFullscreen());
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }

  static watchViewport(callback) {
    const handleResize = () => {
      callback({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }

  static isYouTubeTV() {
    return window.location.hostname === 'tv.youtube.com';
  }
}

// ============================================================================
// UI COMPONENTS
// ============================================================================

class OddsDisplay {
  constructor() {
    this.container = null;
    this.currentOdds = null;
  }

  renderOdds(odds) {
    if (!odds) {
      return '<div class="pm-odds-empty">Select a game to see odds</div>';
    }

    const { teamA, teamAOdds, teamADisplay, teamATrend, teamB, teamBOdds, teamBDisplay, teamBTrend, lastUpdate } = odds;
    const timeAgo = getTimeAgo(lastUpdate);

    return `
      <div class="pm-odds-container">
        <div class="pm-odds-header">
          <div class="pm-live-indicator">
            <span class="pm-live-dot"></span>
            <span class="pm-live-text">Live</span>
          </div>
          <div class="pm-update-time">${timeAgo}</div>
        </div>

        <div class="pm-team-odds-row">
          <div class="pm-team-odds-item">
            <div class="pm-team-name">${sanitizeText(teamA)}</div>
            <div class="pm-odds-wrapper">
              <span class="pm-odds ${teamATrend ? `pm-odds-${teamATrend}` : ''}">${teamADisplay}</span>
            </div>
          </div>
        </div>

        <div class="pm-team-odds-row">
          <div class="pm-team-odds-item">
            <div class="pm-team-name">${sanitizeText(teamB)}</div>
            <div class="pm-odds-wrapper">
              <span class="pm-odds ${teamBTrend ? `pm-odds-${teamBTrend}` : ''}">${teamBDisplay}</span>
            </div>
          </div>
        </div>

        <div class="pm-odds-footer">
          <div class="pm-odds-info">Powered by Polymarket</div>
        </div>
      </div>
    `;
  }

  mount(container, odds) {
    this.container = container;
    this.update(odds);
  }

  update(odds) {
    if (!this.container) return;
    this.currentOdds = odds;
    this.container.innerHTML = this.renderOdds(odds);
    this.container.classList.add('pm-updated');
    setTimeout(() => {
      this.container.classList.remove('pm-updated');
    }, 300);
  }

  showLoading() {
    if (this.container) {
      this.container.innerHTML = '<div class="pm-odds-loading"><div class="pm-spinner"></div><div>Loading odds...</div></div>';
    }
  }

  showError(error) {
    if (this.container) {
      this.container.innerHTML = `<div class="pm-odds-error"><div class="pm-error-icon">⚠️</div><div class="pm-error-message">${sanitizeText(error)}</div></div>`;
    }
  }

  clear() {
    if (this.container) {
      this.container.innerHTML = '<div class="pm-odds-empty">No game selected</div>';
    }
  }
}

class GameSelector {
  constructor(onSelect) {
    this.container = null;
    this.onSelect = onSelect;
    this.games = [];
    this.filteredGames = [];
    this.searchInput = null;
    this.gamesList = null;
  }

  renderSelector() {
    return `
      <div class="pm-game-selector">
        <div class="pm-selector-header">
          <div class="pm-selector-title">NCAA Games</div>
        </div>
        <div class="pm-search-wrapper">
          <input type="text" class="pm-search-input" placeholder="Search teams..." autocomplete="off" />
        </div>
        <div class="pm-games-list-wrapper">
          <div class="pm-games-list"></div>
        </div>
        <div class="pm-selector-footer">
          <div class="pm-game-count">${this.games.length} games available</div>
        </div>
      </div>
    `;
  }

  renderGameItem(game) {
    const teamA = game.outcomes && game.outcomes[0] ? game.outcomes[0] : 'Team A';
    const teamB = game.outcomes && game.outcomes[1] ? game.outcomes[1] : 'Team B';

    return `
      <div class="pm-game-item" data-game-id="${game.id}">
        <div class="pm-game-teams">${sanitizeText(teamA)} vs ${sanitizeText(teamB)}</div>
        <div class="pm-game-meta">
          <span class="pm-game-date">${formatGameDate(game.endDate)}</span>
        </div>
        <div class="pm-game-action">
          <span class="pm-game-arrow">→</span>
        </div>
      </div>
    `;
  }

  filterGames(searchTerm) {
    const term = searchTerm.toLowerCase();
    this.filteredGames = this.games.filter((game) => {
      const teamA = game.outcomes && game.outcomes[0] ? game.outcomes[0].toLowerCase() : '';
      const teamB = game.outcomes && game.outcomes[1] ? game.outcomes[1].toLowerCase() : '';
      const question = game.question.toLowerCase();
      return question.includes(term) || teamA.includes(term) || teamB.includes(term);
    });
    this.renderGamesList();
  }

  renderGamesList() {
    console.log('[GameSelector.renderGamesList] Called');
    console.log('[GameSelector.renderGamesList] gamesList element exists?', !!this.gamesList);

    if (!this.gamesList) {
      console.warn('[GameSelector.renderGamesList] ⚠️ gamesList is null, returning early');
      return;
    }

    console.log('[GameSelector.renderGamesList] filteredGames.length:', this.filteredGames.length);

    if (this.filteredGames.length === 0) {
      console.log('[GameSelector.renderGamesList] No filtered games, showing empty state');
      this.gamesList.innerHTML = '<div class="pm-no-games">No games match your search</div>';
      return;
    }

    console.log('[GameSelector.renderGamesList] Rendering', this.filteredGames.length, 'games');
    const html = this.filteredGames.map((game) => this.renderGameItem(game)).join('');
    console.log('[GameSelector.renderGamesList] Generated HTML length:', html.length);

    this.gamesList.innerHTML = html;
    console.log('[GameSelector.renderGamesList] Set innerHTML, attaching click listeners');

    this.gamesList.querySelectorAll('.pm-game-item').forEach((item) => {
      item.addEventListener('click', () => {
        const gameId = item.getAttribute('data-game-id');
        console.log('[GameSelector] Game clicked:', gameId);
        if (this.onSelect) {
          this.onSelect(gameId);
        }
      });
    });

    console.log('[GameSelector.renderGamesList] Rendering complete');
  }

  mount(container, games) {
    this.container = container;
    this.games = games || [];
    this.filteredGames = this.games;

    container.innerHTML = this.renderSelector();
    this.searchInput = container.querySelector('.pm-search-input');
    this.gamesList = container.querySelector('.pm-games-list');

    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.filterGames(e.target.value);
      });
      this.searchInput.focus();
    }

    this.renderGamesList();
  }

  updateGames(games) {
    console.log('[GameSelector.updateGames] Called with games:', games);
    console.log('[GameSelector.updateGames] Games length:', games?.length);
    console.log('[GameSelector.updateGames] Container exists?', !!this.container);

    this.games = games || [];
    this.filteredGames = this.games;

    console.log('[GameSelector.updateGames] Set this.games to:', this.games);
    console.log('[GameSelector.updateGames] this.games.length:', this.games.length);

    if (this.container) {
      const countElement = this.container.querySelector('.pm-game-count');
      if (countElement) {
        countElement.textContent = `${this.games.length} games available`;
        console.log('[GameSelector.updateGames] Updated count element to:', countElement.textContent);
      }
      console.log('[GameSelector.updateGames] About to call renderGamesList()');
      this.renderGamesList();
    } else {
      console.warn('[GameSelector.updateGames] ⚠️ Container is not set!');
    }
  }
}

class OddsWidget {
  constructor(overlay) {
    this.overlay = overlay;
    this.container = null;
    this.isExpanded = true;
    this.oddsDisplay = new OddsDisplay();
    this.gameSelector = new GameSelector((gameId) => this.handleGameSelection(gameId));
    this.widgetElement = null;
    this.headerElement = null;
    this.bodyElement = null;
  }

  createWidgetElement() {
    const widget = document.createElement('div');
    widget.id = 'polymarket-odds-widget';
    widget.className = 'pm-widget pm-widget-collapsed';
    widget.innerHTML = `
      <div class="pm-widget-header">
        <button class="pm-toggle-btn" title="Toggle Polymarket odds">📊 Odds</button>
      </div>
      <div class="pm-widget-body" style="display: none;">
        <div class="pm-widget-tabs">
          <button class="pm-tab-btn pm-tab-btn-odds pm-tab-active" data-tab="odds">Odds</button>
          <button class="pm-tab-btn pm-tab-btn-games" data-tab="games">Games</button>
        </div>
        <div class="pm-widget-content">
          <div class="pm-odds-container-inner"></div>
          <div class="pm-selector-container-inner" style="display: none;"></div>
        </div>
      </div>
    `;

    const tabButtons = widget.querySelectorAll('.pm-tab-btn');
    tabButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => this.switchTab(e.target.getAttribute('data-tab')));
    });

    return widget;
  }

  mount(playerElement) {
    this.widgetElement = this.createWidgetElement();

    // Try to insert next to player, fallback to body
    try {
      if (playerElement && playerElement.parentElement) {
        playerElement.parentElement.insertBefore(this.widgetElement, playerElement.nextSibling);
        console.log('[OddsWidget] Inserted next to player element');
      } else {
        document.body.appendChild(this.widgetElement);
        console.log('[OddsWidget] Inserted to document body (fallback)');
      }
    } catch (e) {
      console.error('[OddsWidget] Error inserting widget:', e);
      document.body.appendChild(this.widgetElement);
    }

    this.headerElement = this.widgetElement.querySelector('.pm-widget-header');
    this.bodyElement = this.widgetElement.querySelector('.pm-widget-body');
    const toggleButton = this.widgetElement.querySelector('.pm-toggle-btn');
    const oddsContainer = this.widgetElement.querySelector('.pm-odds-container-inner');
    const selectorContainer = this.widgetElement.querySelector('.pm-selector-container-inner');

    toggleButton.addEventListener('click', () => this.toggleExpanded());

    this.oddsDisplay.mount(oddsContainer);
    this.gameSelector.mount(selectorContainer, this.overlay.stateManager.markets);

    console.log('[OddsWidget] Mounted successfully');
  }

  toggleExpanded() {
    this.isExpanded = !this.isExpanded;
    if (this.isExpanded) {
      this.widgetElement.classList.remove('pm-widget-collapsed');
      this.widgetElement.classList.add('pm-widget-expanded');
      this.bodyElement.style.display = 'block';
      console.log('[OddsWidget] Expanded');
    } else {
      this.widgetElement.classList.remove('pm-widget-expanded');
      this.widgetElement.classList.add('pm-widget-collapsed');
      this.bodyElement.style.display = 'none';
      console.log('[OddsWidget] Collapsed');
    }
  }

  switchTab(tabName) {
    const oddsContainer = this.widgetElement.querySelector('.pm-odds-container-inner');
    const selectorContainer = this.widgetElement.querySelector('.pm-selector-container-inner');
    const tabButtons = this.widgetElement.querySelectorAll('.pm-tab-btn');

    tabButtons.forEach((btn) => {
      btn.classList.remove('pm-tab-active');
      if (btn.getAttribute('data-tab') === tabName) {
        btn.classList.add('pm-tab-active');
      }
    });

    if (tabName === 'odds') {
      oddsContainer.style.display = 'block';
      selectorContainer.style.display = 'none';
    } else {
      oddsContainer.style.display = 'none';
      selectorContainer.style.display = 'block';
    }
  }

  async handleGameSelection(gameId) {
    console.log('[OddsWidget] Game selected:', gameId);
    await this.overlay.selectGame(gameId);
    this.switchTab('odds');
  }

  updateOdds(odds) {
    this.oddsDisplay.update(odds);
  }

  updateMarkets(markets) {
    console.log('[OddsWidget.updateMarkets] Called with markets:', markets);
    console.log('[OddsWidget.updateMarkets] Markets type:', typeof markets);
    console.log('[OddsWidget.updateMarkets] Is array?', Array.isArray(markets));
    console.log('[OddsWidget.updateMarkets] Length:', markets?.length);
    if (markets && Array.isArray(markets)) {
      markets.forEach((m, i) => {
        console.log(`[OddsWidget.updateMarkets] Market ${i}:`, m.id, m.question, m.outcomes);
      });
    }
    this.gameSelector.updateGames(markets);
  }

  updateState(state) {
    if (state.currentOdds) {
      this.oddsDisplay.update(state.currentOdds);
    }
    if (state.markets && state.markets.length > 0) {
      this.gameSelector.updateGames(state.markets);
    }
    if (state.error) {
      this.showError(state.error);
    }
  }

  showError(error) {
    this.oddsDisplay.showError(error);
  }
}

// ============================================================================
// MAIN OVERLAY CLASS
// ============================================================================

class YouTubeTVOverlay {
  constructor() {
    this.widget = null;
    this.playerElement = null;
    this.stateManager = {
      markets: [],
      selectedGameId: null,
      currentOdds: null,
      error: null,
    };
  }

  async initialize() {
    try {
      console.log('[YouTubeTVOverlay] ========== INITIALIZATION START ==========');

      if (!YouTubeTVAdapter.isYouTubeTV()) {
        console.warn('[YouTubeTVOverlay] Not on YouTube TV, exiting');
        return;
      }

      console.log('[YouTubeTVOverlay] ✅ Confirmed on YouTube TV');
      console.log('[YouTubeTVOverlay] Waiting for player to load...');

      this.playerElement = await YouTubeTVAdapter.waitForPlayerLoad();
      console.log('[YouTubeTVOverlay] ✅ Player element obtained');

      this.widget = new OddsWidget(this);
      console.log('[YouTubeTVOverlay] Creating widget...');
      this.widget.mount(this.playerElement);
      console.log('[YouTubeTVOverlay] ✅ Widget mounted');

      this.setupMessageListeners();
      console.log('[YouTubeTVOverlay] ✅ Message listeners configured');

      YouTubeTVAdapter.watchFullscreen((isFS) => {
        if (this.widget && this.widget.widgetElement) {
          this.widget.widgetElement.style.top = isFS ? '80px' : '20px';
        }
      });

      console.log('[YouTubeTVOverlay] Requesting initial state from background...');
      await this.requestInitialState();

      console.log('[YouTubeTVOverlay] ========== INITIALIZATION COMPLETE ==========');
    } catch (error) {
      console.error('[YouTubeTVOverlay] ❌ Initialization error:', error);
      console.error('[YouTubeTVOverlay] Error details:', error.message, error.stack);
    }
  }

  setupMessageListeners() {
    listenForMessages({
      [MESSAGE_TYPES.STATE_UPDATE]: (data) => {
        console.log('[YouTubeTVOverlay] State update received');
        this.updateState(data);
      },

      [MESSAGE_TYPES.MARKETS_UPDATED]: (data) => {
        console.log('[YouTubeTVOverlay] Markets updated:', data.markets?.length || 0, 'games');
        this.stateManager.markets = data.markets || [];
        if (this.widget) {
          this.widget.updateMarkets(this.stateManager.markets);
        }
      },

      [MESSAGE_TYPES.ODDS_UPDATED]: (data) => {
        console.log('[YouTubeTVOverlay] Odds updated');
        this.stateManager.currentOdds = data.odds;
        if (this.widget) {
          this.widget.updateOdds(this.stateManager.currentOdds);
        }
      },

      [MESSAGE_TYPES.ERROR]: (data) => {
        console.error('[YouTubeTVOverlay] Error from background:', data.error);
        this.stateManager.error = data.error;
        if (this.widget) {
          this.widget.showError(data.error);
        }
      },
    });
  }

  async requestInitialState() {
    try {
      console.log('[YouTubeTVOverlay] Requesting GET_MARKETS message...');
      const marketsResponse = await sendMessage(MESSAGE_TYPES.GET_MARKETS);
      console.log('[YouTubeTVOverlay] GET_MARKETS RAW response:', marketsResponse);
      console.log('[YouTubeTVOverlay] Response constructor:', marketsResponse?.constructor?.name);
      console.log('[YouTubeTVOverlay] Response keys:', Object.keys(marketsResponse || {}).sort());

      // Try both direct and unwrapped approaches
      let marketsData = null;

      // First try: is response.markets already the array?
      if (Array.isArray(marketsResponse?.markets)) {
        console.log('[YouTubeTVOverlay] ✅ Found markets directly in response.markets');
        marketsData = marketsResponse;
      }
      // Second try: unwrap from .data
      else if (marketsResponse?.data && Array.isArray(marketsResponse.data.markets)) {
        console.log('[YouTubeTVOverlay] ✅ Found markets in response.data.markets');
        marketsData = marketsResponse.data;
      }
      // Third try: is the entire response an array?
      else if (Array.isArray(marketsResponse)) {
        console.log('[YouTubeTVOverlay] ✅ Response IS an array');
        marketsData = { success: true, markets: marketsResponse };
      }
      else {
        console.warn('[YouTubeTVOverlay] ⚠️ Could not find markets array in response');
        console.warn('[YouTubeTVOverlay] ⚠️ response structure:', JSON.stringify(marketsResponse, null, 2));
      }

      if (marketsData && marketsData.markets && Array.isArray(marketsData.markets)) {
        console.log('[YouTubeTVOverlay] ✅ Received', marketsData.markets.length, 'markets from background');
        this.stateManager.markets = marketsData.markets;
        if (this.widget) {
          console.log('[YouTubeTVOverlay] Calling widget.updateMarkets()...');
          this.widget.updateMarkets(this.stateManager.markets);
        }
      } else {
        console.warn('[YouTubeTVOverlay] ⚠️ No valid markets in response after all attempts');
      }

      console.log('[YouTubeTVOverlay] Requesting GET_STATE message...');
      const stateResponse = await sendMessage(MESSAGE_TYPES.GET_STATE);
      console.log('[YouTubeTVOverlay] GET_STATE response:', stateResponse);

      // Unwrap the response (registerMessageHandler wraps in { success: true, data: ... })
      const stateData = stateResponse.data || stateResponse;

      if (stateData.success && stateData.state) {
        this.updateState(stateData.state);
      }
    } catch (error) {
      console.error('[YouTubeTVOverlay] ❌ Error requesting state:', error);
      console.error('[YouTubeTVOverlay] This usually means the background service worker didn\'t respond');
      console.error('[YouTubeTVOverlay] Check chrome://extensions and verify the service worker is running');
    }
  }

  updateState(state) {
    this.stateManager = {
      markets: state.markets || this.stateManager.markets,
      selectedGameId: state.selectedGameId || this.stateManager.selectedGameId,
      currentOdds: state.currentOdds ? state.currentOdds[state.selectedGameId] : this.stateManager.currentOdds,
      error: state.error,
    };

    if (this.widget) {
      this.widget.updateState(this.stateManager);
    }
  }

  async selectGame(gameId) {
    try {
      this.stateManager.selectedGameId = gameId;
      await sendMessage(MESSAGE_TYPES.SELECT_GAME, { gameId });
    } catch (error) {
      console.error('[YouTubeTVOverlay] Error selecting game:', error);
    }
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

console.log('[ContentScript] Bundle loaded');

const overlay = new YouTubeTVOverlay();
overlay.initialize().catch((error) => {
  console.error('[YouTubeTVOverlay] Fatal error:', error);
});
