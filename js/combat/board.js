// El tablero táctico: vive integrado en la lona del octágono. Cada ronda
// genera un subconjunto distinto de zonas (acciones) en posiciones nuevas,
// para que el tablero nunca sea exactamente igual dos veces.

import { getMove, MOVE_LIST } from "../data/moves.js";
import { rand, shuffle, clamp, TAU } from "../engine/utils.js";

const ZONE_RADIUS = 30; // unidades de mundo
const MIN_SEPARATION = 78;
const RING_INNER = 95;
const RING_OUTER = 250;

// Frecuencia con la que cada acción tiende a aparecer en el tablero.
// Permite repeticiones (p.ej. dos zonas de Jab) para que combos como
// jab-jab-paso-low kick-derribo sean dibujables, tal como pide el diseño.
const ZONE_FREQUENCY = {
  jab: 3.2, cross: 2.6, hook: 2.0, lowkick: 1.9, highkick: 1.2,
  step: 1.7, dodge: 1.8, guard: 1.8, clinch: 1.0, escape: 1.0, takedown: 0.7,
};

function drawIcon(ctx, moveId, size, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = size * 0.16;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const s = size;
  switch (moveId) {
    case "jab":
      ctx.beginPath(); ctx.moveTo(-s * 0.5, 0); ctx.lineTo(s * 0.35, 0);
      ctx.moveTo(s * 0.15, -s * 0.22); ctx.lineTo(s * 0.35, 0); ctx.lineTo(s * 0.15, s * 0.22);
      ctx.stroke();
      break;
    case "cross":
      ctx.beginPath(); ctx.moveTo(-s * 0.55, 0); ctx.lineTo(s * 0.5, 0);
      ctx.moveTo(s * 0.24, -s * 0.3); ctx.lineTo(s * 0.5, 0); ctx.lineTo(s * 0.24, s * 0.3);
      ctx.stroke();
      break;
    case "hook":
      ctx.beginPath(); ctx.arc(0, s * 0.1, s * 0.4, Math.PI * 1.1, Math.PI * 1.85);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(s * 0.32, -s * 0.18); ctx.lineTo(s * 0.42, s * 0.02); ctx.lineTo(s * 0.2, s * 0.02);
      ctx.fill();
      break;
    case "lowkick":
      ctx.beginPath(); ctx.moveTo(-s * 0.4, -s * 0.35); ctx.lineTo(s * 0.35, s * 0.3);
      ctx.moveTo(s * 0.08, s * 0.3); ctx.lineTo(s * 0.35, s * 0.3); ctx.lineTo(s * 0.28, s * 0.05);
      ctx.stroke();
      break;
    case "highkick":
      ctx.beginPath(); ctx.moveTo(-s * 0.4, s * 0.35); ctx.lineTo(s * 0.35, -s * 0.3);
      ctx.moveTo(s * 0.08, -s * 0.3); ctx.lineTo(s * 0.35, -s * 0.3); ctx.lineTo(s * 0.28, -s * 0.05);
      ctx.stroke();
      break;
    case "step":
      ctx.beginPath(); ctx.ellipse(-s * 0.18, -s * 0.15, s * 0.13, s * 0.2, 0.3, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(s * 0.2, s * 0.18, s * 0.13, s * 0.2, 0.3, 0, TAU); ctx.fill();
      break;
    case "dodge":
      ctx.beginPath();
      ctx.moveTo(-s * 0.5, 0);
      ctx.bezierCurveTo(-s * 0.2, -s * 0.4, s * 0.2, s * 0.4, s * 0.5, 0);
      ctx.stroke();
      break;
    case "guard":
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.42);
      ctx.quadraticCurveTo(s * 0.42, -s * 0.3, s * 0.4, s * 0.05);
      ctx.quadraticCurveTo(s * 0.35, s * 0.35, 0, s * 0.48);
      ctx.quadraticCurveTo(-s * 0.35, s * 0.35, -s * 0.4, s * 0.05);
      ctx.quadraticCurveTo(-s * 0.42, -s * 0.3, 0, -s * 0.42);
      ctx.stroke();
      break;
    case "takedown":
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.42); ctx.lineTo(0, s * 0.28);
      ctx.moveTo(-s * 0.24, s * 0.02); ctx.lineTo(0, s * 0.28); ctx.lineTo(s * 0.24, s * 0.02);
      ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, s * 0.4, s * 0.26, s * 0.08, 0, 0, TAU); ctx.stroke();
      break;
    case "clinch":
      ctx.beginPath(); ctx.arc(-s * 0.16, 0, s * 0.28, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.arc(s * 0.16, 0, s * 0.28, 0, TAU); ctx.stroke();
      break;
    case "escape":
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-s * 0.45, -s * 0.3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-s * 0.45, s * 0.3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(s * 0.4, 0); ctx.stroke();
      break;
    default:
      ctx.beginPath(); ctx.arc(0, 0, s * 0.3, 0, TAU); ctx.stroke();
  }
  ctx.restore();
}

