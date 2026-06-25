"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { CASES, getConceptDef } from "./cases";

const ANIMATION_CSS = `
@keyframes sdl-pop {
  0%   { opacity: 0; transform: scale(0.82); }
  65%  { transform: scale(1.06); }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes sdl-fadein {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes sdl-fadeout {
  from { opacity: 1; transform: translateY(0); }
  to   { opacity: 0; transform: translateY(-6px); }
}
@keyframes hint-flip {
  0%   { transform: scaleY(1); }
  50%  { transform: scaleY(0.01); }
  100% { transform: scaleY(1); }
}
.sdl-hint-flip {
  animation: hint-flip 0.48s ease-in-out;
  transform-origin: center;
}
@keyframes hint-flash-red {
  0%   { box-shadow: 0 0 0 0 rgba(248,113,113,0); }
  25%  { box-shadow: 0 0 0 2px rgba(248,113,113,0.9), 0 0 22px rgba(248,113,113,0.28); }
  75%  { box-shadow: 0 0 0 2px rgba(248,113,113,0.5), 0 0 14px rgba(248,113,113,0.14); }
  100% { box-shadow: 0 0 0 0 rgba(248,113,113,0); }
}
.sdl-hint-flash-red {
  animation: hint-flash-red 0.55s ease-out;
}
`;

const ALL_CONCEPTS = [
  "API Gateway",
  "Backpressure",
  "Bloom Filter",
  "Bulkhead Pattern",
  "Cache",
  "Canary Deployment",
  "Change Data Capture",
  "Checkpointing",
  "Circuit Breaker",
  "Connection Pool",
  "Consistent Hashing",
  "Content Delivery Network",
  "CQRS",
  "Database Sharding",
  "Deadlock",
  "Distributed Lock",
  "Event Sourcing",
  "Fanout",
  "Feature Flag",
  "Gossip Protocol",
  "Health Check",
  "Heartbeat",
  "Horizontal Scaling",
  "Hot Standby",
  "Idempotency",
  "Index",
  "Leader Election",
  "Load Balancer",
  "Log-Structured Merge Tree",
  "Long Polling",
  "Materialized View",
  "Merkle Tree",
  "Message Queue",
  "Optimistic Locking",
  "Pagination",
  "Pub/Sub",
  "Quorum",
  "Rate Limiter",
  "Read Replica",
  "Replication",
  "Retry with Exponential Backoff",
  "Reverse Proxy",
  "Saga Pattern",
  "Schema Migration",
  "Service Discovery",
  "Service Mesh",
  "Sidecar Pattern",
  "Snapshot",
  "Sticky Session",
  "Two-Phase Commit",
  "Vector Clock",
  "Vertical Scaling",
  "Write-Ahead Log",
].sort();

const EPOCH_DAY = Math.floor(new Date("2026-06-01").getTime() / 86400000);

function getTodayDay(): number {
  return Math.floor(Date.now() / 86400000) - EPOCH_DAY;
}

