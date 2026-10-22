/**
 * input.js
 * Translates keyboard and touch events into a small, game-friendly API.
 *   input.jumpHeld / input.duckHeld  -> current state
 *   input.onJump / input.onConfirm   -> callbacks fired on a fresh press
 */
(function (global) {
  'use strict';

  const JUMP_KEYS = new Set(['Space', 'ArrowUp', 'KeyW']);
  const DUCK_KEYS = new Set(['ArrowDown', 'KeyS']);
  const CONFIRM_KEYS = new Set(['Enter']);

  class Input {
    /** @param {HTMLElement} touchTarget element that jumps when tapped */
    constructor(touchTarget) {
      this.jumpHeld = false;
      this.duckHeld = false;
      this.onJump = () => {};
      this.onConfirm = () => {};

      this._touchTarget = touchTarget;
      this._onKeyDown = this._onKeyDown.bind(this);
      this._onKeyUp = this._onKeyUp.bind(this);
      this._onPointerDown = this._onPointerDown.bind(this);
      this._onPointerUp = this._onPointerUp.bind(this);
      this._onBlur = this._onBlur.bind(this);
    }

    attach() {
      window.addEventListener('keydown', this._onKeyDown);
      window.addEventListener('keyup', this._onKeyUp);
      window.addEventListener('blur', this._onBlur);
      this._touchTarget.addEventListener('pointerdown', this._onPointerDown);
      window.addEventListener('pointerup', this._onPointerUp);
    }

    detach() {
      window.removeEventListener('keydown', this._onKeyDown);
      window.removeEventListener('keyup', this._onKeyUp);
      window.removeEventListener('blur', this._onBlur);
      this._touchTarget.removeEventListener('pointerdown', this._onPointerDown);
      window.removeEventListener('pointerup', this._onPointerUp);
    }

    _onKeyDown(e) {
      const { code } = e;
      if (JUMP_KEYS.has(code)) {
        e.preventDefault(); // stop the page scrolling
        if (!e.repeat) this._pressJump();
      } else if (DUCK_KEYS.has(code)) {
        e.preventDefault();
        this.duckHeld = true;
      } else if (CONFIRM_KEYS.has(code) && !e.repeat) {
        this.onConfirm();
      }
    }

    _onKeyUp(e) {
      if (JUMP_KEYS.has(e.code)) this.jumpHeld = false;
      else if (DUCK_KEYS.has(e.code)) this.duckHeld = false;
    }

    _onPointerDown(e) {
      e.preventDefault();
      this._pressJump();
    }

    _onPointerUp() {
      this.jumpHeld = false;
    }

    _onBlur() {
      this.jumpHeld = false;
      this.duckHeld = false;
    }

    _pressJump() {
      this.jumpHeld = true;
      this.onJump();
    }
  }

  global.Dino.Input = Input;
})(window);
