import type { TimerSettings, TimerState } from "./types";
import { DEFAULT_TIMER_SETTINGS } from "./types";
import { loadTimerSettings, loadTimerState, saveTimerSettings, saveTimerState } from "./storage";

let settings: TimerSettings = DEFAULT_TIMER_SETTINGS;
let state: TimerState = {
  isRunning: false,
  isBreak: false,
  timeRemaining: DEFAULT_TIMER_SETTINGS.workDuration,
  sessionsCompleted: 0,
};
let timerInterval: ReturnType<typeof setInterval> | null = null;
let onTickCallback: (() => void) | null = null;

export function initTimer(onTick?: () => void): void {
  settings = loadTimerSettings();
  state = loadTimerState();
  if (state.timeRemaining <= 0) {
    state.timeRemaining = settings.workDuration;
  }
  onTickCallback = onTick ?? null;
}

export function getTimerSettings(): TimerSettings {
  return { ...settings };
}

export function getTimerState(): TimerState {
  return { ...state };
}

export function updateSettings(newSettings: Partial<TimerSettings>): void {
  settings = { ...settings, ...newSettings };
  saveTimerSettings(settings);
  if (!state.isRunning) {
    state.timeRemaining = state.isBreak
      ? isLongBreak()
        ? settings.longBreakDuration
        : settings.breakDuration
      : settings.workDuration;
    saveTimerState(state);
  }
  onTickCallback?.();
}

function isLongBreak(): boolean {
  return (
    state.sessionsCompleted > 0 && state.sessionsCompleted % settings.sessionsBeforeLongBreak === 0
  );
}

export function startTimer(): void {
  if (state.isRunning) return;

  state.isRunning = true;
  saveTimerState(state);

  timerInterval = setInterval(() => {
    state.timeRemaining--;

    if (state.timeRemaining <= 0) {
      handleTimerComplete();
    }

    saveTimerState(state);
    onTickCallback?.();
  }, 1000);

  onTickCallback?.();
}

export function pauseTimer(): void {
  if (!state.isRunning) return;

  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  state.isRunning = false;
  saveTimerState(state);
  onTickCallback?.();
}

export function resetTimer(): void {
  pauseTimer();
  state.timeRemaining = state.isBreak
    ? isLongBreak()
      ? settings.longBreakDuration
      : settings.breakDuration
    : settings.workDuration;
  saveTimerState(state);
  onTickCallback?.();
}

export function skipToNext(): void {
  pauseTimer();
  if (!state.isBreak) {
    state.sessionsCompleted++;
  }
  state.isBreak = !state.isBreak;
  state.timeRemaining = state.isBreak
    ? isLongBreak()
      ? settings.longBreakDuration
      : settings.breakDuration
    : settings.workDuration;
  saveTimerState(state);
  onTickCallback?.();
}

function handleTimerComplete(): void {
  pauseTimer();

  if (!state.isBreak) {
    state.sessionsCompleted++;
  }

  state.isBreak = !state.isBreak;
  state.timeRemaining = state.isBreak
    ? isLongBreak()
      ? settings.longBreakDuration
      : settings.breakDuration
    : settings.workDuration;

  playNotificationSound();
  showNotification();
  saveTimerState(state);
}

function playNotificationSound(): void {
  try {
    const audioContext = new (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    )();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = "sine";
    gainNode.gain.value = 0.3;

    oscillator.start();
    setTimeout(() => oscillator.stop(), 200);
  } catch {
    // Audio not supported
  }
}

function showNotification(): void {
  if ("Notification" in window && Notification.permission === "granted") {
    const message = state.isBreak ? "Time for a break!" : "Break is over. Time to work!";
    new Notification("Pomodoro Timer", { body: message });
  }
}

