(function () {
  let gameTimer = null;
  let shotTimer = null;

  function initOperator() {
    const api = window.BeastAveScoreboard;
    if (!api) {
      alert("Scoreboard state API did not load. Check that state.js is loading correctly.");
      return;
    }

    const {
      defaultState,
      getScoreboardState,
      saveScoreboardState,
      mmssToSeconds,
      secondsToMmss,
      clampNumber
    } = api;

    function byId(id) {
      return document.getElementById(id);
    }

    function setSaveStatus(text) {
      const el = byId("saveStatus");
      if (!el) return;
      el.textContent = text;
      window.clearTimeout(setSaveStatus.timer);
      setSaveStatus.timer = window.setTimeout(() => (el.textContent = "Ready"), 900);
    }

    function updateState(patch) {
      const state = getScoreboardState();
      saveScoreboardState({ ...state, ...patch });
      renderOperator();
      setSaveStatus("Updated");
    }

    function renderOperator() {
      const state = getScoreboardState();

      const gameClockDisplay = byId("gameClockDisplay");
      const shotClockDisplay = byId("shotClockDisplay");
      const homeScoreDisplay = byId("homeScoreDisplay");
      const awayScoreDisplay = byId("awayScoreDisplay");
      const homeTitle = byId("homeTitle");
      const awayTitle = byId("awayTitle");

      if (gameClockDisplay) gameClockDisplay.textContent = state.gameClock;
      if (shotClockDisplay) shotClockDisplay.textContent = state.shotClock;
      if (homeScoreDisplay) homeScoreDisplay.textContent = state.homeScore;
      if (awayScoreDisplay) awayScoreDisplay.textContent = state.awayScore;
      if (homeTitle) homeTitle.textContent = state.homeTeam;
      if (awayTitle) awayTitle.textContent = state.awayTeam;

      document.querySelectorAll("[data-input]").forEach((input) => {
        const key = input.dataset.input;
        if (document.activeElement !== input) input.value = state[key] ?? "";
      });

      const clockInput = byId("gameClockInput");
      if (clockInput && document.activeElement !== clockInput) clockInput.value = state.gameClock;
    }

    function startGameClock() {
      if (gameTimer) return;

      updateState({ gameClockRunning: true });

      gameTimer = window.setInterval(() => {
        const state = getScoreboardState();
        const remaining = mmssToSeconds(state.gameClock);

        if (remaining <= 0) {
          stopGameClock();
          return;
        }

        saveScoreboardState({ ...state, gameClock: secondsToMmss(remaining - 1) });
        renderOperator();
      }, 1000);
    }

    function stopGameClock() {
      window.clearInterval(gameTimer);
      gameTimer = null;
      updateState({ gameClockRunning: false });
    }

    function startShotClock() {
      if (shotTimer) return;

      updateState({ shotClockRunning: true });

      shotTimer = window.setInterval(() => {
        const state = getScoreboardState();
        const remaining = clampNumber(state.shotClock, 0, 99);

        if (remaining <= 0) {
          stopShotClock();
          return;
        }

        saveScoreboardState({ ...state, shotClock: String(remaining - 1) });
        renderOperator();
      }, 1000);
    }

    function stopShotClock() {
      window.clearInterval(shotTimer);
      shotTimer = null;
      updateState({ shotClockRunning: false });
    }

    function addClick(id, handler) {
      const el = byId(id);
      if (el) el.addEventListener("click", handler);
      else console.warn(`Missing button: ${id}`);
    }

    function bindControls() {
      addClick("gameStart", startGameClock);
      addClick("gameStop", stopGameClock);
      addClick("gameReset", () => updateState({ gameClock: "12:00" }));

      document.querySelectorAll("[data-clock-set]").forEach((button) => {
        button.addEventListener("click", () => updateState({ gameClock: button.dataset.clockSet }));
      });

      const gameClockInput = byId("gameClockInput");
      if (gameClockInput) {
        gameClockInput.addEventListener("change", (e) => {
          updateState({ gameClock: e.target.value || "0:00" });
        });
      }

      addClick("shotStart", startShotClock);
      addClick("shotStop", stopShotClock);
      addClick("shotReset30", () => updateState({ shotClock: "30" }));
      addClick("shotReset15", () => updateState({ shotClock: "15" }));
      addClick("shotReset10", () => updateState({ shotClock: "10" }));
      addClick("shotReset0", () => updateState({ shotClock: "0" }));

      document.querySelectorAll("[data-adjust]").forEach((button) => {
        button.addEventListener("click", () => {
          const [key, deltaRaw] = button.dataset.adjust.split(":");
          const delta = Number(deltaRaw);
          const state = getScoreboardState();
          updateState({ [key]: clampNumber(Number(state[key]) + delta, 0, 999) });
        });
      });

      document.querySelectorAll("[data-input]").forEach((input) => {
        input.addEventListener("input", () => {
          const key = input.dataset.input;
          const state = getScoreboardState();
          saveScoreboardState({ ...state, [key]: input.value });
          renderOperator();
          setSaveStatus("Updated");
        });
      });

      addClick("nextPeriod", () => {
        const order = ["Q1", "Q2", "Q3", "Q4", "OT"];
        const state = getScoreboardState();
        const currentIndex = order.indexOf(state.period);
        const next = currentIndex >= 0 ? order[(currentIndex + 1) % order.length] : "Q1";
        updateState({ period: next });
      });

      addClick("swapPossession", () => {
        const state = getScoreboardState();
        let next = state.possession === state.homeTeam ? state.awayTeam : state.homeTeam;
        if (!state.possession || state.possession === "--") next = state.homeTeam;
        updateState({ possession: next });
      });

      addClick("clearLastGoal", () => updateState({ lastGoal: "--" }));

      addClick("resetGame", () => {
        window.clearInterval(gameTimer);
        window.clearInterval(shotTimer);
        gameTimer = null;
        shotTimer = null;
        saveScoreboardState(defaultState);
        renderOperator();
        setSaveStatus("Reset");
      });
    }

    bindControls();
    renderOperator();
    setSaveStatus("Loaded");
    console.log("BeastAve BoxStrong operator loaded successfully.");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initOperator);
  } else {
    initOperator();
  }
})();
