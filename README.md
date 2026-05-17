# Practice Test

Cross-platform desktop app for managing at-home practice tests. Three-phase flow (answer → grade → review), tabbed sessions, real-time stats, springy motion.

Built from a [Claude Design](https://claude.ai/design) handoff bundle. Stack: Electron + Vite + React.

## Install on your machine

You need [Node.js 18+](https://nodejs.org) and `git`. Then:

```bash
git clone https://github.com/NoahsJones/PracticeTestTool.git
cd PracticeTestTool
npm install
```

That's a one-time setup. After it finishes you can either run from source (below) or build a real desktop app (below).

### Run from source

```bash
npm run dev
```

Vite serves the renderer on `http://localhost:5173` and Electron opens a native window. Closing the window quits the app — no system tray.

### Build a desktop app you can pin

#### Windows 11

```bash
npm run build:win
```

Produces three artifacts in `dist/`:

- `Practice Test Setup 1.0.0.exe` — NSIS installer (creates desktop + Start menu shortcuts)
- `Practice Test 1.0.0.exe` — single-file portable
- `dist/win-unpacked/Practice Test.exe` — raw app folder

> **Icon embedding note (Windows):** electron-builder's icon-embedding step is disabled in `package.json` (`signAndEditExecutable: false`) because it depends on a winCodeSign cache that fails to extract on Windows without admin/Developer Mode (it tries to create macOS dylib symlinks). After building, embed the icon manually with `rcedit`:
>
> ```powershell
> $rcedit = "$env:LOCALAPPDATA\electron-builder\Cache\winCodeSign\120210931\rcedit-x64.exe"
> $ico    = "build\icon.ico"
> & $rcedit "dist\win-unpacked\Practice Test.exe"        --set-icon $ico
> & $rcedit "dist\Practice Test 1.0.0.exe"               --set-icon $ico
> & $rcedit "dist\Practice Test Setup 1.0.0.exe"         --set-icon $ico
> ```
>
> The exact `winCodeSign` folder name (`120210931` above) varies — pick whichever subfolder under `winCodeSign/` contains `rcedit-x64.exe`.

To "install" the app without using the NSIS installer (often simpler):

```powershell
# Copy the unpacked app to your user Programs folder
Copy-Item -Recurse "dist\win-unpacked" "$env:LOCALAPPDATA\Programs\Practice Test"

# Create a desktop shortcut
$shell = New-Object -ComObject WScript.Shell
$sc = $shell.CreateShortcut("$([Environment]::GetFolderPath('Desktop'))\Practice Test.lnk")
$sc.TargetPath       = "$env:LOCALAPPDATA\Programs\Practice Test\Practice Test.exe"
$sc.WorkingDirectory = "$env:LOCALAPPDATA\Programs\Practice Test"
$sc.IconLocation     = "$env:LOCALAPPDATA\Programs\Practice Test\Practice Test.exe,0"
$sc.Save()
```

To pin to taskbar reliably: Start → search "Practice Test" → right-click → "Pin to taskbar". Pinning the running window directly is fragile on portable Electron exes.

The exe is unsigned, so first launch shows a SmartScreen warning ("Windows protected your PC"). Click **More info → Run anyway** — you only need to do this once per build.

#### macOS

Must be built **on a Mac** — Windows can't cross-compile a notarized macOS app.

```bash
npm run build:mac
```

Produces `dist/Practice Test-1.0.0.dmg`. Open it, drag `Practice Test.app` to Applications, then drag from Applications to the Dock for an icon.

The app is unsigned, so first launch needs Right-click → Open → confirm "Open" once.

## Updating

When new changes land on `main`, pull them and rebuild from your existing clone — no need to reclone.

### One-shot (Windows and macOS)

```bash
npm run Update_App
```

This single command does everything: `git pull`, `npm install`, the platform build, and replaces your installed app (`%LOCALAPPDATA%\Programs\Practice Test` on Windows, `/Applications/Practice Test.app` on macOS). On Windows it also re-runs the `rcedit` icon embed. Quit Practice Test before running it.

### Manual steps

If you'd rather run each step yourself:

```bash
git pull
npm install
```

Then rebuild for your platform.

### Windows 11

```powershell
npm run build:win
```

Re-run the `rcedit` icon-embedding snippet from the Windows install section above so the new exes get the proper icon.

Then update your existing install:

- **If you used the NSIS installer:** quit Practice Test, then double-click `dist\Practice Test Setup 1.0.0.exe`. It upgrades in place and keeps your saved tests (`localStorage` is preserved).
- **If you used the manual copy method:** quit Practice Test, then re-copy the unpacked folder over:

  ```powershell
  Copy-Item -Recurse -Force "dist\win-unpacked\*" "$env:LOCALAPPDATA\Programs\Practice Test"
  ```

  The shortcut on your desktop keeps working — it points at the same path.

If the copy fails with "file in use", Practice Test is still running. Close it from the taskbar (or `taskkill /IM "Practice Test.exe" /F`) and try again.

### macOS

Must be rebuilt **on a Mac**.

```bash
npm run build:mac
```

Quit Practice Test, then open `dist/Practice Test-1.0.0.dmg` and drag `Practice Test.app` to Applications — confirm "Replace" when prompted. Your saved tests are preserved.

## Layout

- `electron/main.cjs` — Electron main process (window creation, OS chrome, AppUserModelID)
- `src/App.jsx` — root, tab bar, new-test form, persistence
- `src/components/TestView.jsx` — three-phase test flow (answering → grading → review)
- `src/components/AnimatedNumber.jsx` — springy counter + score ring
- `src/components/Icons.jsx` — inline SVG icon set
- `src/styles.css` — full stylesheet ported from the design
- `build/icon.ico` / `icon.icns` / `icon.png` — app icons (multi-resolution)

Tests are persisted to `localStorage` keyed by `practice-test:tests:v1`.

## Keyboard shortcuts (grading phase)

- **←** / **→** — preview Incorrect / Correct
- **Enter** / **Space** — confirm the previewed grade
- **C** / **X** — instantly mark Correct / Incorrect
- **↑** / **↓** — previous / next question
