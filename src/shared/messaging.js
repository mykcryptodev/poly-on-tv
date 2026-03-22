/**
 * Message types for communication between background and content scripts
 */
export const MESSAGE_TYPES = {
  // Requests from content script to background
  GET_MARKETS: 'GET_MARKETS',
  SELECT_GAME: 'SELECT_GAME',
  GET_ODDS: 'GET_ODDS',
  GET_STATE: 'GET_STATE',
  FIND_MARKET_BY_URL: 'FIND_MARKET_BY_URL',

  // Updates pushed from background to content script
  STATE_UPDATE: 'STATE_UPDATE',
  MARKETS_UPDATED: 'MARKETS_UPDATED',
  ODDS_UPDATED: 'ODDS_UPDATED',
  ERROR: 'ERROR',
  STATUS: 'STATUS',
};

/**
 * Send a message from content script to background
 * @param {string} type - Message type
 * @param {Object} data - Message data
 * @returns {Promise<Object>} Response from background
 */
export function sendMessage(type, data = {}) {
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage(
        { type, data },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response || {});
          }
        }
      );
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Send a message to all YouTube TV tabs
 * Used by background script to push updates to content scripts
 * @param {string} type - Message type
 * @param {Object} data - Message data
 * @returns {Promise<void>}
 */
export async function broadcastMessage(type, data = {}) {
  try {
    const tabs = await chrome.tabs.query({ url: 'https://tv.youtube.com/*' });
    tabs.forEach((tab) => {
      chrome.tabs.sendMessage(tab.id, { type, data }).catch(() => {
        // Ignore errors if tab was closed or content script not ready
      });
    });
  } catch (error) {
    console.error('[Messaging] Error broadcasting message:', error);
  }
}

/**
 * Register a message handler (for use in background script)
 * @param {string} type - Message type to handle
 * @param {Function} handler - Async handler function (data) => response
 * @returns {void}
 */
export function registerMessageHandler(type, handler) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === type) {
      try {
        const result = handler(message.data, sender);

        // Support both sync and async handlers
        if (result instanceof Promise) {
          result
            .then((response) => sendResponse({ success: true, data: response }))
            .catch((error) => {
              console.error(`[Messaging] Error in handler for ${type}:`, error);
              sendResponse({ success: false, error: error.message });
            });
          return true; // Keep channel open for async response
        } else {
          sendResponse({ success: true, data: result });
        }
      } catch (error) {
        console.error(`[Messaging] Sync error in handler for ${type}:`, error);
        sendResponse({ success: false, error: error.message });
      }
    }
  });
}

/**
 * Register multiple message handlers at once
 * @param {Object} handlers - Map of type -> handler function
 * @returns {void}
 */
export function registerMessageHandlers(handlers) {
  Object.entries(handlers).forEach(([type, handler]) => {
    registerMessageHandler(type, handler);
  });
}

/**
 * Listen for messages from background (for use in content script)
 * @param {string} type - Message type to listen for
 * @param {Function} callback - Callback function (data) => void
 * @returns {void}
 */
export function listenForMessage(type, callback) {
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === type) {
      try {
        callback(message.data);
      } catch (error) {
        console.error(`[Messaging] Error in listener for ${type}:`, error);
      }
    }
  });
}

/**
 * Listen for multiple message types at once
 * @param {Object} listeners - Map of type -> callback function
 * @returns {void}
 */
export function listenForMessages(listeners) {
  Object.entries(listeners).forEach(([type, callback]) => {
    listenForMessage(type, callback);
  });
}
