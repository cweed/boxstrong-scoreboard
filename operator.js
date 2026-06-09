let gameTimer = null;
let shotTimer = null;

function setSaveStatus(text) {
  const el = document.getElementById("saveStatus");
  el.textContent = text;
  setTimeout(() => (el.textContent = "Ready"), 900);
}

function updateState(patch) {
  const state = getScoreboardState();
  saveScoreboardState({ ...state, ...patch });
  renderOperator();
  setSaveStatus("Updated");
}

function renderOperator() {
  const state = getScoreboardState();

  document.getElementById("gameClockDisplay").textContent = state.gameClock;
  document.getElementById("shotClockDisplay").textContent = state.shotClock;
  document.getElementById("homeScoreDisplay").textContent = state.homeScore;
  document.getElementById("awayScoreDisplay").textContent = state.awayScore;
  document.getElementById("homeTitle").textContent = state.homeTeam;
  document.getElementById("awayTitle").textContent = state.awayTeam;

  document.querySelectorAll("[data-input]").forEach((input) => {
    const key = input.dataset.input;
    if (document.activeElement !== input) input.value = state[key] ?? "";
  });

  const clockInput = document.getElementById("gameClockInput");
  if (document.activeElement !== clockInput) clockInput.value = state.gameClock;
}

function startGameClock() {
  if (gameTimer) return;
  updateState({ gameClockRunning: true });
  gameTimer = setInterval(() => {
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
  clearInterval(gameTimer);
  gameTimer = null;
  updateState({ gameClockRunning: false });
}

function startShotClock() {
  if (shotTimer) return;
  updateState({ shotClockRunning: true });
  shotTimer = setInterval(() => {
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
  clearInterval(shotTimer);
  shotTimer = null;
  updateState({ shotClockRunning: false });
}

function bindControls() {
  document.getElementById("gameStart").addEventListener("click", startGameClock);
  document.getElementById("gameStop").addEventListener("click", stopGameClock);
  document.getElementById("gameReset").addEventListener("click", () => updateState({ gameClock: "12:00" }));

  document.querySelectorAll("[data-clock-set]").forEach((button) => {
    button.addEventListener("click", () => updateState({ gameClock: button.dataset.clockSet }));
  });

  document.getElementById("gameClockInput").addEventListener("change", (e) => {
    updateState({ gameClock: e.target.value || "0:00" });
  });

  document.getElementById("shotStart").addEventListener("click", startShotClock);
  document.getElementById("shotStop").addEventListener("click", stopShotClock);
  document.getElementById("shotReset30").addEventListener("click", () => updateState({ shotClock: "30" }));
  document.getElementById("shotReset15").addEventListener("click", () => updateState({ shotClock: "15" }));
  document.getElementById("shotReset10").addEventListener("click", () => updateState({ shotClock: "10" }));
  document.getElementById("shotReset0").addEventListener("click", () => updateState({ shotClock: "0" }));

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
    });
  });

  document.getElementById("nextPeriod").addEventListener("click", () => {
    const order = ["Q1", "Q2", "Q3", "Q4", "OT"];
    const state = getScoreboardState();
    const next = order[(order.indexOf(state.period) + 1) % order.length] || "Q1";
    updateState({ period: next });
  });

  document.getElementById("swapPossession").addEventListener("click", () => {
    const state = getScoreboardState();
    let next = state.possession === state.homeTeam ? state.awayTeam : state.homeTeam;
    if (!state.possession || state.possession === "--") next = state.homeTeam;
    updateState({ possession: next });
  });

  document.getElementById("clearLastGoal").addEventListener("click", () => updateState({ lastGoal: "--" }));

  document.getElementById("resetGame").addEventListener("click", () => {
    stopGameClock();
    stopShotClock();
    saveScoreboardState(defaultState);
    renderOperator();
  });
}

bindControls();
renderOperator();
