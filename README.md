# Polymarket NCAA Odds for YouTube TV

A Chrome extension that displays live Polymarket NCAA game odds as a corner widget overlay on YouTube TV.

## Features

- **Live Odds Display**: Watch real-time Polymarket odds for NCAA games
- **Game Selection**: Search and select from available NCAA games
- **Collapsible Widget**: Non-intrusive corner widget that expands on demand
- **Auto-Refresh**: Odds update every 30 seconds automatically
- **Trend Indicators**: See if odds are rising 📈, falling 📉, or stable ➡️
- **Dark Theme**: Designed to blend seamlessly with YouTube TV's interface

## Installation

### From Source (Development Mode)

1. Clone or extract the extension files to `/Users/mike/Developer/poly-on-tv`

2. Open Chrome and go to `chrome://extensions/`

3. Enable **Developer mode** (toggle in top-right corner)

4. Click **Load unpacked**

5. Select the `/Users/mike/Developer/poly-on-tv` folder

6. The extension will appear in your extensions list and toolbar

### First Time Setup

1. Navigate to [YouTube TV](https://tv.youtube.com)
2. Look for the **📊 Odds** button in the top-right corner of the player
3. Click to expand the widget
4. Click the **Games** tab to see available NCAA games
5. Search for a game (by team name) and click to select it
6. The widget will switch to the **Odds** tab and start showing live odds

## Usage

### Viewing Odds

1. **Expand the Widget**: Click the "📊 Odds" button in the top-right corner
2. **Select a Game**: Click the "Games" tab, search for teams, and select a game
3. **Watch Live Odds**: The odds will update automatically every 30 seconds
4. **Collapse**: Click the "📊 Odds" button again to minimize the widget

### Understanding the Odds

- **Team Name**: The college basketball team
- **Percentage**: The implied probability that team will win (e.g., 65.4%)
- **Trend Indicator**: Shows if odds are moving up or down since last update
- **Live Indicator**: Green pulsing dot shows data is actively updating
- **Last Updated**: How long ago the odds were last refreshed

### Keyboard Shortcuts

- **Tab**: Navigate through elements
- **Enter**: Select focused game or button
- **Escape**: Close search/reset (future version)

## How It Works

### Architecture

```
YouTube TV
    ↓
Content Script
    ↓ (messages)
Background Service Worker
    ↓
Polymarket API
```

### Component Breakdown

1. **Content Script** (`src/content/`)
   - Detects YouTube TV page
   - Injects the widget UI
   - Handles user interactions
   - Receives odds updates from background

2. **Background Service Worker** (`src/background/`)
   - Manages Polymarket API calls
   - Caches market and odds data
   - Polls for live odds updates
   - Broadcasts updates to content script

3. **Polymarket Integration**
   - **Gamma API**: Discovers available NCAA markets
   - **CLOB API**: Fetches live odds prices

## Configuration

### Polling Interval

Odds refresh every 30 seconds (Manifest V3 minimum). To adjust:

Edit `src/shared/constants.js`:

```javascript
export const POLLING_CONFIG = {
  ODDS_INTERVAL: 30 * 1000, // milliseconds
  ALARMS_INTERVAL: 0.5, // minutes
};
```

### Market Filtering

To adjust which games are shown, edit `src/shared/constants.js`:

```javascript
export const MARKET_FILTERS = {
  NCAA_KEYWORDS: ['NCAA', 'College Basketball'],
  WINNER_KEYWORDS: ['winner', 'win', 'beats'],
};
```

## Troubleshooting

### Widget Not Appearing

- Ensure you're on YouTube TV (tv.youtube.com)
- Check browser console (F12 → Console) for errors
- Reload the page (F5)
- Disable and re-enable the extension

### No Games Showing

- Wait a few seconds for initial market load
- Refresh the page
- Check network tab to see if Polymarket APIs are responding
- NCAA games may not be available at certain times

### Odds Not Updating

- Check that a game is selected (should show team odds)
- Wait 30+ seconds for next update
- Ensure background service worker is active (check extension page)
- Check browser console for API errors

### Performance Issues

- Close other heavy browser tabs
- Disable other extensions temporarily
- Clear browser cache

## Development

### Project Structure

```
poly-on-tv/
├── manifest.json              # Extension configuration
├── src/
│   ├── background/
│   │   ├── service-worker.js  # Main background logic
│   │   ├── api/
│   │   │   ├── polymarket.js  # Polymarket API client
│   │   │   └── cache.js       # Caching layer
│   │   └── state.js           # State management
│   ├── content/
│   │   ├── content-script.js  # Content script entry
│   │   ├── youtube-tv-adapter.js
│   │   └── ui/
│   │       ├── widget.js      # Main widget component
│   │       ├── dropdown.js    # Game selector
│   │       └── odds-display.js
│   ├── shared/
│   │   ├── constants.js       # Config values
│   │   ├── utils.js           # Utilities
│   │   └── messaging.js       # Chrome messaging
│   └── styles/
│       ├── widget.css         # Widget styling
│       └── dropdown.css       # Dropdown styling
├── icons/                      # Extension icons
└── README.md
```

### Making Changes

1. Edit files in `src/` or `manifest.json`
2. Go to `chrome://extensions`
3. Click the refresh icon on the Polymarket extension card
4. Reload YouTube TV to test

### Building for Distribution

1. Ensure all code is production-ready
2. Test thoroughly on different screen sizes
3. Create promotional images (1280x800)
4. Submit to Chrome Web Store

## API Reference

### Polymarket Gamma API

**Get Sports/Tags**
```
GET https://gamma-api.polymarket.com/sports
```

**Get Markets**
```
GET https://gamma-api.polymarket.com/markets?tag_id={TAG_ID}&closed=false
```

### Polymarket CLOB API

**Get Midpoint (Current Price)**
```
GET https://clob.polymarket.com/midpoint?token_id={TOKEN_ID}
Response: { "mid": "0.6543" }
```

## Privacy & Security

- **No Data Collection**: Extension doesn't track or store user data
- **No Analytics**: No telemetry or usage tracking
- **Read-Only**: Only reads public Polymarket data
- **No Authentication**: No login required
- **No Permissions**: Only requests necessary permissions (storage, alarms)

## Limitations

- Works only on YouTube TV
- NCAA markets must exist on Polymarket
- Polling limited to 30 seconds (Chrome Manifest V3 minimum)
- Markets may be unavailable during off-season
- Odds update frequency depends on Polymarket's API

## Future Enhancements

- [ ] Multi-game tracking
- [ ] Historical odds charts
- [ ] Prop bet markets (not just game winners)
- [ ] Price alerts/notifications
- [ ] Dark mode theme toggle
- [ ] Customizable widget position (drag-and-drop)
- [ ] WebSocket integration for real-time updates
- [ ] Additional market types (spreads, totals)
- [ ] Mobile YouTube TV support
- [ ] Export odds to spreadsheet

## Support & Issues

If you encounter issues:

1. Check the troubleshooting section above
2. Open browser console (F12 → Console) for error messages
3. Test on a fresh YouTube TV page
4. Disable other extensions temporarily
5. Clear browser cache

## Credits

- [Polymarket](https://polymarket.com/) for API access
- Inspired by live betting overlays
- Built with vanilla JavaScript (no frameworks)

## License

This extension is provided as-is. Use at your own discretion.

## Disclaimer

This extension is for informational purposes only. It displays publicly available Polymarket data. Always do your own research before making any trades or bets. The developers are not responsible for any financial decisions based on displayed odds.

---

**Created**: March 2026
**Version**: 1.0.0
**Status**: Beta
