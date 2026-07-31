// Definición vectorial del "muñeco" de cada luchador: proporciones por
// complexión (build). No son imágenes rasterizadas — son medidas en
// unidades locales que fighterRenderer.js usa para dibujar cápsulas y
// arcos con canvas 2D. Esto permite un estilo gráfico propio (bloques
// estilizados, pocas proporciones, mucha personalidad) sin depender de
// sprites externos, y anima perfectamente a 60 FPS.

export const BODY_BUILDS = {
  compact: {
    scale: 1.0, headR: 15, neckW: 10,
    torsoW: 34, torsoH: 52, hipW: 30,
    shoulderW: 40, upperArmLen: 26, upperArmW: 13, forearmLen: 24, forearmW: 11, fistR: 9,
    thighLen: 30, thighW: 15, shinLen: 28, shinW: 12, footLen: 16,
  },
  balanced: {
    scale: 1.04, headR: 15.5, neckW: 10,
    torsoW: 35, torsoH: 55, hipW: 31,
    shoulderW: 43, upperArmLen: 28, upperArmW: 12.5, forearmLen: 26, forearmW: 10.5, fistR: 8.5,
    thighLen: 32, thighW: 15, shinLen: 31, shinW: 11.5, footLen: 17,
  },
  heavy: {
    scale: 1.12, headR: 17, neckW: 13,
    torsoW: 42, torsoH: 56, hipW: 38,
    shoulderW: 50, upperArmLen: 27, upperArmW: 16, forearmLen: 25, forearmW: 14, fistR: 10.5,
    thighLen: 32, thighW: 19, shinLen: 30, shinW: 15, footLen: 18,
  },
  lean: {
    scale: 0.97, headR: 14, neckW: 8.5,
    torsoW: 30, torsoH: 54, hipW: 26,
    shoulderW: 37, upperArmLen: 29, upperArmW: 10.5, forearmLen: 27, forearmW: 9, fistR: 7.5,
    thighLen: 33, thighW: 12.5, shinLen: 32, shinW: 10, footLen: 16,
  },
};

export function getBuild(id) { return BODY_BUILDS[id] ?? BODY_BUILDS.balanced; }
