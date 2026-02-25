function HTMLActuator() {
  this.tileContainer    = document.querySelector(".tile-container");
  this.scoreContainer   = document.querySelector(".score-container");
  this.bestContainer    = document.querySelector(".best-container");
  this.messageContainer = document.querySelector(".game-message");
  this.deepOverlay      = document.querySelector(".game-deepen-overlay");
  this.deepOverlayImg   = document.querySelector(".game-deepen-overlay-img");
  this.deepOverlayText  = document.querySelector(".game-deepen-overlay-text");

  this.score = 0;
}

HTMLActuator.prototype.actuate = function (grid, metadata) {
  var self = this;

  window.requestAnimationFrame(function () {
    self.clearContainer(self.tileContainer);

    grid.cells.forEach(function (column) {
      column.forEach(function (cell) {
        if (cell) {
          self.addTile(cell);
        }
      });
    });
 
    self.updateScore(metadata.score);
    self.updateBestScore(metadata.bestScore);

    if (metadata.overlayIndex !== null && metadata.overlayIndex !== undefined) {
      self.showDeepOverlay(metadata.overlayIndex);
    } else {
      self.hideDeepOverlay();
    }

    if (metadata.terminated) {
      if (metadata.over) {
        self.message(false); // You lose
      } else if (metadata.won) {
        self.message(true); // You win!
      }
    }

  });
};

// Continues the game (both restart and keep playing)
HTMLActuator.prototype.continueGame = function () {
  this.clearMessage();
};

HTMLActuator.prototype.clearContainer = function (container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
};

HTMLActuator.prototype.addTile = function (tile) {
  var self = this;

  var wrapper   = document.createElement("div");
  var inner     = document.createElement("div");
  var position  = tile.previousPosition || { x: tile.x, y: tile.y };
  var positionClass = this.positionClass(position);

  // We can't use classlist because it somehow glitches when replacing classes
  var classes = ["tile", "tile-" + tile.value, positionClass];

  if (tile.value > 2048) classes.push("tile-super");

  this.applyClasses(wrapper, classes);

  inner.classList.add("tile-inner");

  // Make inner a stacking context so the bg-layer and text-layer
  // can be positioned relative to it.
  inner.style.position = "relative";

  var rank = tile.value;

  // Layer 1 (z-index 0): background color + optional image.
  // Sits above the CSS background color but below the text.
  TileConfig.applyBackground(inner, rank);

  // Layer 2 (z-index 1): text wrapper — flex, fills the tile.
  // All text content and animations live inside this div so they
  // always render above the background image layer.
  var textLayer = document.createElement("div");
  textLayer.className            = "tile-text-layer";
  textLayer.style.position       = "relative";
  textLayer.style.zIndex         = "1";
  textLayer.style.display        = "flex";
  textLayer.style.alignItems     = "center";
  textLayer.style.justifyContent = "center";
  textLayer.style.lineHeight     = "1.2";
  textLayer.style.width          = "100%";
  textLayer.style.height         = "100%";
  textLayer.style.boxSizing      = "border-box";
  textLayer.textContent = TileConfig.getText(rank);
  inner.appendChild(textLayer);

  // Animation operates on the text layer, not tile-inner directly.
  TileConfig.applyAnimation(textLayer, rank);

  if (tile.previousPosition) {
    // Make sure that the tile gets rendered in the previous position first
    window.requestAnimationFrame(function () {
      classes[2] = self.positionClass({ x: tile.x, y: tile.y });
      self.applyClasses(wrapper, classes); // Update the position
    });
  } else if (tile.mergedFrom) {
    classes.push("tile-merged");
    this.applyClasses(wrapper, classes);

    // Render the tiles that merged
    tile.mergedFrom.forEach(function (merged) {
      self.addTile(merged);
    });
  } else {
    classes.push("tile-new");
    this.applyClasses(wrapper, classes);
  }

  // Add the inner part of the tile to the wrapper
  wrapper.appendChild(inner);

  // Put the tile on the board
  this.tileContainer.appendChild(wrapper);
};

HTMLActuator.prototype.applyClasses = function (element, classes) {
  element.setAttribute("class", classes.join(" "));
};

HTMLActuator.prototype.normalizePosition = function (position) {
  return { x: position.x + 1, y: position.y + 1 };
};

HTMLActuator.prototype.positionClass = function (position) {
  position = this.normalizePosition(position);
  return "tile-position-" + position.x + "-" + position.y;
};

HTMLActuator.prototype.updateScore = function (score) {
  this.clearContainer(this.scoreContainer);

  var difference = score - this.score;
  this.score = score;

  this.scoreContainer.textContent = this.score;

  if (difference > 0) {
    var addition = document.createElement("div");
    addition.classList.add("score-addition");
    addition.textContent = "+" + difference;

    this.scoreContainer.appendChild(addition);
  }
};

HTMLActuator.prototype.updateBestScore = function (bestScore) {
  this.bestContainer.textContent = bestScore;
};

HTMLActuator.prototype.message = function (won) {
  var type    = won ? "game-won" : "game-over";
  var message = won ? "Deeper and deeper." : "You can always fall deeper.";

  this.messageContainer.classList.add(type);
  this.messageContainer.getElementsByTagName("p")[0].textContent = message;
};

HTMLActuator.prototype.clearMessage = function () {
  // IE only takes one value to remove at a time.
  this.messageContainer.classList.remove("game-won");
  this.messageContainer.classList.remove("game-over");
};

HTMLActuator.prototype.showDeepOverlay = function (index) {
  if (!this.deepOverlay) return;

  var overlays = (TileConfig.boardOverlay && TileConfig.boardOverlay.length)
                   ? TileConfig.boardOverlay : [];
  var cfg     = (index !== null && index !== undefined && overlays[index]) || {};
  var opacity = (cfg.opacity !== undefined) ? cfg.opacity : 0.5;

  // Background color (boardOverlay entries don't have bgColor, but guard anyway)
  this.deepOverlay.style.backgroundColor = cfg.bgColor || "transparent";

  // Background image
  if (cfg.bgImage && this.deepOverlayImg) {
    this.deepOverlayImg.src              = cfg.bgImage;
    this.deepOverlayImg.style.display    = "block";
    this.deepOverlayImg.style.objectFit  = (cfg.bgImageStyle && cfg.bgImageStyle.objectFit) || "cover";
  } else if (this.deepOverlayImg) {
    this.deepOverlayImg.src           = "";
    this.deepOverlayImg.style.display = "none";
  }

  // Text
  if (this.deepOverlayText) {
    this.deepOverlayText.textContent = cfg.text || TileConfig.defaultText;
  }

  this.deepOverlay.style.opacity = opacity;
  this.deepOverlay.style.display = "block";
};

HTMLActuator.prototype.hideDeepOverlay = function () {
  if (this.deepOverlay) this.deepOverlay.style.display = "none";
};
