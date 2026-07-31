// Punto de entrada. Conecta motor, combate, audio y UI. No contiene
// reglas de juego propias: sólo cablea los sistemas entre sí.

import { GameLoop } from "./engine/loop.js";
import { Camera } from "./engine/camera.js";
import { ParticleSystem } from "./engine/particles.js";

import { Fighter } from "./fighters/fighter.js";
import { renderFighter } from "./fighters/fighterRenderer.js";

import { OctagonBoard } from "./combat/board.js";
import { SwipeSystem } from "./combat/swipeSystem.js";
import { CombatManager, BASE_Y } from "./combat/combatManager.js";

import { HitEffects } from "./effects/hitEffects.js";
import { ScreenEffects } from "./effects/screenEffects.js";
import { KOSequence } from "./effects/koEffects.js";

import { AudioEngine } from "./audio/audioEngine.js";
import { getArchetype } from "./data/archetypes.js";

import { Hud } from "./ui/hud.js";
import { Menu } from "./ui/menu.js";
import { Screens } from "./ui/screens.js";

// ---------- estado global de la aplicación ----------
const canvas = document.getElementById("arena-canvas");
const ctx = canvas.getContext("2d", { alpha: false });

let viewW = window.innerWidth, viewH = window.innerHeight;
const dpr = Math.min(window.devicePixelRatio || 1, 2);

let appState = "loading"; // loading | menu | playing | result
let paused = false;

const camera = new Camera(viewW, viewH);
const particles = new ParticleSystem();
const audio = new AudioEngine();
const board = new OctagonBoard();

const screenEffects = new ScreenEffects(camera, null); // loop se enlaza tras crearse
const hitEffects = new HitEffects(particles, camera, screenEffects);
const koSequence = new KOSequence(screenEffects, camera, audio);

const hud = new Hud();

let combatManager = null;
let player = new Fighter({ id: "player", corner: "A", archetypeId: "boxer", name: "TÚ" });
let rival = null;

function buildMatch(rivalArchetypeId) {
  const arch = getArchetype(rivalArchetypeId) ?? getArchetype("kickboxer");
  rival = new Fighter({ id: "rival", corner: "B", archetypeId: arch.id, name: arch.label.toUpperCase() });

  combatManager = new CombatManager({
    player, rival, board, audio, hitEffects, koSequence, camera,
    callbacks: {
      onPhaseChange: (phase) => {
        swipeSystem.setEnabled(phase === "board" && appState === "playing" && !paused);
      },
      onHealthChange: () => { hud.updateHealth(player, rival); hud.updateStamina(player, rival); },
      onComboText: (text) => hud.showCombo(text),
      onTimer: (s) => hud.setTimer(s),
      onRoundChange: (n) => { hud.setRound(n); audio.playBell(); },
      onMatchEnd: ({ winnerCorner, byDecision }) => {
        appState = "result";
        swipeSystem.setEnabled(false);
        audio.stopAmbient();
        screens.showResult({ playerWon: winnerCorner === "A", byDecision });
      },
    },
  });
  hud.updateHealth(player, rival);
  hud.updateStamina(player, rival);
}

buildMatch("kickboxer"); // fondo animado visible tras el menú

const swipeSystem = new SwipeSystem(canvas, camera, board, particles, audio, {
  onComplete: (seq) => combatManager?.submitPlayerCombo(seq),
});
swipeSystem.setEnabled(false);

// ---------- pantallas / menú ----------
const menu = new Menu(audio, {
  onPlay: (rivalId) => {
    buildMatch(rivalId);
    hud.setNames("TÚ", rival.name);
    hud.setRound(1);
    hud.setTimer(60);
    menu.hide();
    hud.show();
    screens.hideResult();
    appState = "playing";
    paused = false;
    audio.startAmbient();
    audio.playBell();
    combatManager.startMatch();
  },
});

const screens = new Screens(audio, {
  onPauseToggle: () => {
    if (appState !== "playing") return;
    paused = !paused;
    loop.setPaused(paused);
    if (paused) { screens.showPause(); swipeSystem.setEnabled(false); }
    else { screens.hidePause(); swipeSystem.setEnabled(combatManager.phase === "board"); }
  },
  onResume: () => {
    paused = false;
    loop.setPaused(false);
    screens.hidePause();
    swipeSystem.setEnabled(combatManager.phase === "board");
  },
  onQuit: () => {
    paused = false; loop.setPaused(false);
    screens.hidePause();
    hud.hide();
    audio.stopAmbient();
    appState = "menu";
    menu.show();
  },
  onRematch: () => {
    const archId = rival.archetype.id;
    buildMatch(archId);
    hud.setNames("TÚ", rival.name);
    screens.hideResult();
    appState = "playing";
    audio.startAmbient();
    audio.playBell();
    combatManager.startMatch();
  },
  onMenu: () => {
    screens.hideResult();
    hud.hide();
    audio.stopAmbient();
    appState = "menu";
    menu.show();
  },
});

// ---------- bucle de simulación / render ----------
function update(dt) {
  camera.update(dt);
  screenEffects.update(dt);
  board.update(dt);
  swipeSystem.update(dt);
  hitEffects.update(dt);
  player.update(dt);
  rival?.update(dt);
  combatManager?.update(dt);
}

function render() {
  const w = viewW, h = viewH;

  ctx.globalAlpha = 1;
  ctx.fillStyle = `rgba(10,11,18,${screenEffects.clearAlpha})`;
  ctx.fillRect(0, 0, w, h);

  board.renderMat(ctx, camera);
  if (appState === "playing" || appState === "result") board.renderZones(ctx, camera);

  if (combatManager) {
    const laneP = combatManager.playerLaneX, laneR = combatManager.rivalLaneX;
    renderFighter(ctx, camera, rival, laneR, BASE_Y, {});
    renderFighter(ctx, camera, player, laneP, BASE_Y, {});
  }

  hitEffects.render(ctx);
  particles.render(ctx);
  swipeSystem.render(ctx);
  screenEffects.renderFlash(ctx, w, h);
}

const loop = new GameLoop({ update, render, fixedStep: 1 / 60 });
screenEffects.loop = loop;

// ---------- resize ----------
function resize() {
  viewW = window.innerWidth; viewH = window.innerHeight;
  canvas.width = Math.round(viewW * dpr);
  canvas.height = Math.round(viewH * dpr);
  canvas.style.width = viewW + "px";
  canvas.style.height = viewH + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  camera.resize(viewW, viewH);
}
window.addEventListener("resize", resize);
window.addEventListener("orientationchange", resize);
resize();

// ---------- arranque / pantalla de carga ----------
function boot() {
  let p = 0;
  const iv = setInterval(() => {
    p += 0.16 + Math.random() * 0.12;
    screens.setLoadingProgress(Math.min(p, 1));
    if (p >= 1) {
      clearInterval(iv);
      screens.hideLoading();
      menu.show();
      appState = "menu";
    }
  }, 90);
}

document.body.addEventListener("pointerdown", () => audio.resume(), { once: true });

loop.start();
boot();

// ---------- PWA: service worker ----------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
