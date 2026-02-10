# Specification

## Summary
**Goal:** Make the audio spectrum analyzer react to the currently playing radio stream and restore the centered FM radio symbol overlay.

**Planned changes:**
- Fix `AudioSpectrumAnalyzer` so it connects to the app’s active audio output and animates frequency bars during playback, while showing a clear idle state when not playing.
- Ensure Web Audio initialization works reliably with the app’s audio element and respects autoplay/user-gesture requirements without producing console-error spam.
- Restore the centered FM/radio symbol overlay in the main display and ensure it remains visible, non-interactive (doesn’t block clicks), and consistent across light/dark themes.
- Update `frontend/src/App.tsx` center-overlay logic to match the restored FM symbol + analyzer behavior, removing broken/unused overlay code and keeping existing UI/3D scene intact.

**User-visible outcome:** When a station plays, the spectrum bars animate in sync with the audio; when not playing, the analyzer displays an idle state. The FM radio symbol is visible again in the center overlay without interfering with interactions.
