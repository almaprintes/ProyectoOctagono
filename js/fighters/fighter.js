// Modelo de luchador: estadísticas, máquina de estados y animación.
// No conoce el tablero ni la IA — combatManager orquesta la pelea y
// llama a estos métodos de bajo nivel.

import { clamp } from "../engine/utils.js";
import { getArchetype } from "../data/archetypes.js";
import { Animator } from "./animator.js";

export const FighterState = {
  IDLE: "idle",
  ACTING: "acting",
  STAGGERED: "staggered",
  DOWN: "down",
  GETTING_UP: "gettingUp",
  CELEBRATING: "celebrating",
  KO: "ko",
};

export class Fighter {
  constructor({ id, corner, archetypeId, name }) {
    this.id = id;
    this.corner = corner; // "A" | "B"
    this.name = name;
    this.archetype = getArchetype(archetypeId);
    this.facing = corner === "A" ? 1 : -1;

    const s = this.archetype.stats;
    this.maxHealth = s.health;
    this.health = s.health;
    this.maxStamina = s.stamina;
    this.stamina = s.stamina;
    this.power = s.power;
    this.speed = s.speed;
    this.chin = s.chin;
    this.staminaRegen = s.staminaRegen;

    this.staggerMeter = 0;
    this.staggerThreshold = 26;
    this.knockdowns = 0;

    this.state = FighterState.IDLE;
    this.animator = new Animator();
    this.pendingCallback = null;

    // Desplazamiento visual acumulado (empuje/retroceso cosmético).
    this.visualNudge = 0;
  }

  reset() {
    this.health = this.maxHealth;
    this.stamina = this.maxStamina;
    this.staggerMeter = 0;
    this.knockdowns = 0;
    this.state = FighterState.IDLE;
    this.animator.stop();
  }

  get alive() { return this.health > 0; }
  get isBusy() { return this.state === FighterState.ACTING || this.state === FighterState.DOWN || this.state === FighterState.GETTING_UP; }

  spendStamina(cost) { this.stamina = clamp(this.stamina - cost, 0, this.maxStamina); }

  update(dt) {
    this.animator.update(dt);
    this.visualNudge *= Math.pow(0.001, dt);

    if (this.state === FighterState.IDLE || this.state === FighterState.STAGGERED) {
      const regen = this.staminaRegen * (this.state === FighterState.STAGGERED ? 4 : 14);
      this.stamina = clamp(this.stamina + regen * dt, 0, this.maxStamina);
    }
    if (this.staggerMeter > 0) {
      this.staggerMeter = Math.max(0, this.staggerMeter - dt * 9);
    }
  }

  // Reproduce una animación de acción (movimiento del tablero).
  playMove(moveId, durationMs, onComplete) {
    this.state = FighterState.ACTING;
    this.animator.play(moveId, durationMs, "move", () => {
      if (this.state === FighterState.ACTING) this.state = FighterState.IDLE;
      if (onComplete) onComplete();
    });
  }

  playReaction(name, durationMs, onComplete, hold = false) {
    this.animator.play(name, durationMs, "reaction", onComplete, hold);
  }

  applyDamage(amount, { stagger = 0, knockdown = false } = {}) {
    this.health = clamp(this.health - amount, 0, this.maxHealth);
    this.staggerMeter += stagger / Math.max(this.chin, 0.5);
    const forcedDown = knockdown || this.staggerMeter >= this.staggerThreshold || this.health <= 0;
    return forcedDown;
  }

  goDown() {
    this.state = FighterState.DOWN;
    this.staggerMeter = 0;
    this.knockdowns++;
  }

  startGetUp(durationMs, onComplete) {
    this.state = FighterState.GETTING_UP;
    this.animator.play("getUp", durationMs, "reaction", () => {
      this.state = FighterState.IDLE;
      if (onComplete) onComplete();
    });
  }

  goCelebrate() {
    this.state = FighterState.CELEBRATING;
    this.animator.play("celebrate", 1400, "reaction");
  }

  goKO() {
    this.state = FighterState.KO;
  }
}
