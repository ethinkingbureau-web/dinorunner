/**
 * game.js
 * Owns the game loop, the state machine (ready -> running -> over)
 * and wires all the other modules together.
 */
(function (global) {
  'use strict';

  const { CONFIG, Input, Player, ObstacleManager, Background, Score } = global.Dino;

  const STATE = Object.freeze({ READY: 'ready', RUNNING: 'running', OVER: 'over' });
  const MAX_FRAME_TIME = 0.05;   // clamp dt so a background tab can't cause a huge physics step
  const RESTART_LOCKOUT_MS = 350; // stops frantic jump-mashing from instantly restarting

  class Game {
    /**
     * @param {object} els DOM references
     * @param {HTMLCanvasElement} els.canvas
     * @param {HTMLElement} els.overlay
     * @param {HTMLElement} els.finalScore
     * @param {HTMLElement} els.bestScore
     * @param {HTMLButtonElement} els.restartButton
     */
    constructor(els) {
      this.els = els;
      this.ctx = els.canvas.getContext('2d');

      this.input = new Input(els.canvas);
      this.player = new Player();
      this.obstacles = new ObstacleManager();
      this.background = new Background();
      this.score = new Score();

      this.state = STATE.READY;
      this.speed = CONFIG.speed.initial;
      this.elapsed = 0;
      this.overAt = 0;
      this.lastTime = 0;

      this.colors = this._readColors();
      this._loop = this._loop.bind(this);
    }

    /* ------------------------------ lifecycle ------------------------------ */

    init() {
      this._setupCanvas();
      this._bindEvents();
      this.input.attach();
      requestAnimationFrame((t) => {
        this.lastTime = t;
        this._loop(t);
      });
    }

    start() {
      this.state = STATE.RUNNING;
    }

    restart() {
      if (this.state !== STATE.OVER) return;
      if (performance.now() - this.overAt < RESTART_LOCKOUT_MS) return;

      this.player.reset();
      this.obstacles.reset();
      this.background.reset();
      this.score.reset();
      this.speed = CONFIG.speed.initial;
      this.elapsed = 0;

      this.els.overlay.hidden = true;
      this.els.restartButton.blur(); // so Space doesn't re-trigger the button
      this.state = STATE.RUNNING;
    }

    gameOver() {
      this.state = STATE.OVER;
      this.overAt = performance.now();
      this.score.commit();

      this.els.finalScore.textContent = this.score.value;
      this.els.bestScore.textContent = this.score.high;
      this.els.overlay.hidden = false;
      this.els.restartButton.focus({ preventScroll: true });
    }

    /* ------------------------------ setup ------------------------------ */

    _setupCanvas() {
      // Render at device resolution so sprites stay crisp on HiDPI screens.
      const { canvas } = this.els;
      const dpr = Math.max(1, Math.floor(global.devicePixelRatio || 1));
      canvas.width = CONFIG.canvas.width * dpr;
      canvas.height = CONFIG.canvas.height * dpr;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    _bindEvents() {
      this.input.onJump = () => this._handleJump();
      this.input.onConfirm = () => this._handleConfirm();
      this.els.restartButton.addEventListener('click', () => this.restart());

      // Keep canvas colours in sync with the OS light/dark setting.
      const mq = global.matchMedia && global.matchMedia('(prefers-color-scheme: dark)');
      if (mq && mq.addEventListener) {
        mq.addEventListener('change', () => { this.colors = this._readColors(); });
      }
    }

    _readColors() {
      const css = getComputedStyle(document.documentElement);
      const get = (name) => css.getPropertyValue(name).trim();
      return {
        fg: get('--fg'),
        stage: get('--stage-bg'),
        muted: get('--muted'),
        hill: get('--hill'),
        cloud: get('--cloud'),
      };
    }

    /* ------------------------------ input handlers ------------------------------ */

    _handleJump() {
      switch (this.state) {
        case STATE.READY:
          this.start();
          this.player.queueJump();
          break;
        case STATE.RUNNING:
          this.player.queueJump();
          break;
        case STATE.OVER:
          this.restart();
          break;
      }
    }

    _handleConfirm() {
      if (this.state === STATE.READY) this.start();
      else if (this.state === STATE.OVER) this.restart();
    }

    /* ------------------------------ loop ------------------------------ */

    _loop(now) {
      const dt = Math.min((now - this.lastTime) / 1000, MAX_FRAME_TIME);
      this.lastTime = now;

      this._update(dt);
      this._render();
      requestAnimationFrame(this._loop);
    }

    _update(dt) {
      if (this.state !== STATE.RUNNING) return;

      this.elapsed += dt;
      this.speed = Math.min(CONFIG.speed.max, CONFIG.speed.initial + CONFIG.speed.acceleration * this.elapsed);

      this.player.update(dt, this.input, this.speed);
      this.obstacles.update(dt, this.speed, this.score.value);
      this.background.update(dt, this.speed);
      this.score.update(dt, this.speed);

      if (this.obstacles.collides(this.player.hitbox)) this.gameOver();
    }

    _render() {
      const { ctx, colors } = this;
      const { width, height } = CONFIG.canvas;

      ctx.fillStyle = colors.stage;
      ctx.fillRect(0, 0, width, height);

      this.background.draw(ctx, colors);
      this.obstacles.draw(ctx, colors);
      this.player.draw(ctx, colors, {
        dead: this.state === STATE.OVER,
        idle: this.state === STATE.READY,
      });
      this.score.draw(ctx, colors);

      if (this.state === STATE.READY) this._drawReadyPrompt();
    }

    _drawReadyPrompt() {
      const { ctx, colors } = this;
      ctx.fillStyle = colors.fg;
      ctx.font = '600 20px ui-monospace, Menlo, Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Press SPACE or ↑ to start', CONFIG.canvas.width / 2, 120);
    }
  }

  global.Dino.Game = Game;
})(window);
