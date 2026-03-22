import { API_CONFIG, MARKET_FILTERS } from '../../shared/constants.js';
import { retryWithBackoff } from '../../shared/utils.js';
import CacheManager from './cache.js';

/**
 * PolymarketClient handles all API calls to Polymarket services
 */
export class PolymarketClient {
  constructor() {
    this.gammaBaseUrl = API_CONFIG.GAMMA_BASE_URL;
    this.clobBaseUrl = API_CONFIG.CLOB_BASE_URL;
    this.ncaaTagId = null;
    this.initialized = false;
  }

  /**
   * Initialize the client by fetching NCAA tag ID
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.initialized) return;

    try {
      const sports = await this.fetchSports();
      console.log('[PolymarketClient] Available sports:', sports.map(s => s.sport).join(', '));

      this.ncaaTagId = this.findNCAATagId(sports);

      if (!this.ncaaTagId) {
        console.warn('[PolymarketClient] NCAA sport code not found, using default "cbb"');
        this.ncaaTagId = 'cbb'; // Default to college basketball code
      }

      this.initialized = true;
      console.log('[PolymarketClient] Initialized with NCAA sport code:', this.ncaaTagId);
    } catch (error) {
      console.error('[PolymarketClient] Initialization error:', error);
      // Still mark as initialized to allow fallback behavior
      this.ncaaTagId = 'cbb';
      this.initialized = true;
    }
  }

  /**
   * Fetch all sports/tags from Gamma API
   * @returns {Promise<Array>} Array of sports objects
   * @private
   */
  async fetchSports() {
    try {
      const response = await this.fetch(`${this.gammaBaseUrl}/sports`);
      // API returns array directly, not wrapped in data field
      return Array.isArray(response) ? response : response.data || [];
    } catch (error) {
      console.error('[PolymarketClient] Error fetching sports:', error);
      return [];
    }
  }

  /**
   * Find NCAA tag ID from sports list
   * @param {Array} sports - Array of sports objects
   * @returns {string|null} NCAA tag ID or null
   * @private
   */
  findNCAATagId(sports) {
    // Look for college basketball sports by code
    const ncaaSportCodes = ['ncaab', 'cbb']; // NCAA basketball codes

    for (const sport of sports) {
      // Check if sport code matches NCAA basketball
      if (ncaaSportCodes.includes(sport.sport)) {
        // Use the series ID as the identifier for fetching markets
        // Some APIs use tag_id, others use sport code
        return sport.sport; // Return the sport code (cbb)
      }
    }

    return null;
  }