function loadSaved(day: number): string[] {
  try {
    const raw = localStorage.getItem(`systemdesigndle-v1-${day}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persist(day: number, guesses: string[]) {
  try {
    localStorage.setItem(`systemdesigndle-v1-${day}`, JSON.stringify(guesses));
  } catch {}
}

const STATS_KEY = "systemdesigndle-stats-v1";

type UserStats = {
  gamesPlayed: number;
  wins: number;
  currentStreak: number;
  maxStreak: number;
  lastDayPlayed: number;
};

const DEFAULT_STATS: UserStats = {
  gamesPlayed: 0,
  wins: 0,
  currentStreak: 0,
  maxStreak: 0,
  lastDayPlayed: -1,
};

function loadStats(): UserStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    return raw ? { ...DEFAULT_STATS, ...JSON.parse(raw) } : { ...DEFAULT_STATS };
  } catch {
    return { ...DEFAULT_STATS };
  }
}

function recordGame(dayNumber: number, won: boolean): UserStats {
  const s = loadStats();
  if (s.lastDayPlayed === dayNumber) return s;
  const newStreak = won
    ? s.lastDayPlayed === dayNumber - 1
      ? s.currentStreak + 1
      : 1
    : 0;
  const updated: UserStats = {
    gamesPlayed: s.gamesPlayed + 1,
    wins: s.wins + (won ? 1 : 0),
    currentStreak: newStreak,
    maxStreak: Math.max(s.maxStreak, newStreak),
    lastDayPlayed: dayNumber,
  };
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(updated));
  } catch {}
  return updated;
}

const T = {
  bg: "#0D1117",
  surface: "#161B22",
  surfaceRaised: "#1C2128",
  surfaceHover: "#21262D",
  border: "rgba(255,255,255,0.07)",
  borderLight: "rgba(255,255,255,0.13)",
  blue: "#60A5FA",
  blueBg: "rgba(96,165,250,0.08)",
  blueBorder: "rgba(96,165,250,0.22)",
  blueGlow: "0 0 0 1.5px rgba(96,165,250,0.45), 0 4px 28px rgba(96,165,250,0.10)",
  coral: "#F87171",
  coralBg: "rgba(248,113,113,0.08)",
  coralBorder: "rgba(248,113,113,0.20)",
  shadow: "0 2px 14px rgba(0,0,0,0.40)",
  shadowMd: "0 8px 36px rgba(0,0,0,0.55)",
  text: {
    primary: "#E6EDF3",
    secondary: "#8B949E",
    muted: "#6E7681",
    dim: "#3D444D",
  },
};

function Confetti({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const COLORS = ["#60A5FA", "#F87171", "#F59E0B", "#A78BFA", "#34D399", "#38BDF8", "#F472B6"];
    const particles = Array.from({ length: 90 }, (_, i) => ({
      x: window.innerWidth * (0.15 + Math.random() * 0.7),
      y: -20 - Math.random() * 120,
      w: Math.random() * 9 + 4,
      h: Math.random() * 5 + 2,
      color: COLORS[i % COLORS.length],
      vx: (Math.random() - 0.5) * 3.5,
      vy: Math.random() * 3 + 1.5,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.18,
    }));

    let raf: number;
    const start = performance.now();

    const draw = (now: number) => {
      const elapsed = now - start;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const fade = elapsed > 1600 ? Math.max(0, 1 - (elapsed - 1600) / 900) : 1;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.07;
        p.angle += p.spin;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.globalAlpha = fade;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }

      if (elapsed < 2500) raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  if (!active) return null;
  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 100 }}
    />
  );
}

const PERF_LABELS = [
  "First Principles",
  "Clean Design",
  "Solid Architecture",
  "Good Reasoning",
  "On the Right Track",
  "Just Made It",
];

function perfLabel(guessCount: number, won: boolean): string {
  if (!won) return "System Down";
  return PERF_LABELS[guessCount - 1] ?? "Congratulations";
}

export default function SystemDesigndle() {
  const dayNumber = useMemo(getTodayDay, []);
  const [viewingDay, setViewingDay] = useState<number>(dayNumber);

  const daily = useMemo(() => CASES[viewingDay % CASES.length], [viewingDay]);

  const [guesses, setGuesses] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [statusMsg, setStatusMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [cardRevealed, setCardRevealed] = useState<boolean[]>(Array(6).fill(false));
  const [cardAnimating, setCardAnimating] = useState<boolean[]>(Array(6).fill(false));
  const [flashingCardIdx, setFlashingCardIdx] = useState(-1);
  const [userStats, setUserStats] = useState<UserStats>(DEFAULT_STATS);
  const [timeToMidnight, setTimeToMidnight] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef(false);
  const prevHintsRef = useRef(0);
  const wrongGuessFlashRef = useRef(false);

  const isArchive = viewingDay !== dayNumber;

  useEffect(() => {
    setGuesses(loadSaved(dayNumber));
    setUserStats(loadStats());
    setHydrated(true);
    if (!localStorage.getItem("systemdesigndle-seen")) setShowHowToPlay(true);
  }, [dayNumber]);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeToMidnight(
        `${String(h).padStart(2, "0")}h : ${String(m).padStart(2, "0")}m : ${String(s).padStart(2, "0")}s`,
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const wrongGuesses = guesses.filter(
    (g) => g.toLowerCase() !== daily.concept.toLowerCase(),
  );
  const won = guesses.some((g) => g.toLowerCase() === daily.concept.toLowerCase());
  const lost = !won && wrongGuesses.length >= 6;
  const gameOver = won || lost;
  const hintsRevealed = gameOver ? 6 : Math.min(wrongGuesses.length + 1, 6);

  const flipCard = useCallback((idx: number, delay = 0) => {
    setTimeout(() => {
      setCardAnimating((prev) => {
        const n = [...prev];
        n[idx] = true;
        return n;
      });
      setTimeout(() => {
        setCardRevealed((prev) => {
          const n = [...prev];
          n[idx] = true;
          return n;
        });
      }, 240);
      setTimeout(() => {
        setCardAnimating((prev) => {
          const n = [...prev];
          n[idx] = false;
          return n;
        });
      }, 480);
    }, delay);
  }, []);

  useEffect(() => {
    if (!hydrated || mountedRef.current) return;
    mountedRef.current = true;
    prevHintsRef.current = hintsRevealed;
    for (let i = 0; i < hintsRevealed; i++) flipCard(i, i * 380);
    if (gameOver && hintsRevealed > 0) {
      setTimeout(() => setShowModal(true), (hintsRevealed - 1) * 380 + 800);
    }
  }, [hydrated, hintsRevealed, gameOver, flipCard, viewingDay]);

  useEffect(() => {
    if (!hydrated || !mountedRef.current) return;
    if (hintsRevealed > prevHintsRef.current) {
      const start = prevHintsRef.current;
      const baseDelay = wrongGuessFlashRef.current ? 580 : 60;
      wrongGuessFlashRef.current = false;
      for (let i = start; i < hintsRevealed; i++) {
        flipCard(i, (i - start) * 200 + baseDelay);
      }
      prevHintsRef.current = hintsRevealed;
    }
  }, [hintsRevealed, hydrated, flipCard]);

  useEffect(() => {
    if (!input.trim()) {
      setSuggestions([]);
      return;
    }
    const q = input.toLowerCase();
    setSuggestions(
      ALL_CONCEPTS.filter((c) => c.toLowerCase().includes(q)).slice(0, 6),
    );
  }, [input]);

  const goToDay = useCallback(
    (day: number) => {
      if (day < 0 || day > dayNumber) return;
      mountedRef.current = false;
      prevHintsRef.current = 0;
      wrongGuessFlashRef.current = false;
      const saved = loadSaved(day);
      setViewingDay(day);
      setGuesses(saved);
      setCardRevealed(Array(6).fill(false));
      setCardAnimating(Array(6).fill(false));
      setFlashingCardIdx(-1);
      setInput("");
      setSuggestions([]);
      setShowModal(false);
      setShowConfetti(false);
      setStatusMsg("");
    },
    [dayNumber],
  );

  const submit = () => {
    if (gameOver || !input.trim()) return;
    const trimmed = input.trim();
    const correct = trimmed.toLowerCase() === daily.concept.toLowerCase();
    const next = [...guesses, trimmed];
    setGuesses(next);
    persist(viewingDay, next);
    setInput("");
    setSuggestions([]);
    setActiveIdx(-1);
    if (correct) {
      if (!isArchive) {
        const stats = recordGame(dayNumber, true);
        setUserStats(stats);
      }
      setShowConfetti(true);
      setTimeout(() => setShowModal(true), 800);
    } else {
      const newWrong = wrongGuesses.length + 1;
      wrongGuessFlashRef.current = true;
      setFlashingCardIdx(hintsRevealed - 1);
      setTimeout(() => setFlashingCardIdx(-1), 560);
      if (newWrong < 6) {
        setStatusMsg(`Incorrect — hint ${newWrong + 1} unlocked`);
        setTimeout(() => setStatusMsg(""), 2200);
      } else {
        if (!isArchive) {
          const stats = recordGame(dayNumber, false);
          setUserStats(stats);
        }
        setTimeout(() => setShowModal(true), 700);
      }
    }
  };

  const dismissInput = () => {
    inputRef.current?.blur();
    setSuggestions([]);
    setActiveIdx(-1);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((p) => Math.min(p + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((p) => Math.max(p - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions.length > 0) {
        const pick = activeIdx >= 0 ? suggestions[activeIdx] : suggestions[0];
        setInput(pick);
        setSuggestions([]);
        setActiveIdx(-1);
      } else {
        submit();
      }
    } else if (e.key === "Escape") {
      dismissInput();
    }
  };

  const emojiCard = () => {
    const score = won ? `${guesses.length}/6` : "X/6";
    const rows = guesses
      .map((g) => (g.toLowerCase() === daily.concept.toLowerCase() ? "🟢" : "🔴"))
      .join("");
    const archiveTag = isArchive ? ` (Problem #${viewingDay + 1})` : "";
    return `SystemDesigndle #${viewingDay + 1}${archiveTag} ${score}\n\n${rows}\n\nhttps://indika.dev/system-design-dle`;
  };

  const copyShare = () => {
    navigator.clipboard.writeText(emojiCard()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!hydrated) return null;

  const label = perfLabel(guesses.length, won);
  const currentCardIdx = gameOver ? -1 : hintsRevealed - 1;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: ANIMATION_CSS }} />
      <Confetti active={showConfetti} />

      {/* Top pill notification */}
      {statusMsg && (
        <div
          style={{
            position: "fixed",
            top: 16,
            left: 0,
            right: 0,
            zIndex: 150,
            display: "flex",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              background: "rgba(13,17,23,0.88)",
              border: `1px solid ${T.coralBorder}`,
              borderRadius: 100,
              padding: "8px 18px",
              fontSize: 13,
              color: T.coral,
              fontWeight: 600,
              whiteSpace: "nowrap" as const,
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              animation: "sdl-fadein 0.18s ease both",
            }}
          >
            {statusMsg}
          </div>
        </div>
      )}

      {/* How to Play modal */}
      {showHowToPlay && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 300,
            background: "rgba(13,17,23,0.97)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px 20px",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 440,
              position: "relative",
              animation: "sdl-fadein 0.35s ease both",
            }}
          >
            <button
              onClick={() => {
                localStorage.setItem("systemdesigndle-seen", "1");
                setShowHowToPlay(false);
              }}
              aria-label="Close"
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                zIndex: 10,
                background: "none",
                border: "none",
                fontSize: 26,
                lineHeight: 1,
                cursor: "pointer",
                color: T.text.muted,
                padding: 4,
                fontFamily: "inherit",
              }}
            >
              ×
            </button>

            <h2
              style={{
                fontFamily: "var(--font-instrument-serif), Georgia, 'Times New Roman', serif",
                fontSize: 28,
                fontWeight: 400,
                letterSpacing: -0.3,
                margin: "0 0 4px",
                color: T.text.primary,
              }}
            >
              How to Play
            </h2>
            <p style={{ fontSize: 13, color: T.text.muted, margin: "0 0 28px", letterSpacing: 0.1 }}>
              Identify the system design concept from engineering clues.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 28 }}>
              {[
                { n: 1, text: "A new system design scenario is presented every day." },
                { n: 2, text: "Type a concept in the search box and submit your guess." },
                { n: 3, text: "Each wrong guess unlocks the next engineering clue." },
                { n: 4, text: "Identify the correct concept within 6 guesses to win." },
              ].map(({ n, text }) => (
                <div key={n} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <span
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      background: T.blue,
                      color: T.bg,
                      fontSize: 12,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    {n}
                  </span>
                  <span style={{ fontSize: 14, color: T.text.secondary, lineHeight: 1.65 }}>
                    {text}
                  </span>
                </div>
              ))}
            </div>

            <div
              style={{
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: 10,
                padding: "14px 18px",
                marginBottom: 28,
                boxShadow: T.shadow,
              }}
            >
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: T.text.muted,
                  margin: "0 0 10px",
                  letterSpacing: "0.09em",
                  textTransform: "uppercase" as const,
                }}
              >
                Example clue
              </p>
              <div style={{ display: "flex", gap: 14 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    fontFamily: "monospace",
                    color: T.blue,
                    minWidth: 20,
                    marginTop: 2,
                  }}
                >
                  01
                </span>
                <span style={{ fontSize: 13, color: T.text.primary, lineHeight: 1.65 }}>
                  A read-heavy service is struggling with latency. The database handles millions of queries a day and response times have crept past the SLA.
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                localStorage.setItem("systemdesigndle-seen", "1");
                setShowHowToPlay(false);
              }}
              style={{
                background: T.blue,
                color: T.bg,
                border: "none",
                borderRadius: 10,
                padding: "13px 0",
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                letterSpacing: 0.1,
                width: "100%",
              }}
            >
              Let&apos;s Play
            </button>
          </div>
        </div>
      )}

      {/* Results modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            background: "rgba(13,17,23,0.97)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 420,
              padding: "24px 20px 40px",
              animation: "sdl-fadein 0.3s ease both",
            }}
          >
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
              <button
                onClick={() => {
                  window.scrollTo(0, 0);
                  setShowModal(false);
                }}
                aria-label="Close"
                style={{
                  background: "none",
                  border: `1px solid ${T.border}`,
                  borderRadius: 8,
                  width: 44,
                  height: 44,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  lineHeight: 1,
                  cursor: "pointer",
                  color: T.text.muted,
                  fontFamily: "inherit",
                }}
              >
                ×
              </button>
            </div>

            {isArchive && (
              <div style={{ textAlign: "center", marginBottom: 12 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.10em",
                    textTransform: "uppercase" as const,
                    color: T.text.muted,
                    background: T.surface,
                    border: `1px solid ${T.border}`,
                    borderRadius: 100,
                    padding: "4px 12px",
                  }}
                >
                  Archive · Problem #{viewingDay + 1}
                </span>
              </div>
            )}

            <div
              style={{
                fontFamily: "var(--font-instrument-serif), Georgia, 'Times New Roman', serif",
                fontSize: 48,
                fontWeight: 400,
                letterSpacing: -0.5,
                color: won ? T.blue : T.coral,
                marginBottom: 6,
                textAlign: "center",
                animation: "sdl-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.1s both",
              }}
            >
              {label}
            </div>

            {won && (
              <div
                style={{
                  fontSize: 13,
                  color: T.text.muted,
                  marginBottom: 24,
                  letterSpacing: 0.1,
                  textAlign: "center",
                }}
              >
                {`Identified in ${guesses.length} of 6 ${guesses.length === 1 ? "guess" : "guesses"}`}
              </div>
            )}
            {!won && <div style={{ marginBottom: 24 }} />}

            <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  background: won ? T.blueBg : T.coralBg,
                  border: `1px solid ${won ? T.blueBorder : T.coralBorder}`,
                  borderRadius: 8,
                  padding: "9px 18px",
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    color: T.text.muted,
                    letterSpacing: "0.09em",
                    textTransform: "uppercase" as const,
                  }}
                >
                  Concept
                </span>
                <span style={{ fontSize: 15, fontWeight: 600, color: won ? T.blue : T.coral }}>
                  {daily.concept}
                </span>
              </div>
            </div>

            <p
              style={{
                fontSize: 13,
                color: T.text.muted,
                lineHeight: 1.7,
                marginBottom: 32,
                textAlign: "center",
                padding: "0 4px",
              }}
            >
              {getConceptDef(daily.concept)}
            </p>

            {!isArchive && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 8,
                  marginBottom: 24,
                }}
              >
                {[
                  { value: String(userStats.gamesPlayed), label: "Played" },
                  {
                    value:
                      userStats.gamesPlayed > 0
                        ? `${Math.round((userStats.wins / userStats.gamesPlayed) * 100)}%`
                        : "0%",
                    label: "Win %",
                  },
                  {
                    value: `${userStats.currentStreak}${userStats.currentStreak > 0 ? " 🔥" : ""}`,
                    label: "Streak",
                  },
                  { value: String(userStats.maxStreak), label: "Best" },
                ].map(({ value, label: statLabel }) => (
                  <div
                    key={statLabel}
                    style={{
                      background: T.surface,
                      border: `1px solid ${T.border}`,
                      borderRadius: 10,
                      padding: "14px 8px",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 700,
                        color: T.text.primary,
                        lineHeight: 1.2,
                        marginBottom: 4,
                      }}
                    >
                      {value}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: T.text.muted,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase" as const,
                      }}
                    >
                      {statLabel}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isArchive ? (
              <div
                style={{ textAlign: "center", marginBottom: 24, color: T.text.muted, fontSize: 13 }}
              >
                <span style={{ marginRight: 6 }}>Next problem in</span>
                <span
                  style={{ fontFamily: "monospace", color: T.text.secondary, fontWeight: 600 }}
                >
                  {timeToMidnight}
                </span>
              </div>
            ) : (
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <button
                  onClick={() => {
                    goToDay(dayNumber);
                    setShowModal(false);
                  }}
                  style={{
                    background: "transparent",
                    color: T.blue,
                    border: `1px solid ${T.blueBorder}`,
                    borderRadius: 10,
                    padding: "10px 24px",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    letterSpacing: 0.1,
                  }}
                >
                  Today&apos;s Problem →
                </button>
              </div>
            )}

            <div
              style={{
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: 10,
                padding: "16px 20px",
                fontFamily: "monospace",
                fontSize: 14,
                color: T.text.secondary,
                marginBottom: 12,
                whiteSpace: "pre" as const,
                lineHeight: 2,
                textAlign: "left" as const,
              }}
            >
              {emojiCard()}
            </div>

            <button
              onClick={copyShare}
              style={{
                background: T.blue,
                color: T.bg,
                border: "none",
                borderRadius: 10,
                padding: "13px 0",
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                letterSpacing: 0.1,
                opacity: copied ? 0.8 : 1,
                transition: "opacity 0.2s",
                width: "100%",
              }}
            >
              {copied ? "Copied to clipboard" : "Share Result"}
            </button>
          </div>
        </div>
      )}

      {/* Page */}
      <div
        onPointerDown={dismissInput}
        onScroll={dismissInput}
        style={{
          minHeight: "100vh",
          background: T.bg,
          color: T.text.primary,
          fontFamily: "var(--font-geist-sans), system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 20px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <button
            onClick={() => goToDay(viewingDay - 1)}
            disabled={viewingDay <= 0}
            aria-label="Previous problem"
            style={{
              background: "none",
              border: "none",
              cursor: viewingDay <= 0 ? "default" : "pointer",
              padding: "6px 10px",
              fontFamily: "inherit",
              flexShrink: 0,
              display: "flex",
              flexDirection: "column" as const,
              alignItems: "center",
              gap: 2,
              minWidth: 64,
              opacity: viewingDay <= 0 ? 0.25 : 1,
              transition: "opacity 0.15s",
            }}
          >
            <span style={{ fontSize: 18, color: T.text.secondary, lineHeight: 1 }}>←</span>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase" as const,
                color: T.text.muted,
              }}
            >
              Prev
            </span>
            <span
              style={{
                fontSize: 10,
                fontFamily: "monospace",
                fontWeight: 600,
                color: viewingDay <= 0 ? T.text.dim : T.blue,
                letterSpacing: 0.2,
              }}
            >
              {viewingDay > 0 ? `#${viewingDay}` : "—"}
            </span>
          </button>

          <div style={{ textAlign: "center", flex: 1 }}>
            <h1
              style={{
                fontFamily: "var(--font-instrument-serif), Georgia, 'Times New Roman', serif",
                fontSize: 32,
                fontWeight: 400,
                letterSpacing: -0.3,
                margin: "0 0 4px",
                color: T.text.primary,
                lineHeight: 1,
              }}
            >
              SystemDesigndle
            </h1>
            <p
              style={{
                fontSize: 11,
                color: isArchive ? T.blue : T.text.muted,
                margin: 0,
                letterSpacing: "0.07em",
                textTransform: "uppercase" as const,
                fontWeight: 500,
              }}
            >
              {isArchive
                ? `Archive · Problem #${viewingDay + 1}`
                : `Problem #${dayNumber + 1}`}
            </p>
          </div>

          <button
            onClick={() => goToDay(viewingDay + 1)}
            disabled={viewingDay >= dayNumber}
            aria-label="Next problem"
            style={{
              background: "none",
              border: "none",
              cursor: viewingDay >= dayNumber ? "default" : "pointer",
              padding: "6px 10px",
              fontFamily: "inherit",
              flexShrink: 0,
              display: "flex",
              flexDirection: "column" as const,
              alignItems: "center",
              gap: 2,
              minWidth: 64,
              opacity: viewingDay >= dayNumber ? 0.25 : 1,
              transition: "opacity 0.15s",
            }}
          >
            <span style={{ fontSize: 18, color: T.text.secondary, lineHeight: 1 }}>→</span>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase" as const,
                color: T.text.muted,
              }}
            >
              Next
            </span>
            <span
              style={{
                fontSize: 10,
                fontFamily: "monospace",
                fontWeight: 600,
                color: viewingDay >= dayNumber ? T.text.dim : T.blue,
                letterSpacing: 0.2,
              }}
            >
              {viewingDay < dayNumber ? `#${viewingDay + 2}` : "—"}
            </span>
          </button>
        </div>

        {/* Clue Timeline */}
        <div style={{ width: "100%", maxWidth: 600, margin: "0 auto", padding: "0 20px" }}>
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: T.text.dim,
              letterSpacing: "0.10em",
              textTransform: "uppercase" as const,
              margin: "0 0 14px",
            }}
          >
            System Brief
          </p>

          {daily.hints.map((hint, i) => {
            const isRevealed = cardRevealed[i];
            const isAnimating = cardAnimating[i];
            const isCurrent = isRevealed && i === currentCardIdx;
            const isPast = isRevealed && !isCurrent;

            return (
              <div
                key={i}
                className={
                  isAnimating
                    ? "sdl-hint-flip"
                    : i === flashingCardIdx
                      ? "sdl-hint-flash-red"
                      : ""
                }
                style={{
                  background: isRevealed ? T.surface : "rgba(255,255,255,0.03)",
                  border: isRevealed
                    ? `1px solid ${isCurrent ? "transparent" : T.border}`
                    : "1px dashed rgba(255,255,255,0.14)",
                  borderRadius: 12,
                  padding: "14px 20px",
                  minHeight: 52,
                  display: "flex",
                  gap: 16,
                  alignItems: "flex-start",
                  opacity: isPast ? 0.62 : 1,
                  boxShadow: isCurrent ? T.blueGlow : isRevealed ? T.shadow : "none",
                  marginBottom: 10,
                  boxSizing: "border-box" as const,
                  transition: isAnimating
                    ? "none"
                    : "opacity 0.4s ease, box-shadow 0.4s ease",
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    fontFamily: "monospace",
                    color: isCurrent ? T.blue : isRevealed ? T.text.muted : T.text.dim,
                    minWidth: 20,
                    marginTop: 3,
                    flexShrink: 0,
                    letterSpacing: 0.5,
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                {isRevealed ? (
                  <span
                    style={{
                      fontSize: 14,
                      lineHeight: 1.65,
                      color: isPast ? T.text.secondary : T.text.primary,
                    }}
                  >
                    {hint}
                  </span>
                ) : (
                  <div style={{ flex: 1 }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Ruled Out */}
        {wrongGuesses.length > 0 && (
          <div
            style={{
              width: "100%",
              maxWidth: 600,
              margin: "32px auto 0",
              padding: "0 20px",
            }}
          >
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: T.text.dim,
                letterSpacing: "0.10em",
                textTransform: "uppercase" as const,
                margin: "0 0 12px",
              }}
            >
              Ruled Out
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {wrongGuesses.map((g) => (
                <div
                  key={g}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    background: T.coralBg,
                    border: `1px solid ${T.coralBorder}`,
                    borderRadius: 100,
                    padding: "5px 14px 5px 10px",
                    fontSize: 12,
                    color: T.coral,
                    fontWeight: 500,
                    letterSpacing: 0.1,
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.75 }}>×</span>
                  <span>{g}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Show Results */}
        {gameOver && !showModal && (
          <div style={{ textAlign: "center", marginTop: 28, paddingBottom: 32 }}>
            <button
              onClick={() => setShowModal(true)}
              style={{
                background: "transparent",
                color: T.text.secondary,
                border: `1px solid ${T.borderLight}`,
                borderRadius: 10,
                padding: "10px 28px",
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "inherit",
                letterSpacing: 0.1,
                boxShadow: T.shadow,
              }}
            >
              Show Results
            </button>
          </div>
        )}

        {!gameOver && <div style={{ height: 120 }} />}
      </div>

      {/* Sticky bottom input bar */}
      {!gameOver && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            background: T.bg,
            borderTop: `1px solid ${T.borderLight}`,
            boxShadow: "0 -4px 24px rgba(0,0,0,0.45)",
            padding: "10px 20px 12px",
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (suggestions.length > 0) {
                const pick = activeIdx >= 0 ? suggestions[activeIdx] : suggestions[0];
                setInput(pick);
                setSuggestions([]);
                setActiveIdx(-1);
              } else {
                submit();
              }
            }}
            style={{
              display: "flex",
              gap: 8,
              maxWidth: 600,
              margin: "0 auto",
              position: "relative",
            }}
          >
            <div style={{ flex: 1, position: "relative" }}>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setActiveIdx(-1);
                }}
                onKeyDown={handleKey}
                onBlur={() => setTimeout(() => setSuggestions([]), 150)}
                placeholder="Search concepts..."
                autoComplete="off"
                style={{
                  width: "100%",
                  boxSizing: "border-box" as const,
                  background: T.surface,
                  border: `1px solid ${T.borderLight}`,
                  borderRadius: 10,
                  padding: "0 16px",
                  height: 48,
                  fontSize: 15,
                  color: T.text.primary,
                  outline: "none",
                  fontFamily: "inherit",
                  boxShadow: T.shadow,
                }}
              />
              {suggestions.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "calc(100% + 6px)",
                    left: 0,
                    right: 0,
                    background: T.surfaceRaised,
                    border: `1px solid ${T.borderLight}`,
                    borderRadius: 10,
                    overflow: "hidden",
                    zIndex: 20,
                    boxShadow: T.shadowMd,
                    maxHeight: "60vh",
                    overflowY: "auto" as const,
                  }}
                >
                  {suggestions.map((s, idx) => (
                    <div
                      key={s}
                      onMouseDown={() => {
                        setInput(s);
                        setSuggestions([]);
                        setActiveIdx(-1);
                        inputRef.current?.focus();
                      }}
                      style={{
                        minHeight: 48,
                        padding: "13px 16px",
                        fontSize: 15,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        background: idx === activeIdx ? T.surfaceHover : "transparent",
                        color: idx === activeIdx ? T.text.primary : T.text.secondary,
                        borderBottom:
                          idx < suggestions.length - 1 ? `1px solid ${T.border}` : "none",
                      }}
                    >
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              type="submit"
              style={{
                background: T.blue,
                color: T.bg,
                border: "none",
                borderRadius: 10,
                padding: "0 22px",
                height: 48,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                whiteSpace: "nowrap" as const,
                flexShrink: 0,
                letterSpacing: 0.1,
              }}
            >
              Submit
            </button>
          </form>
        </div>
      )}
    </>
  );
}
