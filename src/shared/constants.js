// Polymarket API Configuration
export const API_CONFIG = {
  GAMMA_BASE_URL: 'https://gamma-api.polymarket.com',
  CLOB_BASE_URL: 'https://clob.polymarket.com',
  API_TIMEOUT: 10000, // milliseconds
};

// Polling Configuration
export const POLLING_CONFIG = {
  MARKETS_INTERVAL: 5 * 60 * 1000, // 5 minutes
  ODDS_INTERVAL: 30 * 1000, // 30 seconds
  ALARMS_INTERVAL: 0.5, // 30 seconds in minutes (Manifest V3 minimum)
};

// Cache Configuration
export const CACHE_CONFIG = {
  MARKETS_TTL: 5 * 60 * 1000, // 5 minutes
  ODDS_TTL: 30 * 1000, // 30 seconds
  STORAGE_KEY_MARKETS: 'pm_markets_cache',
  STORAGE_KEY_ODDS: 'pm_odds_cache',
  STORAGE_KEY_STATE: 'pm_state',
};

// UI Configuration
export const UI_CONFIG = {
  WIDGET_ID: 'polymarket-odds-widget',
  WIDGET_WIDTH_COLLAPSED: 120,
  WIDGET_HEIGHT_COLLAPSED: 48,
  WIDGET_WIDTH_EXPANDED: 380,
  WIDGET_HEIGHT_EXPANDED_MAX: 600,
  WIDGET_Z_INDEX: 9999,
  UPDATE_ANIMATION_DURATION: 300, // milliseconds
};

// Market Filtering Keywords
export const MARKET_FILTERS = {
  NCAA_KEYWORDS: ['NCAA', 'College Basketball', 'college basketball'],
  WINNER_KEYWORDS: ['winner', 'win', 'beats', 'defeat'],
};

// Error Messages
export const ERROR_MESSAGES = {
  NO_GAMES: 'No NCAA games available right now',
  API_ERROR: 'Unable to fetch odds. Retrying...',
  NETWORK_ERROR: 'Connection lost. Using cached data.',
  INVALID_SELECTION: 'Game no longer available',
  FETCH_TIMEOUT: 'Request timed out',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  GAMES_LOADED: 'Games loaded',
  ODDS_UPDATED: 'Odds updated',
};
