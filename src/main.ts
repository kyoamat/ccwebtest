import "./style.css";
import { initTodos, renderTodoList } from "./todo";
import { initTimer, renderTimer, requestNotificationPermission } from "./timer";

function init(): void {
  const app = document.querySelector<HTMLDivElement>("#app");
  if (!app) return;

  app.innerHTML = `
        <header class="header">
            <h1>Pomodoro Todo</h1>
        </header>
        <main class="main">
            <section class="timer-section">
                <h2>Timer</h2>
                <div id="timer-container"></div>
            </section>
            <section class="todo-section">
                <h2>Tasks</h2>
                <div id="todo-container"></div>
            </section>
        </main>
        <footer class="footer">
            <p>Stay focused and productive!</p>
        </footer>
    `;

  initTodos();
  initTimer();

  const timerContainer = document.querySelector<HTMLDivElement>("#timer-container");
  const todoContainer = document.querySelector<HTMLDivElement>("#todo-container");

  if (timerContainer) {
    renderTimer(timerContainer);
  }

  if (todoContainer) {
    renderTodoList(todoContainer);
  }

  requestNotificationPermission();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
