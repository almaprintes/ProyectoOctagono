// Datos de animación por keyframes (pose -> tiempo normalizado 0..1).
// El animator interpola entre keyframes y funde con la pose de reposo.
// Ángulos en radianes. "reach" es un avance cosmético a lo largo del eje
// que separa a los luchadores (no mueve la posición táctica real).

export const IDLE_POSE = {
  torsoLean: 0.05, torsoTwist: 0, torsoBob: 0, headTilt: 0,
  shoulderF: -0.45, elbowF: 1.15,
  shoulderR: -0.6, elbowR: 1.35,
  hipF: -0.12, kneeF: 0.35,
  hipR: 0.18, kneeR: 0.5,
  hipShiftX: 0, hipShiftY: 0,
  reach: 0,
};

const kf = (t, pose) => ({ t, pose });

// Cada entrada: array de keyframes que se recorre durante move.duration.
export const MOVE_ANIMATIONS = {
  jab: [
    kf(0.00, {}),
    kf(0.35, { shoulderF: 0.95, elbowF: 0.08, torsoTwist: 0.12, reach: 0.35, hipShiftX: 4 }),
    kf(0.55, { shoulderF: 1.05, elbowF: 0.02, torsoTwist: 0.16, reach: 0.42 }),
    kf(1.00, {}),
  ],
  cross: [
    kf(0.00, {}),
    kf(0.30, { torsoTwist: -0.22, hipShiftX: -5, shoulderR: 0.2, elbowR: 1.4 }),
    kf(0.55, { shoulderR: 1.15, elbowR: 0.04, torsoTwist: 0.34, hipShiftX: 8, reach: 0.55 }),
    kf(0.62, { shoulderR: 1.2, elbowR: 0, torsoTwist: 0.38, reach: 0.6 }),
    kf(1.00, {}),
  ],
  hook: [
    kf(0.00, {}),
    kf(0.28, { shoulderF: -1.1, elbowF: 1.5, torsoTwist: -0.3, hipShiftX: -6 }),
    kf(0.55, { shoulderF: 0.55, elbowF: 1.5, torsoTwist: 0.42, hipShiftX: 7, reach: 0.4 }),
    kf(0.68, { shoulderF: 0.7, elbowF: 1.55, torsoTwist: 0.5 }),
    kf(1.00, {}),
  ],
  lowkick: [
    kf(0.00, {}),
    kf(0.30, { hipR: -0.5, kneeR: 1.2, torsoLean: -0.08, hipShiftY: -3 }),
    kf(0.55, { hipR: 0.95, kneeR: 0.25, torsoTwist: 0.3, torsoLean: 0.18, reach: 0.3 }),
    kf(0.7, { hipR: 1.0, kneeR: 0.2 }),
    kf(1.00, {}),
  ],
  highkick: [
    kf(0.00, {}),
    kf(0.30, { hipR: -0.7, kneeR: 1.5, torsoLean: -0.22, hipShiftY: -6 }),
    kf(0.58, { hipR: 1.35, kneeR: 0.15, torsoLean: 0.05, torsoTwist: 0.36, hipShiftY: -14, reach: 0.32 }),
    kf(0.72, { hipR: 1.4, kneeR: 0.1, hipShiftY: -10 }),
    kf(1.00, {}),
  ],
  step: [
    kf(0.00, {}),
    kf(0.5, { hipShiftX: 10, torsoBob: -3, reach: 0.18 }),
    kf(1.00, {}),
  ],
  dodge: [
    kf(0.00, {}),
    kf(0.4, { torsoLean: -0.5, torsoTwist: -0.22, hipShiftY: 8, headTilt: -0.3 }),
    kf(0.75, { torsoLean: -0.5, torsoTwist: -0.22, hipShiftY: 8, headTilt: -0.3 }),
    kf(1.00, {}),
  ],
  guard: [
    kf(0.00, {}),
    kf(0.3, { shoulderF: -1.0, elbowF: 1.7, shoulderR: -1.05, elbowR: 1.75, torsoLean: 0.14, headTilt: 0.1 }),
    kf(0.85, { shoulderF: -1.0, elbowF: 1.7, shoulderR: -1.05, elbowR: 1.75, torsoLean: 0.14, headTilt: 0.1 }),
    kf(1.00, {}),
  ],
  takedown: [
    kf(0.00, {}),
    kf(0.25, { torsoLean: -0.6, hipShiftY: -10, hipF: -0.6, kneeF: 1.2 }),
    kf(0.55, { torsoLean: 0.55, hipShiftY: 6, reach: 0.75, hipShiftX: 14, hipF: 0.4, kneeF: 0.3 }),
    kf(0.8, { torsoLean: 0.7, reach: 0.85, hipShiftY: 10 }),
    kf(1.00, {}),
  ],
  clinch: [
    kf(0.00, {}),
    kf(0.35, { shoulderF: 0.3, elbowF: 1.6, shoulderR: 0.3, elbowR: 1.6, reach: 0.5, torsoLean: 0.2 }),
    kf(0.75, { shoulderF: 0.3, elbowF: 1.6, shoulderR: 0.3, elbowR: 1.6, reach: 0.5, torsoLean: 0.2 }),
    kf(1.00, {}),
  ],
  escape: [
    kf(0.00, {}),
    kf(0.5, { hipShiftX: -12, torsoLean: -0.1, reach: -0.3 }),
    kf(1.00, {}),
  ],
};

export const REACTION_ANIMATIONS = {
  hitLight: [
    kf(0.00, {}),
    kf(0.25, { torsoTwist: -0.3, headTilt: 0.35, hipShiftX: -6 }),
    kf(1.00, {}),
  ],
  hitHeavy: [
    kf(0.00, {}),
    kf(0.2, { torsoTwist: -0.55, headTilt: 0.6, hipShiftX: -12, torsoLean: -0.2 }),
    kf(0.6, { torsoTwist: -0.3, headTilt: 0.3, hipShiftX: -6 }),
    kf(1.00, {}),
  ],
  legHit: [
    kf(0.00, {}),
    kf(0.3, { hipShiftY: 10, kneeF: 1.0, torsoLean: 0.2 }),
    kf(1.00, {}),
  ],
  knockdown: [
    kf(0.00, {}),
    kf(0.4, { torsoLean: 0.9, hipShiftY: 20, headTilt: 0.4 }),
    kf(1.00, { torsoLean: 1.3, hipShiftY: 34, headTilt: 0.5 }),
  ],
  getUp: [
    kf(0.00, { torsoLean: 1.3, hipShiftY: 34, headTilt: 0.5 }),
    kf(0.6, { torsoLean: 0.4, hipShiftY: 10, headTilt: 0.1 }),
    kf(1.00, {}),
  ],
  celebrate: [
    kf(0.00, {}),
    kf(0.3, { shoulderF: -2.4, elbowF: 0.2, shoulderR: -2.4, elbowR: 0.2, torsoLean: -0.15, hipShiftY: -6 }),
    kf(0.65, { shoulderF: -2.6, elbowF: 0.1, shoulderR: -2.2, elbowR: 0.3, torsoLean: -0.1, hipShiftY: 0 }),
    kf(1.00, { shoulderF: -2.4, elbowF: 0.2, shoulderR: -2.4, elbowR: 0.2, torsoLean: -0.15, hipShiftY: -4 }),
  ],
};

export function getMoveAnimation(id) { return MOVE_ANIMATIONS[id]; }
export function getReactionAnimation(id) { return REACTION_ANIMATIONS[id]; }
