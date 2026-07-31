// Traduce el gesto de swipe sobre el tablero en una secuencia de combo.
// Cuida el "game feel": estela luminosa, partículas, escala de casillas,
// brillo y un ligero retroceso al abandonar una zona.

import { PointerTracker } from "../engine/input.js";
import { clamp } from "../engine/utils.js";

const TRAIL_MAX = 42;

export class SwipeSystem {
  constructor(canvas, camera, board, particles, audio, { onZoneEnter, onComplete, boardZ = 6 } = {}) {
    this.canvas = canvas;
    this.camera = camera;
    this.board = board;
    this.particles = particles;
    this.audio = audio;
    this.onZoneEnter = onZoneEnter ?? (() => {});
    this.onComplete = onComplete ?? (() => {});
    this.boardZ = boardZ;

    this.enabled = false;
    this.sequence = [];
    this.trail = [];
    this.currentZoneId = null;
    this.lastPoint = null;

    this.tracker = new PointerTracker(canvas, {
      onStart: (p) => this._start(p),
      onMove: (p) => this._move(p),
      onEnd: (p) => this._end(p),
    });
  }

  setEnabled(v) {
    this.enabled = v;
    if (!v) { this.sequence = []; this.trail = []; this.currentZoneId = null; }
  }

  _toWorld(p) {
    return this.camera.unproject(p.x, p.y, this.boardZ);
  }

  _start(p) {
    if (!this.enabled) return;
    this.sequence = [];
    this.trail = [];
    this.currentZoneId = null;
    this.lastPoint = p;
    this._sampleZone(p);
  }

  _move(p) {
    if (!this.enabled || !this.tracker.active) return;
    this._pushTrail(p);
    this._sampleZone(p);
    this.lastPoint = p;
  }

  _end() {
    if (!this.enabled) return;
    const seq = this.sequence.slice();
    this.onComplete(seq);
  }

  _pushTrail(p) {
    this.trail.push({ x: p.x, y: p.y, life: 0 });
    if (this.trail.length > TRAIL_MAX) this.trail.shift();
    if (this.lastPoint) {
      const dx = p.x - this.lastPoint.x, dy = p.y - this.lastPoint.y;
      const d = Math.hypot(dx, dy);
      if (d > 4) {
        this.particles.spawn({
          x: p.x, y: p.y,
          vx: -dx * 2 + (Math.random() - 0.5) * 40,
          vy: -dy * 2 + (Math.random() - 0.5) * 40,
          life: 0.35, size: Math.random() * 2.4 + 1.4,
          color: "#F5C518", gravity: 0, drag: 0.9, glow: true,
        });
      }
    }
  }

  _sampleZone(p) {
    const world = this._toWorld(p);
    const zone = this.board.zoneAt(world.x, world.y);
    const zoneId = zone ? zone.zoneId : null;

    if (zoneId && zoneId !== this.currentZoneId) {
      const alreadyUsed = zone.state !== "idle";
      if (!alreadyUsed) {
        this.board.markActive(zone.zoneId, this.sequence.length);
        this.sequence.push(zone.moveId);
        this.onZoneEnter(zone, this.sequence.length);
        this.audio?.playSwipeTick(this.sequence.length);
        this._burstAtZone(zone);
      }
      this.currentZoneId = zoneId;
    } else if (!zoneId && this.currentZoneId) {
      // Retroceso: la última zona "recula" ligeramente al abandonarla.
      const prev = this.board.zones.find((z) => z.zoneId === this.currentZoneId);
      if (prev) { prev.targetScale = 0.92; setTimeout(() => { prev.targetScale = 1; }, 90); }
      this.currentZoneId = null;
    }
  }

  _burstAtZone(zone) {
    const p = this.camera.project(zone.x, zone.y, this.boardZ);
    this.particles.burst(p.x, p.y, 14, {
      color: ["#F5C518", "#FFE9A6", "#ffffff"], minSpeed: 40, maxSpeed: 180,
      minLife: 0.25, maxLife: 0.5, gravity: 260, glow: true, minSize: 1.5, maxSize: 3.5,
    });
  }

  update(dt) {
    for (const t of this.trail) t.life += dt;
    this.trail = this.trail.filter((t) => t.life < 0.4);
  }

  render(ctx) {
    if (this.trail.length < 2) return;
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (let i = 1; i < this.trail.length; i++) {
      const a = this.trail[i - 1], b = this.trail[i];
      const t = i / this.trail.length;
      ctx.globalAlpha = t * 0.85;
      ctx.strokeStyle = "#F5C518";
      ctx.shadowBlur = 16;
      ctx.shadowColor = "#F5C518";
      ctx.lineWidth = clamp(9 * t, 1.5, 9);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  destroy() { this.tracker.destroy(); }
}
