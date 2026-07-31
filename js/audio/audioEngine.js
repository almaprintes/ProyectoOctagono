// Motor de audio 100% sintético (WebAudio). No se cargan archivos: cada
// golpe, patada, campana o KO se genera con osciladores y ruido filtrado
// en el instante de reproducirse.

import { rand } from "../engine/utils.js";

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.ambientGain = null;
    this.ambientSource = null;
    this.noiseBuffer = null;
    this.muted = false;
    this._readyResolvers = [];
  }

  ensureContext() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.9;
    this.master.connect(this.ctx.destination);
    this._buildNoiseBuffer();
  }

  resume() {
    this.ensureContext();
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
  }

  setMuted(v) {
    this.muted = v;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(v ? 0 : 0.9, this.ctx.currentTime, 0.05);
    }
  }

  _buildNoiseBuffer() {
    const len = Math.floor(this.ctx.sampleRate * 1.4);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    this.noiseBuffer = buf;
  }

  _noiseSrc() {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    src.playbackRate.value = rand(0.92, 1.08);
    return src;
  }

  _noiseHit({ freqStart = 1200, freqEnd = 300, duration = 0.12, gain = 0.6, type = "lowpass", q = 0.7 } = {}) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime;
    const src = this._noiseSrc();
    const filter = this.ctx.createBiquadFilter();
    filter.type = type; filter.Q.value = q;
    filter.frequency.setValueAtTime(freqStart, t0);
    filter.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 40), t0 + duration);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    src.connect(filter).connect(g).connect(this.master);
    const offset = Math.random() * 0.6;
    src.start(t0, offset, duration + 0.08);
    src.stop(t0 + duration + 0.09);
  }

  _tone({ freqStart = 200, freqEnd = 80, duration = 0.15, gain = 0.5, type = "sine", delay = 0 } = {}) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 20), t0 + duration);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    osc.connect(g).connect(this.master);
    osc.start(t0); osc.stop(t0 + duration + 0.03);
  }

  // ---------- golpes ----------
  playPunchLight() {
    this._noiseHit({ freqStart: 2400, freqEnd: 500, duration: 0.08, gain: 0.5 });
    this._tone({ freqStart: 190, freqEnd: 55, duration: 0.07, gain: 0.28, type: "triangle" });
  }
  playPunchMed() {
    this._noiseHit({ freqStart: 2000, freqEnd: 350, duration: 0.11, gain: 0.6 });
    this._tone({ freqStart: 160, freqEnd: 45, duration: 0.1, gain: 0.36, type: "triangle" });
  }
  playPunchHeavy() {
    this._noiseHit({ freqStart: 1600, freqEnd: 220, duration: 0.16, gain: 0.75 });
    this._tone({ freqStart: 130, freqEnd: 35, duration: 0.16, gain: 0.46, type: "sine" });
  }
  playKickLight() {
    this._noiseHit({ freqStart: 1400, freqEnd: 200, duration: 0.15, gain: 0.65 });
    this._tone({ freqStart: 110, freqEnd: 35, duration: 0.14, gain: 0.4, type: "sine" });
  }
  playKickHeavy() {
    this._noiseHit({ freqStart: 1200, freqEnd: 150, duration: 0.22, gain: 0.85 });
    this._tone({ freqStart: 95, freqEnd: 28, duration: 0.22, gain: 0.55, type: "sine" });
  }
  playGuard() {
    this._noiseHit({ freqStart: 900, freqEnd: 400, duration: 0.09, gain: 0.4, q: 1.4 });
  }
  playWhoosh() {
    this._noiseHit({ freqStart: 3200, freqEnd: 900, duration: 0.18, gain: 0.28, type: "bandpass", q: 0.9 });
  }
  playStep() {
    this._noiseHit({ freqStart: 700, freqEnd: 200, duration: 0.07, gain: 0.22 });
  }
  playClinch() {
    this._noiseHit({ freqStart: 1000, freqEnd: 300, duration: 0.1, gain: 0.45 });
    this._tone({ freqStart: 140, freqEnd: 60, duration: 0.12, gain: 0.3, delay: 0.04 });
  }
  playTakedown() {
    this._noiseHit({ freqStart: 1300, freqEnd: 120, duration: 0.3, gain: 0.9 });
    this._tone({ freqStart: 100, freqEnd: 24, duration: 0.3, gain: 0.6, type: "sine" });
  }
  playSwipeTick(index) {
    this._tone({ freqStart: 520 + index * 34, freqEnd: 520 + index * 34, duration: 0.045, gain: 0.14, type: "sine" });
  }
  playSelect() {
    this._tone({ freqStart: 720, freqEnd: 900, duration: 0.06, gain: 0.25, type: "sine" });
  }
  playBell() {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime;
    [660, 990, 1320].forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.32 / (i + 1), t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 1.6);
      osc.connect(g).connect(this.master);
      osc.start(t0); osc.stop(t0 + 1.65);
    });
  }
  playKO() {
    this._noiseHit({ freqStart: 2200, freqEnd: 100, duration: 0.5, gain: 0.9 });
    this._tone({ freqStart: 400, freqEnd: 30, duration: 0.9, gain: 0.5, type: "sawtooth" });
  }

  // ---------- ambiente ----------
  startAmbient() {
    this.ensureContext();
    if (!this.ctx || this.ambientSource) return;
    const src = this._noiseSrc();
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass"; filter.frequency.value = 900; filter.Q.value = 0.5;
    const g = this.ctx.createGain();
    g.gain.value = 0;
    src.connect(filter).connect(g).connect(this.master);
    src.start();
    g.gain.linearRampToValueAtTime(0.05, this.ctx.currentTime + 1.2);
    this.ambientSource = src;
    this.ambientGain = g;

    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 220;
    lfo.connect(lfoGain).connect(filter.frequency);
    lfo.start();
    this.ambientLFO = lfo;
  }

  stopAmbient() {
    if (!this.ambientSource || !this.ctx) return;
    const t0 = this.ctx.currentTime;
    this.ambientGain.gain.linearRampToValueAtTime(0, t0 + 0.6);
    this.ambientSource.stop(t0 + 0.7);
    this.ambientLFO?.stop(t0 + 0.7);
    this.ambientSource = null;
  }

  playMoveSound(soundId) {
    switch (soundId) {
      case "punchLight": return this.playPunchLight();
      case "punchMed": return this.playPunchMed();
      case "punchHeavy": return this.playPunchHeavy();
      case "kickLight": return this.playKickLight();
      case "kickHeavy": return this.playKickHeavy();
      case "guard": return this.playGuard();
      case "whoosh": return this.playWhoosh();
      case "step": return this.playStep();
      case "clinch": return this.playClinch();
      case "takedown": return this.playTakedown();
      default: return;
    }
  }
}
