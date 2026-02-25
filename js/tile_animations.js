// ---------------------------------------------------------------------------
// TileAnimations — Named animation definitions
//
// Each entry is a named animation strategy. The `apply(element, params)`
// function receives:
//   element — the tile text-layer DOM element to animate
//   params  — configuration object (all fields optional, defaults shown)
//
// To add a new animation, add a new key here with an `apply` function.
// TileConfig (tile_config.js) references these by name.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Shared text-colour helpers
// ---------------------------------------------------------------------------
var _BLACK_SHADOW = "0 0 4px #000, 0 1px 3px rgba(0,0,0,0.9)";
var _WHITE_SHADOW = "0 0 4px #fff, 0 1px 3px rgba(255,255,255,0.9)";

/**
 * Returns { color, textShadow } for the given textColor value and cycle index.
 *   undefined / null  → both null; no style applied (inherit from CSS)
 *   "alternate"       → white + black shadow on even cycles,
 *                        black + white shadow on odd cycles
 *   "random"          → random RGB each call; shadow chosen for max contrast
 *                        via ITU-R BT.601 perceived luminance
 *   anything else     → treated as a literal CSS colour; no auto-shadow
 */
function resolveTextColor(textColor, colorIndex) {
  if (!textColor) return { color: null, textShadow: null };
  if (textColor === "alternate") {
    return (colorIndex % 2 === 0)
      ? { color: "#ffffff", textShadow: _BLACK_SHADOW }
      : { color: "#000000", textShadow: _WHITE_SHADOW };
  }
  if (textColor === "random") {
    var r = Math.floor(Math.random() * 256);
    var g = Math.floor(Math.random() * 256);
    var b = Math.floor(Math.random() * 256);
    var luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return {
      color: "rgb(" + r + "," + g + "," + b + ")",
      textShadow: luma > 0.5 ? _BLACK_SHADOW : _WHITE_SHADOW
    };
  }
  // Literal CSS colour — apply directly, no auto-shadow.
  return { color: textColor, textShadow: null };
}

/** Apply a resolved { color, textShadow } pair to a span element. */
function applyTextColor(span, resolved) {
  if (resolved.color !== null)      span.style.color      = resolved.color;
  if (resolved.textShadow !== null) span.style.textShadow = resolved.textShadow;
}

