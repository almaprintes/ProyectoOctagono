// Controla la pantalla de menú: selección de rival, activación de sonido
// y navegación hacia el combate / instrucciones.

import { ARCHETYPE_LIST } from "../data/archetypes.js";

export class Menu {
  constructor(audio, { onPlay, onHow, onHowBack } = {}) {
    this.audio = audio;
    this.onPlay = onPlay ?? (() => {});
    this.onHow = onHow ?? (() => {});
    this.onHowBack = onHowBack ?? (() => {});
    this.selectedRival = "kickboxer";
    this.muted = false;

    this.screenMenu = document.getElementById("screen-menu");
    this.screenHow = document.getElementById("screen-how");
    this.rivalList = document.getElementById("rival-list");

    this._buildRivalChips();
    this._wireButtons();
  }

  _buildRivalChips() {
    this.rivalList.innerHTML = "";
    for (const arch of ARCHETYPE_LIST) {
      const chip = document.createElement("button");
      chip.className = "rival-chip" + (arch.id === this.selectedRival ? " active" : "");
      chip.textContent = arch.label;
      chip.dataset.id = arch.id;
      chip.addEventListener("click", () => {
        this.selectedRival = arch.id;
        [...this.rivalList.children].forEach((c) => c.classList.toggle("active", c.dataset.id === arch.id));
        this.audio.resume(); this.audio.playSelect();
      });
      this.rivalList.appendChild(chip);
    }
  }

  _wireButtons() {
    document.getElementById("btn-play").addEventListener("click", () => {
      this.audio.resume(); this.audio.playSelect();
      this.onPlay(this.selectedRival);
    });
    document.getElementById("btn-how").addEventListener("click", () => {
      this.audio.resume(); this.audio.playSelect();
      this.showHow();
    });
    document.getElementById("btn-how-back").addEventListener("click", () => {
      this.audio.playSelect();
      this.hideHow();
    });
    document.getElementById("btn-sound").addEventListener("click", () => {
      this.muted = !this.muted;
      this.audio.setMuted(this.muted);
      document.getElementById("sound-icon-on").classList.toggle("hidden", this.muted);
      document.getElementById("sound-icon-off").classList.toggle("hidden", !this.muted);
    });
  }

  showHow() { this.screenMenu.classList.add("hidden"); this.screenHow.classList.remove("hidden"); }
  hideHow() { this.screenHow.classList.add("hidden"); this.screenMenu.classList.remove("hidden"); }

  show() { this.screenMenu.classList.remove("hidden"); }
  hide() { this.screenMenu.classList.add("hidden"); }
}
