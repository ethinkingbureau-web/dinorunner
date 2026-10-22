/**
 * obstacles.js
 * Cacti and birds, plus the manager that spawns, moves and tests them.
 */
(function (global) {
  'use strict';

  const { CONFIG } = global.Dino;
  const cfg = CONFIG.obstacles;

  const rand = (min, max) => min + Math.random() * (max - min);
  const pick = (list) => list[Math.floor(Math.random() * list.length)];

  /* ---------------------------------------------------------------- */
  /* Base class                                                       */
  /* ---------------------------------------------------------------- */
  class Obstacle {
    constructor(x, bottom, w, h) {
      this.x = x;
      this.y = bottom - h;
      this.w = w;
      this.h = h;
    }

    get right() { return this.x + this.w; }

    get hitbox() {
      const i = cfg.hitboxInset;
      return { x: this.x + i, y: this.y + i, w: this.w - i * 2, h: this.h - i * 2 };
    }

    update(dt, speed) {
      this.x -= speed * dt;
    }
  }

  /* ---------------------------------------------------------------- */
  /* Cactus: a row of 1-3 plants, small or large                      */
  /* ---------------------------------------------------------------- */
  const CACTUS_SIZES = {
    small: { unitW: 18, h: 38 },
    large: { unitW: 24, h: 52 },
  };

  class Cactus extends Obstacle {
    constructor(x) {
      const size = pick(['small', 'large']);
      const count = pick([1, 1, 2, 3]);
      const { unitW, h } = CACTUS_SIZES[size];
      super(x, CONFIG.groundY, unitW * count + 3 * (count - 1), h);
      this.unitW = unitW;
      this.count = count;
    }

    draw(ctx, colors) {
      ctx.fillStyle = colors.fg;
      const { unitW, h, y } = this;
      for (let i = 0; i < this.count; i++) {
        const ux = Math.round(this.x + i * (unitW + 3));
        const trunkX = ux + unitW / 2 - 3;
        ctx.fillRect(trunkX, y, 6, h);                         // trunk
        ctx.fillRect(ux, y + h * 0.42, unitW / 2 - 2, 4);      // left arm (horizontal)
        ctx.fillRect(ux, y + h * 0.22, 4, h * 0.2 + 4);        // left arm (vertical)
        ctx.fillRect(trunkX + 6, y + h * 0.55, unitW / 2 - 3, 4); // right arm (horizontal)
        ctx.fillRect(ux + unitW - 4, y + h * 0.33, 4, h * 0.22 + 4); // right arm (vertical)
      }
    }
  }

  /* ---------------------------------------------------------------- */
  /* Bird: flies at one of three heights                              */
  /* ---------------------------------------------------------------- */
  // Distance from the ground to the bird's underside:
  //   8  -> must jump,  34 -> jump or duck,  70 -> just run (or duck)
  const BIRD_HEIGHTS = [8, 34, 70];

  class Bird extends Obstacle {
    constructor(x) {
      super(x, CONFIG.groundY - pick(BIRD_HEIGHTS), 46, 30);
      this.flap = Math.random();
    }

    update(dt, speed) {
      super.update(dt, speed);
      this.flap += dt;
    }

    draw(ctx, colors) {
      const x = Math.round(this.x);
      const y = Math.round(this.y);
      const wingUp = Math.floor(this.flap / 0.15) % 2 === 0;
      ctx.fillStyle = colors.fg;
      ctx.fillRect(x + 12, y + 12, 26, 10);                       // body
      ctx.fillRect(x + 4, y + 10, 10, 9);                         // head
      ctx.fillRect(x, y + 13, 5, 3);                              // beak
      ctx.fillRect(x + 36, y + 14, 10, 4);                        // tail
      if (wingUp) ctx.fillRect(x + 16, y + 1, 12, 11);            // wing up
      else ctx.fillRect(x + 16, y + 22, 12, 8);                   // wing down
      ctx.fillStyle = colors.stage;
      ctx.fillRect(x + 7, y + 12, 3, 3);                          // eye
    }
  }

  /* ---------------------------------------------------------------- */
  /* Manager                                                          */
  /* ---------------------------------------------------------------- */
  class ObstacleManager {
    constructor() {
      this.reset();
    }

    reset() {
      this.items = [];
      this.nextGap = 0.4 * CONFIG.speed.initial + 200; // generous first gap
    }

    update(dt, speed, score) {
      for (const o of this.items) o.update(dt, speed);
      this.items = this.items.filter((o) => o.right > -10);

      // Spawn once the last obstacle has travelled far enough.
      const last = this.items[this.items.length - 1];
      const distanceFromEdge = last ? CONFIG.canvas.width - last.right : Infinity;
      if (distanceFromEdge >= this.nextGap) {
        this._spawn(speed, score);
      }
    }

    _spawn(speed, score) {
      const x = CONFIG.canvas.width + 20;
      const canSpawnBird = score >= cfg.birdsAfterScore;
      const obstacle = canSpawnBird && Math.random() < cfg.birdChance ? new Bird(x) : new Cactus(x);
      this.items.push(obstacle);
      // Gaps are measured in seconds of travel, so they scale with speed and stay fair.
      this.nextGap = speed * rand(cfg.minGapSeconds, cfg.maxGapSeconds);
    }

    /** @param {{x:number,y:number,w:number,h:number}} box */
    collides(box) {
      return this.items.some((o) => {
        const b = o.hitbox;
        return box.x < b.x + b.w && box.x + box.w > b.x && box.y < b.y + b.h && box.y + box.h > b.y;
      });
    }

    draw(ctx, colors) {
      for (const o of this.items) o.draw(ctx, colors);
    }
  }

  global.Dino.ObstacleManager = ObstacleManager;
})(window);
