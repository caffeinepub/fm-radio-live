# Specification

## Summary
**Goal:** Add a Quick Play feature that auto-starts a radio station on load, and redesign the entire app UI with a light, airy pastel aesthetic replacing the current dark space theme.

**Planned changes:**
- On app load, automatically begin playing the first available or last-played radio station with a visual indicator showing the auto-playing station
- Replace the dark space/starfield theme (SpaceScene, BlinkingStars) with a soft white/pale pastel background across all components (Header, TopToolbar, AudioPlayer, RadioPlaybackDisplay, SearchOverlay, UserDashboard, Footer, LoadingScreen)
- Apply clean minimal typography, gentle spacing, and soft-shadow rounded cards throughout
- Update `tailwind.config.js` to define a light theme color palette (background, surface, text, accent, border)
- Update `index.css` to set light background and text defaults, removing hardcoded dark color classes

**User-visible outcome:** The app opens with music already playing and displays a fully light, cheerful UI with soft pastels and clean cards instead of the previous dark space theme.
