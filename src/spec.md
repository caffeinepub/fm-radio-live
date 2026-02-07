# Specification

## Summary
**Goal:** Add additional Christian radio stations (Hindi/English) from the Radio Browser “christian” tag feed to the existing global station list without impacting existing stations or UI behavior.

**Planned changes:**
- Fetch stations from the Radio Browser `bytag/christian` endpoint using the same multi-server failover strategy as the current global station fetch.
- Filter fetched Christian-tag stations to languages containing “hindi” or “english” (case-insensitive).
- Validate and normalize stations before merging (use `url_resolved` when available, otherwise `url`; ensure required fields like coordinates do not break globe/pins usage).
- Merge the additional stations into the existing station dataset without removing or altering previously available stations.
- Cache the merged station list using the app’s existing caching layers so the added stations persist across reloads and after refresh.

**User-visible outcome:** The app continues to work as before (search, bookmarks, playback, refresh), but now includes additional Christian-tag Hindi/English stations alongside all previously available stations.
