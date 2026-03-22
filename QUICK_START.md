# Quick Start - Fixed Extension

## 🔧 What Was Fixed

**Critical Issue**: The extension was using ES6 modules in content scripts, which Chrome doesn't support.

**Solution**: Created a bundled version that inlines all code into a single file.

## 🚀 Installation (Reload Extension)

### Step 1: Reload in Chrome
1. Go to `chrome://extensions`
2. Find "Polymarket NCAA Odds for YouTube TV"
3. Click the **refresh icon** (circular arrow)

### Step 2: Check Console Output

1. Go to YouTube TV: https://tv.youtube.com
2. Open DevTools: **F12**
3. Click **Console** tab
4. You should see output like:

```
[ContentScript] Bundle loaded
[YouTubeTVOverlay] Initializing...
[YouTubeTVOverlay] Waiting for player to load...
[YouTubeTVOverlay] Player found
[OddsWidget] Mounted successfully
[ServiceWorker] ========================================
[ServiceWorker] BACKGROUND SERVICE WORKER STARTING
[ServiceWorker] ========================================
[ServiceWorker] State manager initialized
[ServiceWorker] Initializing Polymarket client...
[ServiceWorker] Polymarket client ready
[ServiceWorker] Fetching initial markets...
[PolymarketClient] Available sports: ncaab, epl, cbb, ...
[PolymarketClient] Initialized with NCAA sport code: cbb
[PolymarketClient] Total markets available: 3500
[PolymarketClient] Filtered to X potential college basketball markets
[PolymarketClient] Fetched and cached X NCAA markets
[ServiceWorker] Successfully fetched and cached X markets
[YouTubeTVOverlay] Requested markets from background...
[YouTubeTVOverlay] Received X markets
[YouTubeTVOverlay] Initialization complete
```

### Step 3: Check the Widget

1. Look for **📊 Odds** button in **top-right corner** of the video player
2. Click to expand the widget
3. You should see two tabs: **Odds** and **Games**
4. Click **Games** tab
5. You should see a list of available NCAA games with a search box

### Step 4: Test Selection

1. In the **Games** tab, search for "St" (for Saint Louis)
2. Click on any Saint Louis vs Michigan game
3. Widget should switch to **Odds** tab
4. Should show odds like "65.4%" and "34.6%"
5. Should update every 30 seconds

## 📋 Troubleshooting Console Output

### Good Signs (No Errors)
- See "[ContentScript] Bundle loaded"
- See "[YouTubeTVOverlay] Initialization complete"
- See "[PolymarketClient] Fetched and cached X NCAA markets"

### If You See Errors

**Error: "NCAA tag ID not found"**
- ✅ Fixed! Should not see this anymore

**Error: "Cannot find player"**
- YouTube TV may not be fully loaded
- Refresh the page (F5)
- Try again

**No console output at all**
- Extension may not have loaded
- Go to chrome://extensions and verify it's enabled
- Refresh the page

**Console shows but no markets (0 NCAA markets)**
- Saint Louis/Michigan game may have already resolved
- Go to https://polymarket.com/sports/cbb
- Search for "Saint Louis" or "Michigan"
- Check if active markets exist
- If they do exist, the widget will show them

### Console Output Guide

| Log | Meaning |
|-----|---------|
| `[ContentScript] Bundle loaded` | Content script started ✅ |
| `[YouTubeTVOverlay] Initializing...` | Extension initializing ✅ |
| `[YouTubeTVOverlay] Player found` | Detected YouTube TV player ✅ |
| `[OddsWidget] Mounted successfully` | Widget added to page ✅ |
| `[PolymarketClient] Fetched and cached X NCAA markets` | Found NCAA games ✅ |
| `[YouTubeTVOverlay] Initialization complete` | All systems ready ✅ |
| --- | --- |
| `[YouTubeTVOverlay] Received 0 markets` | No games available ⚠️ |
| Error in console | Something broke ❌ |

## 🎮 Full Workflow

1. **Reload extension** (chrome://extensions)
2. **Go to YouTube TV**
3. **Open Console** (F12 → Console)
4. **Wait for logs** to complete (should see "Initialization complete")
5. **Look for 📊 button** in top-right
6. **Click to expand** widget
7. **Click Games tab**
8. **Search for team name** (e.g., "louis", "michigan", "saint")
9. **Click a game** to select it
10. **View odds** in Odds tab
11. **See updates** every 30 seconds

## 📸 Expected Screenshots

### Before Expansion
- Small "📊 Odds" button in top-right corner

### After Expanding
- Tab bar: "Odds" | "Games"
- Games tab shows searchable list
- Each game shows: "Team A vs Team B", Date

### After Selecting Game
- Switches to Odds tab automatically
- Shows: Team A: 65.4%, Team B: 34.6%
- Green pulsing "Live" indicator
- "Updated 23 seconds ago"

## 🔍 Debugging Help

**Need to check service worker status?**
1. Go to chrome://extensions
2. Find the extension
3. Under "Service worker" - should see a green dot (running)
4. If red/stopped: The background script crashed (check console)

**Can't find the 📊 button?**
1. Scroll the player area
2. Try different YouTube TV videos
3. Try refreshing the page (F5)
4. Check console for errors

**Games showing but no odds updating?**
1. Make sure a game is selected
2. Wait 30+ seconds (polling interval)
3. Check that "Markets updated" appears in console
4. Games need active Polymarket markets

## ✅ Success Criteria

You'll know it's working when:

- [ ] Extension loads with no errors (check console)
- [ ] 📊 Odds button appears on video
- [ ] Widget expands/collapses on click
- [ ] Games tab shows NCAA games list
- [ ] Can search for games
- [ ] Can click to select a game
- [ ] Odds display with percentages
- [ ] "Updated X seconds ago" changes
- [ ] Console shows no red errors
- [ ] See "Initialization complete" in logs

---

**First Time?**
1. Reload extension
2. Go to YouTube TV
3. Open Console (F12)
4. Watch for logs
5. Look for the 📊 button
6. Try selecting a game

**Still not working?**
Copy the full console output and share it - that will help diagnose the exact issue!
