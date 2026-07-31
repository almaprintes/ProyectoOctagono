// Controla el HUD (DOM superpuesto al canvas). Minimalista y siempre
// legible, nunca tapa el área de combate.

export class Hud {
  constructor() {
    this.root = document.getElementById("hud");
    this.nameLeft = document.getElementById("hud-name-left");
    this.nameRight = document.getElementById("hud-name-right");
    this.healthLeftFill = document.getElementById("hud-health-left-fill");
    this.healthLeftGhost = document.getElementById("hud-health-left-ghost");
    this.healthRightFill = document.getElementById("hud-health-right-fill");
    this.healthRightGhost = document.getElementById("hud-health-right-ghost");
    this.staminaLeftFill = document.getElementById("hud-stamina-left-fill");
    this.staminaRightFill = document.getElementById("hud-stamina-right-fill");
    this.roundEl = document.getElementById("hud-round");
    this.timerEl = document.getElementById("hud-timer");
    this.comboEl = document.getElementById("hud-combo");
    this._comboTimer = null;
  }

  show() { this.root.classList.remove("hidden"); }
  hide() { this.root.classList.add("hidden"); }

  setNames(a, b) { this.nameLeft.textContent = a; this.nameRight.textContent = b; }

  updateHealth(player, rival) {
    const pPct = Math.max(0, (player.health / player.maxHealth) * 100);
    const rPct = Math.max(0, (rival.health / rival.maxHealth) * 100);
    this.healthLeftFill.style.width = pPct + "%";
    this.healthLeftGhost.style.width = pPct + "%";
    this.healthRightFill.style.width = rPct + "%";
    this.healthRightGhost.style.width = rPct + "%";
  }

  updateStamina(player, rival) {
    this.staminaLeftFill.style.width = Math.max(0, (player.stamina / player.maxStamina) * 100) + "%";
    this.staminaRightFill.style.width = Math.max(0, (rival.stamina / rival.maxStamina) * 100) + "%";
  }

  setRound(n) { this.roundEl.textContent = `ROUND ${n}`; }

  setTimer(seconds) {
    const s = Math.max(0, Math.ceil(seconds));
    const m = Math.floor(s / 60);
    const r = s % 60;
    this.timerEl.textContent = `${m}:${r.toString().padStart(2, "0")}`;
  }

  showCombo(text) {
    if (!text) return;
    this.comboEl.textContent = text;
    this.comboEl.classList.add("show");
    clearTimeout(this._comboTimer);
    this._comboTimer = setTimeout(() => this.comboEl.classList.remove("show"), 1100);
  }
}