export function requestNotificationPermission(): void {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function renderTimer(container: HTMLElement): void {
  container.innerHTML = "";

  const timerDisplay = document.createElement("div");
  timerDisplay.className = "timer-display";

  const modeLabel = document.createElement("div");
  modeLabel.className = "timer-mode";
  updateModeLabel(modeLabel);

  const timeDisplay = document.createElement("div");
  timeDisplay.className = "timer-time";
  timeDisplay.textContent = formatTime(state.timeRemaining);

  const sessionsDisplay = document.createElement("div");
  sessionsDisplay.className = "timer-sessions";
  sessionsDisplay.textContent = `Sessions: ${state.sessionsCompleted}`;

  timerDisplay.appendChild(modeLabel);
  timerDisplay.appendChild(timeDisplay);
  timerDisplay.appendChild(sessionsDisplay);
  container.appendChild(timerDisplay);

  const controls = document.createElement("div");
  controls.className = "timer-controls";

  const startPauseBtn = document.createElement("button");
  startPauseBtn.className = "timer-btn timer-btn-primary";
  updateStartPauseButton(startPauseBtn);
  startPauseBtn.addEventListener("click", () => {
    if (state.isRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
    updateStartPauseButton(startPauseBtn);
  });

  const resetBtn = document.createElement("button");
  resetBtn.textContent = "Reset";
  resetBtn.className = "timer-btn";
  resetBtn.addEventListener("click", () => {
    resetTimer();
    updateUI();
  });

  const skipBtn = document.createElement("button");
  skipBtn.textContent = "Skip";
  skipBtn.className = "timer-btn";
  skipBtn.addEventListener("click", () => {
    skipToNext();
    updateUI();
  });

  controls.appendChild(startPauseBtn);
  controls.appendChild(resetBtn);
  controls.appendChild(skipBtn);
  container.appendChild(controls);

  const settingsToggle = document.createElement("button");
  settingsToggle.textContent = "Settings";
  settingsToggle.className = "timer-settings-toggle";
  container.appendChild(settingsToggle);

  const settingsPanel = createSettingsPanel();
  settingsPanel.style.display = "none";
  container.appendChild(settingsPanel);

  settingsToggle.addEventListener("click", () => {
    settingsPanel.style.display = settingsPanel.style.display === "none" ? "block" : "none";
  });

  function updateUI(): void {
    timeDisplay.textContent = formatTime(state.timeRemaining);
    sessionsDisplay.textContent = `Sessions: ${state.sessionsCompleted}`;
    updateModeLabel(modeLabel);
    updateStartPauseButton(startPauseBtn);
  }

  onTickCallback = updateUI;
}

function updateModeLabel(element: HTMLElement): void {
  element.textContent = state.isBreak ? "Break Time" : "Work Time";
  element.className = `timer-mode ${state.isBreak ? "break" : "work"}`;
}

function updateStartPauseButton(button: HTMLElement): void {
  button.textContent = state.isRunning ? "Pause" : "Start";
}

function createSettingsPanel(): HTMLElement {
  const panel = document.createElement("div");
  panel.className = "timer-settings";

  const createSettingInput = (
    label: string,
    value: number,
    onChange: (val: number) => void,
  ): HTMLElement => {
    const container = document.createElement("div");
    container.className = "setting-row";

    const labelEl = document.createElement("label");
    labelEl.textContent = label;

    const input = document.createElement("input");
    input.type = "number";
    input.min = "1";
    input.max = "60";
    input.value = String(Math.floor(value / 60));
    input.addEventListener("change", () => {
      const minutes = parseInt(input.value, 10);
      if (!isNaN(minutes) && minutes > 0) {
        onChange(minutes * 60);
      }
    });

    const unit = document.createElement("span");
    unit.textContent = "min";

    container.appendChild(labelEl);
    container.appendChild(input);
    container.appendChild(unit);
    return container;
  };

  panel.appendChild(
    createSettingInput("Work Duration:", settings.workDuration, (val) =>
      updateSettings({ workDuration: val }),
    ),
  );
  panel.appendChild(
    createSettingInput("Break Duration:", settings.breakDuration, (val) =>
      updateSettings({ breakDuration: val }),
    ),
  );
  panel.appendChild(
    createSettingInput("Long Break:", settings.longBreakDuration, (val) =>
      updateSettings({ longBreakDuration: val }),
    ),
  );

  const sessionsRow = document.createElement("div");
  sessionsRow.className = "setting-row";
  const sessionsLabel = document.createElement("label");
  sessionsLabel.textContent = "Sessions before long break:";
  const sessionsInput = document.createElement("input");
  sessionsInput.type = "number";
  sessionsInput.min = "1";
  sessionsInput.max = "10";
  sessionsInput.value = String(settings.sessionsBeforeLongBreak);
  sessionsInput.addEventListener("change", () => {
    const val = parseInt(sessionsInput.value, 10);
    if (!isNaN(val) && val > 0) {
      updateSettings({ sessionsBeforeLongBreak: val });
    }
  });
  sessionsRow.appendChild(sessionsLabel);
  sessionsRow.appendChild(sessionsInput);
  panel.appendChild(sessionsRow);

  return panel;
}
