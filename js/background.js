/**
 * background.js
 * Three parallax layers: distant hills, clouds, and the speckled ground.
 */
(function (global) {
  'use strict';

  const { CONFIG } = global.Dino;
  const W = CONFIG.canvas.width;
  const GROUND_Y = CONFIG.groundY;

  const HILL_PERIOD = 480;
  const HILL_PARALLAX = 0.05;
  const CLOUD_PARALLAX = 0.15;

  const rand = (min, max) => min + Math.random() * (max - min);

  class Background {
    constructor() {
      this.reset();
    }

    reset() {
      this.groundOffset = 0;
      this.hillOffset = 0;
      this.speckles = Array.from({ length: 46 }, () => ({
        x: rand(0, W),
        y: GROUND_Y + rand(8, 48),
        w: Math.random() < 0.3 ? 8 : 3,
      }));
      this.clouds = Array.from({ length: 4 }, (_, i) => this._newCloud((i * W) / 4 + rand(0, 100)));
    }

    _newCloud(x) {
      return { x, y: rand(24, 110), w: rand(46, 78) };
    }

    update(dt, speed) {
      this.groundOffset = (this.groundOffset + speed * dt) % W;
      this.hillOffset = (this.hillOffset + speed * HILL_PARALLAX * dt) % HILL_PERIOD;

      for (const c of this.clouds) {
        c.x -= speed * CLOUD_PARALLAX * dt;
        if (c.x + c.w < 0) Object.assign(c, this._newCloud(W + rand(20, 200)));
      }
    }

    draw(ctx, colors) {
      this._drawHills(ctx, colors);
      this._drawClouds(ctx, colors);
      this._drawGround(ctx, colors);
    }

    _drawHills(ctx, colors) {
      ctx.fillStyle = colors.hill;
      for (let x = -this.hillOffset; x < W + HILL_PERIOD; x += HILL_PERIOD) {
        ctx.beginPath();
        ctx.moveTo(x, GROUND_Y);
        ctx.lineTo(x + 120, GROUND_Y - 70);
        ctx.lineTo(x + 240, GROUND_Y);
        ctx.lineTo(x + 300, GROUND_Y - 40);
        ctx.lineTo(x + 380, GROUND_Y);
        ctx.closePath();
        ctx.fill();
      }
    }

    _drawClouds(ctx, colors) {
      ctx.fillStyle = colors.cloud;
      for (const c of this.clouds) {
        const x = Math.round(c.x);
        const y = Math.round(c.y);
        ctx.fillRect(x, y + 8, c.w, 8);
        ctx.fillRect(x + c.w * 0.15, y + 2, c.w * 0.45, 8);
        ctx.fillRect(x + c.w * 0.5, y + 5, c.w * 0.3, 6);
      }
    }

    _drawGround(ctx, colors) {
      ctx.fillStyle = colors.fg;
      ctx.fillRect(0, GROUND_Y, W, 2);
      for (const s of this.speckles) {
        const x = (((s.x - this.groundOffset) % W) + W) % W;
        ctx.fillRect(Math.round(x), Math.round(s.y), s.w, 2);
      }
    }
  }

  global.Dino.Background = Background;
})(window);
