# Fix for NCAA Tag ID Initialization Error

## Problem
The extension was failing with error: `"NCAA tag ID not found in sports list"`

## Root Cause
The Polymarket Gamma API returns sports with a `sport` field (e.g., `"sport": "cbb"` for college basketball), not a `name` field. The original code was looking for a `name` field with "NCAA" in it, which doesn't exist.

## Solution
Updated `src/background/api/polymarket.js` with:

### 1. Fixed API Response Parsing
- Changed `fetchSports()` to handle both array responses and wrapped responses
- API returns the sports list directly as an array

### 2. Updated NCAA Detection
- Changed `findNCAATagId()` to look for `sport === "cbb"` or `sport === "ncaab"`
- These are the correct sport codes for college basketball in Polymarket's system

### 3. Improved Error Handling
- If NCAA sport code isn't found, default to `"cbb"` (college basketball)
- Still marked as initialized to allow fallback behavior
- More detailed console logging for debugging

### 4. Better Market Fetching
- Changed to fetch ALL markets and filter for college basketball games
- Filters by keywords: team names, game indicators (beat, vs, win, defeat)
- Comprehensive list of 100+ common college basketball team names for matching
- Added detailed console logging to show:
  - Total markets fetched
  - Number of potential basketball games found
  - Number of final NCAA markets after filtering

### 5. Improved Console Output
- Added logging to show available sports in the API
- Logs the number of markets at each filtering stage
- Clear warnings if no NCAA games are found
- Help message directing users to check if games are available

## Testing the Fix

1. **Reload the Extension**
   - Go to `chrome://extensions`
   - Find "Polymarket NCAA Odds for YouTube TV"
   - Click the refresh icon (or use DevTools)

2. **Check Console Output**
   - Open YouTube TV
   - Open DevTools (F12)
   - Go to Console tab
   - You should see logs like:
     ```
     [PolymarketClient] Available sports: ncaab, epl, lal, acn, ipl, wnba, ...
     [PolymarketClient] Initialized with NCAA sport code: cbb
     [PolymarketClient] Fetched 3500 potential college basketball markets
     [PolymarketClient] Fetched and cached 15 NCAA markets
     ```

3. **Check Widget**
   - Widget should appear in top-right corner
   - Expand it and click "Games" tab
   - Should show available NCAA games (if any exist on Polymarket)

## About the Saint Louis vs Michigan Game

The game you mentioned (`cbb-stlou-mich-2026-03-21`) is on **March 21, 2026**, which appears to be today's date. The game may:
- Already be resolved/closed on Polymarket
- Not yet have active markets available
- Be showing under a different market structure

To track a specific game:
1. Go to https://polymarket.com and search for the game
2. Check if markets are available and active
3. The widget will show any available NCAA game markets

## Market Availability Note

Polymarket markets for NCAA games may not always be available, especially:
- Games that have already happened
- Certain tournament games
- Off-season periods
- Newly scheduled games that aren't listed yet

If no NCAA games show in the widget:
1. Check https://polymarket.com/sports/cbb directly
2. See if active markets exist for current games
3. Wait for games to be added to Polymarket if they're upcoming

## Files Modified

- `src/background/api/polymarket.js` - Fixed API integration and market fetching
- `src/content/content-script.js` - Improved initialization logging

## Console Debugging

If you still see errors, check the DevTools console for:
1. Which sports are available
2. How many total markets were fetched
3. How many were filtered to basketball games
4. How many final NCAA game markets were found

This will help diagnose if the issue is:
- API connectivity (can't fetch markets)
- Market filtering (markets fetched but not matching filters)
- No available markets on Polymarket

---

**To deploy the fix:**
1. Reload the extension
2. Refresh YouTube TV page
3. Check console for detailed diagnostic output
