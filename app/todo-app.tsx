"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Todo = {
  id: string;
  title: string;
  notes?: string;
  list: string;
  dueDate?: string;
  priority: "low" | "medium" | "high";
  completed: boolean;
  assigneeId?: string;
  createdAt: string;
};
type Participant = {
  id: string;
  name: string;
  initials: string;
  color: string;
};
type Filter = "Today" | "Upcoming" | "All tasks" | "Completed" | string;
const icons = {
  Today: "☼",
  Upcoming: "◷",
  "All tasks": "☷",
  Completed: "✓",
  Work: "◆",
  Personal: "●",
  Groceries: "✦",
};

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<Filter>("Today");
  const [showComposer, setShowComposer] = useState(false);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [list, setList] = useState("My tasks");
  const [dueDate, setDueDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [priority, setPriority] = useState<Todo["priority"]>("medium");
  const [assigneeId, setAssigneeId] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [ready, setReady] = useState(false);
  const apiBase = process.env.NEXT_PUBLIC_BASE_PATH || "";
  const today = new Date().toISOString().slice(0, 10);
  const todayLabel = new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })
    .format(new Date())
    .toUpperCase();

  useEffect(() => {
    fetch(`${apiBase}/api/todos`)
      .then((r) => r.json())
      .then((data) => {
        setTodos(data);
        setReady(true);
      })
      .catch(() => setReady(true));
    fetch(`${apiBase}/api/participants`)
      .then((r) => r.json())
      .then(setParticipants)
      .catch(() => setParticipants([]));
  }, [apiBase]);
  const update = async (payload: Partial<Todo> & { id: string }) => {
    const response = await fetch(`${apiBase}/api/todos`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (response.ok) {
      const changed = await response.json();
      setTodos((items) =>
        items.map((item) => (item.id === changed.id ? changed : item)),
      );
    }
  };
  const remove = async (id: string) => {
    await fetch(`${apiBase}/api/todos`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setTodos((items) => items.filter((item) => item.id !== id));
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    const response = await fetch(`${apiBase}/api/todos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        notes,
        list,
        dueDate,
        priority,
        assigneeId,
      }),
    });
    if (response.ok) {
      const newTodo = await response.json();
      setTodos((items) => [newTodo, ...items]);
      setTitle("");
      setNotes("");
      setAssigneeId("");
      setShowComposer(false);
    }
  };
  const filtered = useMemo(
    () =>
      todos.filter((todo) => {
        const textMatch = `${todo.title} ${todo.notes}`
          .toLowerCase()
          .includes(search.toLowerCase());
        if (!textMatch) return false;
        if (filter === "Today")
          return todo.dueDate === today && !todo.completed;
        if (filter === "Upcoming")
          return !!todo.dueDate && todo.dueDate > today && !todo.completed;
        if (filter === "Completed") return todo.completed;
        if (filter === "All tasks") return !todo.completed;
        return todo.list === filter && !todo.completed;
      }),
    [todos, filter, search],
  );
  const lists = ["Work", "Personal", "Groceries"];
  const count = (name: Filter) =>
    name === "Today"
      ? todos.filter((t) => t.dueDate === today && !t.completed).length
      : name === "Upcoming"
        ? todos.filter((t) => t.dueDate && t.dueDate > today && !t.completed)
            .length
        : name === "All tasks"
          ? todos.filter((t) => !t.completed).length
          : name === "Completed"
            ? todos.filter((t) => t.completed).length
            : todos.filter((t) => t.list === name && !t.completed).length;
  const heading = filter === "Today" ? "Good morning, Alex." : filter;
  const subheading =
    filter === "Today"
      ? "Here’s what needs your attention today."
      : `${filtered.length} task${filtered.length === 1 ? "" : "s"} in view`;

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">✓</span>
          <span>focusflow</span>
        </div>
        <button className="add-task" onClick={() => setShowComposer(true)}>
          <span>＋</span> Add task <kbd>N</kbd>
        </button>
        <nav>
          <p className="nav-label">TASKS</p>
          {(["Today", "Upcoming", "All tasks", "Completed"] as Filter[]).map(
            (item) => (
              <button
                key={item}
                className={`nav-item ${filter === item ? "active" : ""}`}
                onClick={() => setFilter(item)}
              >
                <span>{icons[item as keyof typeof icons]}</span>
                {item}
                <b>{count(item)}</b>
              </button>
            ),
          )}
          <p className="nav-label lists-label">
            LISTS <button aria-label="add list">＋</button>
          </p>
          {lists.map((item) => (
            <button
              key={item}
              className={`nav-item list-item ${filter === item ? "active" : ""}`}
              onClick={() => setFilter(item)}
            >
              <i className={item.toLowerCase()}></i>
              {item}
              <b>{count(item)}</b>
            </button>
          ))}
        </nav>
        <div className="profile">
          <div className="avatar">AM</div>
          <div>
            <strong>Who U R</strong>
            <small>Free plan</small>
          </div>
          <span>⌄</span>
        </div>
      </aside>
      <section className="content">
        <header>
          <div className="mobile-brand">✓</div>
          <div className="search">
            <span>⌕</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks"
            />
            <kbd>⌘ K</kbd>
          </div>
          <button className="help">?</button>
          <button className="mobile-add" onClick={() => setShowComposer(true)}>
            ＋
          </button>
        </header>
        <div className="content-inner">
          <div className="hero">
            <div>
              <p className="eyebrow">{todayLabel}</p>
              <h1>{heading}</h1>
              <p>{subheading}</p>
            </div>
            <div className="progress-ring">
              <svg viewBox="0 0 42 42">
                <circle className="track" cx="21" cy="21" r="16" />
                <circle
                  className="meter"
                  cx="21"
                  cy="21"
                  r="16"
                  pathLength="100"
                  strokeDasharray="66 100"
                />
              </svg>
              <span>
                {todos.length
                  ? Math.round(
                      (todos.filter((t) => t.completed).length / todos.length) *
                        100,
                    )
                  : 0}
                %
              </span>
            </div>
          </div>
          {showComposer && (
            <form className="composer" onSubmit={submit}>
              <div className="composer-top">
                <input
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What needs to be done?"
                />
                <button type="button" onClick={() => setShowComposer(false)}>
                  ×
                </button>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add a note (optional)"
              />
              <div className="composer-footer">
                <div>
                  <select
                    value={list}
                    onChange={(e) => setList(e.target.value)}
                  >
                    <option>My tasks</option>
                    {lists.map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                  <select
                    value={priority}
                    onChange={(e) =>
                      setPriority(e.target.value as Todo["priority"])
                    }
                  >
                    <option value="low">Low priority</option>
                    <option value="medium">Medium priority</option>
                    <option value="high">High priority</option>
                  </select>
                  <select
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {participants.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button className="save" type="submit">
                  Add task
                </button>
              </div>
            </form>
          )}
          <div className="task-list">
            {!ready ? (
              <p className="empty">Loading your tasks…</p>
            ) : filtered.length ? (
              filtered.map((todo) => {
                const assignee = participants.find(
                  (person) => person.id === todo.assigneeId,
                );
                return (
                  <article
                    className={`task ${todo.completed ? "done" : ""}`}
                    key={todo.id}
                  >
                    <button
                      className="check"
                      onClick={() =>
                        update({ id: todo.id, completed: !todo.completed })
                      }
                    >
                      {todo.completed && "✓"}
                    </button>
                    <div className="task-copy">
                      <h3>{todo.title}</h3>
                      {todo.notes && <p>{todo.notes}</p>}
                      <div className="meta">
                        {todo.dueDate && (
                          <span
                            className={
                              todo.dueDate < today && !todo.completed
                                ? "overdue"
                                : ""
                            }
                          >
                            {todo.dueDate === today
                              ? "Today"
                              : new Date(
                                  `${todo.dueDate}T00:00:00`,
                                ).toLocaleDateString("en", {
                                  month: "short",
                                  day: "numeric",
                                })}
                          </span>
                        )}
                        <span className={`priority ${todo.priority}`}></span>
                        <span>{todo.list}</span>
                      </div>
                    </div>
                    {assignee && (
                      <div
                        className="task-avatar"
                        title={`Assigned to ${assignee.name}`}
                        style={{ backgroundColor: assignee.color }}
                      >
                        {assignee.initials}
                      </div>
                    )}
                    <div className="more-wrap">
                      <button
                        className="delete"
                        aria-label="more task actions"
                        onClick={() =>
                          setMenuFor(menuFor === todo.id ? null : todo.id)
                        }
                      >
                        ⋯
                      </button>
                      {menuFor === todo.id && (
                        <div className="more-menu">
                          <p>Assign to</p>
                          <button
                            onClick={() => {
                              update({ id: todo.id, assigneeId: "" });
                              setMenuFor(null);
                            }}
                          >
                            Unassigned
                          </button>
                          {participants.map((person) => (
                            <button
                              key={person.id}
                              onClick={() => {
                                update({ id: todo.id, assigneeId: person.id });
                                setMenuFor(null);
                              }}
                            >
                              <i style={{ backgroundColor: person.color }}>
                                {person.initials}
                              </i>
                              {person.name}
                              {todo.assigneeId === person.id && <span>✓</span>}
                            </button>
                          ))}
                          <hr />
                          <button
                            className="danger"
                            onClick={() => remove(todo.id)}
                          >
                            Delete task
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="empty-state">
                <div>✦</div>
                <h2>Nothing here yet</h2>
                <p>Enjoy the clear space, or add a task when you’re ready.</p>
              </div>
            )}
          </div>
          {!showComposer && (
            <button className="quiet-add" onClick={() => setShowComposer(true)}>
              <span>＋</span> Add a task
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
