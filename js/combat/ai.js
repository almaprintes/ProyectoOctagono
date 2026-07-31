// IA del rival. No espera pasivamente: cada arquetipo pondera sus propias
// acciones, reacciona a golpes entrantes según su perfil, y adapta su
// elección según la distancia y el estado de estamina/salud del combate.

import { MOVES, MOVE_LIST } from "../data/moves.js";
import { rand, clamp, choice } from "../engine/utils.js";

function rangeAffinity(move, distance) {
  // distance: 0 clinch, 1 close, 2 mid
  if (move.range === "any") return 1;
  if (move.range === "clinch") return distance === 0 ? 1.6 : distance === 1 ? 0.5 : 0.15;
  if (move.range === "close") return distance <= 1 ? 1.3 : 0.35;
  if (move.range === "mid") return distance >= 1 ? 1.2 : 0.6;
  return 1;
}

function pickWeighted(entries) {
  const total = entries.reduce((s, e) => s + e.w, 0);
  if (total <= 0) return entries[0]?.id;
  let r = rand(0, total);
  for (const e of entries) {
    r -= e.w;
    if (r <= 0) return e.id;
  }
  return entries[entries.length - 1].id;
}

// Construye una secuencia bruta de ids de movimiento (equivalente a lo que
// el jugador dibujaría) para que pase por el mismo resolveCombo().
export function buildAISequence(fighter, opponent, distance) {
  const weights = fighter.archetype.weights;
  const aggression = clamp(0.5 + (opponent.health / opponent.maxHealth) * 0.5, 0.4, 1.2);
  const desperation = fighter.health < fighter.maxHealth * 0.3 ? 1.3 : 1;
  const targetLen = Math.round(rand(2, 5) * fighter.speed);

  const seq = [];
  let staminaLeft = fighter.stamina;

  for (let i = 0; i < targetLen; i++) {
    const isLast = i === targetLen - 1;
    const entries = MOVE_LIST
      .filter((m) => m.staminaCost <= staminaLeft + 2)
      .map((m) => {
        let w = (weights[m.id] ?? 0.3) * rangeAffinity(m, distance);
        if (m.category === "strike" || m.category === "kick") w *= aggression * desperation;
        if (isLast) {
          const defenseBias = (fighter.archetype.reaction.guardChance + fighter.archetype.reaction.dodgeChance);
          if (m.category === "defense") w *= 1 + defenseBias * 2.4;
        }
        return { id: m.id, w: Math.max(w, 0.001) };
      });
    if (!entries.length) break;
    const id = pickWeighted(entries);
    const move = MOVES[id];
    if (move.staminaCost > staminaLeft) break;
    staminaLeft -= move.staminaCost;
    seq.push(id);
  }
  return seq;
}

// Decide cómo reacciona el rival a un golpe entrante concreto mientras
// ejecuta el combo del jugador.
export function decideReaction(fighter) {
  const react = fighter.archetype.reaction;
  const staminaFactor = clamp(fighter.stamina / fighter.maxStamina, 0.25, 1);
  const dodgeChance = react.dodgeChance * staminaFactor;
  const guardChance = react.guardChance * staminaFactor;
  const roll = Math.random();
  if (roll < dodgeChance) return "evade";
  if (roll < dodgeChance + guardChance) return "block";
  return "none";
}

// Ventana de contragolpe tras una esquiva exitosa.
export function rollCounter(fighter) {
  return Math.random() < fighter.archetype.reaction.counterWindow;
}
