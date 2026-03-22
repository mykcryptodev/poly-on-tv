import { CACHE_CONFIG } from '../shared/constants.js';
import CacheManager from './api/cache.js';

/**
 * StateManager handles application state and persistence
 */
export class StateManager {
  constructor() {
    this.state = {
      markets: [],
      selectedGameId: null,
      currentOdds: {}, // { gameId: { teamA: 0.65, teamB: 0.35, lastUpdate: timestamp } }
      previousOdds: {}, // For trend calculation
      lastMarketsFetch: null,
      lastOddsFetch: null,
      isPolling: false,
      error: null,
    };

    this.listeners = [];
  }

  /**
   * Initialize state from persistent storage
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      const stored = await CacheManager.getState();
      this.state = {
        ...this.state,
        ...stored,
      };
      console.log('[StateManager] State initialized from storage:', this.state);
    } catch (error) {
      console.error('[StateManager] Error initializing state:', error);
    }
  }

  /**
   * Get current state (read-only copy)
   * @returns {Object} Current state
   */
  getState() {
    return JSON.parse(JSON.stringify(this.state));
  }

  /**
   * Update markets list
   * @param {Array} markets - New markets list
   * @returns {Promise<void>}
   */
  async setMarkets(markets) {
    this.state.markets = markets;
    this.state.lastMarketsFetch = Date.now();
    await this.persistAndNotify();
  }

  /**
   * Select a game to track
   * @param {string} gameId - Game ID to select
   * @returns {Promise<void>}
   */
  async selectGame(gameId) {
    // Validate that game exists
    const gameExists = this.state.markets.some((m) => m.id === gameId);
    if (!gameExists && this.state.markets.length > 0) {
      console.warn(`[StateManager] Game ${gameId} not found in markets list`);
      return;
    }

    this.state.selectedGameId = gameId;
    await this.persistAndNotify();
  }

  /**
   * Update odds for the currently selected game
   * @param {Object} odds - Odds object { teamA: number, teamB: number }
   * @returns {Promise<void>}
   */
  async updateOdds(odds) {
    if (!this.state.selectedGameId) {
      return;
    }

    // Store previous odds for trend calculation
    if (this.state.currentOdds[this.state.selectedGameId]) {
      this.state.previousOdds[this.state.selectedGameId] =
        this.state.currentOdds[this.state.selectedGameId];
    }

    // Update current odds
    this.state.currentOdds[this.state.selectedGameId] = {
      ...odds,
      lastUpdate: Date.now(),
    };

    this.state.lastOddsFetch = Date.now();
    await this.persistAndNotify();
  }

  /**
   * Get current odds for selected game
   * @returns {Object|null} Odds object or null if no game selected
   */
  getSelectedGameOdds() {
    if (!this.state.selectedGameId) {
      return null;
    }
    return this.state.currentOdds[this.state.selectedGameId] || null;
  }

  /**
   * Get previous odds for trend calculation
   * @returns {Object|null} Previous odds object or null
   */
  getPreviousGameOdds() {
    if (!this.state.selectedGameId) {
      return null;
    }
    return this.state.previousOdds[this.state.selectedGameId] || null;
  }

  /**
   * Get selected game details
   * @returns {Object|null} Selected game market object or null
   */
  getSelectedGame() {
    if (!this.state.selectedGameId) {
      return null;
    }
    return this.state.markets.find((m) => m.id === this.state.selectedGameId) || null;
  }

  /**
   * Set polling status
   * @param {boolean} isPolling - Whether polling is active
   * @returns {Promise<void>}
   */
  async setPollingStatus(isPolling) {
    this.state.isPolling = isPolling;
    await this.persistAndNotify();
  }

  /**
   * Set error state
   * @param {string|null} error - Error message or null
   * @returns {Promise<void>}
   */
  async setError(error) {
    this.state.error = error;
    await this.persistAndNotify();
  }

  /**
   * Clear error state
   * @returns {Promise<void>}
   */
  async clearError() {
    this.state.error = null;
    await this.persistAndNotify();
  }

  /**
   * Register a listener for state changes
   * @param {Function} callback - Called with new state on changes
   * @returns {Function} Unregister function
   */
  subscribe(callback) {
    this.listeners.push(callback);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  /**
   * Persist state and notify all listeners
   * @returns {Promise<void>}
   * @private
   */
  async persistAndNotify() {
    try {
      // Persist to storage
      await CacheManager.setState(this.state);

      // Notify all listeners
      this.listeners.forEach((listener) => {
        try {
          listener(this.getState());
        } catch (error) {
          console.error('[StateManager] Error in listener:', error);
        }
      });
    } catch (error) {
      console.error('[StateManager] Error persisting state:', error);
    }
  }

  /**
   * Reset state to defaults
   * @returns {Promise<void>}
   */
  async reset() {
    this.state = {
      markets: [],
      selectedGameId: null,
      currentOdds: {},
      previousOdds: {},
      lastMarketsFetch: null,
      lastOddsFetch: null,
      isPolling: false,
      error: null,
    };
    await this.persistAndNotify();
  }
}

export default StateManager;
