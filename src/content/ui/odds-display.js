import { getTimeAgo } from '../../shared/utils.js';

/**
 * OddsDisplay component renders the current odds for a selected game
 */
export class OddsDisplay {
  constructor() {
    this.container = null;
    this.currentOdds = null;
  }

  /**
   * Render the odds display HTML
   * @param {Object} odds - Odds object with team data
   * @returns {string} HTML string
   */
  renderOdds(odds) {
    if (!odds) {
      return '<div class="pm-odds-empty">Select a game to see odds</div>';
    }

    const { teamA, teamAOdds, teamADisplay, teamATrend, teamB, teamBOdds, teamBDisplay, teamBTrend, lastUpdate } =
      odds;

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
            <div class="pm-team-name">${this.sanitize(teamA)}</div>
            <div class="pm-odds-wrapper">
              <span class="pm-odds ${teamATrend ? `pm-odds-${teamATrend}` : ''}">${teamADisplay}</span>
              ${this.getTrendIcon(teamATrend)}
            </div>
          </div>
        </div>

        <div class="pm-team-odds-row">
          <div class="pm-team-odds-item">
            <div class="pm-team-name">${this.sanitize(teamB)}</div>
            <div class="pm-odds-wrapper">
              <span class="pm-odds ${teamBTrend ? `pm-odds-${teamBTrend}` : ''}">${teamBDisplay}</span>
              ${this.getTrendIcon(teamBTrend)}
            </div>
          </div>
        </div>

        <div class="pm-odds-footer">
          <div class="pm-odds-info">
            Powered by Polymarket
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Get trend indicator icon
   * @param {string} trend - 'rising', 'falling', or 'stable'
   * @returns {string} HTML icon or empty string
   * @private
   */
  getTrendIcon(trend) {
    if (!trend || trend === 'stable') return '';

    const icons = {
      rising: '📈',
      falling: '📉',
      stable: '➡️',
    };

    return `<span class="pm-trend-icon">${icons[trend] || ''}</span>`;
  }

  /**
   * Sanitize text to prevent XSS
   * @param {string} text - Text to sanitize
   * @returns {string} Sanitized text
   * @private
   */
  sanitize(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Mount the odds display to a container
   * @param {Element} container - Parent container
   * @param {Object} odds - Odds data
   */
  mount(container, odds) {
    this.container = container;
    this.update(odds);
  }

  /**
   * Update the odds display with new data
   * @param {Object} odds - New odds data
   */
  update(odds) {
    if (!this.container) return;

    this.currentOdds = odds;
    this.container.innerHTML = this.renderOdds(odds);

    // Trigger animation
    this.container.classList.add('pm-updated');
    setTimeout(() => {
      this.container.classList.remove('pm-updated');
    }, 300);
  }

  /**
   * Show loading state
   */
  showLoading() {
    if (this.container) {
      this.container.innerHTML = `
        <div class="pm-odds-loading">
          <div class="pm-spinner"></div>
          <div>Loading odds...</div>
        </div>
      `;
    }
  }

  /**
   * Show error state
   * @param {string} error - Error message
   */
  showError(error) {
    if (this.container) {
      this.container.innerHTML = `
        <div class="pm-odds-error">
          <div class="pm-error-icon">⚠️</div>
          <div class="pm-error-message">${this.sanitize(error)}</div>
        </div>
      `;
    }
  }

  /**
   * Clear the display
   */
  clear() {
    if (this.container) {
      this.container.innerHTML = '<div class="pm-odds-empty">No game selected</div>';
    }
  }
}

export default OddsDisplay;
