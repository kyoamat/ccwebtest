import { describe, it, expect, beforeEach, vi } from "vitest";
import { initTodos, getTodos, addTodo, toggleTodo, deleteTodo, clearCompletedTodos } from "./todo";

// Mock crypto.randomUUID
vi.stubGlobal("crypto", {
  randomUUID: vi.fn(() => `uuid-${Math.random().toString(36).substring(7)}`),
});

describe("todo", () => {
  beforeEach(() => {
    localStorage.clear();
    initTodos();
  });

  describe("addTodo", () => {
    it("should add a new todo", () => {
      const todo = addTodo("Test task");

      expect(todo).not.toBeNull();
      expect(todo?.text).toBe("Test task");
      expect(todo?.completed).toBe(false);
      expect(getTodos()).toHaveLength(1);
    });

    it("should trim whitespace from todo text", () => {
      const todo = addTodo("  Trimmed task  ");

      expect(todo?.text).toBe("Trimmed task");
    });

    it("should return null for empty text", () => {
      const todo = addTodo("");

      expect(todo).toBeNull();
      expect(getTodos()).toHaveLength(0);
    });

    it("should return null for whitespace-only text", () => {
      const todo = addTodo("   ");

      expect(todo).toBeNull();
      expect(getTodos()).toHaveLength(0);
    });

    it("should persist todos to localStorage", () => {
      addTodo("Persisted task");

      const stored = localStorage.getItem("pomodoro-todos");
      expect(stored).not.toBeNull();
      expect(JSON.parse(stored!)).toHaveLength(1);
    });
  });

  describe("toggleTodo", () => {
    it("should toggle todo completed status", () => {
      const todo = addTodo("Toggle task")!;

      expect(todo.completed).toBe(false);

      const result = toggleTodo(todo.id);
      expect(result).toBe(true);

      const todos = getTodos();
      expect(todos[0].completed).toBe(true);
    });

    it("should toggle back to incomplete", () => {
      const todo = addTodo("Toggle task")!;

      toggleTodo(todo.id);
      toggleTodo(todo.id);

      const todos = getTodos();
      expect(todos[0].completed).toBe(false);
    });

    it("should return false for non-existent todo", () => {
      const result = toggleTodo("non-existent-id");
      expect(result).toBe(false);
    });
  });

  describe("deleteTodo", () => {
    it("should delete a todo", () => {
      const todo = addTodo("Delete task")!;

      const result = deleteTodo(todo.id);

      expect(result).toBe(true);
      expect(getTodos()).toHaveLength(0);
    });

    it("should return false for non-existent todo", () => {
      const result = deleteTodo("non-existent-id");
      expect(result).toBe(false);
    });

    it("should only delete the specified todo", () => {
      addTodo("Task 1");
      const todo2 = addTodo("Task 2")!;
      addTodo("Task 3");

      deleteTodo(todo2.id);

      const todos = getTodos();
      expect(todos).toHaveLength(2);
      expect(todos.find((t) => t.text === "Task 2")).toBeUndefined();
    });
  });

  describe("clearCompletedTodos", () => {
    it("should clear all completed todos", () => {
      const todo1 = addTodo("Task 1")!;
      addTodo("Task 2");
      const todo3 = addTodo("Task 3")!;

      toggleTodo(todo1.id);
      toggleTodo(todo3.id);

      const cleared = clearCompletedTodos();

      expect(cleared).toBe(2);
      expect(getTodos()).toHaveLength(1);
      expect(getTodos()[0].text).toBe("Task 2");
    });

    it("should return 0 when no completed todos", () => {
      addTodo("Task 1");
      addTodo("Task 2");

      const cleared = clearCompletedTodos();

      expect(cleared).toBe(0);
      expect(getTodos()).toHaveLength(2);
    });
  });

  describe("getTodos", () => {
    it("should return a copy of todos array", () => {
      addTodo("Task 1");

      const todos1 = getTodos();
      const todos2 = getTodos();

      expect(todos1).not.toBe(todos2);
      expect(todos1).toEqual(todos2);
    });
  });
});
