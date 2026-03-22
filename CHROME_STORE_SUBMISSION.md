# Chrome Web Store Submission Guide

This guide walks you through publishing the Polymarket NCAA Odds extension on the Chrome Web Store.

## Prerequisites

1. **Google Developer Account** - Required to publish Chrome extensions
   - Visit: https://developer.chrome.com/docs/webstore/register
   - One-time registration fee: $5 USD
   - You'll need a Google account and valid payment method

2. **Zip File** - Already prepared: `poly-on-tv-extension.zip`

3. **Marketing Assets** - See sections below for required dimensions and content

## Step 1: Register as a Chrome Web Store Developer

1. Go to https://chrome.google.com/webstore/devconsole
2. Sign in with your Google account
3. Accept the Developer Agreement
4. Pay the $5 registration fee
5. Complete your developer profile with:
   - Display name: Your name or company
   - Contact email
   - Website (optional, can be GitHub repo)

## Step 2: Create New Extension Item

1. Click **"New item"** in your Developer Dashboard
2. Upload `poly-on-tv-extension.zip` (already prepared)
3. Click **"Upload"** and wait for validation (usually instant)

## Step 3: Fill Store Listing

### Basic Information

**Item name:** (Already set from manifest.json)
- Polymarket NCAA Odds for YouTube TV

**Short description:** (Max 132 characters)
```
Live Polymarket NCAA basketball odds displayed on YouTube TV
```

**Detailed description:** (Max 16,000 characters)
```
Display live Polymarket NCAA college basketball game odds as a corner widget overlay on YouTube TV.

Features:
• Paste a Polymarket URL to instantly load live odds
• Beautiful overlay widget positioned in top-right corner
• Dark/light theme toggle
• Activity display toggle
• One-click close with no interference to YouTube TV playback
• Automatic market matching from URL abbreviations

How to Use:
1. Open YouTube TV in Chrome
2. Click the extension icon in your browser toolbar
3. Paste a Polymarket NCAA game URL (e.g., https://polymarket.com/sports/cbb/...)
4. The widget will load live odds and update every 30 seconds
5. Toggle theme/activity settings or close the widget as needed

Data:
• Uses Polymarket's public APIs (no authentication required)
• No user data collection or tracking
• No accounts or sign-ups needed

Perfect for watching NCAA basketball games and checking betting odds on Polymarket simultaneously!
```

**Category:** Select "Productivity" or "Sports"

**Language:** English

**Websites:**
- GitHub: https://github.com/mykcryptodev/poly-on-tv
- (Polymarket not required, your GitHub repo is fine)

## Step 4: Upload Promotional Graphics

### Required Images:

**1. Small Tile (440x280 PNG)**
- Small promotional tile for various placements
- Should show: Widget on YouTube TV with odds displaying
- Example: Screenshot of the widget with Polymarket odds visible

**2. Large Tile (920x680 PNG)**
- Primary promotional image
- High quality screenshot showing the widget in action
- Show the corner widget with theme/activity buttons visible
- Odds should be clearly readable

**3. Screenshot 1 (1280x800 PNG)**
- Full YouTube TV page with the odds widget visible in top-right
- Show the widget loaded with market data
- Activity and theme buttons should be visible

**4. Screenshot 2 (1280x800 PNG)**
- Close-up of the widget showing the URL input form
- Show the "Paste Polymarket URL" input field
- Show the "Load Odds" button

**5. Screenshot 3 (1280x800 PNG)**
- Widget displaying live odds with theme toggle
- Show both activity and theme buttons
- Show live odds percentages for both teams
- Timestamp showing recent update

### How to Create Screenshots:

**Option 1: Use Chrome DevTools (Free)**
1. Open YouTube TV in Chrome with the extension loaded
2. Open DevTools (F12)
3. Click the 3-dot menu > More tools > Screenshots
4. Select "Capture full page"
5. Crop/resize to required dimensions using your image editor

