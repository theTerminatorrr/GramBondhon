---
name: vercel-react-best-practices
description: >-
  Vercel & React/TypeScript engineering best practices.
  Optimize frontend performance, eliminate unnecessary re-renders, structure clean state,
  and follow modern web standards.
---

# Vercel & React Best Practices

This skill guides the implementation of high-performance frontend components, state management, and asset delivery following modern production standards.

## When to Use
- Designing or modifying UI components, pages, and client-side data fetching.
- Auditing web performance (Core Web Vitals: LCP, CLS, FID/INP).
- Preventing state churn and excessive DOM re-renders.

## Core Rules

1. **Rendering & State Efficiency**:
   - Keep state as local as possible. Avoid lifting state up unnecessarily.
   - Use stable references (`useCallback`, `useMemo` where appropriate) and avoid inline function creation in hot render paths.
   - Batch DOM updates or leverage virtual DOM / reactive binding patterns.
2. **Asset & Bundle Optimization**:
   - Defer non-critical scripts (`defer`, `async`, dynamic `import()`).
   - Use modern image formats (`WebP`, `AVIF`) with explicit `width` and `height` to prevent Cumulative Layout Shift (CLS).
   - Lazy load heavy visual elements (interactive maps, 3D canvas graphs, charts) until they enter the viewport.
3. **Resilient Data Fetching**:
   - Handle loading, error, and empty states gracefully.
   - Implement exponential backoff or retry logic for critical telemetry endpoints.
