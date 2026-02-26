# Agent Context — hypno2048

> **Purpose:** Onboarding context for AI coding agents continuing work on this project.
> Last updated: 2026-02-25

---

## Project Overview

A hypnosis-themed 2048 derivative. Tiles display suggestive text with custom animations instead of plain numbers. A board-wide overlay appears as the player "deepens". Deployed as a static site with no build tools.

**Live URL:** https://mindscapez.github.io/hypno2048/  
**Repo:** https://github.com/mindscapez/hypno2048 (branch: `master`)  
**Local path:** `c:\Users\brian\Git\DreamingEmma.github.io`  
**Git identity (repo-local):** `mindscapez / mindscapez.usa@gmail.com`  
**Remote URL:** `https://mindscapez@github.com/mindscapez/hypno2048.git`

---

## Tech Stack

- Vanilla JS (ES5), no bundler, no npm — `file://` compatible
- SCSS source at `style/main.scss`, compiled output at `style/main.css` (commit both)
- GitHub Pages via Actions (`.github/workflows/deploy.yml`)
- Cache-busting: deploy workflow injects `?v=<7-char-git-SHA>` onto all JS/CSS URLs in `index.html` at deploy time via `sed`; source files are never modified

---

## Script Load Order (from `index.html`)

1. `js/bind_polyfill.js`
2. `js/classlist_polyfill.js`
3. `js/animframe_polyfill.js`
4. `js/keyboard_input_manager.js`
5. `js/tile_animations.js`
6. `js/tile_config.js`
7. `js/html_actuator.js`
8. `js/grid.js`
9. `js/tile.js`
10. `js/local_storage_manager.js`
11. `js/game_manager.js`
12. `js/application.js`

---

## DOM Tile Structure

```
.tile                     (wrapper; CSS transform for movement)
  └── .tile-inner         (position:relative; background; border-radius)
        ├── .tile-bg-layer   (position:absolute; z-index:0; background image)
        └── .tile-text-layer (position:relative; z-index:1; flex; font-size set by fitTextToTile)
              └── <span>(s)  — animated text elements
```

**Board overlay:** `.game-deepen-overlay` — z-index:50, pointer-events:none  
**Overlay text:** `.game-deepen-overlay-text` — CSS baseline `font-size: 72px`, overridden at runtime by `fitOverlayText()`

**Tile sizes:**  
- Desktop: 107px × 107px  
- Mobile (`@media max-width: 520px`): 58px × 58px

---

## Key Files

### `js/tile_config.js`
Defines all per-tile configuration and board overlay entries.

- **`TileConfig.tiles`** — object keyed by rank (2, 4, 8 … 2048); each entry:
  ```js
  { text, bgImage, animation, animationParams }
  ```
- **`TileConfig.boardOverlay`** — array of 11 entries (index 0 = rank 2, index 10 = rank 2048); each:
  ```js
  { text, bgImage, opacity: 0.5 }
  ```
  Cycles with modulo wrapping when `deepenLevel` exceeds 11.
- **`TileConfig.defaultText`** — fallback text (`"Deeper"`)
- **`TileConfig.slideSpeed`** — tile slide animation duration (ms)
- **`TileConfig.slideEasing`** — CSS easing for slides

### `js/html_actuator.js`
DOM rendering, text sizing, overlay display.

- **Constructor:** Captures tile/score/overlay element refs; sets `score = 0`; installs debounced resize listener (150ms) that re-fits all `.tile-text-layer` elements via `fitTextToTile` and calls `fitOverlayText()` if overlay is visible.
- **`addTile(tile)`:** Creates tile DOM; captures `rawText` before `applyAnimation` can clear it; stores as `textLayer.dataset.rawText`; calls `fitTextToTile(textLayer, rawText)` after appending to DOM.
- **`fitTextToTile(textLayer, text)`:**
  - Timing: double-`requestAnimationFrame` (avoids animation scale-0 issue from `tile-new` CSS appear keyframe)
  - Reads `tileW` from `getComputedStyle(tileInner).width` (not `getBoundingClientRect` — transforms affect that)
  - Budget: `available = tileW * 0.8`
  - Cap: `maxAllowed = tileW * 0.38`
  - Reference probe: measures text width at a fixed `100px` font size
  - `targetSize = Math.floor(100 * available / measuredWidth)`, then clamped to `[6, maxAllowed]`
  - Always sets `textLayer.style.fontSize`
