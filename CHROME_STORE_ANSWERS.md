# Chrome Web Store Submission Answers

This document contains the exact answers to provide in the Chrome Web Store submission form.

## Technical Information Form

### 1. Alarms justification
**Leave blank** - Extension does not use Chrome alarms.

The field only appears if you declare alarms in manifest.json. Since we've removed the `alarms` permission, this field will not be required.

### 2. Host permission justification
**Leave blank** - Extension does not use host permissions.

The extension has no host_permissions declared. The official Polymarket embed iframe handles all API communication to Polymarket servers directly.

### 3. Are you using remote code?
**Select: "No, I am not using remote code"**

The extension does not use any remote code. It only loads the official Polymarket embed from embed.polymarket.com via an iframe, which is first-party Polymarket code and not considered "remote code" in the Chrome Web Store sense.

### 4. Data usage
**Check NONE of the boxes:**
- ☐ Personally identifiable information
- ☐ Health information
- ☐ Financial and payment information
- ☐ Authentication information
- ☐ Personal communications
- ☐ Location
- ☐ Web history
- ☐ User activity
- ☐ Website content

**Explanation:** The extension collects zero user data. It only stores the user's theme preference (dark/light) and activity toggle state in local storage. No data is transmitted or collected.

---

## Extension Details

**Name:** Polymarket Odds for YouTube TV

**Version:** 2.5.0

**Permissions Used:**
- `storage` - Only to save user preferences (theme, activity toggle) locally

**No background service worker, no API calls, no remote code - just a simple widget overlay with the official Polymarket embed!**

---

## Submission Checklist

- [x] Manifest simplified (removed unnecessary permissions)
- [x] No background service worker needed
- [x] No API polling (embed handles all live updates)
- [x] No remote code
- [x] No user data collection
- [x] All answers truthfully reflect actual extension behavior
