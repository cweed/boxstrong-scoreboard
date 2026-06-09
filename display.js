(function () {
  function initDisplay() {
    const api = window.BeastAveScoreboard;
    if (!api) {
      console.error("BeastAveScoreboard state API was not loaded.");
      return;
    }

    function renderDisplay() {
      const state = api.getScoreboardState();

      document.querySelectorAll("[data-field]").forEach((el) => {
        const key = el.dataset.field;
        if (key in state) el.textContent = state[key];
      });

      const shotCard = document.getElementById("shotClockCard");
      if (shotCard) {
        const shot = Number(state.shotClock);
        shotCard.classList.toggle("warning", shot <= 10 && shot > 0);
        shotCard.classList.toggle("expired", shot === 0);
      }
    }

    window.addEventListener("storage", renderDisplay);
    window.addEventListener("scoreboard-state-updated", renderDisplay);
    setInterval(renderDisplay, 250);
    renderDisplay();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDisplay);
  } else {
    initDisplay();
  }
})();
