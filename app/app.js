import { TASKS, UI, taskById } from "./tasks.js";

const LANG_KEY = "satr-papers-lang";
const CHECK_KEY = "satr-papers-checks-v1";

export function progressLabel(checked, total, lang) {
  if (lang === "ar") return `${checked} من ${total} مستندات`;
  return `${checked} of ${total} documents`;
}

export function loadChecks() {
  try {
    const raw = localStorage.getItem(CHECK_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveChecks(checks) {
  try {
    localStorage.setItem(CHECK_KEY, JSON.stringify(checks));
  } catch {
    /* private mode */
  }
}

export function loadLang() {
  try {
    return localStorage.getItem(LANG_KEY) === "ar" ? "ar" : "en";
  } catch {
    return "en";
  }
}

export function taskMatches(task, query, lang) {
  const needle = String(query ?? "").trim().toLowerCase();
  if (!needle) return true;
  return String(task[lang].title).toLowerCase().includes(needle);
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const state = {
  lang: "en",
  checks: {},
  query: "",
};

function text() {
  return UI[state.lang];
}

function applyLanguage(lang) {
  state.lang = lang === "ar" ? "ar" : "en";
  document.documentElement.lang = state.lang === "ar" ? "ar" : "en";
  document.documentElement.dir = state.lang === "ar" ? "rtl" : "ltr";
  const copy = text();
  document.title = copy.title;
  document.getElementById("kicker").textContent = copy.kicker;
  document.getElementById("skip").textContent = copy.skip;
  document.getElementById("direction").textContent = copy.direction;
  document.getElementById("disclaimer").textContent = copy.disclaimer;
  const toggle = document.getElementById("lang-toggle");
  toggle.textContent = copy.langButton;
  toggle.setAttribute("aria-pressed", String(copy.langPressed));
  toggle.setAttribute("lang", state.lang === "ar" ? "en" : "ar");
  try {
    localStorage.setItem(LANG_KEY, state.lang);
  } catch {
    /* ignore */
  }
  render();
}

function checkedCount(taskId) {
  const bag = state.checks[taskId] ?? {};
  return Object.values(bag).filter(Boolean).length;
}

function totalChecked() {
  return TASKS.reduce((sum, task) => sum + checkedCount(task.id), 0);
}

function render() {
  const id = location.hash.replace(/^#/, "");
  const task = taskById(id);
  const view = document.getElementById("view");
  view.innerHTML = task ? renderDetail(task) : renderList();
  bind(view, task);
}

function visibleTasks() {
  return TASKS.filter((task) => taskMatches(task, state.query, state.lang));
}

function renderCard(task) {
  const copy = text();
  const item = task[state.lang];
  const index = TASKS.indexOf(task) + 1;
  return `<li>
      <button type="button" class="task" data-open="${task.id}">
        <span class="index">${index}</span>
        <span>
          <strong>${escapeHtml(item.title)}</strong>
          <small>${escapeHtml(item.summary)}</small>
        </span>
        <span class="go">${escapeHtml(copy.open)}</span>
      </button>
    </li>`;
}

function renderList() {
  const copy = text();
  const tasks = visibleTasks();
  return `<section class="hero">
    <h1>${escapeHtml(copy.headline)}</h1>
    <p class="deck">${escapeHtml(copy.deck)}</p>
    <p class="ready-line">${escapeHtml(copy.ready(totalChecked()))}</p>
    <div class="search-row">
      <label for="task-search">${escapeHtml(copy.searchLabel)}</label>
      <input id="task-search" type="text" value="${escapeHtml(state.query)}" autocomplete="off" enterkeyhint="search" />
    </div>
    <p class="search-empty"${tasks.length ? " hidden" : ""}>${escapeHtml(copy.searchEmpty)}</p>
    <ul class="tasks">${tasks.map(renderCard).join("")}</ul>
  </section>`;
}

function renderDetail(task) {
  const copy = text();
  const item = task[state.lang];
  const bag = state.checks[task.id] ?? {};
  const done = checkedCount(task.id);
  const docs = item.documents
    .map((doc) => {
      const on = Boolean(bag[doc.id]);
      return `<li class="doc${on ? " checked" : ""}">
        <input type="checkbox" id="doc-${task.id}-${doc.id}" data-doc="${doc.id}" ${on ? "checked" : ""} />
        <label for="doc-${task.id}-${doc.id}">
          <strong>${escapeHtml(doc.name)}</strong>
          <p>${escapeHtml(doc.detail)}</p>
        </label>
      </li>`;
    })
    .join("");
  const steps = item.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("");
  return `<article class="detail">
    <button type="button" class="back" id="back">${escapeHtml(copy.back)}</button>
    <h1>${escapeHtml(item.title)}</h1>
    <p class="deck">${escapeHtml(item.summary)}</p>
    <div class="meta">
      <span class="chip">${escapeHtml(item.office)}</span>
      <span class="chip">${escapeHtml(item.time)}</span>
      <span class="chip">${escapeHtml(item.fee)}</span>
    </div>
    <div class="columns">
      <section class="panel">
        <div class="panel-head">
          <h2>${escapeHtml(copy.documents)}</h2>
          <p id="check-progress" aria-live="polite">${escapeHtml(progressLabel(done, item.documents.length, state.lang))}</p>
        </div>
        <ul class="docs">${docs}</ul>
      </section>
      <section class="panel">
        <h2>${escapeHtml(copy.steps)}</h2>
        <ol class="steps">${steps}</ol>
      </section>
    </div>
    <section class="say">
      <h2>${escapeHtml(copy.say)}</h2>
      <p id="say-text">${escapeHtml(item.say)}</p>
      <button type="button" id="copy">${escapeHtml(copy.copy)}</button>
    </section>
    <p class="official"><a href="${escapeHtml(task.href)}">${escapeHtml(copy.official)}</a></p>
    <p class="reset-row"><button type="button" class="text-button" id="reset">${escapeHtml(copy.reset)}</button></p>
  </article>`;
}

function bindTaskButtons(view) {
  view.querySelectorAll("[data-open]").forEach((button) => {
    button.addEventListener("click", () => {
      location.hash = button.getAttribute("data-open");
    });
  });
}

function bind(view, task) {
  bindTaskButtons(view);
  const search = view.querySelector("#task-search");
  search?.addEventListener("input", () => {
    state.query = search.value;
    const tasks = visibleTasks();
    view.querySelector(".tasks").innerHTML = tasks.map(renderCard).join("");
    const empty = view.querySelector(".search-empty");
    if (empty) empty.hidden = tasks.length > 0;
    bindTaskButtons(view);
  });
  const back = view.querySelector("#back");
  if (back) {
    back.addEventListener("click", () => {
      location.hash = "";
    });
  }
  if (!task) return;
  view.querySelectorAll("[data-doc]").forEach((box) => {
    box.addEventListener("change", () => {
      const docId = box.getAttribute("data-doc");
      const bag = { ...(state.checks[task.id] ?? {}) };
      bag[docId] = box.checked;
      state.checks[task.id] = bag;
      saveChecks(state.checks);
      const row = box.closest(".doc");
      row.classList.toggle("checked", box.checked);
      const label = document.getElementById("check-progress");
      label.textContent = progressLabel(checkedCount(task.id), task[state.lang].documents.length, state.lang);
    });
  });
  const copyButton = view.querySelector("#copy");
  copyButton?.addEventListener("click", async () => {
    const sentence = document.getElementById("say-text").textContent;
    try {
      await navigator.clipboard.writeText(sentence);
    } catch {
      const area = document.createElement("textarea");
      area.value = sentence;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    copyButton.textContent = text().copied;
  });
  view.querySelector("#reset")?.addEventListener("click", () => {
    state.checks[task.id] = {};
    saveChecks(state.checks);
    render();
  });
}

function boot() {
  state.checks = loadChecks();
  document.getElementById("lang-toggle").addEventListener("click", () => {
    applyLanguage(state.lang === "ar" ? "en" : "ar");
  });
  window.addEventListener("hashchange", render);
  applyLanguage(loadLang());
}

if (typeof document !== "undefined" && document.getElementById("view")) boot();
