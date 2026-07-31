// Sistema de partículas genérico, ligero, sin asignaciones por frame
// (pool reutilizable) para mantener 60 FPS en móviles gama media.

import { rand } from "./utils.js";

const POOL_SIZE = 400;

export class ParticleSystem {
  constructor() {
    this.pool = new Array(POOL_SIZE).fill(null).map(() => ({
      active: false, x: 0, y: 0, vx: 0, vy: 0,
      life: 0, maxLife: 1, size: 2, color: "#fff",
      gravity: 0, drag: 0.98, shape: "circle", rotation: 0, vrot: 0, glow: false,
    }));
    this.cursor = 0;
  }

  spawn(opts) {
    const p = this.pool[this.cursor];
    this.cursor = (this.cursor + 1) % POOL_SIZE;
    p.active = true;
    p.x = opts.x; p.y = opts.y;
    p.vx = opts.vx ?? 0; p.vy = opts.vy ?? 0;
    p.life = 0;
    p.maxLife = opts.life ?? 0.6;
    p.size = opts.size ?? 3;
    p.color = opts.color ?? "#ffffff";
    p.gravity = opts.gravity ?? 0;
    p.drag = opts.drag ?? 0.98;
    p.shape = opts.shape ?? "circle";
    p.rotation = opts.rotation ?? 0;
    p.vrot = opts.vrot ?? 0;
    p.glow = !!opts.glow;
    return p;
  }

  burst(x, y, count, opts = {}) {
    for (let i = 0; i < count; i++) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(opts.minSpeed ?? 60, opts.maxSpeed ?? 220);
      this.spawn({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed * (opts.flatten ?? 1),
        life: rand(opts.minLife ?? 0.25, opts.maxLife ?? 0.55),
        size: rand(opts.minSize ?? 2, opts.maxSize ?? 5),
        color: Array.isArray(opts.color) ? opts.color[i % opts.color.length] : (opts.color ?? "#fff"),
        gravity: opts.gravity ?? 420,
        drag: opts.drag ?? 0.94,
        shape: opts.shape ?? "circle",
        glow: opts.glow,
      });
    }
  }

  update(dt) {
    for (const p of this.pool) {
      if (!p.active) continue;
      p.life += dt;
      if (p.life >= p.maxLife) { p.active = false; continue; }
      p.vy += p.gravity * dt;
      p.vx *= Math.pow(p.drag, dt * 60);
      p.vy *= Math.pow(p.drag, dt * 60);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rotation += p.vrot * dt;
    }
  }

  render(ctx) {
    for (const p of this.pool) {
      if (!p.active) continue;
      const t = p.life / p.maxLife;
      const alpha = 1 - t;
      ctx.save();
      ctx.globalAlpha = Math.max(0, alpha);
      if (p.glow) {
        ctx.shadowBlur = 14;
        ctx.shadowColor = p.color;
      }
      ctx.fillStyle = p.color;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      const size = p.size * (0.4 + alpha * 0.6);
      if (p.shape === "circle") {
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === "spark") {
        ctx.fillRect(-size * 1.8, -size * 0.35, size * 3.6, size * 0.7);
      } else {
        ctx.fillRect(-size / 2, -size / 2, size, size);
      }
      ctx.restore();
    }
  }

  clear() { for (const p of this.pool) p.active = false; }
}
