// Efectos de impacto: cada golpe que conecta dispara partículas, shake de
// cámara, un destello y una onda expansiva. El objetivo es que cada golpe
// se sienta potente, tal como pide el diseño.

const WEIGHT_PROFILE = {
  jab: { shake: 4, particles: 10, flash: 0.10, ring: 18 },
  cross: { shake: 7, particles: 16, flash: 0.16, ring: 26 },
  hook: { shake: 11, particles: 22, flash: 0.22, ring: 34 },
  lowkick: { shake: 9, particles: 18, flash: 0.15, ring: 28 },
  highkick: { shake: 15, particles: 28, flash: 0.28, ring: 42 },
  takedown: { shake: 18, particles: 30, flash: 0.24, ring: 46 },
  clinch: { shake: 6, particles: 10, flash: 0.08, ring: 20 },
};

export class HitEffects {
  constructor(particles, camera, screenFx) {
    this.particles = particles;
    this.camera = camera;
    this.screenFx = screenFx;
    this.rings = [];
  }

  trigger(moveId, screenPoint, { blocked = false, corner = "A" } = {}) {
    const p = WEIGHT_PROFILE[moveId] ?? { shake: 6, particles: 12, flash: 0.12, ring: 22 };
    const color = corner === "A" ? ["#FF4B3E", "#FF9A8F", "#ffffff"] : ["#37C6FF", "#9FE7FF", "#ffffff"];

    if (blocked) {
      this.particles.burst(screenPoint.x, screenPoint.y, Math.round(p.particles * 0.5), {
        color: ["#F5C518", "#FFE9A6"], minSpeed: 30, maxSpeed: 110, minLife: 0.2, maxLife: 0.35,
        gravity: 180, shape: "spark", glow: true,
      });
      this.camera.shake(p.shake * 0.35);
      this.screenFx.flash(p.flash * 0.4);
      return;
    }

    this.particles.burst(screenPoint.x, screenPoint.y, p.particles, {
      color, minSpeed: 70, maxSpeed: 260, minLife: 0.22, maxLife: 0.48,
      gravity: 380, shape: "spark", glow: true, minSize: 2, maxSize: 4.5,
    });
    this.camera.shake(p.shake);
    this.screenFx.flash(p.flash);
    this.rings.push({ x: screenPoint.x, y: screenPoint.y, r: 4, maxR: p.ring * 2.2, life: 0, color });
  }

  update(dt) {
    for (const r of this.rings) {
      r.life += dt * 3.6;
      r.r = 4 + (r.maxR - 4) * Math.min(1, r.life);
    }
    this.rings = this.rings.filter((r) => r.life < 1);
  }

  render(ctx) {
    for (const r of this.rings) {
      const alpha = Math.max(0, 1 - r.life);
      ctx.save();
      ctx.globalAlpha = alpha * 0.7;
      ctx.strokeStyle = Array.isArray(r.color) ? r.color[0] : r.color;
      ctx.lineWidth = 3 * (1 - r.life * 0.6);
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}