export class OctagonBoard {
  constructor() {
    this.zones = [];
    this.time = 0;
    this.ambient = [];
    for (let i = 0; i < 22; i++) {
      this.ambient.push({
        a: rand(0, TAU), r: rand(RING_INNER * 0.4, RING_OUTER * 1.05),
        speed: rand(0.02, 0.07), y: rand(-140, 160), flicker: rand(0, TAU),
      });
    }
  }

  // Muestreo ponderado CON reemplazo: el mismo movimiento puede aparecer
  // más de una vez. Garantiza al menos una zona defensiva para que
  // siempre exista un final de combo protector disponible.
  _weightedPick(moveIds, count) {
    const pool = moveIds.map((id) => ({ id, w: ZONE_FREQUENCY[id] ?? 1 }));
    const picked = [];

    const guaranteedDefense = Math.random() < 0.5 ? "guard" : "dodge";
    if (moveIds.includes(guaranteedDefense)) picked.push(guaranteedDefense);

    while (picked.length < count) {
      const total = pool.reduce((s, e) => s + e.w, 0);
      let r = rand(0, total);
      let chosen = pool[0]?.id;
      for (const e of pool) { r -= e.w; if (r <= 0) { chosen = e.id; break; } }
      picked.push(chosen);
    }
    return shuffle(picked);
  }

  generate(moveIds, count = 7) {
    const picked = this._weightedPick(moveIds, count);
    const placed = [];
    let attempts = 0;
    while (placed.length < picked.length && attempts < 400) {
      attempts++;
      const angle = rand(0, TAU);
      const r = rand(RING_INNER, RING_OUTER);
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r * 0.62;
      const ok = placed.every((p) => Math.hypot(p.x - x, p.y - y) > MIN_SEPARATION);
      if (ok) placed.push({ x, y });
    }
    this.zones = picked.map((moveId, i) => ({
      zoneId: `z${i}_${moveId}`,
      moveId,
      x: placed[i]?.x ?? rand(-180, 180),
      y: placed[i]?.y ?? rand(-100, 120),
      scale: 0,
      targetScale: 1,
      glow: 0,
      state: "idle", // idle | active | used | locked
      order: -1,
      spawnDelay: i * 0.035,
    }));
    return this.zones;
  }

  zoneAt(worldX, worldY) {
    let best = null, bestD = ZONE_RADIUS * 1.6;
    for (const z of this.zones) {
      if (z.state === "locked") continue;
      const d = Math.hypot(z.x - worldX, z.y - worldY);
      if (d < bestD) { bestD = d; best = z; }
    }
    return best;
  }

  markActive(zoneId, order) {
    const z = this.zones.find((zz) => zz.zoneId === zoneId);
    if (z && z.state === "idle") { z.state = "active"; z.order = order; z.glow = 1; }
  }

  reset() {
    for (const z of this.zones) { z.state = "idle"; z.order = -1; z.glow = 0; }
  }

  lockAll() { for (const z of this.zones) { z.state = "locked"; z.targetScale = 0; } }

