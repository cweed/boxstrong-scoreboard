const SCOREBOARD_KEY = "beastave_boxstrong_scoreboard_v1";

const defaultState = {
  leagueTitle: "BOXSTRONG",
  gameStatus: "LIVE",
  period: "Q1",
  gameClock: "12:00",
  shotClock: "30",
  gameClockRunning: false,
  shotClockRunning: false,

  homeTeam: "SABRETOOTHS",
  awayTeam: "PHOENIX",
  homeRecord: "0-0",
  awayRecord: "0-0",
  homeScore: 0,
  awayScore: 0,
  homeShots: 0,
  awayShots: 0,
  homePenalties: 0,
  awayPenalties: 0,
  homeTimeouts: 2,
  awayTimeouts: 2,

  possession: "--",
  lastGoal: "--",
  note: "Week 1 Matchup",
  connection: "LOCAL CONTROL"
};

function getScoreboardState() {
  const raw = localStorage.getItem(SCOREBOARD_KEY);
  if (!raw) return { ...defaultState };
  try {
    return { ...defaultState, ...JSON.parse(raw) };
  } catch {
    return { ...defaultState };
  }
}

function saveScoreboardState(nextState) {
  const state = { ...defaultState, ...nextState };
  localStorage.setItem(SCOREBOARD_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent("scoreboard-state-updated", { detail: state }));
}

function mmssToSeconds(value) {
  const parts = String(value || "0:00").split(":").map(Number);
  if (parts.length !== 2 || parts.some(Number.isNaN)) return 0;
  return Math.max(0, parts[0] * 60 + parts[1]);
}

function secondsToMmss(total) {
  const safe = Math.max(0, Number(total) || 0);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function clampNumber(value, min = 0, max = 999) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

if (!localStorage.getItem(SCOREBOARD_KEY)) {
  saveScoreboardState(defaultState);
}