  /**
   * Fetch active NCAA markets
   * @returns {Promise<Array>} Array of market objects
   */
  async fetchNCAAMarkets() {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Check cache first
      const cachedMarkets = await CacheManager.getMarkets();
      if (cachedMarkets.length > 0) {
        return cachedMarkets;
      }

      // Fetch markets - try multiple endpoints
      let markets = [];

      // Strategy: Fetch all markets and filter for basketball games
      try {
        console.log('[PolymarketClient] Fetching all markets...');
        const url = `${this.gammaBaseUrl}/markets?closed=false&limit=5000`;
        const response = await this.fetch(url);
        const allMarkets = Array.isArray(response) ? response : response.data || [];

        console.log(`[PolymarketClient] Total markets available: ${allMarkets.length}`);

        // Filter for college basketball - look for team names and game-like questions
        markets = allMarkets.filter((m) => {
          if (!m.question) return false;
          const q = m.question.toLowerCase();

          // Look for common college basketball keywords or team matchups
          const isBBGameLike =
            (q.includes('beat') || q.includes('defeat') || q.includes('win') || q.includes('vs ')) &&
            (q.includes('ncaa') ||
              q.includes('college') ||
              q.includes('cbb') ||
              // Common team indicators (case insensitive team names)
              /\b(duke|unc|michigan|ohio state|kansas|ucla|texas|alabama|clemson|georgia|florida|lsu|auburn|tennessee|kentucky|missouri|arkansas|oklahoma|baylor|iowa|purdue|wisconsin|minnesota|penn state|indiana|illinois|michigan state|nebraska|colorado|oregon|washington|utah|arizona|colorado state|new mexico|san diego state|fresno state|boise state|clemson|georgia tech|boston college|virginia|wake forest|syracuse|notre dame|connecticut|memphis|houston|tulsa|cincinnati|smack|saint louis|stlou|george mason|vcu|xavier|marquette|butler|creighton|dayton|northern iowa|loyola|murray state|belmont|furman|wofford|samford|citadel|college of charleston|merrimack|sacred heart|manhattan|niagara|monmouth|rider|quinnipiac|bryant|umass|rhode island|george mason|vcu|old dominion|east carolina|marshall|rice|tulane|charlotte|southern method|alabama state|alcorn|jackson state|southern|grambling|tennessee state|austin peay|belmont|abilene christian|mcneese|stephen f austin|nicholls|southeast louisiana|central arkansas|little rock|northern colorado|portland state|idaho|eastern washington|weber state|southern utah|north dakota|north dakota state|south dakota|south dakota state|southern illinois|eastern illinois|bradley|evansville|indiana state|valparaiso|southeast missouri|troy|appalachian state|georgia southern|coastal carolina|liberty|richmond|campbell|drexel|delaware|towson|northeastern|maine|vermont|albany|stony brook|hartford|maryland baltimore county|umbc|robert morris|fed pitt|pittburgh|penn|cornell|yale|harvard|brown|rutgers)\b/i);

          return isBBGameLike;
        });

        console.log(`[PolymarketClient] Filtered to ${markets.length} potential college basketball markets`);
      } catch (error) {
        console.error('[PolymarketClient] Error fetching all markets:', error.message);
        // Try just fetching a subset
        try {
          const url = `${this.gammaBaseUrl}/markets?limit=500`;
          const response = await this.fetch(url);
          markets = Array.isArray(response) ? response : response.data || [];
        } catch (fallbackError) {
          console.error('[PolymarketClient] Even fallback fetch failed:', fallbackError.message);
          throw fallbackError;
        }
      }

      // Filter for game winner markets (must have "beat", "win", etc.)
      const filteredMarkets = markets.filter((m) => this.isWinnerMarket(m));

      // Parse and enrich market data
      const enrichedMarkets = filteredMarkets.map((m) => this.parseMarket(m));

      // Cache the markets
      await CacheManager.setMarkets(enrichedMarkets);

      console.log('[PolymarketClient] Fetched and cached', enrichedMarkets.length, 'NCAA markets');

      // If no markets found, log this for debugging
      if (enrichedMarkets.length === 0) {
        console.warn('[PolymarketClient] No NCAA game markets found. Try again later or check if games are available on Polymarket.');
      }

      return enrichedMarkets;
    } catch (error) {
      console.error('[PolymarketClient] Error fetching NCAA markets:', error);
      // Fall back to cache if available
      const cached = await CacheManager.getMarkets();
      console.log(`[PolymarketClient] Returning ${cached.length} cached markets as fallback`);
      return cached;
    }
  }

  /**
   * Check if market is a game winner market
   * @param {Object} market - Market object
   * @returns {boolean}
   * @private
   */
  isWinnerMarket(market) {
    if (!market.question) return false;

    const question = market.question.toLowerCase();

    // Check for explicit winner keywords
    for (const keyword of MARKET_FILTERS.WINNER_KEYWORDS) {
      if (question.includes(keyword.toLowerCase())) {
        return true;
      }
    }

    // Also accept markets with exactly 2 outcomes and a "vs" matchup
    // This captures game winner markets like "Team A vs Team B" format
    if (question.includes(' vs ') || question.includes(' vs.')) {
      const outcomes = market.outcomes;
      if (Array.isArray(outcomes) && outcomes.length === 2) {
        // Check if outcomes look like team names (not other types like "O/U", "Over", "Under")
        const hasNonScoreOutcomes = !outcomes.some(o =>
          o.toLowerCase().includes('over') ||
          o.toLowerCase().includes('under') ||
          o.toLowerCase().includes('o/u') ||
          /^\d+/.test(o) // Doesn't start with a number
        );
        if (hasNonScoreOutcomes) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Parse and enrich market data from API response
   * @param {Object} market - Raw market object from API
   * @returns {Object} Parsed market with required fields
   * @private
   */
  parseMarket(market) {
    const tokenMap = {};
    const outcomes = [];

    // Build token map from tokens array
    if (Array.isArray(market.tokens)) {
      for (const token of market.tokens) {
        tokenMap[token.outcome] = token.token_id;
        outcomes.push(token.outcome);
      }
    }

    return {
      id: market.id,
      question: market.question,
      outcomes: outcomes,
      tokenMap: tokenMap,
      endDate: market.end_date_iso,
      volume: market.volume || '0',
      liquidity: market.liquidity || '0',
      tags: market.tags || [],
    };
  }

  /**
   * Get live odds (midpoint price) for a specific token
   * @param {string} tokenId - Token ID
   * @returns {Promise<number>} Probability (0-1)
   */
  async fetchLiveOdds(tokenId) {
    try {
      const url = `${this.clobBaseUrl}/midpoint?token_id=${tokenId}`;
      const response = await this.fetch(url);

      if (response.mid !== undefined) {
        return parseFloat(response.mid);
      }

      // Fallback: try to parse as price
      if (response.price !== undefined) {
        return parseFloat(response.price);
      }

      console.warn('[PolymarketClient] Unexpected odds response format:', response);
      return 0;
    } catch (error) {
      console.error(`[PolymarketClient] Error fetching odds for token ${tokenId}:`, error);
      throw error;
    }
  }

  /**
   * Get order book (depth) for a specific token
   * @param {string} tokenId - Token ID
   * @returns {Promise<Object>} Order book object with bids and asks
   */
  async fetchOrderBook(tokenId) {
    try {
      const url = `${this.clobBaseUrl}/book?token_id=${tokenId}`;
      return await this.fetch(url);
    } catch (error) {
      console.error(`[PolymarketClient] Error fetching order book for token ${tokenId}:`, error);
      throw error;
    }
  }

  /**
   * Generic fetch wrapper with timeout and error handling
   * @param {string} url - URL to fetch
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} Parsed JSON response
   * @private
   */
  async fetch(url, options = {}) {
    return retryWithBackoff(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.API_TIMEOUT);

      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          signal: controller.signal,
          ...options,
        });

        if (!response.ok) {
          if (response.status === 429) {
            throw new Error('Rate limited');
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } finally {
        clearTimeout(timeoutId);
      }
    });
  }
}

export default PolymarketClient;