- **`showDeepOverlay(index)`:** Looks up `TileConfig.boardOverlay[index]`; sets image/text/opacity; calls `fitOverlayText()` after making overlay visible.
- **`fitOverlayText()`:** Resets `textEl.style.fontSize = ""`; reads `maxW = container.offsetWidth * 0.90`, `maxH = container.offsetHeight * 0.85`; decrements font size 1px at a time from computed value until `scrollWidth ≤ maxW && scrollHeight ≤ maxH`; minimum 8px.

### `js/tile_animations.js`
All animation classes (`Whackamole`, `Flash`, `RiseFall`, `Appear_and_fade`, `Vibrate`).

- **`Whackamole`:** `fontSize: "70%"` (relative to `fitTextToTile`-set size); `maxWidth: "60%"`; `whiteSpace: "nowrap"`; anchor range `15–85%` (tile has `overflow:hidden`).
- **`Flash`:** `whiteSpace: "normal"` (allows word-wrap at spaces; `fitTextToTile` ensures the widest word fits).
- **`RiseFall`:** All dimension reads (`tileH`, `spanH`, `effectiveDuration`, position vars) are inside `tick()` — re-reads every frame, automatically adapts to window resize. `effectiveDuration = Math.round(duration * 107 / tileH)`.

### `js/game_manager.js`
- **State fields:** `score`, `over`, `won`, `keepPlaying` (boolean), `overlayIndex` (null or 0-based int), `deepenLevel`
- **`clearLowestTiles()`:** Sets `overlayIndex = (deepenLevel - 1) % TileConfig.boardOverlay.length`
- **`activateTestMode()`:** Clears grid; places one tile per configured rank at random cells; resets all state; calls `continueGame()` + `actuate()`
- **`serialize()` / `setup()`:** Use `overlayIndex` (not `overlayRank`)

### `js/keyboard_input_manager.js`
- Arrow / WASD / swipe input
- **Test mode:** T key × 5 within 2 seconds emits `"testMode"` event (activates `activateTestMode()`)
- **Input locking:** `lock(ms)` / `unlock()` methods guard the slide animation window

### `.github/workflows/deploy.yml`
- Deploys to GitHub Pages on every push to `master`
- **Cache-bust step** (runs before artifact upload):
  ```yaml
  - name: Inject cache-bust version into asset URLs
    run: |
      VER="${GITHUB_SHA::7}"
      sed -i "s|\.js\"|.js?v=$VER\"|g"       index.html
      sed -i "s|main\.css\"|main.css?v=$VER\"|g" index.html
  ```

---

## Known Bugs Fixed (do not re-introduce)

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| Single-word text same size on mobile as desktop | `tile-new` CSS appear keyframe scales tile-inner 0→1; `getBoundingClientRect` returned ~0 → early return | Use `getComputedStyle().width`; double-rAF timing |
| All text same size after window resize | `fitTextToTile` only ran at tile creation | Resize listener re-fits all `.tile-text-layer` elements |
| Whackamole text overflowing tile edges | `translate(-50%,-50%)` anchor near edges pushed span outside | 70% font size + 60% maxWidth + 15–85% anchor clamping |
| RiseFall wrong speed after resize | Tile dimensions read once at start | Read all dimensions inside `tick()` every frame |
| Multi-word Flash text overflowing | `whiteSpace: nowrap` prevented word-wrap | Changed to `whiteSpace: normal` |
| Mobile seeing cached old version | No force-reload available on mobile | `?v=<SHA>` cache-busting in deploy workflow |

---

## How to Make Common Changes

| Task | File(s) |
|------|---------|
| Add/edit tile text or animation | `js/tile_config.js` → `tiles` object |
| Add/edit board overlay entries | `js/tile_config.js` → `boardOverlay` array |
| Change tile font sizing logic | `HTMLActuator.prototype.fitTextToTile` in `js/html_actuator.js` |
| Change overlay font sizing logic | `HTMLActuator.prototype.fitOverlayText` in `js/html_actuator.js` |
| Add a new animation type | `js/tile_animations.js` — add class, register in `TileAnimations` map |
| Change slide speed/easing | `js/tile_config.js` → `slideSpeed` / `slideEasing` |
| Modify deploy pipeline | `.github/workflows/deploy.yml` |

---

## Deployment Notes

- Every push to `master` auto-deploys via GitHub Actions (~1 min)
- Source `index.html` never has `?v=` strings — those are injected only in the deployed artifact
- To verify deployment: check https://github.com/mindscapez/hypno2048/actions
- SCSS must be compiled manually to `style/main.css` before committing style changes (no build step in CI)
