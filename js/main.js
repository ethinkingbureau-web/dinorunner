/**
 * main.js
 * Entry point: find the DOM elements and boot the game.
 */
(function (global) {
  'use strict';

  window.addEventListener('DOMContentLoaded', () => {
    const $ = (id) => document.getElementById(id);

    const game = new global.Dino.Game({
      canvas: $('game-canvas'),
      overlay: $('game-over'),
      finalScore: $('final-score'),
      bestScore: $('best-score'),
      restartButton: $('restart-btn'),
    });

    game.init();
    global.dinoGame = game; // handy for debugging in the console
  });
})(window);
