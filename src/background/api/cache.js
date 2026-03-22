import { CACHE_CONFIG } from '../../shared/constants.js';

/**
 * CacheManager handles caching of API data with TTL
 */
export class CacheManager {
  /**
   * Get cached data if it exists and is not expired
   * @param {string} key - Cache key
   * @returns {Promise<any>} Cached data or null if not found/expired
   */
  static async get(key) {
    try {
      const stored = await chrome.storage.local.get(key);
      const cacheData = stored[key];

      if (!cacheData) {
        return null;
      }

      // Check if cache has expired
      if (cacheData.expiresAt && Date.now() > cacheData.expiresAt) {
        // Cache expired, remove it
        await chrome.storage.local.remove(key);
        return null;
      }

      return cacheData.data;
    } catch (error) {
      console.error(`[Cache] Error getting cache for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set cached data with optional TTL
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   * @param {number} ttl - Time to live in milliseconds
   * @returns {Promise<void>}
   */
  static async set(key, data, ttl) {
    try {
      const cacheData = {
        data,
        createdAt: Date.now(),
        expiresAt: ttl ? Date.now() + ttl : null,
      };

      await chrome.storage.local.set({ [key]: cacheData });
    } catch (error) {
      console.error(`[Cache] Error setting cache for key ${key}:`, error);
    }
  }

  /**
   * Remove cached data
   * @param {string} key - Cache key
   * @returns {Promise<void>}
   */
  static async remove(key) {
    try {
      await chrome.storage.local.remove(key);
    } catch (error) {
      console.error(`[Cache] Error removing cache for key ${key}:`, error);
    }
  }

  /**
   * Clear all cached data
   * @returns {Promise<void>}
   */
  static async clear() {
    try {
      await chrome.storage.local.clear();
    } catch (error) {
      console.error('[Cache] Error clearing cache:', error);
    }
  }

  /**
   * Get cached NCAA markets
   * @returns {Promise<Array>} Cached markets or empty array
   */
  static async getMarkets() {
    const markets = await this.get(CACHE_CONFIG.STORAGE_KEY_MARKETS);
    return markets || [];
  }

  /**
   * Set cached NCAA markets
   * @param {Array} markets - Markets to cache
   * @returns {Promise<void>}
   */
  static async setMarkets(markets) {
    await this.set(CACHE_CONFIG.STORAGE_KEY_MARKETS, markets, CACHE_CONFIG.MARKETS_TTL);
  }

  /**
   * Get cached odds for a specific game
   * @param {string} gameId - Game ID
   * @returns {Promise<Object>} Cached odds or null
   */
  static async getOdds(gameId) {
    const allOdds = await this.get(CACHE_CONFIG.STORAGE_KEY_ODDS) || {};
    return allOdds[gameId] || null;
  }

  /**
   * Set cached odds for a specific game
   * @param {string} gameId - Game ID
   * @param {Object} odds - Odds data to cache
   * @returns {Promise<void>}
   */
  static async setOdds(gameId, odds) {
    const allOdds = await this.get(CACHE_CONFIG.STORAGE_KEY_ODDS) || {};
    allOdds[gameId] = odds;
    await this.set(CACHE_CONFIG.STORAGE_KEY_ODDS, allOdds, CACHE_CONFIG.ODDS_TTL);
  }

  /**
   * Get all cached state
   * @returns {Promise<Object>} Cached state or empty object
   */
  static async getState() {
    const stored = await chrome.storage.local.get(CACHE_CONFIG.STORAGE_KEY_STATE);
    return stored[CACHE_CONFIG.STORAGE_KEY_STATE] || {};
  }

  /**
   * Set cached state (permanent, no TTL)
   * @param {Object} state - State to cache
   * @returns {Promise<void>}
   */
  static async setState(state) {
    await chrome.storage.local.set({
      [CACHE_CONFIG.STORAGE_KEY_STATE]: state,
    });
  }
}

export default CacheManager;
