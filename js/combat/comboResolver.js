// Convierte la secuencia bruta dibujada por el jugador en una "playbook"
// ejecutable: recorta por estamina disponible y calcula el multiplicador
// de daño por longitud de cadena limpia (recompensa combos largos, que es
// la prioridad número uno: que encadenar se sienta gratificante).

import { getMove } from "../data/moves.js";

const MAX_CHAIN = 7;

export function resolveCombo(rawSequence, fighter) {
  const moves = [];
  let staminaLeft = fighter.stamina;
  let strikeStreak = 0;

  for (const id of rawSequence.slice(0, MAX_CHAIN)) {
    const move = getMove(id);
    if (!move) continue;
    const overdrawn = staminaLeft - move.staminaCost < -6; // pequeño margen de fatiga
    if (overdrawn) break;
    staminaLeft -= move.staminaCost;

    if (move.category === "strike" || move.category === "kick") strikeStreak++;
    else strikeStreak = 0;

    moves.push({
      move,
      comboIndex: moves.length,
      chainBonus: 1 + Math.min(moves.length, 5) * 0.06,
    });
  }

  return {
    moves,
    length: moves.length,
    clean: moves.length === rawSequence.length,
    endsInDefense: moves.length > 0 && moves[moves.length - 1].move.category === "defense",
    staminaCost: fighter.stamina - staminaLeft,
  };
}
