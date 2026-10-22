/**
 * config.js
 * Central place for every tunable number in the game.
 * All modules hang off the single global `Dino` namespace.
 */
(function (global) {
  'use strict';

  const Dino = (global.Dino = global.Dino || {});

  Dino.CONFIG = Object.freeze({
    canvas: { width: 800, height: 300 },
    groundY: 240, // y coordinate of the ground line

    physics: {
      gravity: 2400,        // px / s^2
      jumpVelocity: 780,    // px / s (upwards)
      releaseGravityMul: 2.2, // extra gravity when jump key is released while rising (short hop)
      fastFallMul: 2.8,     // extra gravity when holding "down" in mid-air
      jumpBuffer: 0.1,      // seconds a jump press is remembered before landing
    },

    speed: {
      initial: 300,         // px / s
      max: 900,
      acceleration: 10,     // px / s gained per second of play
    },

    player: {
      x: 60,
      width: 44,
      height: 48,
      duckWidth: 58,
      duckHeight: 28,
      hitboxInset: 6,       // shrink hitbox so near-misses feel fair
    },

    obstacles: {
      minGapSeconds: 0.85,  // gap between obstacles, expressed in seconds of travel
      maxGapSeconds: 1.7,
      birdsAfterScore: 300, // birds only appear once the player is warmed up
      birdChance: 0.22,
      unicornsAfterScore: 100,
      unicornChance: 0.25,
      hitboxInset: 4,
    },

    score: {
      pointsPerPixel: 0.025,
      storageKey: 'dino-run:high-score',
    },
  });
})(window);
