export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

export interface TimerSettings {
  workDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
}

export interface TimerState {
  isRunning: boolean;
  isBreak: boolean;
  timeRemaining: number;
  sessionsCompleted: number;
}

export const DEFAULT_TIMER_SETTINGS: TimerSettings = {
  workDuration: 25 * 60,
  breakDuration: 5 * 60,
  longBreakDuration: 15 * 60,
  sessionsBeforeLongBreak: 4,
};
