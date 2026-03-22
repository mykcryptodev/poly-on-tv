# Diagnostics & Troubleshooting

## Extension Verification Checklist

### ✅ Step 1: Verify Extension is Installed

```
1. Go to chrome://extensions
2. Look for "Polymarket NCAA Odds for YouTube TV"
3. Verify it says "Enabled" (toggle should be ON)
4. Note the extension ID (you'll see something like "abcdef123456...")
```

**If not there:**
- Click "Load unpacked"
- Navigate to: `/Users/mike/Developer/poly-on-tv`
- Click "Select Folder"

### ✅ Step 2: Verify Service Worker Running

```
1. Go to chrome://extensions
2. Find the extension
3. Click "Details"
4. Look for "Service worker" section
5. It should show status with a green dot
```

**Expected:** Green dot = running ✅
**Problem:** Red/grayed out = crashed ❌

To see service worker logs:
1. Click "Details" on extension
2. Find "Service worker"
3. Click the log link to see output

### ✅ Step 3: Check Content Script Loading

```
1. Go to https://tv.youtube.com/watch/wK7igiXfUc4
2. Open DevTools: F12
3. Go to Console tab
4. Look for: [ContentScript] Bundle loaded
```

**Expected:** Message appears ✅
**Problem:** No message = content script not loading ❌

### ✅ Step 4: Check Initialization Logs

```
In the Console, you should see (in order):

[ContentScript] Bundle loaded
[YouTubeTVOverlay] Initializing...
[YouTubeTVOverlay] Waiting for player to load...
[YouTubeTVOverlay] Player found
[OddsWidget] Mounted successfully
```

If you see these: Content script is working! ✅

### ✅ Step 5: Check Service Worker Initialization

The service worker logs appear separately. To see them:

```
1. Go to chrome://extensions
2. Find the extension
3. Click "Details"
4. Look for "Service worker" with a blue link
5. Click to view service worker logs
```

You should see:

```
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
```

### ✅ Step 6: Check Widget Appears

```
1. On YouTube TV, look for 📊 Odds button
2. Location: Top-right corner of the video player
3. Should be a small button with dark background
```

**If visible:** Widget loaded! ✅
**If not visible:**
- Scroll the player area
- Try different video
- Refresh page (F5)
- Check console for errors

### ✅ Step 7: Check Markets Request

Back in the YouTube TV console (F12 → Console):

```
You should see:
[YouTubeTVOverlay] Requesting markets from background...
[YouTubeTVOverlay] Received X markets
```

**Expected:** X > 0 (has some markets) ✅
**Problem:** Received 0 markets = no NCAA games available ⚠️

### ✅ Step 8: Test Widget Interaction

```
1. Click the 📊 Odds button
2. Widget should expand
3. Should show two tabs: "Odds" and "Games"
4. Console should show:
   [OddsWidget] Expanded
```

### ✅ Step 9: Check Games List

```
1. Click "Games" tab
2. Should show list of NCAA games
3. Each game shows: Team vs Team, Date
4. There's a search box at the top
```

**If games show:** Markets loaded! ✅
**If empty:** No NCAA games available on Polymarket ⚠️

## Common Issues & Fixes

### Issue: No Console Output

**Symptoms:** Open console, see nothing from the extension

**Causes:**
1. Content script didn't load
2. Extension not enabled
3. Not on correct URL

**Fixes:**
```
1. Verify extension enabled: chrome://extensions
2. Verify on YouTube TV: https://tv.youtube.com
3. Hard refresh page: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
4. Reload extension: F5 on chrome://extensions
5. Close and re-open DevTools: F12
```

### Issue: Can See Console but No Markets

**Symptoms:**
- Console shows "Initializing..."
- But says "Received 0 markets"

**Likely cause:** No NCAA games available on Polymarket

**Verification:**
```
1. Go to https://polymarket.com/sports/cbb
2. Search for "Saint Louis" or "Michigan"
3. Are there active markets?
4. Check if game is already resolved
```

**Note:** Games may not have markets if:
- Game already happened
- Game not yet listed on Polymarket
- During off-season
- Market closed after resolution

### Issue: Widget Not Appearing

**Symptoms:**
- Console says "Mounted successfully"
- But 📊 button not visible

**Causes:**
1. Button positioned off-screen
2. YouTube TV not fully loaded
3. CSS not loaded

**Fixes:**
```
1. Scroll the player area
2. Refresh page: F5
3. Try different YouTube TV video
4. Check DevTools → Elements tab
   Look for element: #polymarket-odds-widget
```

### Issue: Markets Not Updating

**Symptoms:**
- Games show in list
- Can select a game
- But odds show "Loading..." forever

**Causes:**
1. Market doesn't have CLOB data
2. API call failing
3. Token ID mismatch

**Check Service Worker Console:**
1. Go to chrome://extensions
2. Find extension
3. Click "Details"
4. Look for service worker logs
5. Search for "polling" or "Error"

### Issue: Service Worker Not Running

**Symptoms:**
- Go to chrome://extensions
- Extension shows red dot or no service worker

**Causes:**
1. Syntax error in service worker
2. Failed import
3. Unhandled exception

**Fixes:**
```
1. Go to chrome://extensions/errors
2. Look for errors from this extension
3. Check service worker logs
4. May need to reload extension
```

## Network Debugging

### Check API Calls

To verify the extension is calling Polymarket APIs:

```
1. Open DevTools: F12
2. Go to Network tab
3. Refresh page
4. Look for requests to:
   - gamma-api.polymarket.com/markets
   - clob.polymarket.com/midpoint
```

**Expected:**
- ✅ Requests appear with 200 status
- ✅ Responses have market data

**Problems:**
- ❌ No requests = API not being called
- ❌ 403/404 = API endpoint wrong
- ❌ 429 = Rate limited

## Logging All Output

To capture all logs for diagnosis:

### Console Logs
```
1. Open DevTools: F12
2. Go to Console tab
3. Right-click → Save As
4. Send me the saved file
```

### Service Worker Logs
```
1. Go to chrome://extensions
2. Find extension, click Details
3. Click service worker link
4. Right-click → Save As
5. Send me the saved file
```

### Extension Errors
```
1. Go to chrome://extensions/errors
2. Look for this extension's errors
3. Screenshot or copy all text
4. Send to me
```

## What to Include in Bug Report

If asking for help, include:

1. **Console output** (screenshot or text)
2. **Service worker logs** (screenshot or text)
3. **Error messages** (exact text)
4. **What you tried** (steps taken)
5. **Where you are** (YouTube TV URL)
6. **Chrome version** (Settings → About Chrome)

---

## Quick Self-Diagnostic

Run this checklist:

- [ ] Extension appears in chrome://extensions
- [ ] Extension is enabled (toggle ON)
- [ ] Service worker status is green
- [ ] Go to YouTube TV
- [ ] Console shows "[ContentScript] Bundle loaded"
- [ ] Console shows "[YouTubeTVOverlay] Initialization complete"
- [ ] Service worker shows "Fetched and cached X NCAA markets"
- [ ] 📊 Odds button visible on player
- [ ] Can expand/collapse widget
- [ ] Games tab shows NCAA games list
- [ ] No red errors in console

**If all checked:** ✅ Extension is working!
**If any failed:** Debug using sections above
