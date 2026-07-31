// El corazón del combate. No dibuja nada: coordina el estado táctico
// (distancia, turnos, rondas), aplica el resultado de cada movimiento y
// notifica al resto del juego (HUD, efectos, audio) mediante callbacks.

import { resolveCombo } from "./comboResolver.js";
import { buildAISequence, decideReaction, rollCounter } from "./ai.js";
import { getLeadPoint } from "../fighters/fighterRenderer.js";
import { getMove } from "../data/moves.js";
import { clamp, lerp } from "../engine/utils.js";

export const BASE_Y = 18;
const GAP_BY_DISTANCE = [42, 96, 168];
const ROUND_SECONDS = 60;
const MAX_ROUNDS = 3;

export class CombatManager {
  constructor({ player, rival, board, audio, hitEffects, koSequence, camera, callbacks = {} }) {
    this.player = player;
    this.rival = rival;
    this.board = board;
    this.audio = audio;
    this.hitEffects = hitEffects;
    this.koSequence = koSequence;
    this.camera = camera;
    this.cb = callbacks;

    this.distance = 1;
    this.playerLaneX = -GAP_BY_DISTANCE[1];
    this.rivalLaneX = GAP_BY_DISTANCE[1];

    this.phase = "intro"; // intro | board | executing | knockdown | matchEnd
    this.round = 1;
    this.roundTime = ROUND_SECONDS;

    this.actionQueue = [];
    this.actionIndex = 0;
    this.actionElapsed = 0;
    this.actionImpactFired = false;
    this.actor = null;
    this.target = null;
    this.isPlayerTurn = true;

    this.playerEndingStance = null; // "block" | "evade" | null
  }

  startMatch() {
    this.player.reset();
    this.rival.reset();
    this.round = 1;
    this.roundTime = ROUND_SECONDS;
    this.distance = 1;
    this._syncLanesInstant();
    this._toBoardPhase();
  }

  // ---------- posiciones ----------
  _targetGap() { return GAP_BY_DISTANCE[this.distance]; }
  _syncLanesInstant() {
    const g = this._targetGap();
    this.playerLaneX = -g; this.rivalLaneX = g;
  }
  _updateLanes(dt) {
    const g = this._targetGap();
    this.playerLaneX = lerp(this.playerLaneX, -g, clamp(dt * 5, 0, 1));
    this.rivalLaneX = lerp(this.rivalLaneX, g, clamp(dt * 5, 0, 1));
  }

  // ---------- fase de tablero ----------
  _toBoardPhase() {
    if (this._checkMatchEnd()) return;
    this.phase = "board";
    this.board.reset();
    const pool = ["jab", "cross", "hook", "lowkick", "highkick", "step", "dodge", "guard", "takedown", "clinch", "escape"];
    this.board.generate(pool, 7);
    this.playerEndingStance = null;
    this.cb.onPhaseChange?.("board");
    this.cb.onComboText?.("");
  }

  // Llamado por swipeSystem cuando el jugador levanta el dedo.
  submitPlayerCombo(rawSequence) {
    if (this.phase !== "board") return;
    if (rawSequence.length === 0) return;

    const resolved = resolveCombo(rawSequence, this.player);
    this.board.lockAll();
    this.phase = "executing";
    this.cb.onPhaseChange?.("executing");

    if (resolved.moves.length === 0) {
      this.cb.onComboText?.("SIN ESTAMINA");
      setTimeout(() => this._startAITurn(), 260);
      return;
    }

    const tag = resolved.moves.length >= 5 ? "COMBO BRUTAL" : resolved.moves.length >= 3 ? "COMBO" : "";
    if (tag) this.cb.onComboText?.(`${tag} x${resolved.moves.length}`);

    this.playerEndingStance = resolved.endsInDefense
      ? resolved.moves[resolved.moves.length - 1].move.effect
      : null;

    this._runSequence(this.player, this.rival, resolved.moves, true, () => {
      if (this._checkMatchEnd()) return;
      this._startAITurn();
    });
  }

