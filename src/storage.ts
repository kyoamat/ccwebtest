import type { Todo, TimerSettings, TimerState } from "./types";
import { DEFAULT_TIMER_SETTINGS } from "./types";

const STORAGE_KEYS = {
  TODOS: "pomodoro-todos",
  TIMER_SETTINGS: "pomodoro-timer-settings",
  TIMER_STATE: "pomodoro-timer-state",
} as const;

export function saveTodos(todos: Todo[]): void {
  localStorage.setItem(STORAGE_KEYS.TODOS, JSON.stringify(todos));
}

export function loadTodos(): Todo[] {
  const data = localStorage.getItem(STORAGE_KEYS.TODOS);
  if (!data) return [];
  try {
    return JSON.parse(data) as Todo[];
  } catch {
    return [];
  }
}

export function saveTimerSettings(settings: TimerSettings): void {
  localStorage.setItem(STORAGE_KEYS.TIMER_SETTINGS, JSON.stringify(settings));
}

export function loadTimerSettings(): TimerSettings {
  const data = localStorage.getItem(STORAGE_KEYS.TIMER_SETTINGS);
  if (!data) return DEFAULT_TIMER_SETTINGS;
  try {
    return { ...DEFAULT_TIMER_SETTINGS, ...JSON.parse(data) } as TimerSettings;
  } catch {
    return DEFAULT_TIMER_SETTINGS;
  }
}

export function saveTimerState(state: TimerState): void {
  localStorage.setItem(STORAGE_KEYS.TIMER_STATE, JSON.stringify(state));
}

export function loadTimerState(): TimerState {
  const data = localStorage.getItem(STORAGE_KEYS.TIMER_STATE);
  const defaultState: TimerState = {
    isRunning: false,
    isBreak: false,
    timeRemaining: DEFAULT_TIMER_SETTINGS.workDuration,
    sessionsCompleted: 0,
  };
  if (!data) return defaultState;
  try {
    return { ...defaultState, ...JSON.parse(data), isRunning: false } as TimerState;
  } catch {
    return defaultState;
  }
}
