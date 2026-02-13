# Specification

## Summary
**Goal:** Let guests access the User Dashboard and persist station bookmarks locally, while finalizing the AudioSpectrumAnalyzer to a 10-bar, edge-to-edge mirrored layout with correct resize behavior.

**Planned changes:**
- Update the AudioSpectrumAnalyzer to render a maximum of 10 total bars (5 mirrored on each side), reduce bar width, and compute spacing dynamically so bars fill the full canvas width edge-to-edge while keeping the center-out mirrored grayscale style.
- Fix AudioSpectrumAnalyzer canvas sizing and resize logic to prevent cumulative scaling issues across resizes and keep animation smooth.
- Allow unauthenticated (guest) users to open and use the User Dashboard overlay with limited, local-only/read-only behavior (no authenticated backend calls).
- Ensure guest station bookmarking works without login, persists locally across sessions using the existing device-level storage approach, and is reflected correctly in the dashboard.

**User-visible outcome:** Users can open the dashboard and manage/view bookmarks even when not logged in (with bookmarks persisting after reload), and the spectrum analyzer displays up to 10 grayscale mirrored bars that span the screen edge-to-edge and remain correctly scaled on resize.
