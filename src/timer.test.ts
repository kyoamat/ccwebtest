import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  initTimer,
  getTimerSettings,
  getTimerState,
  updateSettings,
  startTimer,
  pauseTimer,
  resetTimer,
  skipToNext,
  formatTime,
} from "./timer";
import { DEFAULT_TIMER_SETTINGS } from "./types";

describe("timer", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    initTimer();
  });

  afterEach(() => {
    pauseTimer();
    vi.useRealTimers();
  });

  describe("formatTime", () => {
    it("should format seconds as MM:SS", () => {
      expect(formatTime(0)).toBe("00:00");
      expect(formatTime(59)).toBe("00:59");
      expect(formatTime(60)).toBe("01:00");
      expect(formatTime(125)).toBe("02:05");
      expect(formatTime(3600)).toBe("60:00");
    });

    it("should pad single digits with zero", () => {
      expect(formatTime(65)).toBe("01:05");
    });
  });

  describe("initTimer", () => {
    it("should initialize with default settings", () => {
      const settings = getTimerSettings();
      expect(settings).toEqual(DEFAULT_TIMER_SETTINGS);
    });

    it("should initialize with default state", () => {
      const state = getTimerState();
      expect(state.isRunning).toBe(false);
      expect(state.isBreak).toBe(false);
      expect(state.timeRemaining).toBe(DEFAULT_TIMER_SETTINGS.workDuration);
      expect(state.sessionsCompleted).toBe(0);
    });
  });

  describe("updateSettings", () => {
    it("should update work duration", () => {
      updateSettings({ workDuration: 30 * 60 });

      const settings = getTimerSettings();
      expect(settings.workDuration).toBe(30 * 60);
    });

    it("should update time remaining when not running", () => {
      updateSettings({ workDuration: 30 * 60 });

      const state = getTimerState();
      expect(state.timeRemaining).toBe(30 * 60);
    });

    it("should persist settings to localStorage", () => {
      updateSettings({ workDuration: 30 * 60 });

      const stored = localStorage.getItem("pomodoro-timer-settings");
      expect(stored).not.toBeNull();
      expect(JSON.parse(stored!).workDuration).toBe(30 * 60);
    });
  });

  describe("startTimer and pauseTimer", () => {
    it("should start the timer", () => {
      startTimer();

      const state = getTimerState();
      expect(state.isRunning).toBe(true);
    });

    it("should pause the timer", () => {
      startTimer();
      pauseTimer();

      const state = getTimerState();
      expect(state.isRunning).toBe(false);
    });

    it("should decrement time when running", () => {
      const initialTime = getTimerState().timeRemaining;

      startTimer();
      vi.advanceTimersByTime(3000);

      const state = getTimerState();
      expect(state.timeRemaining).toBe(initialTime - 3);
    });

    it("should not decrement when paused", () => {
      startTimer();
      vi.advanceTimersByTime(2000);
      pauseTimer();

      const timeAfterPause = getTimerState().timeRemaining;
      vi.advanceTimersByTime(5000);

      expect(getTimerState().timeRemaining).toBe(timeAfterPause);
    });
  });

  describe("resetTimer", () => {
    it("should reset timer to initial work duration", () => {
      startTimer();
      vi.advanceTimersByTime(5000);
      resetTimer();

      const state = getTimerState();
      expect(state.timeRemaining).toBe(DEFAULT_TIMER_SETTINGS.workDuration);
      expect(state.isRunning).toBe(false);
    });

    it("should reset to break duration when in break mode", () => {
      skipToNext(); // Go to break
      startTimer();
      vi.advanceTimersByTime(2000);
      resetTimer();

      const state = getTimerState();
      expect(state.timeRemaining).toBe(DEFAULT_TIMER_SETTINGS.breakDuration);
    });
  });

  describe("skipToNext", () => {
    it("should switch from work to break", () => {
      skipToNext();

      const state = getTimerState();
      expect(state.isBreak).toBe(true);
      expect(state.sessionsCompleted).toBe(1);
      expect(state.timeRemaining).toBe(DEFAULT_TIMER_SETTINGS.breakDuration);
    });

    it("should switch from break to work", () => {
      skipToNext(); // work -> break
      skipToNext(); // break -> work

      const state = getTimerState();
      expect(state.isBreak).toBe(false);
      expect(state.sessionsCompleted).toBe(1);
      expect(state.timeRemaining).toBe(DEFAULT_TIMER_SETTINGS.workDuration);
    });

    it("should use long break after configured sessions", () => {
      // Complete 3 work sessions first
      for (let i = 0; i < 3; i++) {
        skipToNext(); // work -> break
        skipToNext(); // break -> work
      }
      // Now on 4th work session, skip to get long break
      skipToNext(); // work -> break (session 4 = long break)

      const state = getTimerState();
      expect(state.isBreak).toBe(true);
      expect(state.sessionsCompleted).toBe(4);
      expect(state.timeRemaining).toBe(DEFAULT_TIMER_SETTINGS.longBreakDuration);
    });
  });

  describe("timer completion", () => {
    it("should switch to break when work timer completes", () => {
      // Set a short work duration for testing
      updateSettings({ workDuration: 3 });

      startTimer();
      vi.advanceTimersByTime(4000);

      const state = getTimerState();
      expect(state.isBreak).toBe(true);
      expect(state.sessionsCompleted).toBe(1);
      expect(state.isRunning).toBe(false);
    });

    it("should switch to work when break timer completes", () => {
      updateSettings({ workDuration: 2, breakDuration: 2 });

      startTimer();
      vi.advanceTimersByTime(3000); // Complete work

      startTimer();
      vi.advanceTimersByTime(3000); // Complete break

      const state = getTimerState();
      expect(state.isBreak).toBe(false);
      expect(state.isRunning).toBe(false);
    });
  });
});
