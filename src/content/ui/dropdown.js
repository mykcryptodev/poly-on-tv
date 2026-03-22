import { formatGameDate } from '../../shared/utils.js';

/**
 * GameSelector component for selecting which NCAA game to track
 */
export class GameSelector {
  constructor(onSelect) {
    this.container = null;
    this.onSelect = onSelect;
    this.games = [];
    this.filteredGames = [];
    this.searchInput = null;
    this.gamesList = null;
  }

  /**
   * Render the game selector HTML
   * @returns {string} HTML string
   */
  renderSelector() {
    return `
      <div class="pm-game-selector">
        <div class="pm-selector-header">
          <div class="pm-selector-title">NCAA Games</div>
        </div>

        <div class="pm-search-wrapper">
          <input
            type="text"
            class="pm-search-input"
            placeholder="Search teams..."
            autocomplete="off"
          />
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

  /**
   * Render a single game item
   * @param {Object} game - Game market object
   * @returns {string} HTML string
   * @private
   */
  renderGameItem(game) {
    // Extract team names if possible
    const teamNames = this.extractTeamNames(game);

    return `
      <div class="pm-game-item" data-game-id="${game.id}">
        <div class="pm-game-teams">
          ${this.sanitize(teamNames.teamA)} vs ${this.sanitize(teamNames.teamB)}
        </div>
        <div class="pm-game-meta">
          <span class="pm-game-date">${formatGameDate(game.endDate)}</span>
        </div>
        <div class="pm-game-action">
          <span class="pm-game-arrow">→</span>
        </div>
      </div>
    `;
  }

  /**
   * Extract team names from game question
   * @param {Object} game - Game object
   * @returns {Object} {teamA, teamB}
   * @private
   */
  extractTeamNames(game) {
    // Try to parse team names from outcomes
    if (game.outcomes && game.outcomes.length >= 2) {
      return {
        teamA: game.outcomes[0],
        teamB: game.outcomes[1],
      };
    }

    // Fallback: try to parse from question
    const question = game.question;
    const vs = question.indexOf(' vs ');
    if (vs > 0) {
      const teamA = question.substring(0, vs).replace(/^[^a-zA-Z]+/, '').trim();
      const teamB = question.substring(vs + 4).replace(/[^a-zA-Z]+$/, '').trim();
      return { teamA, teamB };
    }

    return { teamA: 'Team A', teamB: 'Team B' };
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
   * Filter games by search term
   * @param {string} searchTerm - Search term
   * @private
   */
  filterGames(searchTerm) {
    const term = searchTerm.toLowerCase();

    this.filteredGames = this.games.filter((game) => {
      const teamNames = this.extractTeamNames(game);
      const question = game.question.toLowerCase();
      const teamsText = `${teamNames.teamA} ${teamNames.teamB}`.toLowerCase();

      return teamsText.includes(term) || question.includes(term);
    });

    this.renderGamesList();
  }

  /**
   * Render the filtered games list
   * @private
   */
  renderGamesList() {
    if (!this.gamesList) return;

    if (this.filteredGames.length === 0) {
      this.gamesList.innerHTML = '<div class="pm-no-games">No games match your search</div>';
      return;
    }

    this.gamesList.innerHTML = this.filteredGames.map((game) => this.renderGameItem(game)).join('');

    // Attach click handlers
    this.gamesList.querySelectorAll('.pm-game-item').forEach((item) => {
      item.addEventListener('click', () => {
        const gameId = item.getAttribute('data-game-id');
        if (this.onSelect) {
          this.onSelect(gameId);
        }
      });
    });
  }

  /**
   * Mount the selector to a container
   * @param {Element} container - Parent container
   * @param {Array} games - Array of game markets
   */
  mount(container, games) {
    this.container = container;
    this.games = games || [];
    this.filteredGames = this.games;

    container.innerHTML = this.renderSelector();

    // Store references
    this.searchInput = container.querySelector('.pm-search-input');
    this.gamesList = container.querySelector('.pm-games-list');

    // Attach event listeners
    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.filterGames(e.target.value);
      });

      // Focus on mount
      this.searchInput.focus();
    }

    // Initial render
    this.renderGamesList();
  }

  /**
   * Update games list
   * @param {Array} games - New games list
   */
  updateGames(games) {
    this.games = games || [];
    this.filteredGames = this.games;

    if (this.container) {
      // Update game count
      const countElement = this.container.querySelector('.pm-game-count');
      if (countElement) {
        countElement.textContent = `${this.games.length} games available`;
      }

      // Re-render list
      this.renderGamesList();
    }
  }

  /**
   * Clear selection
   */
  clearSearch() {
    if (this.searchInput) {
      this.searchInput.value = '';
      this.filterGames('');
    }
  }

  /**
   * Get selected game ID
   * @returns {string|null}
   */
  getSelectedGameId() {
    const selected = this.container?.querySelector('.pm-game-item.selected');
    return selected?.getAttribute('data-game-id') || null;
  }
}

export default GameSelector;
