# Specification

## Summary
**Goal:** Center the AudioSpectrumAnalyzer overlay and replace the centered FM logo overlay with a radio-tower symbol that has animated signal waves above the analyzer.

**Planned changes:**
- Reposition the AudioSpectrumAnalyzer overlay to be visually centered on common mobile viewports (remove downward offset) while keeping it non-interactive.
- Remove the centered FM logo overlay from the main display so it is no longer rendered or visible.
- Add a centered radio-tower symbol with continuously animated signal waves, positioned directly above the centered analyzer and aligned on the same center axis; ensure it does not intercept pointer events.
- Update `frontend/src/App.tsx` center-overlay layout to a single centered vertical stack (tower above analyzer) and remove obsolete center-overlay code paths/imports.

**User-visible outcome:** The spectrum analyzer appears centered on screen, with an animated radio-tower symbol and signal waves directly above it, and the previous centered FM logo no longer appears.
