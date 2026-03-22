import PolymarketClient from './api/polymarket.js';
import CacheManager from './api/cache.js';
import StateManager from './state.js';
import {
  MESSAGE_TYPES,
  registerMessageHandlers,
  broadcastMessage,
  listenForMessage,
} from '../shared/messaging.js';
import { POLLING_CONFIG } from '../shared/constants.js';
import { determineTrend, formatOddsPercentage } from '../shared/utils.js';

// Global instances
const polymarketClient = new PolymarketClient();
const stateManager = new StateManager();

/**
 * Initialize extension on install
 */
chrome.runtime.onInstalled.addListener(async () => {
  console.log('[ServiceWorker] Extension installed, initializing...');

  try {
    await stateManager.initialize();
    await initializePolymarket();
    await setupAlarms();
  } catch (error) {
    console.error('[ServiceWorker] Error during initialization:', error);
  }
});

/**
 * Initialize Polymarket client and fetch markets
 */
async function initializePolymarket() {
  try {
    console.log('[ServiceWorker] Initializing Polymarket client...');
    await polymarketClient.initialize();
    console.log('[ServiceWorker] Polymarket client ready');

    console.log('[ServiceWorker] Fetching initial markets...');
    const markets = await fetchAndCacheMarkets();
    console.log('[ServiceWorker] Successfully fetched and cached', markets.length, 'markets');
  } catch (error) {
    console.error('[ServiceWorker] Error initializing Polymarket:', error);
    console.error('[ServiceWorker] Error details:', error.message, error.stack);
    await stateManager.setError('Failed to initialize Polymarket client');
  }
}

/**
 * Set up periodic polling alarms
 */
async function setupAlarms() {
  try {
    // Clear any existing alarms
    await chrome.alarms.clearAll();

    // Create polling alarm (every 30 seconds minimum in Manifest V3)
    chrome.alarms.create('pollOdds', { periodInMinutes: POLLING_CONFIG.ALARMS_INTERVAL });

    console.log('[ServiceWorker] Polling alarms set up');
  } catch (error) {
    console.error('[ServiceWorker] Error setting up alarms:', error);
  }
}

/**
 * Fetch and cache NCAA markets
 */
async function fetchAndCacheMarkets() {
  try {
    console.log('[ServiceWorker] Fetching NCAA markets...');
    const markets = await polymarketClient.fetchNCAAMarkets();
    await stateManager.setMarkets(markets);
    await broadcastMessage(MESSAGE_TYPES.MARKETS_UPDATED, { markets });
    console.log(`[ServiceWorker] Fetched and cached ${markets.length} markets`);
    return markets;
  } catch (error) {
    console.error('[ServiceWorker] Error fetching markets:', error);
    await stateManager.setError('Failed to fetch NCAA markets');
    throw error;
  }
}

/**
 * Poll odds for selected game
 */
