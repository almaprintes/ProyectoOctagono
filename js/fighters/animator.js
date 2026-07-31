// Animador procedural: reproduce animaciones definidas por keyframes de
// pose y las funde entre sí para que nunca haya "saltos" visuales al
// encadenar movimientos dentro de un mismo combo.

import { clamp, lerp, Easing } from "../engine/utils.js";
import { IDLE_POSE, getMoveAnimation, getReactionAnimation } from "../animations/moveAnimations.js";

function samplePose(frames, t) {
  let i = 0;
  while (i < frames.length - 1 && frames[i + 1].t <= t) i++;
  const kA = frames[i];
  const kB = frames[Math.min(i + 1, frames.length - 1)];
  const span = kB.t - kA.t || 1;
  const localT = span > 0 ? clamp((t - kA.t) / span, 0, 1) : 1;
  const poseA = { ...IDLE_POSE, ...kA.pose };
  const poseB = { ...IDLE_POSE, ...kB.pose };
  const out = {};
  for (const key in IDLE_POSE) out[key] = lerp(poseA[key], poseB[key], localT);
  return out;
}

function blend(a, b, t) {
  const out = {};
  for (const key in IDLE_POSE) out[key] = lerp(a[key], b[key], t);
  return out;
}

export class Animator {
  constructor() {
    this.current = null; // { name, duration, elapsed, kind }
    this.prevSnapshot = { ...IDLE_POSE };
    this.blendT = 1;
    this.onComplete = null;
    this.idleTime = 0;
  }

  play(name, durationMs, kind = "move", onComplete = null, hold = false) {
    this.prevSnapshot = this.getPose();
    this.current = { name, duration: Math.max(durationMs, 40) / 1000, elapsed: 0, kind, hold, completed: false };
    this.blendT = 0;
    this.onComplete = onComplete;
  }

  stop() {
    this.prevSnapshot = this.getPose();
    this.current = null;
    this.blendT = 0;
    this.onComplete = null;
  }

  get playing() { return !!this.current; }
  get activeName() { return this.current ? this.current.name : "idle"; }
  get progress() { return this.current ? clamp(this.current.elapsed / this.current.duration, 0, 1) : 0; }

  update(dt) {
    this.idleTime += dt;
    this.blendT = Math.min(1, this.blendT + dt * 9);
    if (!this.current || this.current.completed) return;
    this.current.elapsed += dt;
    if (this.current.elapsed >= this.current.duration) {
      this.current.elapsed = this.current.duration;
      const cb = this.onComplete;
      this.onComplete = null;
      if (this.current.hold) {
        // Se queda congelado en la última pose (p.ej. tendido tras un derribo)
        // hasta que se llame a play() de nuevo.
        this.current.completed = true;
      } else {
        this.current = null;
      }
      if (cb) cb();
    }
  }

  getPose() {
    let target;
    if (this.current) {
      const frames = this.current.kind === "reaction"
        ? getReactionAnimation(this.current.name)
        : getMoveAnimation(this.current.name);
      target = frames ? samplePose(frames, this.progress) : IDLE_POSE;
    } else {
      // Balanceo sutil de reposo (respiración / guardia viva).
      const breathe = Math.sin(this.idleTime * 2.1) * 0.02;
      target = { ...IDLE_POSE, torsoBob: Math.sin(this.idleTime * 2.1) * 1.4, headTilt: breathe };
    }
    if (this.blendT < 1) return blend(this.prevSnapshot, target, Easing.cubicOut(this.blendT));
    return target;
  }
}
