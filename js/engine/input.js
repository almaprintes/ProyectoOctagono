// Captura de puntero unificada (touch + ratón, para probar en escritorio).
// Sólo entrega coordenadas normalizadas al canvas; no conoce el tablero.

export class PointerTracker {
  constructor(canvas, { onStart, onMove, onEnd } = {}) {
    this.canvas = canvas;
    this.onStart = onStart ?? (() => {});
    this.onMove = onMove ?? (() => {});
    this.onEnd = onEnd ?? (() => {});
    this.active = false;
    this.pointerId = null;

    this._down = this._down.bind(this);
    this._move = this._move.bind(this);
    this._up = this._up.bind(this);

    canvas.addEventListener("pointerdown", this._down, { passive: false });
    window.addEventListener("pointermove", this._move, { passive: false });
    window.addEventListener("pointerup", this._up, { passive: false });
    window.addEventListener("pointercancel", this._up, { passive: false });
  }

  _localPoint(e) {
    const r = this.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  _down(e) {
    if (this.active) return;
    this.active = true;
    this.pointerId = e.pointerId;
    e.preventDefault();
    this.onStart(this._localPoint(e));
  }

  _move(e) {
    if (!this.active || e.pointerId !== this.pointerId) return;
    e.preventDefault();
    this.onMove(this._localPoint(e));
  }

  _up(e) {
    if (!this.active || e.pointerId !== this.pointerId) return;
    e.preventDefault();
    this.active = false;
    this.pointerId = null;
    this.onEnd(this._localPoint(e));
  }

  destroy() {
    window.removeEventListener("pointermove", this._move);
    window.removeEventListener("pointerup", this._up);
    window.removeEventListener("pointercancel", this._up);
  }
}
