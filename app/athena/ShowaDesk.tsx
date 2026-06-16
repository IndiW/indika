"use client";

import { useState, useEffect, useRef } from "react";

const POMODORO = 25 * 60;

const INITIAL_TODOS = [
  { id: 1, text: "メールの返信", done: false },
  { id: 2, text: "資料の印刷", done: false },
];

const HEALTH_TASKS = [
  {
    id: "eyes",
    label: "Look away",
    detail: "20 seconds",
    cooldown: 20 * 60 * 1000,
  },
  {
    id: "posture",
    label: "Posture",
    detail: "Reset",
    cooldown: 30 * 60 * 1000,
  },
  { id: "stand", label: "Stand up", detail: null, cooldown: 60 * 60 * 1000 },
  { id: "hydrate", label: "Hydrate", detail: null, cooldown: 60 * 60 * 1000 },
  {
    id: "break",
    label: "Screen break",
    detail: null,
    cooldown: 6 * 60 * 60 * 1000,
  },
] as const;

const NOISE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`;

const TILE_BASE: React.CSSProperties = {
  background: "#1a1714",
  borderRadius: 6,
  boxShadow:
    "inset 0 1px 0 rgba(255,255,255,.03),0 12px 26px -14px rgba(0,0,0,.8)",
  padding: "20px 22px",
  minHeight: 0,
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
};

type Widget = "timer" | "todo" | "fidget" | "buddy" | "health";
const WIDGET_LABELS: Record<Widget, string> = {
  timer: "TIMER",
  todo: "TODO",
  fidget: "FIDGET",
  buddy: "BUDDY",
  health: "HEALTH",
};
const NON_HEALTH: Widget[] = ["timer", "todo", "fidget", "buddy"];

const DEFAULT_ORDER: Widget[] = ["timer", "todo", "fidget", "buddy"];
const DEFAULT_ACTIVE = new Set<Widget>([
  "timer",
  "todo",
  "fidget",
  "buddy",
  "health",
]);

export default function ShowaDesk() {
  const [active, setActive] = useState<Set<Widget>>(DEFAULT_ACTIVE);
  const [widgetOrder, setWidgetOrder] = useState<Widget[]>(DEFAULT_ORDER);
  const [trayOpen, setTrayOpen] = useState(false);
  const [dragSrc, setDragSrc] = useState<Widget | null>(null);
  const [dragOver, setDragOver] = useState<Widget | null>(null);

  const [selectedDuration, setSelectedDuration] = useState(POMODORO);
  const [timeLeft, setTimeLeft] = useState(POMODORO);
  const [running, setRunning] = useState(false);
  const [todos, setTodos] = useState(INITIAL_TODOS);
  const [healthDoneAt, setHealthDoneAt] = useState<Record<string, number>>({});
  const [tick, setTick] = useState(0);
  const [clickCount, setClickCount] = useState(0);
  const [clock, setClock] = useState("");
  const [newTodo, setNewTodo] = useState("");
  const nextId = useRef(INITIAL_TODOS.length + 1);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("sk-todos");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTodos(parsed.slice(0, 5));
          nextId.current =
            Math.max(...parsed.map((t: { id: number }) => t.id)) + 1;
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("sk-health");
      if (stored) setHealthDoneAt(JSON.parse(stored));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("sk-todos", JSON.stringify(todos));
    } catch {}
  }, [todos]);

  useEffect(() => {
    try {
      localStorage.setItem("sk-health", JSON.stringify(healthDoneAt));
    } catch {}
  }, [healthDoneAt]);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(
        `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`,
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setRunning(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  void tick;

  function toggleWidget(w: Widget) {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(w)) next.delete(w);
      else next.add(w);
      return next;
    });
    if (w !== "health") {
      setWidgetOrder((prev) =>
        prev.includes(w) ? prev.filter((x) => x !== w) : [...prev, w],
      );
    }
  }

  function handleDrop(target: Widget) {
    if (!dragSrc || dragSrc === target) return;
    setWidgetOrder((prev) => {
      const next = [...prev];
      const si = next.indexOf(dragSrc);
      const ti = next.indexOf(target);
      [next[si], next[ti]] = [next[ti], next[si]];
      return next;
    });
    setDragSrc(null);
    setDragOver(null);
  }

  function toggleTodo(id: number) {
    setTodos((ts) =>
      ts.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    );
  }
  function removeTodo(id: number) {
    setTodos((ts) => ts.filter((t) => t.id !== id));
  }
  function addTodo() {
    const text = newTodo.trim();
    if (!text || todos.length >= 5) return;
    setTodos((ts) => [...ts, { id: nextId.current++, text, done: false }]);
    setNewTodo("");
  }
  function completeHealth(id: string) {
    setHealthDoneAt((prev) => ({ ...prev, [id]: Date.now() }));
  }
  function isHealthAvailable(id: string, cooldown: number) {
    const doneAt = healthDoneAt[id];
    return !doneAt || Date.now() - doneAt >= cooldown;
  }

  const mins = Math.floor(timeLeft / 60)
    .toString()
    .padStart(2, "0");
  const secs = (timeLeft % 60).toString().padStart(2, "0");
  const doneCount = todos.filter((t) => t.done).length;

  const orderedWidgets = widgetOrder.filter((w) => active.has(w));
  const hasNonHealth = orderedWidgets.length > 0;
  const onlyHealth = active.size > 0 && !hasNonHealth && active.has("health");

  useEffect(() => {
    document.title = running ? `${mins}:${secs} — Athena` : "Athena";
  }, [running, mins, secs]);

  const outlineBtn: React.CSSProperties = {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    letterSpacing: ".12em",
    color: "#9a8f7e",
    background: "none",
    border: "1px solid #3a352e",
    padding: "10px 0",
    borderRadius: 3,
    cursor: "pointer",
    fontFamily: "inherit",
  };
  const solidBtn: React.CSSProperties = {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    letterSpacing: ".12em",
    color: "#16130f",
    background: "#ad5440",
    padding: "10px 0",
    borderRadius: 3,
    border: "none",
    cursor: "pointer",
    fontFamily: "inherit",
  };

  function tile(
    w: Widget,
    idx: number,
    extra?: React.CSSProperties,
  ): React.CSSProperties {
    const n = orderedWidgets.length;
    const spanning = n === 3 && idx === 2;
    return {
      ...TILE_BASE,
      ...extra,
      ...(spanning ? { gridColumn: "1 / -1" } : {}),
      border:
        dragOver === w ? "1px solid rgba(173,84,64,0.55)" : "1px solid #2e2922",
      opacity: dragSrc === w ? 0.3 : 1,
      transition: "opacity 0.12s, border-color 0.12s",
    };
  }

  function dragProps(w: Widget) {
    return {
      draggable: true as const,
      onDragStart: (e: React.DragEvent) => {
        setDragSrc(w);
        e.dataTransfer.effectAllowed = "move";
      },
      onDragOver: (e: React.DragEvent) => {
        e.preventDefault();
        if (w !== dragSrc) setDragOver(w);
      },
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        handleDrop(w);
      },
      onDragEnd: () => {
        setDragSrc(null);
        setDragOver(null);
      },
      onDragLeave: () => setDragOver((prev) => (prev === w ? null : prev)),
    };
  }

  function DragHandle() {
    return (
      <span
        style={{
          color: "#2e2922",
          fontSize: 13,
          lineHeight: 1,
          userSelect: "none",
          cursor: "grab",
          flexShrink: 0,
        }}
      >
        ⠿
      </span>
    );
  }

  function TileLabel({ n, label }: { n: string; label: string }) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
          marginBottom: 4,
        }}
      >
        <span
          style={{ fontSize: 10, letterSpacing: ".28em", color: "#6c6358" }}
        >
          {n} — {label}
        </span>
        <DragHandle />
      </div>
    );
  }

  function renderWidget(w: Widget, idx: number) {
    switch (w) {
      case "timer": {
        const progress = timeLeft / selectedDuration;
        return (
          <div key={w} style={tile(w, idx)} {...dragProps(w)}>
            {/* Header: label | presets | drag */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexShrink: 0,
                marginBottom: 4,
              }}
            >
              <span
                style={{ fontSize: 10, letterSpacing: ".28em", color: "#6c6358" }}
              >
                01 — FOCUS · 集中
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {([5, 25, 50] as const).map((m) => {
                  const s = m * 60;
                  const isActive = selectedDuration === s;
                  return (
                    <button
                      key={m}
                      onClick={() => {
                        setSelectedDuration(s);
                        setTimeLeft(s);
                        setRunning(false);
                      }}
                      style={{
                        fontSize: 9,
                        letterSpacing: ".14em",
                        color: isActive ? "#d6cebf" : "#4a443c",
                        background: "none",
                        border: isActive ? "1px solid #3a352e" : "1px solid transparent",
                        padding: "3px 6px",
                        borderRadius: 3,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      {m}m
                    </button>
                  );
                })}
                <DragHandle />
              </div>
            </div>
            {/* Numbers */}
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontFamily: "'DotGothic16', monospace",
                  fontSize: "clamp(48px, 8vw, 96px)",
                  lineHeight: 1,
                  color: "#e2dac9",
                }}
              >
                {mins}
                <span
                  className={running ? undefined : "sk-blink"}
                  style={{ color: running ? "#e2dac9" : "#ad5440" }}
                >
                  :
                </span>
                {secs}
              </span>
            </div>
            {/* Progress bar */}
            <div
              style={{
                height: 2,
                background: "#1e1b18",
                borderRadius: 1,
                flexShrink: 0,
                margin: "10px 0 8px",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progress * 100}%`,
                  background: "#ad5440",
                  borderRadius: 1,
                  transition: running ? "width 1s linear" : "none",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button
                className="sk-btn"
                onClick={() => setRunning((r) => !r)}
                style={running ? solidBtn : outlineBtn}
              >
                {running ? "⏸ STOP" : "▶ START"}
              </button>
              <button
                className="sk-btn"
                onClick={() => {
                  setRunning(false);
                  setTimeLeft(selectedDuration);
                }}
                style={{ ...outlineBtn, flex: "none", padding: "10px 18px" }}
              >
                ↺ RESET
              </button>
            </div>
          </div>
        );
      }

      case "todo":
        return (
          <div
            key={w}
            style={tile(w, idx, { overflow: "auto" })}
            {...dragProps(w)}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexShrink: 0,
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  letterSpacing: ".28em",
                  color: "#6c6358",
                }}
              >
                02 — TO DO · 今日のこと
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 10, color: "#ad5440" }}>
                  {doneCount}/{todos.length}
                </span>
                <DragHandle />
              </div>
            </div>
            {todos.map((todo) => (
              <div
                key={todo.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "10px 0",
                  borderBottom: "1px solid #241f1b",
                  flexShrink: 0,
                }}
              >
                <div
                  onClick={() => toggleTodo(todo.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 11,
                    flex: 1,
                    cursor: "pointer",
                  }}
                >
                  {todo.done ? (
                    <span
                      style={{
                        width: 15,
                        height: 15,
                        background: "#ad5440",
                        color: "#16130f",
                        fontSize: 10,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      ✓
                    </span>
                  ) : (
                    <span
                      style={{
                        width: 15,
                        height: 15,
                        border: "1px solid #4a443c",
                        display: "inline-block",
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <span
                    style={{
                      flex: 1,
                      fontSize: 13,
                      color: todo.done ? "#6c6358" : "#d6cebf",
                      textDecoration: todo.done ? "line-through" : "none",
                    }}
                  >
                    {todo.text}
                  </span>
                </div>
                <button
                  className="sk-remove"
                  onClick={() => removeTodo(todo.id)}
                >
                  ×
                </button>
              </div>
            ))}
            {todos.length < 5 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                  padding: "10px 0 0",
                  marginTop: "auto",
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    width: 15,
                    height: 15,
                    border: "1px dashed #3a352e",
                    color: "#5a5249",
                    fontSize: 11,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  +
                </span>
                <input
                  draggable={false}
                  className="sk-add"
                  placeholder="追加…"
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTodo()}
                />
              </div>
            )}
          </div>
        );

      case "fidget":
        return (
          <div key={w} style={tile(w, idx)} {...dragProps(w)}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  letterSpacing: ".28em",
                  color: "#6c6358",
                }}
              >
                03 — FIDGET · クリック
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  onClick={() => setClickCount(0)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#3a352e",
                    fontSize: 10,
                    letterSpacing: ".16em",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    padding: 0,
                  }}
                >
                  RESET
                </button>
                <DragHandle />
              </div>
            </div>
            <button
              className="sk-clicker"
              onClick={() => setClickCount((c) => c + 1)}
            >
              <span
                style={{
                  fontFamily: "'DotGothic16', monospace",
                  fontSize: "clamp(32px, 5vw, 56px)",
                  color: "#2e2922",
                  lineHeight: 1,
                  pointerEvents: "none",
                  userSelect: "none",
                }}
              >
                {clickCount.toLocaleString()}
              </span>
            </button>
          </div>
        );

      case "buddy":
        return (
          <div key={w} style={tile(w, idx, { gap: 12 })} {...dragProps(w)}>
            <TileLabel n="04" label="BUDDY · 仲間" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/study_1.gif"
              alt="body double"
              style={{
                flex: 1,
                minHeight: 0,
                width: "100%",
                display: "block",
                borderRadius: 3,
                objectFit: "cover",
              }}
            />
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@600;700&family=DotGothic16&family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        .sk-blink { animation: sk-blink 1.1s steps(1) infinite; }
        @keyframes sk-blink { 50% { opacity: .18; } }
        .sk-btn:hover { opacity: 0.82; }
        .sk-add { background: none; border: none; outline: none; color: #d6cebf; font-size: 13px; font-family: 'DM Mono', monospace; width: 100%; }
        .sk-add::placeholder { color: #5a5249; }
        .sk-widget-tag { cursor: pointer; user-select: none; transition: opacity 0.12s; }
        .sk-widget-tag:hover { opacity: 0.72; }
        .sk-remove { background: none; border: none; cursor: pointer; color: #3a352e; font-size: 14px; padding: 0 0 0 6px; font-family: inherit; line-height: 1; flex-shrink: 0; transition: color 0.1s; }
        .sk-remove:hover { color: #ad5440; }
        .sk-clicker { width: 100%; border: 1px solid #2e2922; border-radius: 4px; background: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.08s, border-color 0.08s; flex: 1; margin-top: 10px; }
        .sk-clicker:hover { background: #1e1b18; border-color: #3a352e; }
        .sk-clicker:active { background: #252119; }
        .sk-health-item { cursor: pointer; transition: opacity 0.12s; }
        .sk-health-item:hover { opacity: 0.75; }
        .sk-page { height: 100vh; overflow: hidden; display: flex; flex-direction: column; }
        .sk-main-grid { display: grid; gap: 14px; flex: 1; min-height: 0; }
        @media (max-width: 768px) {
          .sk-page { height: auto; min-height: 100dvh; overflow-y: auto; }
          .sk-main-grid { grid-template-columns: 1fr !important; grid-auto-rows: auto !important; }
          .sk-main-grid > * { grid-row: auto !important; grid-column: auto !important; }
        }
      `}</style>

      <div
        className="sk-page"
        style={{
          background: "#050403",
          backgroundImage: NOISE,
          fontFamily: "'DM Mono', monospace",
        }}
      >
        <div
          style={{
            flex: 1,
            minHeight: 0,
            maxWidth: 1060,
            width: "100%",
            margin: "0 auto",
            padding: "28px 40px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: 13 }}>
              <span
                style={{
                  fontFamily: "'Shippori Mincho', serif",
                  fontWeight: 500,
                  fontSize: 13,
                  color: "#e2dac9",
                  letterSpacing: ".22em",
                }}
              >
                ATHENA
              </span>
              <span
                style={{
                  fontSize: 10,
                  letterSpacing: ".24em",
                  color: "#5a5249",
                }}
              >
                v.1985
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <button
                onClick={() => setTrayOpen((o) => !o)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: 10,
                  letterSpacing: ".2em",
                  color: trayOpen ? "#d6cebf" : "#6c6358",
                  padding: 0,
                }}
              >
                {trayOpen ? "▲ CUSTOMIZE" : "▼ CUSTOMIZE"}
              </button>
            </div>
          </div>

          {/* Widget tray */}
          {trayOpen && (
            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                flexShrink: 0,
              }}
            >
              {(["timer", "todo", "fidget", "buddy", "health"] as Widget[]).map(
                (w) => {
                  const on = active.has(w);
                  return (
                    <span
                      key={w}
                      className="sk-widget-tag"
                      onClick={() => toggleWidget(w)}
                      style={{
                        fontSize: 11,
                        letterSpacing: ".1em",
                        color: on ? "#d6cebf" : "#6c6358",
                        border: on ? "1px solid #ad5440" : "1px dashed #3a352e",
                        padding: "6px 12px",
                        borderRadius: 3,
                      }}
                    >
                      {WIDGET_LABELS[w]} {on ? "✓" : "+"}
                    </span>
                  );
                },
              )}
            </div>
          )}

          {/* Content */}
          {active.size > 0 && (
            <div
              style={{
                flex: 1,
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              {hasNonHealth && (
                <div
                  className="sk-main-grid"
                  style={{
                    gridTemplateColumns:
                      orderedWidgets.length === 1 ? "1fr" : "1.3fr 1fr",
                    gridAutoRows: "1fr",
                  }}
                >
                  {orderedWidgets.map((w, idx) => renderWidget(w, idx))}
                </div>
              )}

              {active.has("health") && (
                <div
                  style={{
                    ...TILE_BASE,
                    overflow: "visible",
                    flexShrink: 0,
                    border: "1px solid #2e2922",
                    ...(onlyHealth ? { flex: 1 } : {}),
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      letterSpacing: ".28em",
                      color: "#6c6358",
                      flexShrink: 0,
                    }}
                  >
                    05 — HEALTH · 健康
                  </span>
                  <div style={{ display: "flex", marginTop: 16 }}>
                    {HEALTH_TASKS.map((task, i) => {
                      const available = isHealthAvailable(
                        task.id,
                        task.cooldown,
                      );
                      return (
                        <div
                          key={task.id}
                          className={available ? "sk-health-item" : undefined}
                          onClick={
                            available
                              ? () => completeHealth(task.id)
                              : undefined
                          }
                          style={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            gap: 10,
                            padding: "0 20px",
                            borderLeft: i > 0 ? "1px solid #2e2922" : "none",
                            cursor: available ? "pointer" : "default",
                          }}
                        >
                          <div
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              flexShrink: 0,
                              background: available ? "#ad5440" : "transparent",
                              border: available ? "none" : "1px solid #2e2922",
                            }}
                          />
                          <div>
                            <div
                              style={{
                                fontSize: 12,
                                letterSpacing: ".08em",
                                color: available ? "#d6cebf" : "#3a352e",
                              }}
                            >
                              {task.label}
                            </div>
                            {task.detail && (
                              <div
                                style={{
                                  fontSize: 10,
                                  letterSpacing: ".1em",
                                  color: available ? "#6c6358" : "#2e2922",
                                  marginTop: 3,
                                }}
                              >
                                {task.detail}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