  _startAITurn() {
    if (this._checkMatchEnd()) return;
    this.phase = "executing";
    const rawSeq = buildAISequence(this.rival, this.player, this.distance);
    if (rawSeq.length === 0) { this._toBoardPhase(); return; }
    const resolved = resolveCombo(rawSeq, this.rival);
    if (resolved.moves.length === 0) { this._toBoardPhase(); return; }

    this._runSequence(this.rival, this.player, resolved.moves, false, () => {
      if (this._checkMatchEnd()) return;
      this._toBoardPhase();
    });
  }

  // ---------- ejecución de secuencia ----------
  _runSequence(actor, target, moves, isPlayerTurn, onDone) {
    this.actionQueue = moves;
    this.actionIndex = 0;
    this.isPlayerTurn = isPlayerTurn;
    this.actor = actor;
    this.target = target;
    this._onSequenceDone = onDone;
    this._aborted = false;
    this._beginMove();
  }

  _beginMove() {
    const entry = this.actionQueue[this.actionIndex];
    if (!entry || this._aborted) { this._finishSequence(); return; }
    this.actionElapsed = 0;
    this.actionImpactFired = false;
    this.actor.spendStamina(entry.move.staminaCost);
    this.cb.onHealthChange?.();
    this.actor.playMove(entry.move.id, entry.move.duration, null);

    if (entry.move.category === "movement") {
      if (entry.move.effect === "reposition") this.distance = Math.max(0, this.distance - 1);
      if (entry.move.effect === "separate") this.distance = Math.min(2, this.distance + 1);
      this.audio.playMoveSound("step");
    }
  }

  _finishSequence() {
    this.phase = "resolved";
    const cb = this._onSequenceDone;
    this._onSequenceDone = null;
    if (cb) cb();
  }

  update(dt) {
    this._updateLanes(dt);

    if (this.phase === "board" && this.roundActive) {
      this.roundTime = Math.max(0, this.roundTime - dt);
      this.cb.onTimer?.(this.roundTime);
      if (this.roundTime <= 0) this._endRoundByTime();
    }

    if (this.phase !== "executing") return;
    const entry = this.actionQueue[this.actionIndex];
    if (!entry) return;
    this.actionElapsed += dt * 1000;
    const impactAt = entry.move.duration * 0.52;
    if (!this.actionImpactFired && this.actionElapsed >= impactAt) {
      this.actionImpactFired = true;
      this._resolveMoveEffect(entry);
    }
    if (this.actionElapsed >= entry.move.duration && !this._aborted) {
      this.actionIndex++;
      this._beginMove();
    }
  }

  get roundActive() { return this.phase === "board"; }

  // ---------- efectos de combate por movimiento ----------
  _resolveMoveEffect(entry) {
    const move = entry.move;
    const actor = this.actor, target = this.target;

    if (move.category === "defense") {
      this.audio.playMoveSound(move.effect === "block" ? "guard" : "whoosh");
      return;
    }
    if (move.effect === "clinch") {
      const success = Math.random() < move.accuracy * (this.distance <= 1 ? 1 : 0.5);
      this.audio.playMoveSound("clinch");
      if (success) this.distance = 0;
      return;
    }
    if (move.effect === "takedown") {
      const success = Math.random() < move.accuracy * (this.distance === 0 ? 1 : 0.32);
      this.audio.playMoveSound("takedown");
      if (!success) return;
      this._landHit(actor, target, move, entry.chainBonus, { forceKnockdown: true });
      return;
    }
    if (move.category === "strike" || move.category === "kick") {
      this._resolveStrike(actor, target, move, entry.chainBonus);
    }
  }

