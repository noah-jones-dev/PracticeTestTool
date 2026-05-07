# Practice Test

Cross-platform desktop app for managing at-home practice tests. Three-phase flow (answer → grade → review), tabbed sessions, real-time stats, springy motion.

Built from a [Claude Design](https://claude.ai/design) handoff bundle. Stack: Electron + Vite + React.

## Develop

```bash
npm install
npm run dev
```

Vite serves the renderer on `http://localhost:5173` and Electron loads it.

## Package

```bash
npm run build:mac    # produces a .dmg
npm run build:win    # produces an NSIS installer
```

## Layout

- `electron/main.cjs` — Electron main process (window creation, OS chrome)
- `src/App.jsx` — root, tab bar, new-test form, persistence
- `src/components/TestView.jsx` — three-phase test flow
- `src/components/AnimatedNumber.jsx` — springy counter + score ring
- `src/components/Icons.jsx` — inline SVG icon set
- `src/styles.css` — full stylesheet ported from the design

Tests are persisted to `localStorage` keyed by `practice-test:tests:v1`.