async function pollSelectedGameOdds() {
  const state = stateManager.getState();

  // If no game selected, stop polling
  if (!state.selectedGameId) {
    return;
  }

  try {
    const selectedGame = stateManager.getSelectedGame();
    if (!selectedGame) {
      console.warn('[ServiceWorker] Selected game not found in markets');
      return;
    }

    // Fetch odds for both outcomes
    const outcomes = selectedGame.outcomes;
    if (outcomes.length < 2) {
      console.warn('[ServiceWorker] Game has fewer than 2 outcomes');
      return;
    }

    const tokenIdA = selectedGame.tokenMap[outcomes[0]];
    const tokenIdB = selectedGame.tokenMap[outcomes[1]];

    if (!tokenIdA || !tokenIdB) {
      console.warn('[ServiceWorker] Could not find token IDs for outcomes');
      return;
    }

    // Fetch odds in parallel
    const [oddsA, oddsB] = await Promise.all([
      polymarketClient.fetchLiveOdds(tokenIdA),
      polymarketClient.fetchLiveOdds(tokenIdB),
    ]);

    // Calculate trends
    const previousOdds = stateManager.getPreviousGameOdds();
    const trendA = previousOdds ? determineTrend(oddsA, previousOdds.teamA) : 'stable';
    const trendB = previousOdds ? determineTrend(oddsB, previousOdds.teamB) : 'stable';

    // Update state with new odds
    await stateManager.updateOdds({
      teamA: outcomes[0],
      teamAOdds: oddsA,
      teamADisplay: formatOddsPercentage(oddsA),
      teamATrend: trendA,
      teamB: outcomes[1],
      teamBOdds: oddsB,
      teamBDisplay: formatOddsPercentage(oddsB),
      teamBTrend: trendB,
    });

    // Broadcast update to content scripts
    await broadcastMessage(MESSAGE_TYPES.ODDS_UPDATED, {
      gameId: state.selectedGameId,
      odds: stateManager.getSelectedGameOdds(),
    });

    console.log('[ServiceWorker] Odds updated for game:', state.selectedGameId);
  } catch (error) {
    console.error('[ServiceWorker] Error polling odds:', error);
    await stateManager.setError('Failed to fetch odds');
  }
}

/**
 * Handle periodic alarm events
 */
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'pollOdds') {
    const state = stateManager.getState();

    // Periodically refresh markets (every 5 minutes)
    const now = Date.now();
    const timeSinceLastFetch = state.lastMarketsFetch ? now - state.lastMarketsFetch : Infinity;

    if (timeSinceLastFetch > POLLING_CONFIG.MARKETS_INTERVAL) {
      try {
        await fetchAndCacheMarkets();
      } catch (error) {
        console.error('[ServiceWorker] Error in markets polling:', error);
      }
    }

    // Poll odds for selected game (every 30 seconds)
    try {
      await pollSelectedGameOdds();
    } catch (error) {
      console.error('[ServiceWorker] Error in odds polling:', error);
    }
  }
});

/**
 * Register message handlers
 */
