---
name: iris
description: >-
  Visual UI verification skill. Whenever modifying frontend components, CSS, or pages,
  capture screenshots from http://localhost:5173 to verify responsiveness, layout, styling,
  and visual fidelity across desktop and mobile viewports.
---

# Iris: Visual UI Verification & Fidelity Assurance

This skill guides visual inspection and layout verification of the frontend application.

## When to Use
- Whenever modifying frontend HTML, CSS, or TypeScript components.
- Inspecting page responsiveness across desktop, tablet, and mobile viewports.
- Verifying animations, navbar behavior, cards, and modal components.

## Target Dev Server
- **Frontend URL**: `http://localhost:5173` (Vite Development Server)
- **Surveillance & API Hub**: `http://localhost:3001` (Dev Server)

## Procedure

1. **Verify Server Status**:
   - Ensure the Vite dev server is running on port 5173.
   - If not running, start it: `npm run dev` or `npx vite --port 5173`.
2. **Launch Visual Capture**:
   - Use `browser_subagent` to open `http://localhost:5173/<target-page>.html`.
   - Capture full-page or component screenshots.
3. **Verify Layout Fidelity**:
   - Contrast check: Text must be readable against backgrounds.
   - Spacing & alignment: No awkward horizontal overflow or overlapping text.
   - Mobile responsiveness: Check viewport resizing down to 375px width.
   - Interactive components: Test dropdowns, buttons, modal triggers, and hover states.
