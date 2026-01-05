import type { Todo } from "./types";
import { saveTodos, loadTodos } from "./storage";

let todos: Todo[] = [];
let onChangeCallback: (() => void) | null = null;

export function initTodos(onChange?: () => void): void {
  todos = loadTodos();
  onChangeCallback = onChange ?? null;
}

export function getTodos(): Todo[] {
  return [...todos];
}

export function addTodo(text: string): Todo | null {
  const trimmedText = text.trim();
  if (!trimmedText) return null;

  const todo: Todo = {
    id: crypto.randomUUID(),
    text: trimmedText,
    completed: false,
    createdAt: Date.now(),
  };
  todos.push(todo);
  saveTodos(todos);
  onChangeCallback?.();
  return todo;
}

export function toggleTodo(id: string): boolean {
  const todo = todos.find((t) => t.id === id);
  if (!todo) return false;

  todo.completed = !todo.completed;
  saveTodos(todos);
  onChangeCallback?.();
  return true;
}

export function deleteTodo(id: string): boolean {
  const index = todos.findIndex((t) => t.id === id);
  if (index === -1) return false;

  todos.splice(index, 1);
  saveTodos(todos);
  onChangeCallback?.();
  return true;
}

export function clearCompletedTodos(): number {
  const before = todos.length;
  todos = todos.filter((t) => !t.completed);
  saveTodos(todos);
  onChangeCallback?.();
  return before - todos.length;
}

export function renderTodoList(container: HTMLElement): void {
  container.innerHTML = "";

  const inputContainer = document.createElement("div");
  inputContainer.className = "todo-input-container";

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Add a new task...";
  input.className = "todo-input";

  const addButton = document.createElement("button");
  addButton.textContent = "Add";
  addButton.className = "todo-add-btn";

  const handleAdd = () => {
    if (addTodo(input.value)) {
      input.value = "";
      renderTodoItems(listContainer);
    }
  };

  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleAdd();
  });
  addButton.addEventListener("click", handleAdd);

  inputContainer.appendChild(input);
  inputContainer.appendChild(addButton);
  container.appendChild(inputContainer);

  const listContainer = document.createElement("ul");
  listContainer.className = "todo-list";
  container.appendChild(listContainer);

  renderTodoItems(listContainer);

  const clearButton = document.createElement("button");
  clearButton.textContent = "Clear Completed";
  clearButton.className = "todo-clear-btn";
  clearButton.addEventListener("click", () => {
    clearCompletedTodos();
    renderTodoItems(listContainer);
  });
  container.appendChild(clearButton);
}

function renderTodoItems(listContainer: HTMLElement): void {
  listContainer.innerHTML = "";

  if (todos.length === 0) {
    const emptyMessage = document.createElement("li");
    emptyMessage.className = "todo-empty";
    emptyMessage.textContent = "No tasks yet. Add one above!";
    listContainer.appendChild(emptyMessage);
    return;
  }

  for (const todo of todos) {
    const li = document.createElement("li");
    li.className = `todo-item ${todo.completed ? "completed" : ""}`;
    li.dataset.id = todo.id;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.completed;
    checkbox.className = "todo-checkbox";
    checkbox.addEventListener("change", () => {
      toggleTodo(todo.id);
      renderTodoItems(listContainer);
    });

    const text = document.createElement("span");
    text.className = "todo-text";
    text.textContent = todo.text;

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "×";
    deleteBtn.className = "todo-delete-btn";
    deleteBtn.addEventListener("click", () => {
      deleteTodo(todo.id);
      renderTodoItems(listContainer);
    });

    li.appendChild(checkbox);
    li.appendChild(text);
    li.appendChild(deleteBtn);
    listContainer.appendChild(li);
  }
}