**Option 2: Use Online Tools (Free)**
- Canva (https://www.canva.com) - Free templates
- Figma (https://www.figma.com) - Free tier
- GIMP (free, open-source image editor)

**Option 3: Use Your System Screenshot Tool**
1. Take screenshots with built-in tool
2. Resize using Preview (macOS) or Paint (Windows)
3. Ensure images are PNG format and correct dimensions

**Icon Requirements:**
- Already provided in `icons/` folder
- 16x16, 48x48, 128x128 PNG files
- Used by Chrome Web Store automatically

## Step 5: Privacy & Permissions

### Privacy Policy
Chrome Web Store requires a privacy policy. Use this template:

```
PRIVACY POLICY
Polymarket NCAA Odds for YouTube TV

DATA COLLECTION
This extension does not collect, store, or transmit any user data.

API USAGE
The extension uses Polymarket's public APIs to fetch market and odds data.
These API calls may be logged by Polymarket per their privacy policy.

PERMISSIONS
- Storage: Used only to save your theme and activity preferences locally
- Alarms: Used for internal polling of odds updates

NO TRACKING
This extension contains no analytics, tracking pixels, or third-party services.
Your browsing and market views are never reported.

CHROME SYNC
Any settings saved are only stored locally on your device and not synced.

For questions, visit: https://github.com/mykcryptodev/poly-on-tv
```

### Permissions Declaration

In the store listing, explain why you need permissions:

**"storage"** - Required to save your theme preference (dark/light) and activity toggle state locally on your device

**"host_permissions" (gamma-api.polymarket.com, clob.polymarket.com)** - Required to fetch live NCAA market data and current odds from Polymarket's public APIs

## Step 6: Content Rating

Go through the content rating questionnaire:
- Category: Productivity
- Content rating: General Audiences
- No sensitive content flags needed

## Step 7: Review & Publish

1. Review all information carefully
2. Check that all fields are complete
3. Click **"Submit for review"**
4. Google will review (usually 1-3 hours, but can take up to 24 hours)

## Step 8: Monitor Status

Once submitted:
1. Check your Developer Dashboard daily
2. Look for emails from Google regarding:
   - Approval (extension goes live)
   - Rejection (needs fixes)
   - Questions (may need clarification)

Common rejection reasons and fixes:
- **Unclear permissions**: Add detailed privacy policy
- **Non-functional code**: Ensure extension works in latest Chrome
- **Low quality screenshots**: Use high-resolution, clear images
- **Incomplete description**: Ensure description is detailed

## Final Extension URL

Once approved, your extension will be available at:
```
https://chrome.google.com/webstore/detail/polymarket-ncaa-odds-for-/[EXTENSION_ID]
```

The `[EXTENSION_ID]` is auto-generated by Google upon first upload.

## Marketing After Launch

1. **GitHub**: Star and share the GitHub repo
   - https://github.com/mykcryptodev/poly-on-tv

2. **Social Media**: Share with sports betting/crypto communities

3. **Polymarket Community**: Post in Polymarket Discord/forums

4. **Sports Communities**: r/CollegeBasketball, r/MarketCap, etc.

## Support & Updates

After launch:
1. Monitor user reviews and feedback
2. Fix any reported bugs quickly
3. Update version number in `manifest.json` for new features
4. Submit updates through Developer Dashboard

## Checklist Before Submission

- [ ] Developer account created ($5 paid)
- [ ] Extension zip file prepared (`poly-on-tv-extension.zip`)
- [ ] Small Tile image (440x280 PNG)
- [ ] Large Tile image (920x680 PNG)
- [ ] 3x Screenshots (1280x800 PNG each)
- [ ] Privacy Policy written
- [ ] Detailed description completed
- [ ] Short description (under 132 chars)
- [ ] Category selected
- [ ] Language set to English
- [ ] All required fields filled
- [ ] Extension tested on latest Chrome version
- [ ] Ready to submit for review

## Questions?

If you encounter issues:
1. Check Chrome Web Store documentation: https://developer.chrome.com/docs/webstore/
2. Review common submission issues: https://developer.chrome.com/docs/webstore/troubleshooting/
3. Contact Chrome Web Store Support through your developer account

Good luck with your submission!