  update(dt) {
    this.time += dt;
    for (const z of this.zones) {
      if (this.time > z.spawnDelay) {
        z.scale += (z.targetScale - z.scale) * clamp(dt * 10, 0, 1);
      }
      z.glow = Math.max(0, z.glow - dt * 1.6);
    }
    for (const a of this.ambient) {
      a.a += a.speed * dt * 10;
      a.flicker += dt * 2;
    }
  }

  renderMat(ctx, camera) {
    const c = camera.project(0, 0, 0);
    const rOuter = RING_OUTER * 1.28 * c.scale;

    // Vignette exterior.
    ctx.save();
    const grad = ctx.createRadialGradient(c.x, c.y, rOuter * 0.15, c.x, c.y, rOuter);
    grad.addColorStop(0, "#232842");
    grad.addColorStop(0.55, "#1B1E2B");
    grad.addColorStop(1, "#0A0B12");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, rOuter, rOuter * 0.66, 0, 0, TAU);
    ctx.fill();

    // Octágono estructural (cage) como anillo de líneas.
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= 8; i++) {
      const a = (i / 8) * TAU - Math.PI / 8;
      const wx = Math.cos(a) * RING_OUTER * 1.22;
      const wy = Math.sin(a) * RING_OUTER * 1.22 * 0.62;
      const p = camera.project(wx, wy, 0);
      if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();

    // Barrido de radar táctico (elemento de firma visual).
    const sweepA = (this.time * 0.5) % TAU;
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, rOuter, rOuter * 0.66, 0, 0, TAU);
    ctx.clip();
    ctx.globalAlpha = 0.16;
    const sweepLen = 1.1;
    const gradSweep = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, rOuter);
    gradSweep.addColorStop(0, "rgba(55,198,255,0.5)");
    gradSweep.addColorStop(1, "rgba(55,198,255,0)");
    ctx.translate(c.x, c.y);
    ctx.rotate(sweepA);
    ctx.fillStyle = gradSweep;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, rOuter, -sweepLen / 2, sweepLen / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Líneas tácticas concéntricas.
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    for (const rr of [0.35, 0.62, 0.9]) {
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, rOuter * rr, rOuter * rr * 0.66, 0, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();

    // Partículas ambientales (polvo/luz suspendida).
    ctx.save();
    for (const a of this.ambient) {
      const wx = Math.cos(a.a) * a.r;
      const wy = Math.sin(a.a) * a.r * 0.62;
      const p = camera.project(wx, a.y, 6 + Math.sin(a.flicker) * 4);
      ctx.globalAlpha = 0.10 + Math.sin(a.flicker) * 0.05;
      ctx.fillStyle = "#8fa3ff";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.6 * p.scale, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  renderZones(ctx, camera) {
    for (const z of this.zones) {
      if (z.scale <= 0.01) continue;
      const move = getMove(z.moveId);
      const p = camera.project(z.x, z.y, 6);
      const s = z.scale * p.scale;
      const active = z.state === "active";
      const baseColor = active ? "#F5C518" : "rgba(232,230,240,0.85)";
      const panelColor = active ? "rgba(245,197,24,0.20)" : "rgba(255,255,255,0.055)";
      const borderColor = active ? "#F5C518" : "rgba(255,255,255,0.22)";

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(Math.PI / 4);
      const size = ZONE_RADIUS * s * (1 + z.glow * 0.22);

      if (active || z.glow > 0.05) {
        ctx.shadowBlur = 22 * s;
        ctx.shadowColor = "#F5C518";
      }
      ctx.fillStyle = panelColor;
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = active ? 2.4 * s : 1.4 * s;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(-size, -size, size * 2, size * 2, size * 0.28) : ctx.rect(-size, -size, size * 2, size * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.translate(p.x, p.y);
      drawIcon(ctx, z.moveId, ZONE_RADIUS * s * 0.95, baseColor);
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = active ? "#F5C518" : "rgba(232,230,240,0.7)";
      ctx.font = `700 ${9 * s}px Arial Narrow, Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(move.short, p.x, p.y + ZONE_RADIUS * s + 12 * s);
      ctx.restore();
    }
  }
}
