import { OddsWidget } from './ui/widget.js';
import YouTubeTVAdapter from './youtube-tv-adapter.js';
import { sendMessage, listenForMessages, MESSAGE_TYPES } from '../shared/messaging.js';

/**
 * Main content script for YouTube TV integration
 */
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

  /**
   * Initialize the overlay
   */
  async initialize() {
    try {
      console.log('[YouTubeTVOverlay] Initializing...');

      // Verify we're on YouTube TV
      if (!YouTubeTVAdapter.isYouTubeTV()) {
        console.warn('[YouTubeTVOverlay] Not on YouTube TV, exiting');
        return;
      }

      // Wait for player to load
      console.log('[YouTubeTVOverlay] Waiting for player to load...');
      this.playerElement = await YouTubeTVAdapter.waitForPlayerLoad();
      console.log('[YouTubeTVOverlay] Player found');

      // Create and mount widget
      this.widget = new OddsWidget(this);
      this.widget.mount(this.playerElement);

      // Set up message listeners
      this.setupMessageListeners();

      // Watch for fullscreen changes
      YouTubeTVAdapter.watchFullscreen((isFS) => {
        if (this.widget) {
          this.widget.updatePositionForFullscreen(isFS);
        }
      });

      // Watch for viewport changes
      YouTubeTVAdapter.watchViewport(() => {
        if (this.widget) {
          this.widget.reposition();
        }
      });

      // Request initial state from background
      await this.requestInitialState();

      // Log initialization completion
      console.log('[YouTubeTVOverlay] Ready! Markets available:', this.stateManager.markets.length);

      console.log('[YouTubeTVOverlay] Initialization complete');
    } catch (error) {
      console.error('[YouTubeTVOverlay] Initialization error:', error);
    }
  }

  /**
   * Set up message listeners for updates from background
   */
  setupMessageListeners() {
    listenForMessages({
      [MESSAGE_TYPES.STATE_UPDATE]: (data) => {
        console.log('[YouTubeTVOverlay] State update received:', data);
        this.updateState(data);
      },

      [MESSAGE_TYPES.MARKETS_UPDATED]: (data) => {
        console.log('[YouTubeTVOverlay] Markets updated');
        this.stateManager.markets = data.markets || [];
        if (this.widget) {
          this.widget.updateMarkets(this.stateManager.markets);
        }
      },

      [MESSAGE_TYPES.ODDS_UPDATED]: (data) => {
        console.log('[YouTubeTVOverlay] Odds updated:', data);
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

  /**
   * Request initial state from background
   */
  async requestInitialState() {
    try {
      // Get current state
      const response = await sendMessage(MESSAGE_TYPES.GET_STATE);
      if (response.success && response.state) {
        this.updateState(response.state);
      }

      // Get markets
      const marketsResponse = await sendMessage(MESSAGE_TYPES.GET_MARKETS);
      if (marketsResponse.success && marketsResponse.markets) {
        this.stateManager.markets = marketsResponse.markets;
        if (this.widget) {
          this.widget.updateMarkets(this.stateManager.markets);
        }
      }

      // Get odds if game is selected
      if (this.stateManager.selectedGameId) {
        const oddsResponse = await sendMessage(MESSAGE_TYPES.GET_ODDS);
        if (oddsResponse.success && oddsResponse.odds) {
          this.stateManager.currentOdds = oddsResponse.odds;
          if (this.widget) {
            this.widget.updateOdds(this.stateManager.currentOdds);
          }
        }
      }
    } catch (error) {
      console.error('[YouTubeTVOverlay] Error requesting initial state:', error);
    }
  }

  /**
   * Update internal state
   */
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

  /**
   * Handle game selection from widget
   */
  async selectGame(gameId) {
    try {
      this.stateManager.selectedGameId = gameId;
      await sendMessage(MESSAGE_TYPES.SELECT_GAME, { gameId });
    } catch (error) {
      console.error('[YouTubeTVOverlay] Error selecting game:', error);
    }
  }

  /**
   * Get game details by ID
   */
  getGameById(gameId) {
    return this.stateManager.markets.find((m) => m.id === gameId);
  }
}

// Initialize overlay when content script loads
const overlay = new YouTubeTVOverlay();
overlay.initialize().catch((error) => {
  console.error('[YouTubeTVOverlay] Fatal error:', error);
});

console.log('[ContentScript] Loaded');
