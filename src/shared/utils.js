/**
 * Format a probability (0-1) as a percentage string
 * @param {number} probability - Value between 0 and 1
 * @returns {string} Formatted percentage (e.g., "65.4%")
 */
export function formatOddsPercentage(probability) {
  if (typeof probability !== 'number' || probability < 0 || probability > 1) {
    return 'N/A';
  }
  return `${(probability * 100).toFixed(1)}%`;
}

/**
 * Format a probability as implied odds (decimal)
 * @param {number} probability - Value between 0 and 1
 * @returns {string} Formatted odds (e.g., "1.53")
 */
export function formatOddsDecimal(probability) {
  if (typeof probability !== 'number' || probability <= 0 || probability > 1) {
    return 'N/A';
  }
  return (1 / probability).toFixed(2);
}

/**
 * Get human-readable time ago string
 * @param {number} timestamp - Milliseconds since epoch
 * @returns {string} Time ago (e.g., "2 minutes ago")
 */
export function getTimeAgo(timestamp) {
  if (!timestamp) return 'never';

  const now = Date.now();
  const seconds = Math.floor((now - timestamp) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;

  return `${Math.floor(seconds / 86400)}d ago`;
}

/**
 * Determine if odds are trending up, down, or stable
 * @param {number} currentOdds - Current probability
 * @param {number} previousOdds - Previous probability
 * @param {number} threshold - Change threshold to consider significant (default 0.02)
 * @returns {string} 'rising', 'falling', or 'stable'
 */
export function determineTrend(currentOdds, previousOdds, threshold = 0.02) {
  if (!previousOdds) return 'stable';

  const change = currentOdds - previousOdds;

  if (Math.abs(change) < threshold) return 'stable';
  return change > 0 ? 'rising' : 'falling';
}

/**
 * Extract team names from a market question
 * @param {string} question - Market question (e.g., "Will Duke beat UNC?")
 * @returns {object} {teamA, teamB} or null if cannot parse
 */
export function extractTeamsFromQuestion(question) {
  // Try to match patterns like "Will [Team A] [beat/vs] [Team B]?"
  const patterns = [
    /Will\s+(.+?)\s+(?:beat|defeat|win\s+against)\s+(.+?)\??/i,
    /(.+?)\s+(?:vs|versus)\s+(.+?)\s+winner/i,
    /Winner:\s+(.+?)\s+(?:vs|or)\s+(.+?)/i,
  ];

  for (const pattern of patterns) {
    const match = question.match(pattern);
    if (match) {
      return {
        teamA: match[1].trim(),
        teamB: match[2].trim(),
      };
    }
  }

  return null;
}

/**
 * Parse an ISO date string to human-readable format
 * @param {string} isoString - ISO 8601 date string
 * @returns {string} Formatted date (e.g., "Mar 15, 7:00 PM")
 */
export function formatGameDate(isoString) {
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

/**
 * Sleep for a given duration
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise}
 */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Exponential backoff retry logic
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum retry attempts
 * @param {number} initialDelay - Initial delay in milliseconds
 * @returns {Promise} Result of fn or throws last error
 */
export async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 1000) {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

/**
 * Deep clone an object
 * @param {object} obj - Object to clone
 * @returns {object} Cloned object
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Sanitize HTML to prevent XSS
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text
 */
export function sanitizeHTML(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Check if object is empty
 * @param {object} obj - Object to check
 * @returns {boolean}
 */
export function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}

/**
 * Debounce a function
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(fn, delay = 300) {
  let timeoutId;

  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}