  _resolveStrike(actor, target, move, chainBonus) {
    const rangeOk = move.range === "any" || this.distance <= (move.range === "close" ? 1 : 2);
    const accuracy = move.accuracy * (rangeOk ? 1 : 0.45);
    if (Math.random() > accuracy) return; // fallo

    let blocked = false, evaded = false;

    if (this.isPlayerTurn) {
      const reaction = decideReaction(target);
      if (reaction === "evade") evaded = true;
      else if (reaction === "block") blocked = true;
    } else {
      if (this.playerEndingStance === "evade") evaded = Math.random() < 0.68;
      else if (this.playerEndingStance === "block") blocked = true;
    }

    if (evaded) {
      this.audio.playMoveSound("whoosh");
      const leadPt = getLeadPoint(target, this._laneOf(target), BASE_Y);
      const sp = this.camera.project(leadPt.x, leadPt.y, leadPt.z);
      this.hitEffects.trigger(move.id, sp, { blocked: true, corner: target.corner });
      if (this.isPlayerTurn && rollCounter(target)) {
        // Contragolpe gratuito del rival tras una esquiva exitosa.
        this._landHit(target, actor, getMove("jab"), 1.15, {});
      }
      return;
    }

    this._landHit(actor, target, move, chainBonus, { blocked });
  }

  _landHit(actor, target, move, chainBonus, { blocked = false, forceKnockdown = false } = {}) {
    const reduction = blocked ? (move.damageReduction ?? 0.62) : 0;
    const dmg = move.damage * actor.power * chainBonus * (1 - reduction);
    const staggerAmt = (move.stagger ?? 0) * (blocked ? 0.35 : 1);
    const knockChance = forceKnockdown ? 1 : (move.knockdownChance ?? 0);
    const knockdown = Math.random() < knockChance;

    const forcedDown = target.applyDamage(dmg, { stagger: staggerAmt, knockdown });

    const leadPt = getLeadPoint(actor, this._laneOf(actor), BASE_Y);
    const sp = this.camera.project(leadPt.x, leadPt.y, leadPt.z);
    this.hitEffects.trigger(move.id, sp, { blocked, corner: actor.corner });
    this.audio.playMoveSound(blocked ? "guard" : move.sound);

    this.cb.onHealthChange?.();

    if (target.health <= 0) {
      this._aborted = true;
      target.playReaction("knockdown", 700, () => target.goDown(), true);
      this._triggerMatchEnd(actor.corner);
      return;
    }

    if (forcedDown) {
      this._aborted = true;
      target.playReaction("knockdown", 700, () => {
        target.goDown();
        setTimeout(() => {
          target.startGetUp(800, () => this._toBoardPhase());
        }, 650);
      }, true);
      return;
    }

    const reactionName = move.legTarget ? "legHit" : (dmg >= 9 ? "hitHeavy" : "hitLight");
    target.playReaction(reactionName, Math.min(move.duration * 0.7, 380));
  }

  _laneOf(fighter) { return fighter.corner === "A" ? this.playerLaneX : this.rivalLaneX; }

  // ---------- fin de asalto / combate ----------
  _endRoundByTime() {
    if (this.round >= MAX_ROUNDS) { this._decideByHealth(); return; }
    this.round++;
    this.roundTime = ROUND_SECONDS;
    this.distance = 1;
    this._syncLanesInstant();
    this.cb.onRoundChange?.(this.round);
    this._toBoardPhase();
  }

  _decideByHealth() {
    const winnerCorner = this.player.health >= this.rival.health ? "A" : "B";
    this._triggerMatchEnd(winnerCorner, true);
  }

  _checkMatchEnd() {
    return this.phase === "matchEnd";
  }

  _triggerMatchEnd(winnerCorner, byDecision = false) {
    this.phase = "matchEnd";
    const winner = winnerCorner === "A" ? this.player : this.rival;
    const loser = winnerCorner === "A" ? this.rival : this.player;
    winner.goCelebrate();
    if (!byDecision) loser.goKO();

    const finish = () => this.cb.onMatchEnd?.({ winnerCorner, byDecision });
    if (byDecision) { setTimeout(finish, 500); return; }
    this.koSequence.play(finish);
  }
}
