// Catálogo de acciones disponibles en el tablero táctico.
// category: "strike" | "kick" | "movement" | "defense" | "grapple"
// range: distancia mínima requerida entre luchadores para conectar.
// staminaCost: coste al ejecutarse dentro de un combo.
// duration: milisegundos que ocupa la animación en la fase de ejecución.
// stagger: acumulación de aturdimiento que provoca en el rival si conecta.

export const MOVES = {
  jab: {
    id: "jab", label: "Jab", short: "JB", category: "strike", range: "close",
    damage: 4, stagger: 3, staminaCost: 4, duration: 260,
    accuracy: 0.92, sound: "punchLight",
  },
  cross: {
    id: "cross", label: "Cross", short: "CR", category: "strike", range: "close",
    damage: 7, stagger: 5, staminaCost: 6, duration: 320,
    accuracy: 0.85, sound: "punchMed",
  },
  hook: {
    id: "hook", label: "Hook", short: "HK", category: "strike", range: "close",
    damage: 9, stagger: 8, staminaCost: 8, duration: 420,
    accuracy: 0.78, sound: "punchHeavy",
  },
  lowkick: {
    id: "lowkick", label: "Low Kick", short: "LK", category: "kick", range: "mid",
    damage: 6, stagger: 6, staminaCost: 7, duration: 380,
    accuracy: 0.86, sound: "kickLight", legTarget: true,
  },
  highkick: {
    id: "highkick", label: "High Kick", short: "HGK", category: "kick", range: "mid",
    damage: 13, stagger: 12, staminaCost: 13, duration: 540,
    accuracy: 0.68, sound: "kickHeavy", knockdownChance: 0.16,
  },
  step: {
    id: "step", label: "Paso", short: "PS", category: "movement", range: "any",
    damage: 0, stagger: 0, staminaCost: 2, duration: 220,
    accuracy: 1, sound: "step", effect: "reposition",
  },
  dodge: {
    id: "dodge", label: "Esquiva", short: "ESQ", category: "defense", range: "any",
    damage: 0, stagger: 0, staminaCost: 3, duration: 260,
    accuracy: 1, sound: "whoosh", effect: "evade", evadeChance: 0.7,
  },
  guard: {
    id: "guard", label: "Guardia", short: "GRD", category: "defense", range: "any",
    damage: 0, stagger: 0, staminaCost: 2, duration: 240,
    accuracy: 1, sound: "guard", effect: "block", damageReduction: 0.62,
  },
  takedown: {
    id: "takedown", label: "Derribo", short: "DRB", category: "grapple", range: "clinch",
    damage: 11, stagger: 16, staminaCost: 17, duration: 760,
    accuracy: 0.6, sound: "takedown", effect: "takedown",
  },
  clinch: {
    id: "clinch", label: "Clinch", short: "CLN", category: "grapple", range: "mid",
    damage: 2, stagger: 3, staminaCost: 8, duration: 400,
    accuracy: 0.7, sound: "clinch", effect: "clinch",
  },
  escape: {
    id: "escape", label: "Escape", short: "ESC", category: "movement", range: "clinch",
    damage: 0, stagger: 0, staminaCost: 5, duration: 300,
    accuracy: 1, sound: "step", effect: "separate",
  },
};

export const MOVE_LIST = Object.values(MOVES);

export const MOVE_CATEGORIES = {
  strike: ["jab", "cross", "hook"],
  kick: ["lowkick", "highkick"],
  movement: ["step", "escape"],
  defense: ["dodge", "guard"],
  grapple: ["takedown", "clinch"],
};

export function getMove(id) { return MOVES[id]; }
