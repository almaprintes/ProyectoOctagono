// Cámara 2.5D: simula un encuadre ligeramente inclinado sobre el octágono
// mediante una proyección "world -> screen" (escala vertical + parallax
// por profundidad), más shake y zoom para el game feel.

import { clamp, lerp, rand } from "./utils.js";

export class Camera {
  constructor(width, height) {
    this.width = width;
    this.height = height;

    // Centro del octágono en coordenadas de pantalla.
    this.originX = width / 2;
    this.originY = height * 0.52;

    // Tilt: aplasta el eje Z sobre Y para dar sensación de vista inclinada.
    this.tilt = 0.62;
    this.baseScale = 1;
    this.zoom = 1;
    this.targetZoom = 1;

    this.shakeAmp = 0;
    this.shakeDecay = 6.5;
    this.shakeSeed = Math.random() * 1000;
    this.time = 0;

    this.offsetX = 0;
    this.offsetY = 0;
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this.originX = width / 2;
    this.originY = height * 0.52;
    // Escala de referencia para que el octágono quepa en cualquier móvil.
    this.baseScale = Math.min(width, height * 1.15) / 720;
  }

  shake(amount) {
    this.shakeAmp = Math.min(this.shakeAmp + amount, 46);
  }

  setZoom(z) { this.targetZoom = z; }

  update(dt) {
    this.time += dt;
    this.shakeAmp = Math.max(0, this.shakeAmp - this.shakeDecay * this.shakeAmp * dt * 2.2);
    this.zoom = lerp(this.zoom, this.targetZoom, clamp(dt * 6, 0, 1));

    if (this.shakeAmp > 0.05) {
      const t = this.time * 28 + this.shakeSeed;
      this.offsetX = Math.sin(t) * this.shakeAmp;
      this.offsetY = Math.cos(t * 1.3) * this.shakeAmp * 0.6;
    } else {
      this.offsetX = lerp(this.offsetX, 0, 0.2);
      this.offsetY = lerp(this.offsetY, 0, 0.2);
    }
  }

  // Proyecta un punto del "mundo" (x, y = profundidad en la lona, z = altura)
  // a coordenadas de pantalla.
  project(x, y, z = 0) {
    const s = this.baseScale * this.zoom;
    const sx = this.originX + (x * s) + this.offsetX;
    const sy = this.originY + (y * this.tilt * s) - (z * s) + this.offsetY;
    return { x: sx, y: sy, scale: s * (1 + y * 0.0007) };
  }

  // Aplica el contexto de cámara (para elementos que se dibujan ya
  // proyectados manualmente no hace falta, se usa para overlays globales).
  applyShakeOnly(ctx) {
    ctx.translate(this.offsetX, this.offsetY);
  }

  // Inversa aproximada de project(), asumiendo una altura z fija (se usa
  // para convertir toques de pantalla en coordenadas de mundo del tablero).
  unproject(screenX, screenY, z = 0) {
    const s = this.baseScale * this.zoom;
    const x = (screenX - this.originX - this.offsetX) / s;
    const y = (screenY - this.originY - this.offsetY + z * s) / (this.tilt * s);
    return { x, y };
  }
}
