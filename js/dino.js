/**
 * dino.js
 * The player character: physics, animation, hitbox and drawing.
 */
(function (global) {
  'use strict';

  const { CONFIG } = global.Dino;
  const { physics, player } = CONFIG;

  class Player {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = player.x;
      this.bottom = CONFIG.groundY; // y of the feet
      this.vy = 0;                  // positive = moving up
      this.onGround = true;
      this.ducking = false;
      this.jumpBuffer = 0;
      this.runTimer = 0;
    }

    get width() { return this.ducking ? player.duckWidth : player.width; }
    get height() { return this.ducking ? player.duckHeight : player.height; }
    get top() { return this.bottom - this.height; }

    /** Axis-aligned collision box, slightly smaller than the sprite. */
    get hitbox() {
      const i = player.hitboxInset;
      return {
        x: this.x + i,
        y: this.top + i,
        w: this.width - i * 2,
        h: this.height - i * 2,
      };
    }

    /** Remember a jump press for a few frames so early presses still count. */
    queueJump() {
      this.jumpBuffer = physics.jumpBuffer;
    }

    update(dt, input, gameSpeed) {
      // Ducking only applies on the ground.
      this.ducking = input.duckHeld && this.onGround;

      if (this.jumpBuffer > 0) {
        this.jumpBuffer -= dt;
        if (this.onGround) this._jump();
      }

      if (!this.onGround) {
        let g = physics.gravity;
        if (this.vy > 0 && !input.jumpHeld) g *= physics.releaseGravityMul; // short hop
        if (input.duckHeld) g *= physics.fastFallMul;                       // fast fall
        this.vy -= g * dt;
        this.bottom -= this.vy * dt;

        if (this.bottom >= CONFIG.groundY) {
          this.bottom = CONFIG.groundY;
          this.vy = 0;
          this.onGround = true;
        }
      }

      // Legs cycle faster as the game speeds up.
      this.runTimer += dt * (gameSpeed / CONFIG.speed.initial);
    }

    _jump() {
      this.vy = physics.jumpVelocity;
      this.onGround = false;
      this.jumpBuffer = 0;
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {{fg:string, stage:string}} colors
     * @param {{dead?:boolean, idle?:boolean}} [opts]
     */
    draw(ctx, colors, opts = {}) {
      const { dead = false, idle = false } = opts;
      const x = Math.round(this.x);
      const y = Math.round(this.top);
      const stepA = !idle && this.onGround && Math.floor(this.runTimer / 0.1) % 2 === 0;
      const rect = (rx, ry, rw, rh) => ctx.fillRect(x + rx, y + ry, rw, rh);

      ctx.fillStyle = colors.fg;

      if (this.ducking) {
        rect(40, 0, 18, 14);   // head
        rect(6, 6, 36, 16);    // body
        rect(0, 8, 8, 6);      // tail
        rect(12, 22, 8, stepA ? 6 : 3);  // legs
        rect(30, 22, 8, stepA ? 3 : 6);
        ctx.fillStyle = colors.stage;
        this._drawEye(ctx, x + 50, y + 3, dead);
        return;
      }

      rect(24, 0, 20, 16);   // head
      rect(12, 14, 22, 22);  // body
      rect(0, 16, 14, 8);    // tail base
      rect(4, 22, 10, 6);    // tail tip
      rect(32, 26, 9, 3);    // arm
      // Legs: in the air both are extended, on the ground they alternate.
      const airborne = !this.onGround;
      rect(14, 36, 8, airborne || stepA ? 12 : 6);
      rect(26, 36, 8, airborne || !stepA ? 12 : 6);
      ctx.fillStyle = colors.stage;
      this._drawEye(ctx, x + 36, y + 4, dead);
    }

    _drawEye(ctx, ex, ey, dead) {
      if (!dead) {
        ctx.fillRect(ex, ey, 4, 4);
        return;
      }
      // "X" eyes for the game-over pose
      ctx.fillRect(ex, ey, 2, 2);
      ctx.fillRect(ex + 2, ey + 2, 2, 2);
      ctx.fillRect(ex + 2, ey, 2, 2);
      ctx.fillRect(ex, ey + 2, 2, 2);
    }
  }

  global.Dino.Player = Player;
})(window);
