# Testing Guide - Polymarket NCAA Odds for YouTube TV

## Installation & Setup

### Step 1: Load Extension in Chrome

1. Open Chrome
2. Navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right)
4. Click **Load unpacked**
5. Select `/Users/mike/Developer/poly-on-tv`
6. You should see "Polymarket NCAA Odds for YouTube TV" in your extensions list

### Step 2: Verify Installation

- Check that the extension appears in your extensions list
- Click the extension icon in the toolbar to verify it's active
- Check the service worker status:
  - Go to `chrome://extensions`
  - Find the extension and click **Details**
  - Look for "Service worker" status

## Basic Functionality Tests

### Test 1: Navigate to YouTube TV

**Expected Result**: Extension should be ready

1. Open [YouTube TV](https://tv.youtube.com)
2. Watch for the extension to load (may take a few seconds)
3. Check browser console (F12 → Console) for any errors
4. You should see logs like:
   ```
   [ContentScript] Loaded
   [ServiceWorker] Background script loaded
   ```

### Test 2: Widget Appears on Page

**Expected Result**: "📊 Odds" button visible in top-right corner

1. Look for a small widget in the **top-right corner** of the YouTube TV player
2. The widget should be dark with "📊 Odds" text
3. If not visible:
   - Scroll to ensure it's not hidden
   - Check that YouTube TV is fully loaded
   - Check console for errors

### Test 3: Expand the Widget

**Expected Result**: Widget expands to show full interface

1. Click the "📊 Odds" button
2. Widget should expand to show:
   - **Odds** and **Games** tabs
   - Empty odds view (no game selected yet)
3. Click again to collapse

### Test 4: View Available Games

**Expected Result**: List of NCAA games displays

1. With widget expanded, click the **Games** tab
2. You should see:
   - A search input field
   - A list of available NCAA games
   - Game count at bottom
3. Each game should show:
   - Team names (e.g., "Duke vs UNC")
   - Date/time of game
   - Clickable item

### Test 5: Search Games

**Expected Result**: Games filter by team name

1. With Games tab open, type a team name in the search box
2. List should filter to show matching games
3. Try searching for:
   - "Duke" - should show Duke games
   - "Carolina" - should show UNC games
   - "xyz" - should show "No games match your search"

### Test 6: Select a Game

**Expected Result**: Widget switches to odds and loads data

1. In Games tab, click on any game
2. Widget should:
   - Switch to **Odds** tab automatically
   - Show "Loading odds..." briefly
   - Display team names and odds percentages
3. Odds should display as:
   - Team A name: XX.X%
   - Team B name: XX.X%
   - Live indicator (green pulsing dot)
   - "Updated X seconds ago"

### Test 7: Live Updates

**Expected Result**: Odds refresh every ~30 seconds

1. Select a game and view odds
2. Note the "Updated X seconds ago" timestamp
3. Wait 30+ seconds
4. Timestamp should update
5. Odds values may change slightly

### Test 8: Trend Indicators

**Expected Result**: Trend icons show when odds move significantly

1. Select a game with changing odds
2. Watch for trend icons next to odds:
   - 📈 = odds rising
   - 📉 = odds falling
   - ➡️ = stable
3. As odds update, icons may change

## Advanced Tests

### Test 9: Fullscreen Mode

**Expected Result**: Widget repositions to avoid controls

1. Start playing a YouTube TV video
2. Click fullscreen button
3. Widget should move to top: **80px** instead of **20px**
4. Widget should remain visible and functional
5. Exit fullscreen and widget returns to normal position

### Test 10: Multiple Games

**Expected Result**: Can switch between games

1. Select Game A
2. Note the odds
3. Switch to Games tab
4. Select Game B
5. Return to Odds tab
6. Should now show Game B's odds
7. Repeat for Game C

### Test 11: Game Search Persistence

**Expected Result**: Search survives widget collapse/expand

1. Search for "Duke" in Games tab
2. See filtered results
3. Collapse widget
4. Expand widget
5. Search should be cleared (fresh state)

### Test 12: Error Handling

**Expected Result**: Graceful error handling

#### Test 12a: No Games Available

1. If no NCAA games are showing:
   - Widget should show "No NCAA games available right now"
   - Not crash or show broken state

#### Test 12b: Network Disconnect

1. While odds are updating, disconnect network (Dev Tools → offline)
2. Should see "Connection lost" message
3. Show cached odds if available
4. Reconnect and verify recovery

#### Test 12c: API Error

1. Open browser Dev Tools (F12 → Network)
2. Block Polymarket APIs (right-click → Block domain)
3. Should show error message gracefully
4. Not crash entire extension

## Performance Tests

### Test 13: Memory Usage

**Expected Result**: No memory leaks

1. Open YouTube TV with extension
2. Keep page open for 30+ minutes
3. Open Dev Tools → Memory → Take heap snapshot
4. Memory usage should be stable (not constantly growing)

### Test 14: CPU Usage

**Expected Result**: Minimal CPU impact

1. Watch Task Manager while extension runs
2. Chrome process should not spike
3. Polling every 30 seconds is normal
4. No continuous high CPU usage

### Test 15: DOM Updates

**Expected Result**: Smooth animations

1. Update odds (either wait for refresh or select new game)
2. Odds should update smoothly without flickering
3. No visible lag or jank

## UI/UX Tests

### Test 16: Widget Positioning

**Expected Result**: Widget positioned correctly on all screen sizes

1. Test on different resolutions:
   - 1920x1080 (Full HD)
   - 2560x1440 (2K)
   - 3840x2160 (4K)
   - 1366x768 (Laptop)
2. Widget should:
   - Stay in top-right corner
   - Not cover critical YouTube controls
   - Remain fully visible and readable

### Test 17: Dark Theme

**Expected Result**: Widget matches YouTube TV styling

1. Check color scheme:
   - Background: Dark gray/black
   - Text: White
   - Accents: Cyan blue (#00d4ff)
2. Should be readable over any video content

### Test 18: Responsive Design

**Expected Result**: Works on different window sizes

1. Resize browser window to different widths
2. Widget should:
   - Scale appropriately
   - Not overflow
   - Remain usable

### Test 19: Scrolling

**Expected Result**: Long game list is scrollable

1. Search for a term that returns many games
2. Games list should have scrollbar
3. Should be able to scroll through all games

## Browser Compatibility

### Test 20: Chrome Versions

**Expected Result**: Works on recent Chrome versions

Test on Chrome versions:
- Latest stable
- Latest beta (if available)
- Chrome 120+ (Manifest V3 requirement)

Check for any warnings in extension page

## Console Output

### Test 21: Check Logs

**Expected Result**: Useful debug info, no errors

1. Open console (F12 → Console)
2. Should see startup logs:
   ```
   [ContentScript] Loaded
   [ServiceWorker] Background script loaded
   [ServiceWorker] Initialized with NCAA tag ID: xyz...
   [PolymarketClient] Initialized
   ```
3. When selecting games:
   ```
   [YouTubeTVOverlay] Game selected: xyz...
   [ServiceWorker] Fetched and cached X markets
   [ServiceWorker] Odds updated for game: xyz...
   ```
4. No red error messages
5. Warnings are acceptable (usually from third-party code)

## Checklist Summary

- [ ] Extension loads in Chrome
- [ ] Widget appears on YouTube TV
- [ ] Widget expands/collapses
- [ ] Games list displays
- [ ] Game search works
- [ ] Game selection works
- [ ] Odds display correctly
- [ ] Odds update every ~30 seconds
- [ ] Trend indicators show
- [ ] Fullscreen mode works
- [ ] Multiple games can be tracked
- [ ] Error handling works
- [ ] Memory stable over time
- [ ] CPU usage normal
- [ ] UI smooth and responsive
- [ ] Works on different screen sizes
- [ ] Dark theme consistent
- [ ] Console logs are informative
- [ ] No critical errors

## Troubleshooting During Testing

### Widget Not Appearing

1. Check console for errors
2. Reload page (F5)
3. Verify extension is enabled (`chrome://extensions`)
4. Check if YouTube TV is fully loaded

### Games Not Loading

1. Check network tab in DevTools
2. Look for requests to `gamma-api.polymarket.com`
3. If 403/404: API may be rate-limited or down
4. Wait 30 seconds and try again

### Odds Not Updating

1. Verify a game is selected (check Odds tab)
2. Wait 30 seconds (minimum polling interval)
3. Check service worker status
4. Look for requests to `clob.polymarket.com`

### Performance Issues

1. Close other tabs
2. Disable other extensions
3. Check Task Manager for other high-CPU processes
4. Try in Incognito mode

## Reporting Issues

When reporting issues, include:

1. Screenshot of the problem
2. Console output (copy from F12 → Console)
3. Chrome version (chrome://settings/help)
4. Screen resolution
5. Steps to reproduce
6. Expected vs actual behavior

---

**Last Updated**: March 2026
**Version**: 1.0.0
