// Animations are defined in tile_animations.js (loaded before this file).
// TileConfig references them by name via TileAnimations[name].apply(...).

// ---------------------------------------------------------------------------
// TileConfig — Per-tile text, background, and animation assignment
//
// Each numeric key maps to a tile rank (2, 4, 8 …). All fields are optional
// except `text`.
//
//   text            {string}  Label displayed on the tile
//   bgColor         {string}  CSS background-color, overrides the SCSS default
//   bgImage         {string}  URL of a background image (GIF/WebP/AVIF/APNG/SVG
//                             etc.) rendered in a layer between the background
//                             color and the text
//   bgImageStyle    {object}  Extra inline-style overrides for the <img> element,
//                             e.g. { opacity: "0.4", objectFit: "contain" }
//   animation       {string}  Key from TileAnimations to play (optional)
//   animationParams {object}  Parameters forwarded to the animation (optional)
// ---------------------------------------------------------------------------
var TileConfig = {

  tiles: {
    2:    { text: "Stop Thinking", 
                bgImage: "https://i.gifer.com/origin/5b/5b422c794a860c653d9273fda7ef06f2_w200.webp",
                animation:"Flash", animationParams: { durationOn: 100, durationOff: 100, textColor: "alternate" }  },
    4:    { text: "Relax", 
                bgImage: "https://i.gifer.com/origin/9e/9ea2a8299209bfbd746e648137f9e562_w200.gif", 
                animation: "Whackamole", animationParams: { fade: true, durationOn: 800, tilesUnsync: true, durationOff: 200, textColor: "alternate" }   },
    8:    { text: "Focus Focus",  
                bgImage: "https://i.gifer.com/origin/df/df4525ed4f916186a0342e0aa08b0b40_w200.webp",
                animation: "Appear_and_fade", animationParams: { duration: 1500, wordByWord: true, textColor: "alternate" } },
    16:   { text: "Fuzzy", 
                bgImage: "https://i.gifer.com/origin/9c/9c7bf931cf42e1ab6e36a7bd74aa68d7_w200.webp", 
                animation: "Vibrate", animationParams: { amplitude: 4, speed: 40, durationOn: 500, durationOff: 150, textColor: "random" } },
    32:   { text: "Melt Melt Melt",
                bgImage: "https://i.gifer.com/origin/89/89ebf67f4ecc214a42168f8dfd065572_w200.webp", 
                animation: "Appear_and_fade", animationParams: { duration: 1400, wordByWord: true, textColor: "random" } },
    64:   { text: "Sleep", 
                bgImage: "https://i.makeagif.com/media/8-24-2023/rrtGly.gif",
                animation:"Flash", animationParams: { durationOn: 100, durationOff: 1200, textColor: "alternate" }  },
    128:  { text: "Sink",
                bgImage: "https://i.gifer.com/origin/89/89ed53123bb01a4eba7397fefc2830d8_w200.webp",
                animation: "RiseFall", animationParams: { duration: 3000, direction: "fall", textColor: "alternate" } },
    256:  { text: "Blank",
                bgImage: "https://i.gifer.com/origin/12/12a94bd9daec21697527d5a99bddc24b_w200.webp", 
                animation: "Whackamole", animationParams: { durationOn: 100, tilesUnsync: true, durationOff: 300, textColor: "alternate" }   },
    512:  { text: "Empty", 
                bgImage: "https://i.gifer.com/origin/6e/6ebe3326095d85bd912fdd416d929abc_w200.webp",  
                animation: "Appear_and_fade", animationParams: { duration: 1100, textColor: "alternate" }   },
    1024: { text: "Drop",
                bgImage: "https://i.gifer.com/origin/9b/9bf27f312f37fc9e7e988d7599a9612e_w200.webp",
                animation: "RiseFall", animationParams: { duration: 800, direction: "fall" } },
    2048: { text: "SURRENDER",
                bgImage: "https://media.tenor.com/eBl9Op1iop4AAAAM/hypnosis-hypnotized.gif",    
                animation:"Flash", animationParams: { durationOn: 200, durationOff: 200}  }
  },
    // good extra animation images:
    // https://i.gifer.com/origin/9b/9bf27f312f37fc9e7e988d7599a9612e_w200.webp
    // https://i.gifer.com/origin/89/89ebf67f4ecc214a42168f8dfd065572_w200.webp
    // https://media.tenor.com/pdPU15AJpqsAAAAM/hypnosis-hypnotized.gif

  defaultText: "Deeper",

  // ---------------------------------------------------------------------------
  // boardOverlay — sequential overlays shown each time the board fills up.
  //
  // Each time clearLowestTiles() fires, the pointer advances by one (wrapping
  // at the end so the cycle repeats). Each entry has:
  //   text     {string}  Message shown in the overlay text region
  //   bgImage  {string}  URL of the background image (GIF/WebP/etc.)
  //   opacity  {number}  0 (transparent) → 1 (fully opaque)
  // ---------------------------------------------------------------------------
  boardOverlay: [
    { text: "Let Go More and More",  bgImage: "https://i.gifer.com/origin/5b/5b422c794a860c653d9273fda7ef06f2_w200.webp", opacity: 0.2 },
    { text: "So Easy to Give In", bgImage: "https://i.gifer.com/origin/9b/9bf27f312f37fc9e7e988d7599a9612e_w200.webp",  opacity: 0.3 },          
    { text: "Empty and Blank",          bgImage: "https://i.gifer.com/origin/6e/6ebe3326095d85bd912fdd416d929abc_w200.webp",  opacity: 0.6 },
    { text: "Mind Melting", bgImage: "https://i.gifer.com/origin/89/89ebf67f4ecc214a42168f8dfd065572_w200.webp", opacity: 0.5 },
    { text: "Slipping Away",    bgImage: "https://i.gifer.com/origin/9e/9ea2a8299209bfbd746e648137f9e562_w200.gif",  opacity: 0.35 },
    { text: "So Easy To Drop Deeper",    bgImage: "https://i.gifer.com/origin/df/df4525ed4f916186a0342e0aa08b0b40_w200.webp", opacity: 0.4 },
    { text: "Fuzzy And Floaty More and More",          bgImage: "https://i.gifer.com/origin/9c/9c7bf931cf42e1ab6e36a7bd74aa68d7_w200.webp", opacity: 0.45 },
    { text: "Drop Deep",           bgImage: "https://i.gifer.com/origin/9b/9bf27f312f37fc9e7e988d7599a9612e_w200.webp", opacity: 0.75 },
    { text: "Sinking and Swirling",           bgImage: "https://i.gifer.com/origin/89/89ed53123bb01a4eba7397fefc2830d8_w200.webp", opacity: 0.6 },
    { text: "SLEEP NOW",          bgImage: "https://i.makeagif.com/media/8-24-2023/rrtGly.gif",                        opacity: 0.4 },
    { text: "LET GO NOW",           bgImage: "https://media.tenor.com/pdPU15AJpqsAAAAM/hypnosis-hypnotized.gif", opacity: 0.75 },
    { text: "SURRENDER",      bgImage: "https://media.tenor.com/eBl9Op1iop4AAAAM/hypnosis-hypnotized.gif",         opacity: 0.8 }
  ],

  // ---------------------------------------------------------------------------
  // Tile slide transition
  //
  //   slideSpeed   {number}  Duration of the tile-move CSS transition in ms.
  //                          Default is 100. Higher values (e.g. 300) make
  //                          tiles slide visibly slowly.
  //
  //   slideEasing  {string}  CSS transition-timing-function for tile movement.
  //                          Any valid CSS value works, plus the shorthand:
  //                          "inertia" — tiles start slow and accelerate
  //                                      (cubic-bezier ease-in).
  //                          "ease-in-out" (default) — symmetric ease.
  //                          "linear"  — constant speed.
  //                          "ease-out" — fast start, slow finish.
  // ---------------------------------------------------------------------------
  slideSpeed: 700,
  slideEasing: "ease-in-out",

  // Returns the display text for a given tile rank.
  getText: function (rank) {
    return (this.tiles[rank] && this.tiles[rank].text) || this.defaultText;
  },

  // Applies background color and optional image layer to tile-inner.
  // The image layer is an absolutely-positioned div (z-index 0) inserted as
  // the first child, sitting above the background color but below the text.
  applyBackground: function (inner, rank) {
    var cfg = this.tiles[rank] || {};

    // Override the SCSS background color when explicitly configured.
    if (cfg.bgColor) {
      inner.style.backgroundColor = cfg.bgColor;
    }

    // Insert an image layer if a bgImage URL is provided.
    if (cfg.bgImage) {
      var bgLayer = document.createElement("div");
      bgLayer.className          = "tile-bg-layer";
      bgLayer.style.position     = "absolute";
      bgLayer.style.top          = "0";
      bgLayer.style.left         = "0";
      bgLayer.style.right        = "0";
      bgLayer.style.bottom       = "0";
      bgLayer.style.zIndex       = "0";
      bgLayer.style.overflow     = "hidden";
      bgLayer.style.borderRadius = "inherit";

      var img             = document.createElement("img");
      img.src             = cfg.bgImage;
      img.style.width     = "100%";
      img.style.height    = "100%";
      img.style.objectFit = "cover";   // override via bgImageStyle if needed
      img.style.display   = "block";

      // Apply any extra per-tile image style overrides.
      if (cfg.bgImageStyle) {
        var style = cfg.bgImageStyle;
        Object.keys(style).forEach(function (prop) {
          img.style[prop] = style[prop];
        });
      }

      bgLayer.appendChild(img);
      inner.appendChild(bgLayer);
    }
  },

  // Applies the configured animation (if any) to the text-layer element.
  applyAnimation: function (element, rank) {
    var cfg = this.tiles[rank];
    if (cfg && cfg.animation && TileAnimations[cfg.animation]) {
      TileAnimations[cfg.animation].apply(element, cfg.animationParams || {});
    }
  }
};

