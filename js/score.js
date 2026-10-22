/**
 * score.js
 * Distance-based score with a persisted high score and canvas HUD.
 */
(function (global) {
  'use strict';

  const { CONFIG } = global.Dino;
  const cfg = CONFIG.score;

  const pad = (n) => String(n).padStart(5, '0');

  function loadHighScore() {
    try {
      return Number(localStorage.getItem(cfg.storageKey)) || 0;
    } catch (_) {
      return 0; // storage unavailable (private mode, blocked, etc.)
    }
  }

  function saveHighScore(value) {
    try {
      localStorage.setItem(cfg.storageKey, String(value));
    } catch (_) {
      /* ignore */
    }
  }

  class Score {
    constructor() {
      this.high = loadHighScore();
      this.reset();
    }

    reset() {
      this.distance = 0;
      this.flashTimer = 0;
      this._lastMilestone = 0;
    }

    get value() {
      return Math.floor(this.distance * cfg.pointsPerPixel);
    }

    update(dt, speed) {
      this.distance += speed * dt;
      const milestone = Math.floor(this.value / 100);
      if (milestone > this._lastMilestone) {
        this._lastMilestone = milestone;
        this.flashTimer = 0.8; // blink the HUD every 100 points
      }
      if (this.flashTimer > 0) this.flashTimer -= dt;
    }

    /** Call when a run ends. Returns true if a new high score was set. */
    commit() {
      if (this.value > this.high) {
        this.high = this.value;
        saveHighScore(this.high);
        return true;
      }
      return false;
    }

    draw(ctx, colors) {
      ctx.font = '600 18px ui-monospace, Menlo, Consolas, monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      const right = CONFIG.canvas.width - 16;

      const blinkOff = this.flashTimer > 0 && Math.floor(this.flashTimer / 0.1) % 2 === 1;
      ctx.fillStyle = colors.fg;
      if (!blinkOff) ctx.fillText(pad(this.value), right, 14);

      ctx.fillStyle = colors.muted;
      ctx.fillText('HI ' + pad(Math.max(this.high, 0)), right - 100, 14);
    }
  }

  global.Dino.Score = Score;
})(window);