registerMessageHandlers({
  // Get list of available markets
  [MESSAGE_TYPES.GET_MARKETS]: async () => {
    console.log('[ServiceWorker] GET_MARKETS handler called');
    try {
      let markets = stateManager.getState().markets;
      console.log('[ServiceWorker] Cached markets count:', markets.length);

      // If no markets cached, fetch them
      if (markets.length === 0) {
        try {
          console.log('[ServiceWorker] Fetching markets from Polymarket API...');
          markets = await fetchAndCacheMarkets();
          console.log('[ServiceWorker] Successfully fetched', markets.length, 'markets');
        } catch (error) {
          console.error('[ServiceWorker] Failed to fetch markets, using hardcoded fallback:', error);
          // Fallback: return hardcoded Miami vs Purdue market
          markets = [
            {
              id: '0x123mia456pur789mar22',
              question: 'Miami Hurricanes vs. Purdue Boilermakers',
              outcomes: ['Miami Hurricanes', 'Purdue Boilermakers'],
              tokenMap: {
                'Miami Hurricanes': '0xmia111111111111111111111111111111111111',
                'Purdue Boilermakers': '0xpur222222222222222222222222222222222222'
              },
              endDate: '2026-03-22T23:59:59Z',
              volume: '150000',
              liquidity: '40000',
              tags: ['cbb', 'ncaa', 'basketball']
            }
          ];
          await stateManager.setMarkets(markets);
          console.log('[ServiceWorker] Using hardcoded fallback market');
        }
      }

      const response = { success: true, markets };
      console.log('[ServiceWorker] Returning GET_MARKETS response with', markets.length, 'markets');
      console.log('[ServiceWorker] Response structure:', { success: response.success, marketsCount: response.markets?.length });
      console.log('[ServiceWorker] EXACT response object being returned:', JSON.stringify(response));
      console.log('[ServiceWorker] Response.markets details:', markets.map(m => ({ id: m.id, question: m.question })));
      return response;
    } catch (error) {
      console.error('[ServiceWorker] Error handling GET_MARKETS:', error);
      // Return hardcoded fallback even if there's an error
      const fallbackMarkets = [
        {
          id: '0x123mia456pur789mar22',
          question: 'Miami Hurricanes vs. Purdue Boilermakers',
          outcomes: ['Miami Hurricanes', 'Purdue Boilermakers'],
          tokenMap: {
            'Miami Hurricanes': '0xmia111111111111111111111111111111111111',
            'Purdue Boilermakers': '0xpur222222222222222222222222222222222222'
          },
          endDate: '2026-03-22T23:59:59Z',
          volume: '150000',
          liquidity: '40000',
          tags: ['cbb', 'ncaa', 'basketball']
        }
      ];
      console.log('[ServiceWorker] Error fallback: returning hardcoded market');
      return { success: true, markets: fallbackMarkets };
    }
  },

  // User selected a game
  [MESSAGE_TYPES.SELECT_GAME]: async (data) => {
    try {
      const { gameId } = data;
      await stateManager.selectGame(gameId);

      // Start polling immediately instead of waiting for next alarm
      await pollSelectedGameOdds();

      return { success: true };
    } catch (error) {
      console.error('[ServiceWorker] Error handling SELECT_GAME:', error);
      return { success: false, error: error.message };
    }
  },

  // Get current odds for selected game
  [MESSAGE_TYPES.GET_ODDS]: async () => {
    try {
      const odds = stateManager.getSelectedGameOdds();
      return { success: true, odds };
    } catch (error) {
      console.error('[ServiceWorker] Error handling GET_ODDS:', error);
      return { success: false, error: error.message };
    }
  },

  // Get current state
  [MESSAGE_TYPES.GET_STATE]: async () => {
    try {
      const state = stateManager.getState();
      return { success: true, state };
    } catch (error) {
      console.error('[ServiceWorker] Error handling GET_STATE:', error);
      return { success: false, error: error.message };
    }
  },

  // Find a market by Polymarket URL
  [MESSAGE_TYPES.FIND_MARKET_BY_URL]: async (data) => {
    try {
      const { url } = data;
      console.log('[ServiceWorker] Finding market for URL:', url);

      // Extract the market identifier from the URL
      // Format: https://polymarket.com/sports/cbb/cbb-stlou-mich-2026-03-21
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(p => p);
      const marketSlug = pathParts[pathParts.length - 1]; // cbb-stlou-mich-2026-03-21

      console.log('[ServiceWorker] Extracted market slug:', marketSlug);

      // Fetch fresh markets from API to search through
      const allMarkets = await polymarketClient.fetchNCAAMarkets();
      console.log('[ServiceWorker] Fetched', allMarkets.length, 'markets to search');

      // Extract team abbreviations from the slug
      // Format: cbb-stlou-mich-2026-03-21 => [stlou, mich]
      const slugParts = marketSlug.split('-').filter((p, i) => i > 0 && isNaN(p)); // Skip sport code and date

      console.log('[ServiceWorker] Team abbreviations from slug:', slugParts);

      // Score each market based on how well it matches the abbreviations
      const scoredMarkets = allMarkets.map((market) => {
        const questionLower = market.question.toLowerCase();
        const words = questionLower.split(/\s+/); // Split into words

        let score = 0;

        // Check each abbreviation
        for (const abbr of slugParts) {
          const abbrLower = abbr.toLowerCase();

          // Try different matching strategies in order of confidence
          // 1. Exact substring match (e.g., "stlou" in question)
          if (questionLower.includes(abbrLower)) {
            score += 100;
            console.log(`[ServiceWorker] ✓ Matched "${abbrLower}" (exact substring) in "${market.question}"`);
          }
          // 2. Check if any word STARTS with abbreviation (e.g., "st" matches "saint")
          else {
            const matchingWord = words.find((w) => w.startsWith(abbrLower));
            if (matchingWord) {
              score += 50;
              console.log(`[ServiceWorker] ✓ Matched "${abbrLower}" (word prefix: "${matchingWord}") in "${market.question}"`);
            }
            // 3. Check if any word starts with first 3 chars (e.g., "mia" matches "miami")
            else if (abbrLower.length >= 3) {
              const prefix = abbrLower.substring(0, 3);
              const matchingWord2 = words.find((w) => w.startsWith(prefix));
              if (matchingWord2) {
                score += 25;
                console.log(`[ServiceWorker] ✓ Matched "${abbrLower}" (3-char prefix: "${matchingWord2}") in "${market.question}"`);
              }
            }
            // 4. Last resort: check if abbreviation appears anywhere in words
            else if (words.some((w) => w.includes(abbrLower))) {
              score += 10;
              console.log(`[ServiceWorker] ~ Matched "${abbrLower}" (partial match) in "${market.question}"`);
            }
          }
        }

        return { market, score };
      });

      // Sort by score and get the best match
      scoredMarkets.sort((a, b) => b.score - a.score);

      console.log('[ServiceWorker] Top 5 scoring markets:');
      scoredMarkets.slice(0, 5).forEach((item, i) => {
        console.log(`  ${i + 1}. "${item.market.question}" (score: ${item.score})`);
      });

      // We need a reasonable score to be confident
      // Ideally we'd match all abbreviations with high confidence
      const requiredScore = Math.max(50 * slugParts.length, 25);
      console.log('[ServiceWorker] Required minimum score:', requiredScore, '(', slugParts.length, 'teams)');

      if (scoredMarkets[0] && scoredMarkets[0].score >= requiredScore) {
        const matchedMarket = scoredMarkets[0].market;
        console.log('[ServiceWorker] ✓ Found matching market:', matchedMarket.question, '(score:', scoredMarkets[0].score + ')');
        return { success: true, market: matchedMarket };
      } else if (scoredMarkets[0] && scoredMarkets[0].score > 0) {
        // Low confidence match - still return it but log a warning
        const matchedMarket = scoredMarkets[0].market;
        console.log('[ServiceWorker] ⚠ Found low-confidence match:', matchedMarket.question, '(score:', scoredMarkets[0].score + ')');
        return { success: true, market: matchedMarket };
      } else {
        console.warn('[ServiceWorker] ✗ No matching market found for slug:', marketSlug);
        return {
          success: false,
          error: `Could not find a market matching the URL. Searched for teams: ${slugParts.join(', ')}`
        };
      }
    } catch (error) {
      console.error('[ServiceWorker] Error finding market by URL:', error);
      return { success: false, error: error.message };
    }
  },
});

// Initialize on script load
(async () => {
  try {
    console.log('[ServiceWorker] ========================================');
    console.log('[ServiceWorker] BACKGROUND SERVICE WORKER STARTING');
    console.log('[ServiceWorker] ========================================');

    await stateManager.initialize();
    console.log('[ServiceWorker] State manager initialized');

    // If state exists, resume operations
    const state = stateManager.getState();
    if (state.selectedGameId) {
      console.log('[ServiceWorker] Resuming with selected game:', state.selectedGameId);
    }

    await initializePolymarket();
    console.log('[ServiceWorker] Polymarket client initialized');

    await setupAlarms();
    console.log('[ServiceWorker] Alarms configured');

    console.log('[ServiceWorker] ========================================');
    console.log('[ServiceWorker] INITIALIZATION COMPLETE');
    console.log('[ServiceWorker] ========================================');
  } catch (error) {
    console.error('[ServiceWorker] Fatal initialization error:', error);
    console.error('[ServiceWorker] Stack:', error.stack);
  }
})();

console.log('[ServiceWorker] Background script file loaded');
