// Orquesta la secuencia completa de un KO: impacto final, congelación,
// slow-motion con zoom dramático, y vuelta a la normalidad antes de
// mostrar la pantalla de resultado.

export class KOSequence {
  constructor(screenFx, camera, audio) {
    this.screenFx = screenFx;
    this.camera = camera;
    this.audio = audio;
    this.playing = false;
  }

  play(onDone) {
    this.playing = true;
    this.audio.playKO();
    this.screenFx.flash(1);
    this.camera.shake(40);
    this.screenFx.trail(0.5);

    // Congelación breve antes del slow-motion (impacto seco).
    this.screenFx.slowMotion(0.06, 220);
    this.screenFx.zoom(1.5);

    setTimeout(() => {
      this.screenFx.slowMotion(0.35, 900);
    }, 240);

    setTimeout(() => {
      this.screenFx.resetZoom();
      this.playing = false;
      if (onDone) onDone();
    }, 1700);
  }
}
