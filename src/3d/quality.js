/**
 * Lightweight adaptive quality policy for the shared MapLibre/Three renderer.
 * It only reacts to measured frame time; it never invents FPS or GPU metrics.
 */
export const QUALITY_PROFILES = Object.freeze({
  high: Object.freeze({ pixelRatioScale: 1, shadowMap: true, maxDpr: 2 }),
  balanced: Object.freeze({ pixelRatioScale: 0.85, shadowMap: false, maxDpr: 1.5 }),
  low: Object.freeze({ pixelRatioScale: 0.7, shadowMap: false, maxDpr: 1 })
});

export function createAdaptiveQualityController({
  targetFrameMs = 16.7,
  downgradeAfter = 8,
  upgradeAfter = 45,
  initial = 'high'
} = {}) {
  const levels = ['high', 'balanced', 'low'];
  let level = levels.includes(initial) ? initial : 'high';
  let slowFrames = 0;
  let fastFrames = 0;

  return {
    get level() { return level; },
    get profile() { return QUALITY_PROFILES[level]; },
    sample(frameMs) {
      if (!Number.isFinite(frameMs) || frameMs <= 0) return level;
      if (frameMs > targetFrameMs * 1.25) {
        slowFrames += 1;
        fastFrames = 0;
      } else if (frameMs < targetFrameMs * 0.8) {
        fastFrames += 1;
        slowFrames = 0;
      } else {
        slowFrames = 0;
        fastFrames = 0;
      }
      const current = levels.indexOf(level);
      if (slowFrames >= downgradeAfter && current < levels.length - 1) {
        level = levels[current + 1];
        slowFrames = 0;
      } else if (fastFrames >= upgradeAfter && current > 0) {
        level = levels[current - 1];
        fastFrames = 0;
      }
      return level;
    }
  };
}
