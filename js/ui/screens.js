// Controla las pantallas de carga, pausa y resultado, y expone los
// callbacks de sus botones al orquestador principal (main.js).

export class Screens {
  constructor(audio, { onResume, onQuit, onRematch, onMenu, onPauseToggle } = {}) {
    this.audio = audio;
    this.onResume = onResume ?? (() => {});
    this.onQuit = onQuit ?? (() => {});
    this.onRematch = onRematch ?? (() => {});
    this.onMenu = onMenu ?? (() => {});
    this.onPauseToggle = onPauseToggle ?? (() => {});

    this.loading = document.getElementById("screen-loading");
    this.loadingFill = document.getElementById("loading-fill");
    this.pauseScreen = document.getElementById("screen-pause");
    this.resultScreen = document.getElementById("screen-result");
    this.resultTag = document.getElementById("result-tag");
    this.resultTitle = document.getElementById("result-title");
    this.resultSub = document.getElementById("result-sub");
    this.pauseBtn = document.getElementById("btn-pause");

    this._wire();
  }

  _wire() {
    this.pauseBtn.addEventListener("click", () => { this.audio.playSelect(); this.onPauseToggle(); });
    document.getElementById("btn-resume").addEventListener("click", () => { this.audio.playSelect(); this.onResume(); });
    document.getElementById("btn-quit").addEventListener("click", () => { this.audio.playSelect(); this.onQuit(); });
    document.getElementById("btn-rematch").addEventListener("click", () => { this.audio.playSelect(); this.onRematch(); });
    document.getElementById("btn-menu").addEventListener("click", () => { this.audio.playSelect(); this.onMenu(); });
  }

  setLoadingProgress(pct) { this.loadingFill.style.width = `${Math.round(pct * 100)}%`; }
  hideLoading() { this.loading.classList.add("hidden"); }

  showPause() { this.pauseScreen.classList.remove("hidden"); }
  hidePause() { this.pauseScreen.classList.add("hidden"); }

  showResult({ playerWon, byDecision }) {
    this.resultTag.textContent = byDecision ? (playerWon ? "DECISIÓN" : "DERROTA") : (playerWon ? "KO" : "KO RIVAL");
    this.resultTitle.textContent = playerWon ? "VICTORIA" : "DERROTA";
    this.resultSub.textContent = byDecision
      ? "El combate se decidió por daño acumulado."
      : (playerWon ? "Tu combo terminó el combate." : "El rival encontró el hueco perfecto.");
    this.resultScreen.classList.remove("hidden");
  }
  hideResult() { this.resultScreen.classList.add("hidden"); }
}
