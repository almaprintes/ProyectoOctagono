// Bucle principal: timestep fijo para la simulación, interpolación libre
// para el render. Soporta escala de tiempo (para el slow-motion del KO)
// y pausa completa.

export class GameLoop {
  constructor({ update, render, fixedStep = 1 / 60 }) {
    this.update = update;
    this.render = render;
    this.fixedStep = fixedStep;
    this.accumulator = 0;
    this.lastTime = 0;
    this.running = false;
    this.paused = false;
    this.timeScale = 1;
    this._raf = null;
    this._frame = this._frame.bind(this);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this._raf = requestAnimationFrame(this._frame);
  }

  stop() {
    this.running = false;
    if (this._raf) cancelAnimationFrame(this._raf);
  }

  setPaused(v) { this.paused = v; }

  setTimeScale(scale) { this.timeScale = scale; }

  _frame(now) {
    if (!this.running) return;
    this._raf = requestAnimationFrame(this._frame);

    let delta = (now - this.lastTime) / 1000;
    this.lastTime = now;
    // Evita saltos grandes (cambio de pestaña, hitches).
    delta = Math.min(delta, 0.25);

    if (this.paused) {
      this.render(0);
      return;
    }

    delta *= this.timeScale;
    this.accumulator += delta;

    let steps = 0;
    while (this.accumulator >= this.fixedStep && steps < 8) {
      this.update(this.fixedStep, this.timeScale);
      this.accumulator -= this.fixedStep;
      steps++;
    }

    const alpha = this.accumulator / this.fixedStep;
    this.render(alpha);
  }
}