var TileAnimations = {

  /**
   * Appear_and_fade
   * The text snaps instantly to full opacity, then fades out — looping indefinitely.
   *
   * When wordByWord is true, each space-separated word gets its own slot of
   * (duration / numWords) ms within the full cycle so they appear in order:
   *   "Focus More"  @ 1500ms → Focus visible 0–750ms, More visible 750–1500ms
   *   "A B C"       @ 1500ms → A: 0–500ms, B: 500–1000ms, C: 1000–1500ms
   * All spans share the same total animation-duration so they loop in sync.
   *
   * IMPORTANT: Animations are applied to child <span> elements so the
   * tile-inner background and CSS tile-new/tile-merged animations are
   * never affected.
   *
   * Supported params:
   *   duration    {number}  Total cycle length in ms                  (default: 2000)
   *   startDelay  {number}  ms to wait before the loop begins         (default: 310)
   *   wordByWord  {boolean} Animate each word separately in sequence  (default: false)
 *   textColor   {string}  CSS color, "alternate", or "random"       (default: inherit)
 *   color       {string}  Fallback CSS color if textColor is unset  (default: inherit)
   *   fontSize    {string}  CSS font-size value                       (default: inherit)
   *   fontWeight  {string}  CSS font-weight value                     (default: inherit)
   *   fontFamily  {string}  CSS font-family value                     (default: inherit)
   */
  "Appear_and_fade": {
    apply: function (element, params) {
      params = params || {};

      var duration   = params.duration || 2000;
      var startDelay = (params.startDelay !== undefined) ? params.startDelay : 310;
      var wordByWord = params.wordByWord || false;
      var fullText   = element.textContent;
      var words      = fullText.split(" ");

      if (!TileAnimations._injectedKeyframes) {
        TileAnimations._injectedKeyframes = {};
      }

      // Clear the element — we'll re-populate with styled spans.
      element.textContent = "";

      // Helper: stamp common animation properties onto a span.
      function animateSpan(span, keyframeName) {
        applyTextColor(span, resolveTextColor(params.textColor || params.color, 0));
        if (params.fontSize)   span.style.fontSize   = params.fontSize;
        if (params.fontWeight) span.style.fontWeight = params.fontWeight;
        if (params.fontFamily) span.style.fontFamily = params.fontFamily;
        span.style.display                    = "inline-block";
        span.style.animationName              = keyframeName;
        span.style.animationDuration          = duration + "ms";
        span.style.animationTimingFunction    = "linear";
        span.style.animationIterationCount    = "infinite";
        span.style.animationDelay             = startDelay + "ms";
        span.style.animationFillMode          = "backwards";
      }

      if (!wordByWord || words.length <= 1) {
        // ── Single-block mode (original behaviour) ───────────────────────
        var keyframeName = "tile-appear-and-fade";
        if (!TileAnimations._injectedKeyframes[keyframeName]) {
          var styleEl = document.createElement("style");
          styleEl.textContent = [
            "@keyframes " + keyframeName + " {",
            "  0%   { opacity: 1; }",
            "  100% { opacity: 0; }",
            "}"
          ].join("\n");
          document.head.appendChild(styleEl);
          TileAnimations._injectedKeyframes[keyframeName] = true;
        }
        var span = document.createElement("span");
        span.textContent = fullText;
        element.appendChild(span);
        animateSpan(span, keyframeName);

        // For dynamic textColor modes, re-apply colour on each animation loop.
        if (params.textColor === "alternate" || params.textColor === "random") {
          var afColorIndex = [1]; // 0 was consumed by animateSpan above
          span.addEventListener("animationiteration", function () {
            applyTextColor(span, resolveTextColor(params.textColor, afColorIndex[0]++));
          });
        }

      } else {
        // ── Word-by-word mode ─────────────────────────────────────────────
        // Stack words vertically: each word gets an equal share of the tile
        // height (1/N). Override the element to be a column flex container so
        // each word slot fills its row, then centers the text within it.
        var numWords = words.length;

        element.style.flexDirection  = "column";
        element.style.alignItems     = "stretch";  // slots span full width
        element.style.justifyContent = "stretch";

        var wordSpans     = [];
        var wbwColorIndex = [1]; // 0 consumed on initial render

        words.forEach(function (word, i) {
          var slotStart = parseFloat(((i / numWords) * 100).toFixed(2));
          var slotEnd   = parseFloat((((i + 1) / numWords) * 100).toFixed(2));
          var snapAt    = parseFloat((slotStart + 0.1).toFixed(2));

          var kfName = "tile-word-fade-" + i + "-of-" + numWords;
          if (!TileAnimations._injectedKeyframes[kfName]) {
            var lines = ["@keyframes " + kfName + " {"];
            if (i === 0) {
              lines.push("  0%      { opacity: 1; }");
              lines.push("  " + slotEnd + "% { opacity: 0; }");
              if (slotEnd < 100) lines.push("  100%    { opacity: 0; }");
            } else {
              lines.push("  0%          { opacity: 0; }");
              lines.push("  " + slotStart + "%  { opacity: 0; }");
              lines.push("  " + snapAt   + "%  { opacity: 1; }");
              lines.push("  " + slotEnd  + "%  { opacity: 0; }");
              if (slotEnd < 100) lines.push("  100%       { opacity: 0; }");
            }
            lines.push("}");
            var kfEl = document.createElement("style");
            kfEl.textContent = lines.join("\n");
            document.head.appendChild(kfEl);
            TileAnimations._injectedKeyframes[kfName] = true;
          }

          var wordSpan = document.createElement("span");
          wordSpan.textContent = word;

          // Each slot takes an equal share of the tile height and centers
          // its word both horizontally and vertically within that slice.
          wordSpan.style.flex           = "1";
          wordSpan.style.display        = "flex";
          wordSpan.style.alignItems     = "center";
          wordSpan.style.justifyContent = "center";
          wordSpan.style.width          = "100%";

          element.appendChild(wordSpan);
          wordSpans.push(wordSpan);

          // Apply text styling and animation to the word span.
          applyTextColor(wordSpan, resolveTextColor(params.textColor || params.color, 0));
          if (params.fontSize)   wordSpan.style.fontSize   = params.fontSize;
          if (params.fontWeight) wordSpan.style.fontWeight = params.fontWeight;
          if (params.fontFamily) wordSpan.style.fontFamily = params.fontFamily;
          wordSpan.style.animationName              = kfName;
          wordSpan.style.animationDuration          = duration + "ms";
          wordSpan.style.animationTimingFunction    = "linear";
          wordSpan.style.animationIterationCount    = "infinite";
          wordSpan.style.animationDelay             = startDelay + "ms";
          wordSpan.style.animationFillMode          = "backwards";
        });

        // For dynamic textColor modes, re-colour all word spans in sync
        // at the start of each full animation cycle.
        if ((params.textColor === "alternate" || params.textColor === "random") && wordSpans.length > 0) {
          wordSpans[0].addEventListener("animationiteration", function () {
            var resolved = resolveTextColor(params.textColor, wbwColorIndex[0]++);
            for (var wi = 0; wi < wordSpans.length; wi++) {
              applyTextColor(wordSpans[wi], resolved);
            }
          });
        }
      }
    }
  },

  /**
   * Whackamole
   * The text snaps instantly visible at a random position inside the tile,
   * stays there for `durationOn` ms, then snaps invisible. After `durationOff`
   * ms of blank tile it snaps visible again at a new random position — repeat.
   *
   * When `fade` is true the snap-on behaviour is preserved but the text then
   * fades to transparent over the full `durationOn` period using a CSS opacity
   * transition (no JS per-frame work).
   *
   * Each call to apply() is per tile instance, so with `tilesUnsync: true`
   * both `durationOn` and `durationOff` receive independent ±10% jitter,
   * causing each tile to drift out of phase with its neighbours over time.
   *
   * IMPORTANT: This animation switches the text-layer to block positioning
   * so the span can be placed freely. The tile background and tile-inner
   * CSS animations are unaffected.
   *
   * Supported params:
   *   durationOn   {number}  ms the text is visible per cycle          (default: 2000)
   *   durationOff  {number}  ms the tile is blank between appearances  (default: 0)
   *   startDelay   {number}  ms before the first appearance            (default: 310)
   *   tilesUnsync  {boolean} ±10% per-tile jitter on both durations    (default: false)
   *   fade         {boolean} fade out over durationOn instead of snap  (default: false)
   *   textColor    {string}  CSS color, "alternate", or "random"       (default: inherit)
   *   color        {string}  Fallback CSS color if textColor is unset  (default: inherit)
   *   fontSize     {string}  CSS font-size                             (default: inherit)
   *   fontWeight   {string}  CSS font-weight                           (default: inherit)
   *   fontFamily   {string}  CSS font-family                           (default: inherit)
   */
  "Whackamole": {
    apply: function (element, params) {
      params = params || {};

      var baseDurationOn  = params.durationOn  || 2000;
      var baseDurationOff = params.durationOff || 0;
      var startDelay      = (params.startDelay !== undefined) ? params.startDelay : 310;
      var tilesUnsync     = params.tilesUnsync || false;
      var fade            = params.fade        || false;

      // ±10% per-tile jitter when tilesUnsync is enabled — rolled once per
      // tile instance so each tile keeps its own consistent (but offset) pace.
      function jitter(base) {
        return tilesUnsync ? Math.round(base * (0.9 + Math.random() * 0.2)) : base;
      }
      var durationOn  = jitter(baseDurationOn);
      var durationOff = jitter(baseDurationOff);

      var fullText = element.textContent;
      element.textContent = "";

      // Switch the text-layer to a block positioning context.
      element.style.display        = "block";
      element.style.position       = "relative";
      element.style.overflow       = "hidden";
      element.style.alignItems     = "";
      element.style.justifyContent = "";

      // The floating text span — absolutely positioned within element.
      var span = document.createElement("span");
      span.textContent         = fullText;
      span.style.position      = "absolute";
      span.style.transform     = "translate(-50%, -50%)";
      span.style.textAlign     = "center";
      span.style.maxWidth      = "80%";
      span.style.visibility    = "hidden";
      span.style.opacity       = "1";
      span.style.pointerEvents = "none";

      applyTextColor(span, resolveTextColor(params.textColor || params.color, 0));
      if (params.fontSize)   span.style.fontSize   = params.fontSize;
      if (params.fontWeight) span.style.fontWeight = params.fontWeight;
      if (params.fontFamily) span.style.fontFamily = params.fontFamily;

      element.appendChild(span);

      var whackColorIndex = 0;

      // One full cycle: show → wait durationOn → hide → wait durationOff → repeat
      function cycle() {
        // Snap to a new random position (20–80% keeps text inside the tile).
        span.style.left = (20 + Math.random() * 60) + "%";
        span.style.top  = (20 + Math.random() * 60) + "%";
        if (params.textColor) applyTextColor(span, resolveTextColor(params.textColor, whackColorIndex++));

        if (fade) {
          // Snap to fully visible (no transition), force reflow so the browser
          // registers opacity:1 before we kick off the fade-out transition.
          span.style.transition = "none";
          span.style.opacity    = "1";
          span.style.visibility = "visible";
          void span.offsetHeight; // reflow
          span.style.transition = "opacity " + durationOn + "ms linear";
          span.style.opacity    = "0";
        } else {
          span.style.visibility = "visible";
        }

        element._whackamoleTimer = setTimeout(function () {
          // Clean up — remove transition so the next snap-on is instant.
          span.style.transition = "none";
          span.style.opacity    = "1";
          span.style.visibility = "hidden";

          if (durationOff > 0) {
            element._whackamoleTimer = setTimeout(cycle, durationOff);
          } else {
            cycle();
          }
        }, durationOn);
      }

      // Initial delay (lets tile-new / tile-merged animations finish first).
      element._whackamoleTimer = setTimeout(cycle, startDelay);
    }
  },

  /**
   * Flash
   * Centered text (normal tile layout) snaps on for `durationOn` ms then
   * off for `durationOff` ms, repeating indefinitely. No movement, no fading.
   *
   * Supported params:
   *   durationOn   {number}  ms the text is visible                    (default: 500)
   *   durationOff  {number}  ms the text is hidden                     (default: 500)
   *   startDelay   {number}  ms before the first flash                 (default: 310)
 *   textColor    {string}  CSS color, "alternate", or "random"       (default: inherit)
 *   color        {string}  Fallback CSS color if textColor is unset  (default: inherit)
   *   fontSize     {string}  CSS font-size                             (default: inherit)
   *   fontWeight   {string}  CSS font-weight                           (default: inherit)
   *   fontFamily   {string}  CSS font-family                           (default: inherit)
   */
  "Flash": {
    apply: function (element, params) {
      params = params || {};

      var durationOn  = params.durationOn  || 500;
      var durationOff = params.durationOff || 500;
      var startDelay  = (params.startDelay !== undefined) ? params.startDelay : 310;

      var fullText = element.textContent;
      element.textContent = "";

      // Reuse the existing flex centering already set on the text-layer.
      var span = document.createElement("span");
      span.textContent         = fullText;
      span.style.visibility    = "hidden";
      span.style.pointerEvents = "none";

      applyTextColor(span, resolveTextColor(params.textColor || params.color, 0));
      if (params.fontSize)   span.style.fontSize   = params.fontSize;
      if (params.fontWeight) span.style.fontWeight = params.fontWeight;
      if (params.fontFamily) span.style.fontFamily = params.fontFamily;

      element.appendChild(span);

      var flashColorIndex = 0;

      function flashOn() {
        if (params.textColor) applyTextColor(span, resolveTextColor(params.textColor, flashColorIndex++));
        span.style.visibility = "visible";
        element._flashTimer   = setTimeout(flashOff, durationOn);
      }
      function flashOff() {
        span.style.visibility = "hidden";
        element._flashTimer   = setTimeout(flashOn, durationOff);
      }

      element._flashTimer = setTimeout(flashOn, startDelay);
    }
  },

  /**
   * RiseFall
   * Animates the tile text along the vertical axis. Four direction modes:
   *
   *   "rise"   — text travels from below the tile bottom to above the tile top
   *              at constant speed, looping. Clipped at tile edges.
   *   "fall"   — same but top-to-bottom. Clipped at tile edges.
   *   "bounce" — text stays fully within the tile, moving at constant speed,
   *              instantly reversing at the top and bottom edges (triangle wave).
   *   "sin"    — text stays fully within the tile, using a cosine curve so
   *              speed smoothly eases in/out at each edge (no hard reversal).
   *
   * Position measurement is deferred until after startDelay so the tile is
   * fully laid out in the DOM before we read its dimensions.
   *
   * Supported params:
   *   duration    {number}  ms for one full traversal / cycle           (default: 3000)
   *   direction   {string}  "rise" | "fall" | "bounce" | "sin"          (default: "rise")
   *   startDelay  {number}  ms before animation begins                  (default: 310)
 *   textColor   {string}  CSS color, "alternate", or "random"        (default: inherit)
 *   color       {string}  Fallback CSS color if textColor is unset   (default: inherit)
   *   fontSize    {string}  CSS font-size                               (default: inherit)
   *   fontWeight  {string}  CSS font-weight                             (default: inherit)
   *   fontFamily  {string}  CSS font-family                             (default: inherit)
   */
  "RiseFall": {
    apply: function (element, params) {
      params = params || {};

      var duration   = params.duration  || 3000;
      var direction  = params.direction || "rise";
      var startDelay = (params.startDelay !== undefined) ? params.startDelay : 310;

      var fullText = element.textContent;
      element.textContent = "";

      // Clip text that leaves the tile for rise / fall modes.
      if (direction === "rise" || direction === "fall") {
        element.style.overflow = "hidden";
      }

      // Drop the flex layout — the span is absolutely positioned.
      element.style.display        = "block";
      element.style.alignItems     = "";
      element.style.justifyContent = "";

      var span = document.createElement("span");
      span.textContent         = fullText;
      span.style.position      = "absolute";
      span.style.left          = "50%";
      span.style.transform     = "translateX(-50%)";  // horizontal centering
      span.style.textAlign     = "center";
      span.style.maxWidth      = "80%";
      span.style.visibility    = "hidden";
      span.style.pointerEvents = "none";

      applyTextColor(span, resolveTextColor(params.textColor || params.color, 0));
      if (params.fontSize)   span.style.fontSize   = params.fontSize;
      if (params.fontWeight) span.style.fontWeight = params.fontWeight;
      if (params.fontFamily) span.style.fontFamily = params.fontFamily;

      element.appendChild(span);

      // Defer until after startDelay so the tile is in the DOM and
      // offsetHeight returns real values.
      element._risefallTimer = setTimeout(function () {
        var tileH   = element.offsetHeight;
        var spanH   = span.offsetHeight;

        // Pixel positions for the span's `top` value:
        //   topIn  — flush with tile top  (fully visible, top)
        //   botIn  — flush with tile bottom (fully visible, bottom)
        //   above  — entirely above tile (hidden, for rise/fall)
        //   below  — entirely below tile (hidden, for rise/fall)
        var topIn   = 0;
        var botIn   = tileH - spanH;
        var above   = -spanH;
        var below   = tileH;
        var centerY = (tileH - spanH) / 2;

        span.style.visibility = "visible";
        var startTime   = null;
        var rfLastCycle = -1;

        function tick(ts) {
          if (startTime === null) startTime = ts;
          var elapsed = ts - startTime;
          var t, frac, top, amplitude;

          // Re-apply textColor at the start of each new full cycle.
          if (params.textColor) {
            var rfCycle = Math.floor(elapsed / duration);
            if (rfCycle !== rfLastCycle) {
              rfLastCycle = rfCycle;
              applyTextColor(span, resolveTextColor(params.textColor, rfCycle));
            }
          }

          if (direction === "rise") {
            // Linear: below → above, looping.
            t   = (elapsed % duration) / duration;
            top = below + t * (above - below);

          } else if (direction === "fall") {
            // Linear: above → below, looping.
            t   = (elapsed % duration) / duration;
            top = above + t * (below - above);

          } else if (direction === "bounce") {
            // Triangle wave: botIn → topIn → botIn at constant speed.
            t    = (elapsed % duration) / duration;
            frac = t < 0.5 ? t * 2 : 2 - t * 2;   // 0→1→0
            top  = botIn * (1 - frac) + topIn * frac;

          } else { // "sin"
            // Cosine curve: starts at bottom, eases smoothly to top and back.
            amplitude = (botIn - topIn) / 2;
            top = centerY + amplitude * Math.cos(2 * Math.PI * elapsed / duration);
          }

          span.style.top       = top + "px";
          element._risefallRaf = requestAnimationFrame(tick);
        }

        element._risefallRaf = requestAnimationFrame(tick);
      }, startDelay);
    }
  },

  /**
   * Vibrate
   * The text rapidly jitters in small random-looking pixel offsets — a buzz
   * or shaking effect. Implemented entirely with a CSS @keyframes animation
   * on transform:translate so it runs on the GPU compositor with no JS timers
   * after startup.
   *
   * Optional pulsed mode: set durationOn + durationOff to make it buzz for
   * durationOn ms, go still for durationOff ms, then repeat. Omit both (or
   * leave at 0) for continuous vibration.
   *
   * Supported params:
   *   amplitude   {number}  Max pixel displacement in x and y         (default: 2)
   *   speed       {number}  ms per full shake cycle                   (default: 50)
   *   durationOn  {number}  ms to buzz before pausing (0 = continuous)(default: 0)
   *   durationOff {number}  ms of stillness between buzzes            (default: 0)
   *   startDelay  {number}  ms before animation begins                (default: 310)
 *   textColor   {string}  CSS color, "alternate", or "random"       (default: inherit)
 *   color       {string}  Fallback CSS color if textColor is unset  (default: inherit)
   *   fontSize    {string}  CSS font-size                             (default: inherit)
   *   fontWeight  {string}  CSS font-weight                           (default: inherit)
   *   fontFamily  {string}  CSS font-family                           (default: inherit)
   */
  "Vibrate": {
    apply: function (element, params) {
      params = params || {};

      var amplitude   = (params.amplitude  !== undefined) ? params.amplitude  : 2;
      var speed       = params.speed       || 50;
      var durationOn  = params.durationOn  || 0;
      var durationOff = params.durationOff || 0;
      var startDelay  = (params.startDelay !== undefined) ? params.startDelay : 310;
      var pulsed      = durationOn > 0 && durationOff > 0;

      var fullText = element.textContent;
      element.textContent = "";

      // Wrap in a span so only the text transforms, not the whole tile-layer.
      var span = document.createElement("span");
      span.textContent         = fullText;
      span.style.display       = "inline-block"; // required for transform to work on inline text
      span.style.pointerEvents = "none";

      applyTextColor(span, resolveTextColor(params.textColor || params.color, 0));
      if (params.fontSize)   span.style.fontSize   = params.fontSize;
      if (params.fontWeight) span.style.fontWeight = params.fontWeight;
      if (params.fontFamily) span.style.fontFamily = params.fontFamily;

      element.appendChild(span);

      // Build a keyframe name unique to this amplitude+speed combo so the
      // @keyframes block is only injected once per unique configuration.
      var kfName = "tile-vibrate-a" + amplitude + "-s" + speed;

      if (!TileAnimations._injectedKeyframes) TileAnimations._injectedKeyframes = {};
      if (!TileAnimations._injectedKeyframes[kfName]) {
        // Fixed pattern of 8 offsets scaled by amplitude. The irrational-ish
        // ratios (0.7, 0.9, 0.4 …) make the path feel organic rather than
        // mechanical back-and-forth.
        var a = amplitude;
        var kf = [
          "@keyframes " + kfName + " {",
          "  0%   { transform: translate(0, 0); }",
          "  12%  { transform: translate(" +  a              + "px, " + -(a * 0.5)  + "px); }",
          "  25%  { transform: translate(" + -(a * 0.7)      + "px, " +  (a * 0.8)  + "px); }",
          "  37%  { transform: translate(" +  (a * 0.9)      + "px, " +  (a * 0.3)  + "px); }",
          "  50%  { transform: translate(" + -(a * 0.4)      + "px, " + -(a * 0.9)  + "px); }",
          "  62%  { transform: translate(" +  (a * 0.6)      + "px, " +  (a * 0.7)  + "px); }",
          "  75%  { transform: translate(" + -(a * 0.8)      + "px, " + -(a * 0.2)  + "px); }",
          "  87%  { transform: translate(" +  (a * 0.3)      + "px, " + -(a * 0.6)  + "px); }",
          "  100% { transform: translate(0, 0); }",
          "}"
        ].join("\n");
        var styleEl = document.createElement("style");
        styleEl.textContent = kf;
        document.head.appendChild(styleEl);
        TileAnimations._injectedKeyframes[kfName] = true;
      }

      // Apply the CSS animation — GPU-driven from this point, no more JS needed
      // for the continuous (non-pulsed) case.
      function startBuzz() {
        span.style.animationName            = kfName;
        span.style.animationDuration        = speed + "ms";
        span.style.animationTimingFunction  = "linear";
        span.style.animationIterationCount  = "infinite";
        span.style.animationFillMode        = "none";
      }
      function stopBuzz() {
        span.style.animationName = "none";
        span.style.transform     = "translate(0,0)";
      }

      var vibrateColorIndex = 1; // 0 was consumed on span creation above

      if (!pulsed) {
        // Continuous: just start after startDelay and leave it running.
        element._vibrateTimer = setTimeout(startBuzz, startDelay);
      } else {
        // Pulsed: buzz → still → buzz → …
        function buzzCycle() {
          if (params.textColor) applyTextColor(span, resolveTextColor(params.textColor, vibrateColorIndex++));
          startBuzz();
          element._vibrateTimer = setTimeout(function () {
            stopBuzz();
            element._vibrateTimer = setTimeout(buzzCycle, durationOff);
          }, durationOn);
        }
        element._vibrateTimer = setTimeout(buzzCycle, startDelay);
      }
    }
  }

};
