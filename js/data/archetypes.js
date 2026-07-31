// Arquetipos de luchador. El jugador siempre dispone del repertorio
// completo (11 acciones); lo que cambia entre arquetipos es el propio
// cuerpo/paleta del luchador y, en el caso de la IA, su personalidad de
// decisión (pesos de selección de movimiento + perfil de reacción).

export const ARCHETYPES = {
  boxer: {
    id: "boxer", label: "Boxeador",
    palette: { body: "#C9432F", trim: "#F5C518", skin: "#E7B98E" },
    stats: { health: 100, stamina: 100, power: 1.05, speed: 1.1, chin: 0.95, staminaRegen: 1.1 },
    weights: { jab: 5, cross: 5, hook: 4, lowkick: 0.4, highkick: 0.2, step: 2, dodge: 2.2, guard: 1.6, takedown: 0.1, clinch: 0.3, escape: 0.6 },
    reaction: { dodgeChance: 0.30, guardChance: 0.35, counterWindow: 0.35 },
    build: "compact",
  },
  kickboxer: {
    id: "kickboxer", label: "Kickboxer",
    palette: { body: "#2F7DC9", trim: "#E8E6F0", skin: "#D9A066" },
    stats: { health: 104, stamina: 96, power: 1.0, speed: 1.0, chin: 1.0, staminaRegen: 1.0 },
    weights: { jab: 3, cross: 3, hook: 2.4, lowkick: 4.2, highkick: 3.2, step: 2.2, dodge: 1.8, guard: 1.6, takedown: 0.2, clinch: 0.5, escape: 0.7 },
    reaction: { dodgeChance: 0.28, guardChance: 0.3, counterWindow: 0.3 },
    build: "balanced",
  },
  wrestler: {
    id: "wrestler", label: "Luchador",
    palette: { body: "#3E8E5B", trim: "#F5C518", skin: "#C98A5B" },
    stats: { health: 116, stamina: 92, power: 1.12, speed: 0.86, chin: 1.18, staminaRegen: 0.92 },
    weights: { jab: 1.6, cross: 1.8, hook: 1.6, lowkick: 1.0, highkick: 0.3, step: 1.6, dodge: 1.2, guard: 1.4, takedown: 5.2, clinch: 4.4, escape: 0.9 },
    reaction: { dodgeChance: 0.14, guardChance: 0.22, counterWindow: 0.18 },
    build: "heavy",
  },
  counter: {
    id: "counter", label: "Contragolpeador",
    palette: { body: "#8B4FC9", trim: "#37C6FF", skin: "#E0AE83" },
    stats: { health: 92, stamina: 100, power: 0.98, speed: 1.16, chin: 0.86, staminaRegen: 1.15 },
    weights: { jab: 3.2, cross: 3.6, hook: 3.0, lowkick: 1.6, highkick: 1.2, step: 2.6, dodge: 4.2, guard: 3.4, takedown: 0.1, clinch: 0.2, escape: 1.0 },
    reaction: { dodgeChance: 0.5, guardChance: 0.42, counterWindow: 0.55 },
    build: "lean",
  },
};

export const ARCHETYPE_LIST = Object.values(ARCHETYPES);

export function getArchetype(id) { return ARCHETYPES[id]; }
