// Efectos de pantalla globales: destello (flash), slow-motion, zoom de
// cámara y una estela de movimiento barata (no se limpia el canvas por
// completo durante unos frames, dejando un rastro translúcido).

import { clamp } from "../engine/utils.js";

export class ScreenEffects {
  constructor(camera, loop) {
    this.camera = camera;
    this.loop = loop;
    this.flashAmount = 0;
    this.trailAmount = 0;
    this._slowMoTimer = null;
  }

  flash(amount) {
    this.flashAmount = clamp(this.flashAmount + amount, 0, 1);
  }

  trail(amount) {
    this.trailAmount = clamp(Math.max(this.trailAmount, amount), 0, 0.85);
  }

  slowMotion(scale, durationMs) {
    this.loop.setTimeScale(scale);
    if (this._slowMoTimer) clearTimeout(this._slowMoTimer);
    this._slowMoTimer = setTimeout(() => {
      this.loop.setTimeScale(1);
      this._slowMoTimer = null;
    }, durationMs);
  }

  zoom(level) { this.camera.setZoom(level); }
  resetZoom() { this.camera.setZoom(1); }

  update(dt) {
    this.flashAmount = Math.max(0, this.flashAmount - dt * 3.2);
    this.trailAmount = Math.max(0, this.trailAmount - dt * 1.6);
  }

  // Devuelve la opacidad de "borrado" a usar en vez de un clearRect total.
  get clearAlpha() { return 1 - this.trailAmount; }

  renderFlash(ctx, width, height) {
    if (this.flashAmount <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = this.flashAmount;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
}