// ---------------------------------------------------------------------------
// Inject CSS override for tile slide speed and easing.
// Runs once immediately after TileConfig is defined so it beats any
// requestAnimationFrame rendering but still lands after main.css.
// ---------------------------------------------------------------------------
(function () {
  var speed  = TileConfig.slideSpeed;
  var easing = TileConfig.slideEasing;

  // Named preset → real CSS timing function.
  var easingMap = {
    "inertia":     "cubic-bezier(0.55, 0.055, 0.675, 0.19)",  // ease-in: slow start, accelerates
    "ease-in":     "ease-in",
    "ease-out":    "ease-out",
    "ease-in-out": "ease-in-out",
    "linear":      "linear"
  };
  var timingFn = easingMap[easing] || easing;

  // Only inject if different from the compiled defaults to avoid a no-op element.
  if (speed === 100 && timingFn === "ease-in-out") return;

  // The compiled SCSS uses:
  //   tile movement  — $transition-speed (100ms) ease-in-out
  //   appear/pop     — 200ms ease, delay $transition-speed (100ms)
  // Scale appear/pop proportionally: delay = slideSpeed, duration = slideSpeed * 2.
  var popDuration = speed * 2;

  var css = [
    // Tile slide movement
    ".tile {",
    "  -webkit-transition: " + speed + "ms " + timingFn + ";",
    "  -moz-transition:    " + speed + "ms " + timingFn + ";",
    "  transition:         " + speed + "ms " + timingFn + ";",
    "  -webkit-transition-property: -webkit-transform;",
    "  -moz-transition-property:    -moz-transform;",
    "  transition-property:         transform;",
    "}",
    // New-tile appear: delay until after the slide lands
    ".tile-new .tile-inner {",
    "  -webkit-animation: appear " + popDuration + "ms ease " + speed + "ms backwards;",
    "  animation:         appear " + popDuration + "ms ease " + speed + "ms backwards;",
    "}",
    // Merged-tile pop: same delay + scaled duration
    ".tile-merged .tile-inner {",
    "  -webkit-animation: pop " + popDuration + "ms ease " + speed + "ms backwards;",
    "  animation:         pop " + popDuration + "ms ease " + speed + "ms backwards;",
    "}"
  ].join("\n");

  var styleEl = document.createElement("style");
  styleEl.textContent = css;
  document.head.appendChild(styleEl);
}());
