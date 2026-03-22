# Polymarket Odds for YouTube TV

A lightweight Chrome extension that displays live Polymarket odds as a corner widget overlay on YouTube TV.

Simply paste any Polymarket URL and watch live odds update in real-time while you stream.

## Features

- **📊 Live Odds Display**: Display any Polymarket market directly on YouTube TV
- **🎯 URL-Based**: Paste a Polymarket URL to instantly load odds
- **🌓 Theme Toggle**: Switch between dark and light modes
- **👁️ Activity Toggle**: Show or hide activity data
- **⚡ Real-Time Updates**: Official Polymarket embed handles live updates
- **📱 Non-Intrusive**: Compact corner widget that doesn't interfere with video playback
- **✨ Clean Design**: Minimalist neon chart icon

## Demo

Watch the extension in action:

**[Demo Video](polyontv.mp4)** - See how to use the extension to view Polymarket odds while watching YouTube TV

## Installation

### From Chrome Web Store (Coming Soon)
Once approved, install directly from the Chrome Web Store for automatic updates.

### Manual Installation (Developer Mode)

1. Clone this repository:
   ```bash
   git clone https://github.com/mykcryptodev/poly-on-tv.git
   cd poly-on-tv
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable **Developer mode** (toggle in top-right corner)

4. Click **Load unpacked**

5. Select the `poly-on-tv` folder

6. The extension will appear in your extensions list

## Quick Start

1. Navigate to [YouTube TV](https://tv.youtube.com)

2. Look for the **Polymarket** icon in the top-right corner of the page

3. Click the widget to expand it

4. Paste a Polymarket URL (e.g., `https://polymarket.com/market/will-the-lakers-beat-the-celtics-on-march-22`)

5. Click **Load Odds** to display the market

6. Use the control buttons:
   - **⊞** (Activity) - Toggle activity display on/off
   - **☀️** (Theme) - Switch between dark and light modes
   - **✕** (Close) - Remove the widget

## How It Works

The extension is simple and lightweight:

```
User clicks widget
        ↓
Pastes Polymarket URL
        ↓
Extension extracts market slug
        ↓
Displays official Polymarket embed
        ↓
Embed handles live odds updates
```

### Architecture

- **Content Script** (`src/content/content-script-simple.js`): Injects the widget into YouTube TV
- **Widget UI** (`src/content/iframe-widget.html`): Widget interface
- **Widget Logic** (`src/content/iframe-widget.js`): Handles URL input, theme/activity toggles, and widget close
- **Official Embed**: Polymarket's native iframe displays live market data

No background service worker, no API calls, no data collection - just a clean widget wrapper around Polymarket's official embed.

## Project Structure

```
poly-on-tv/
├── manifest.json                    # Extension configuration (Manifest V3)
├── src/
│   └── content/
│       ├── content-script-simple.js # Injects widget into YouTube TV
│       ├── iframe-widget.html       # Widget UI and styles
│       └── iframe-widget.js         # Widget logic and controls
├── icons/
│   ├── icon16.png                   # 16x16 neon chart icon
│   ├── icon48.png                   # 48x48 neon chart icon
│   └── icon128.png                  # 128x128 neon chart icon
├── marketing_images/                # Chrome Web Store screenshots
├── README.md                        # This file
├── CHROME_STORE_SUBMISSION.md       # Chrome Web Store submission guide
└── CHROME_STORE_ANSWERS.md          # Form answers for submission
```

## Usage

### Displaying a Market

1. Find a Polymarket URL you want to display
   - Example: `https://polymarket.com/sports/cbb/duke-vs-unc-2026-03-22`

2. Click the Polymarket widget in YouTube TV's top-right corner

3. Paste the URL into the input field

4. Click **Load Odds**

5. The official Polymarket embed will display with live odds

### Theme Toggle

Click the **☀️** button to switch between dark and light themes. The theme preference is saved locally.

### Activity Toggle

Click the **⊞** button to show or hide activity data in the market display.

### Closing the Widget

Click the **✕** button to remove the widget completely. You can re-open it anytime by clicking the extension icon.

## Permissions

The extension uses minimal permissions:

- **`storage`**: Saves your theme and activity preferences locally (no data sent anywhere)

That's it. No background service worker, no API access, no user tracking, no data collection.

## Privacy

- ✅ **Zero Data Collection**: Extension doesn't collect or track any user data
- ✅ **No Analytics**: No telemetry, no usage tracking
- ✅ **Local Storage Only**: Theme and activity preferences stored locally in your browser
- ✅ **Read-Only**: Only displays publicly available Polymarket data
- ✅ **No Authentication**: No login required
- ✅ **Open Source**: Code is transparent and auditable

## Limitations

- Works only on YouTube TV (`tv.youtube.com`)
- Markets must exist on Polymarket
- Odds update frequency depends on Polymarket's official embed
- Widget position is fixed to top-right corner

## Troubleshooting

### Widget Not Showing

- Ensure you're on YouTube TV (tv.youtube.com)
- Reload the page (F5)
- Check that the extension is enabled in `chrome://extensions/`
- Disable other extensions to check for conflicts

### Invalid URL Error

- Make sure you're using a valid Polymarket URL
- Example format: `https://polymarket.com/sports/...`
- Check the URL contains the market slug

### Theme/Activity Toggle Not Working

- Reload the page and try again
- Clear your browser cache

## Contributing

Found a bug? Want to improve the extension?

1. Open an issue on GitHub
2. Create a pull request with your changes
3. Ensure your code follows the existing style

## Development

### Making Changes

1. Edit files in `src/content/`
2. Go to `chrome://extensions`
3. Click the **reload** icon on the Polymarket extension
4. Refresh YouTube TV to test

### Building for Distribution

The extension zip is automatically created at `poly-on-tv-extension.zip` for Chrome Web Store submission.

## Chrome Web Store

Submission documents:
- **[CHROME_STORE_SUBMISSION.md](CHROME_STORE_SUBMISSION.md)** - Complete submission guide
- **[CHROME_STORE_ANSWERS.md](CHROME_STORE_ANSWERS.md)** - Answers to submission form questions
- **poly-on-tv-extension.zip** - Ready-to-upload extension package

## Credits

- [Polymarket](https://polymarket.com/) for providing the official embed and APIs
- Built with vanilla JavaScript (no frameworks or heavy dependencies)
- Designed for minimal footprint and maximum simplicity

## License

This extension is provided as-is. Feel free to use, modify, and distribute.

## Disclaimer

This extension displays publicly available Polymarket data. It is for informational purposes only. Always do your own research before making any financial decisions or trades. The developers are not responsible for any outcomes based on displayed odds or data.

---

**Version**: 2.5.0
**Status**: Production
**Last Updated**: March 2026
**License**: Open Source
