// Utilidades matemáticas y de interpolación compartidas por el motor.

export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export const lerp = (a, b, t) => a + (b - a) * t;

export const invLerp = (a, b, v) => (b === a ? 0 : clamp((v - a) / (b - a), 0, 1));

export const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);

export const rand = (min, max) => min + Math.random() * (max - min);

export const randInt = (min, max) => Math.floor(rand(min, max + 1));

export const choice = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export const TAU = Math.PI * 2;

// --- Easing (Robert Penner, forma compacta) ---
export const Easing = {
  linear: (t) => t,
  quadOut: (t) => 1 - (1 - t) * (1 - t),
  quadIn: (t) => t * t,
  cubicOut: (t) => 1 - Math.pow(1 - t, 3),
  cubicIn: (t) => t * t * t,
  backOut: (t) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  elasticOut: (t) => {
    const c4 = (2 * Math.PI) / 3;
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  sineInOut: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  expoOut: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
};

// Interpola un ángulo tomando el camino más corto (radianes).
export function lerpAngle(a, b, t) {
  let diff = (b - a) % TAU;
  if (diff > Math.PI) diff -= TAU;
  if (diff < -Math.PI) diff += TAU;
  return a + diff * t;
}

// Genera un id corto único para instancias en runtime.
let __id = 0;
export const uid = () => `o${(__id++).toString(36)}`;
