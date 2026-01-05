import { describe, it, expect, beforeEach } from "vitest";
import {
  saveTodos,
  loadTodos,
  saveTimerSettings,
  loadTimerSettings,
  saveTimerState,
  loadTimerState,
} from "./storage";
import type { Todo, TimerSettings, TimerState } from "./types";
import { DEFAULT_TIMER_SETTINGS } from "./types";

describe("storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("todos", () => {
    it("should save and load todos", () => {
      const todos: Todo[] = [
        { id: "1", text: "Test task", completed: false, createdAt: Date.now() },
        { id: "2", text: "Another task", completed: true, createdAt: Date.now() },
      ];

      saveTodos(todos);
      const loaded = loadTodos();

      expect(loaded).toEqual(todos);
    });

    it("should return empty array when no todos saved", () => {
      const loaded = loadTodos();
      expect(loaded).toEqual([]);
    });

    it("should return empty array on invalid JSON", () => {
      localStorage.setItem("pomodoro-todos", "invalid json");
      const loaded = loadTodos();
      expect(loaded).toEqual([]);
    });
  });

  describe("timer settings", () => {
    it("should save and load timer settings", () => {
      const settings: TimerSettings = {
        workDuration: 30 * 60,
        breakDuration: 10 * 60,
        longBreakDuration: 20 * 60,
        sessionsBeforeLongBreak: 3,
      };

      saveTimerSettings(settings);
      const loaded = loadTimerSettings();

      expect(loaded).toEqual(settings);
    });

    it("should return default settings when none saved", () => {
      const loaded = loadTimerSettings();
      expect(loaded).toEqual(DEFAULT_TIMER_SETTINGS);
    });

    it("should merge with defaults on partial settings", () => {
      localStorage.setItem("pomodoro-timer-settings", JSON.stringify({ workDuration: 30 * 60 }));
      const loaded = loadTimerSettings();

      expect(loaded.workDuration).toBe(30 * 60);
      expect(loaded.breakDuration).toBe(DEFAULT_TIMER_SETTINGS.breakDuration);
    });
  });

  describe("timer state", () => {
    it("should save and load timer state", () => {
      const state: TimerState = {
        isRunning: true,
        isBreak: false,
        timeRemaining: 1200,
        sessionsCompleted: 2,
      };

      saveTimerState(state);
      const loaded = loadTimerState();

      // isRunning should always be false on load
      expect(loaded).toEqual({ ...state, isRunning: false });
    });

    it("should return default state when none saved", () => {
      const loaded = loadTimerState();

      expect(loaded.isRunning).toBe(false);
      expect(loaded.isBreak).toBe(false);
      expect(loaded.timeRemaining).toBe(DEFAULT_TIMER_SETTINGS.workDuration);
      expect(loaded.sessionsCompleted).toBe(0);
    });

    it("should always set isRunning to false on load", () => {
      const state: TimerState = {
        isRunning: true,
        isBreak: false,
        timeRemaining: 1200,
        sessionsCompleted: 0,
      };

      saveTimerState(state);
      const loaded = loadTimerState();

      expect(loaded.isRunning).toBe(false);
    });
  });
});
