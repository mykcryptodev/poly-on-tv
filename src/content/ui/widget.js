import { OddsDisplay } from './odds-display.js';
import { GameSelector } from './dropdown.js';
import { UI_CONFIG } from '../../shared/constants.js';

/**
 * OddsWidget - Main widget component for YouTube TV overlay
 */
export class OddsWidget {
  constructor(overlay) {
    this.overlay = overlay;
    this.container = null;
    this.isExpanded = false;
    this.isFullscreen = false;

    // Sub-components
    this.oddsDisplay = new OddsDisplay();
    this.gameSelector = new GameSelector((gameId) => this.handleGameSelection(gameId));

    // Elements
    this.widgetElement = null;
    this.headerElement = null;
    this.bodyElement = null;
    this.toggleButton = null;
    this.oddsContainer = null;
    this.selectorContainer = null;
  }

  /**
   * Mount the widget to the player container
   * @param {Element} playerElement - YouTube TV player element
   */
  mount(playerElement) {
    // Create widget container
    this.widgetElement = this.createWidgetElement();
    playerElement.parentElement.insertBefore(this.widgetElement, playerElement.nextSibling);

    // Store references to child elements
    this.headerElement = this.widgetElement.querySelector('.pm-widget-header');
    this.bodyElement = this.widgetElement.querySelector('.pm-widget-body');
    this.toggleButton = this.widgetElement.querySelector('.pm-toggle-btn');
    this.oddsContainer = this.widgetElement.querySelector('.pm-odds-container-inner');
    this.selectorContainer = this.widgetElement.querySelector('.pm-selector-container-inner');

    // Attach event listeners
    this.toggleButton.addEventListener('click', () => this.toggleExpanded());

    // Mount sub-components
    this.oddsDisplay.mount(this.oddsContainer);

    console.log('[OddsWidget] Mounted');
  }

  /**
   * Create the widget DOM element
   * @returns {Element} Widget element
   * @private
   */
  createWidgetElement() {
    const widget = document.createElement('div');
    widget.id = UI_CONFIG.WIDGET_ID;
    widget.className = 'pm-widget pm-widget-collapsed';
    widget.innerHTML = `
      <div class="pm-widget-header">
        <button class="pm-toggle-btn" title="Toggle Polymarket odds">
          📊 Odds
        </button>
      </div>

      <div class="pm-widget-body" style="display: none;">
        <div class="pm-widget-tabs">
          <button class="pm-tab-btn pm-tab-btn-odds pm-tab-active" data-tab="odds">
            Odds
          </button>
          <button class="pm-tab-btn pm-tab-btn-games" data-tab="games">
            Games
          </button>
        </div>

        <div class="pm-widget-content">
          <div class="pm-odds-container-inner"></div>
          <div class="pm-selector-container-inner" style="display: none;"></div>
        </div>
      </div>
    `;

    // Attach tab switching
    const tabButtons = widget.querySelectorAll('.pm-tab-btn');
    tabButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => this.switchTab(e.target.getAttribute('data-tab')));
    });

    return widget;
  }

  /**
   * Toggle widget expanded/collapsed state
   */
  toggleExpanded() {
    this.isExpanded = !this.isExpanded;

    if (this.isExpanded) {
      this.expand();
    } else {
      this.collapse();
    }
  }

  /**
   * Expand the widget
   * @private
   */
  expand() {
    this.widgetElement.classList.remove('pm-widget-collapsed');
    this.widgetElement.classList.add('pm-widget-expanded');
    this.bodyElement.style.display = 'block';

    // Initialize game selector if not already done
    if (this.selectorContainer.innerHTML === '') {
      this.gameSelector.mount(this.selectorContainer, this.overlay.stateManager.markets);
    }

    console.log('[OddsWidget] Expanded');
  }

  /**
   * Collapse the widget
   * @private
   */
  collapse() {
    this.widgetElement.classList.remove('pm-widget-expanded');
    this.widgetElement.classList.add('pm-widget-collapsed');
    this.bodyElement.style.display = 'none';

    console.log('[OddsWidget] Collapsed');
  }

  /**
   * Switch between tabs
   * @param {string} tabName - Tab name ('odds' or 'games')
   * @private
   */
  switchTab(tabName) {
    const oddsContainer = this.widgetElement.querySelector('.pm-odds-container-inner');
    const selectorContainer = this.widgetElement.querySelector('.pm-selector-container-inner');
    const tabButtons = this.widgetElement.querySelectorAll('.pm-tab-btn');

    // Update active tab button
    tabButtons.forEach((btn) => {
      btn.classList.remove('pm-tab-active');
      if (btn.getAttribute('data-tab') === tabName) {
        btn.classList.add('pm-tab-active');
      }
    });

    // Show/hide containers
    if (tabName === 'odds') {
      oddsContainer.style.display = 'block';
      selectorContainer.style.display = 'none';
    } else {
      oddsContainer.style.display = 'none';
      selectorContainer.style.display = 'block';
    }
  }

  /**
   * Handle game selection
   * @param {string} gameId - Selected game ID
   * @private
   */
  async handleGameSelection(gameId) {
    console.log('[OddsWidget] Game selected:', gameId);

    // Call overlay to handle selection
    await this.overlay.selectGame(gameId);

    // Switch to odds tab
    this.switchTab('odds');
  }

  /**
   * Update odds display
   * @param {Object} odds - Odds data
   */
  updateOdds(odds) {
    this.oddsDisplay.update(odds);
  }

  /**
   * Update markets list
   * @param {Array} markets - Markets list
   */
  updateMarkets(markets) {
    this.gameSelector.updateGames(markets);
  }

  /**
   * Update internal state
   * @param {Object} state - New state
   */
  updateState(state) {
    // Update odds if available
    if (state.currentOdds) {
      this.oddsDisplay.update(state.currentOdds);
    }

    // Update markets list
    if (state.markets && state.markets.length > 0) {
      this.gameSelector.updateGames(state.markets);
    }

    // Show error if present
    if (state.error) {
      this.showError(state.error);
    }
  }

  /**
   * Show error message
   * @param {string} error - Error message
   */
  showError(error) {
    this.oddsDisplay.showError(error);
  }

  /**
   * Update widget position for fullscreen mode
   * @param {boolean} isFullscreen - Whether in fullscreen mode
   */
  updatePositionForFullscreen(isFullscreen) {
    this.isFullscreen = isFullscreen;

    if (!this.widgetElement) return;

    const style = this.widgetElement.style;
    style.top = isFullscreen ? '80px' : '20px';
    style.right = '20px';

    if (isFullscreen) {
      this.widgetElement.classList.add('pm-widget-fullscreen');
    } else {
      this.widgetElement.classList.remove('pm-widget-fullscreen');
    }
  }

  /**
   * Reposition widget (e.g., on window resize)
   */
  reposition() {
    if (!this.widgetElement) return;

    // Ensure widget stays within viewport
    const rect = this.widgetElement.getBoundingClientRect();
    const maxTop = window.innerHeight - 200;
    const maxRight = window.innerWidth - 150;

    if (rect.top > maxTop) {
      this.widgetElement.style.top = maxTop + 'px';
    }

    if (rect.left > maxRight) {
      this.widgetElement.style.right = '20px';
    }
  }

  /**
   * Destroy the widget
   */
  destroy() {
    if (this.widgetElement && this.widgetElement.parentElement) {
      this.widgetElement.parentElement.removeChild(this.widgetElement);
    }
  }
}

export default OddsWidget;
