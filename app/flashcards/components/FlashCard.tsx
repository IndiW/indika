"use client";

import { useState, useEffect, useRef } from "react";
import { Flashcard, updateCard } from "../lib/cards";

const MEMES = ["/Absolute_Cinema.webp"];

const FIRE_SCALE = 6;
const FIRE_FPS = 7;
const FIRE_ART_H = 22;
const FIRE_CSS_H = FIRE_ART_H * FIRE_SCALE;

interface FlashCardProps {
  card: Flashcard;
  index: number;
  streak: number;
  onResult: (id: string, result: "correct" | "wrong") => void;
  onUpdate: (id: string, data: { prompt: string; answer: string; category: string }) => void;
}

export default function FlashCard({ card, index, streak, onResult, onUpdate }: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [memeUrl, setMemeUrl] = useState<string | null>(null);
  const [showMeme, setShowMeme] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editPrompt, setEditPrompt] = useState("");
  const [editAnswer, setEditAnswer] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const lastMemeIndex = useRef(-1);
  const memeKey = useRef(0);
  const memeImgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardSceneRef = useRef<HTMLDivElement>(null);
  const correctBtnRef = useRef<HTMLButtonElement>(null);
  const memePos = useRef<{ bottom: number; left: number }>({ bottom: 56, left: 0 });
  const rafRef = useRef<number>(0);
  const fadeOutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streakRef = useRef(streak);
  streakRef.current = streak;

  useEffect(() => {
    if (!showMeme) return;
    const img = memeImgRef.current;
    if (!img) return;

    img.style.transition = "none";
    img.style.opacity = "0";
    img.style.transform = "translateY(0)";

    rafRef.current = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!memeImgRef.current) return;
        memeImgRef.current.style.transition = "opacity 0.2s ease-out, transform 1.4s ease-out";
        memeImgRef.current.style.opacity = "1";
        memeImgRef.current.style.transform = "translateY(-150px)";

        fadeOutTimerRef.current = setTimeout(() => {
          if (memeImgRef.current) memeImgRef.current.style.opacity = "0";
        }, 700);

        doneTimerRef.current = setTimeout(() => setShowMeme(false), 1200);
      });
    });

    return () => {
      cancelAnimationFrame(rafRef.current);
      if (fadeOutTimerRef.current) clearTimeout(fadeOutTimerRef.current);
      if (doneTimerRef.current) clearTimeout(doneTimerRef.current);
    };
  }, [showMeme]);

  useEffect(() => {
    if (streak < 5) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

    const MS = 1000 / FIRE_FPS;
    let prev = Date.now();
    let raf: number;

    function sync() {
      canvas!.width = Math.round(canvas!.clientWidth / FIRE_SCALE);
      canvas!.height = FIRE_ART_H;
    }
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(canvas);

    function rand(lo: number, hi: number) {
      return Math.floor(Math.random() * (hi - lo + 1)) + lo;
    }

    function tick() {
      const now = Date.now();
      if (now - prev >= MS) {
        prev = now;
        const W = canvas!.width;
        const H = FIRE_ART_H;
        ctx.clearRect(0, 0, W, H);

        const t = Math.min(1, (streakRef.current - 5) / 10);
        const maxH = Math.round(4 + t * 14);

        for (let x = 0; x < W; x++) {
          const norm = x / Math.max(1, W - 1);
          const bell = Math.sin(norm * Math.PI);
          const colMax = Math.round(bell * maxH);
          if (colMax <= 0) continue;

          const h1 = Math.min(H, Math.max(1, colMax + rand(-2, 1)));
          const h2 = Math.max(0, h1 - rand(2, 4));
          const h3 = Math.max(0, h2 - rand(1, 3));

          ctx.fillStyle = "#d14234"; ctx.fillRect(x, H - h1, 1, h1);
          if (h2 > 0) { ctx.fillStyle = "#f2a55f"; ctx.fillRect(x, H - h2, 1, h2); }
          if (h3 > 0) { ctx.fillStyle = "#e8dec5"; ctx.fillRect(x, H - h3, 1, h3); }
        }
      }
      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streak >= 5]);

  const handleFlip = () => {
    if (isEditing) return;
    setIsFlipped((f) => !f);
  };

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditPrompt(card.prompt);
    setEditAnswer(card.answer);
    setEditCategory(card.category);
    setIsEditing(true);
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(false);
  };

  const saveEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaving(true);
    const data = { prompt: editPrompt.trim(), answer: editAnswer.trim(), category: editCategory.trim() || 'General' };
    updateCard(card.id, data);
    onUpdate(card.id, data);
    setIsSaving(false);
    setIsEditing(false);
  };

  const handleResult = (r: "correct" | "wrong") => {
    if (result) return;
    setResult(r);
    onResult(card.id, r);

    if (r === "correct") {
      if (correctBtnRef.current && cardSceneRef.current) {
        const btnRect = correctBtnRef.current.getBoundingClientRect();
        const sceneRect = cardSceneRef.current.getBoundingClientRect();
        memePos.current = {
          left: btnRect.left + btnRect.width / 2 - sceneRect.left - 40,
          bottom: sceneRect.bottom - (btnRect.top + btnRect.height / 2) - 40,
        };
      }

      let idx = Math.floor(Math.random() * MEMES.length);
      if (MEMES.length > 1 && idx === lastMemeIndex.current) idx = (idx + 1) % MEMES.length;
      lastMemeIndex.current = idx;
      memeKey.current += 1;
      setMemeUrl(MEMES[idx]);
      setShowMeme(true);
    } else {
      const audio = new Audio("/sounds/FAHHH Sound effect from TikTok .mp3");
      audio.currentTime = 0;
      audio.play().catch(() => {});
      setTimeout(() => audio.pause(), 2000);
    }
  };

  const cardNumber = String(index + 1).padStart(2, "0");
  void cardNumber;

  const fieldStyle = {
    background: "var(--fc-bg)",
    borderColor: "var(--fc-border)",
    color: "var(--fc-text-primary)",
    fontFamily: "var(--font-geist-sans)",
  };

  const editContent = (
    <>
      <div className="flex items-start justify-between">
        <span
          className="text-xs tracking-[0.2em] uppercase"
          style={{ fontFamily: "var(--font-geist-mono)", color: "var(--fc-text-secondary)" }}
        >
          {editCategory || card.category}
        </span>
        <button
          onClick={cancelEdit}
          className="text-xs tracking-[0.1em] uppercase transition-opacity hover:opacity-60"
          style={{ fontFamily: "var(--font-geist-mono)", color: "var(--fc-text-tertiary)" }}
        >
          cancel
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-3" style={{ scrollbarWidth: "none" }}>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs tracking-[0.15em] uppercase" style={{ fontFamily: "var(--font-geist-mono)", color: "var(--fc-text-secondary)" }}>
            Prompt
          </label>
          <textarea
            value={editPrompt}
            onChange={(e) => setEditPrompt(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            rows={3}
            className="w-full rounded-xl px-4 py-3 text-sm leading-relaxed resize-none outline-none border"
            style={fieldStyle}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs tracking-[0.15em] uppercase" style={{ fontFamily: "var(--font-geist-mono)", color: "var(--fc-text-secondary)" }}>
            Answer
          </label>
          <textarea
            value={editAnswer}
            onChange={(e) => setEditAnswer(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            rows={3}
            className="w-full rounded-xl px-4 py-3 text-sm leading-relaxed resize-none outline-none border"
            style={fieldStyle}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs tracking-[0.15em] uppercase" style={{ fontFamily: "var(--font-geist-mono)", color: "var(--fc-text-secondary)" }}>
            Category
          </label>
          <input
            type="text"
            value={editCategory}
            onChange={(e) => setEditCategory(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="w-full rounded-xl px-4 py-3 text-sm outline-none border"
            style={fieldStyle}
          />
        </div>
      </div>

      <button
        onClick={saveEdit}
        disabled={isSaving}
        className="w-full py-3.5 rounded-xl text-sm font-medium tracking-wide transition-opacity disabled:opacity-40"
        style={{ background: "var(--fc-text-primary)", color: "#080808", fontFamily: "var(--font-geist-sans)" }}
      >
        {isSaving ? "Saving…" : "Save"}
      </button>
    </>
  );

  return (
    <div
      ref={cardSceneRef}
      className="fc-card-scene w-full h-full relative"
      style={{ cursor: isEditing ? "default" : "pointer" }}
      onClick={handleFlip}
    >
      <div className={`fc-card-inner relative w-full h-full ${isFlipped ? "flipped" : ""}`}>
        {/* Front */}
        <div
          className={`fc-card-face absolute inset-0 flex flex-col justify-between p-8 sm:p-10 rounded-2xl border ${result === "correct" ? "fc-flash-correct" : result === "wrong" ? "fc-flash-wrong" : ""}`}
          style={{ background: "var(--fc-surface)", borderColor: "var(--fc-border)" }}
        >
          {isEditing ? editContent : (
            <>
              <div className="flex items-start justify-between">
                <span className="text-xs tracking-[0.2em] uppercase" style={{ fontFamily: "var(--font-geist-mono)", color: "var(--fc-text-secondary)" }}>
                  {card.category}
                </span>
                <button
                  onClick={startEdit}
                  className="text-xs tracking-[0.1em] uppercase transition-opacity hover:opacity-60"
                  style={{ fontFamily: "var(--font-geist-mono)", color: "var(--fc-text-tertiary)" }}
                >
                  edit
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-6" style={{ scrollbarWidth: "none" }}>
                <div className="min-h-full flex items-center">
                  <p className="text-2xl sm:text-3xl font-medium leading-tight tracking-tight" style={{ color: "var(--fc-text-primary)" }}>
                    {card.prompt}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-4 h-px" style={{ background: "var(--fc-text-tertiary)" }} />
                <span className="text-xs tracking-[0.15em] uppercase" style={{ fontFamily: "var(--font-geist-mono)", color: "var(--fc-text-tertiary)" }}>
                  tap to reveal
                </span>
              </div>
            </>
          )}
        </div>

        {/* Back */}
        <div
          className={`fc-card-back-face absolute inset-0 flex flex-col justify-between p-8 sm:p-10 rounded-2xl border ${result === "correct" ? "fc-flash-correct" : result === "wrong" ? "fc-flash-wrong" : ""}`}
          style={{ background: "var(--fc-surface)", borderColor: "var(--fc-border)" }}
        >
          {isEditing ? editContent : (
            <>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs tracking-[0.2em] uppercase" style={{ fontFamily: "var(--font-geist-mono)", color: "var(--fc-text-secondary)" }}>
                    {card.category}
                  </span>
                  <div className="w-4 h-px" style={{ background: "var(--fc-border-hover)" }} />
                  <span className="text-xs tracking-[0.2em] uppercase" style={{ fontFamily: "var(--font-geist-mono)", color: "var(--fc-text-secondary)" }}>
                    Answer
                  </span>
                </div>
                <button
                  onClick={startEdit}
                  className="text-xs tracking-[0.1em] uppercase transition-opacity hover:opacity-60"
                  style={{ fontFamily: "var(--font-geist-mono)", color: "var(--fc-text-tertiary)" }}
                >
                  edit
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-6" style={{ scrollbarWidth: "none" }}>
                <div className="min-h-full flex items-center">
                  <p className="text-xl sm:text-2xl font-light leading-relaxed" style={{ color: "var(--fc-text-primary)" }}>
                    {card.answer}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 fc-fade-up">
                <button
                  ref={correctBtnRef}
                  onClick={(e) => { e.stopPropagation(); handleResult("correct"); }}
                  disabled={!!result}
                  className="flex-1 py-3.5 px-4 rounded-xl text-sm font-medium tracking-wide transition-all duration-200 hover:opacity-80 active:scale-[0.98] disabled:cursor-default disabled:active:scale-100"
                  style={{
                    background: result === "correct" ? "var(--fc-accent-correct)" : result === "wrong" ? "transparent" : "var(--fc-text-primary)",
                    color: result === "correct" ? "#080808" : result === "wrong" ? "var(--fc-text-tertiary)" : "#080808",
                    border: result === "wrong" ? "1px solid var(--fc-border)" : undefined,
                    opacity: result === "wrong" ? 0.4 : 1,
                    fontFamily: "var(--font-geist-sans)",
                  }}
                >
                  Knew it
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleResult("wrong"); }}
                  disabled={!!result}
                  className="flex-1 py-3.5 px-4 rounded-xl text-sm font-medium tracking-wide transition-all duration-200 hover:opacity-80 active:scale-[0.98] disabled:cursor-default disabled:active:scale-100"
                  style={{
                    background: result === "wrong" ? "var(--fc-accent-wrong)" : "transparent",
                    color: result === "wrong" ? "#080808" : result === "correct" ? "var(--fc-text-tertiary)" : "var(--fc-text-primary)",
                    border: result === "correct" ? "1px solid var(--fc-border)" : "1px solid var(--fc-border-hover)",
                    opacity: result === "correct" ? 0.4 : 1,
                    fontFamily: "var(--font-geist-sans)",
                  }}
                >
                  Missed it
                </button>
              </div>
            </>
          )}
        </div>

        {streak >= 5 && (
          <canvas
            ref={canvasRef}
            style={{
              position: "absolute",
              bottom: "100%",
              left: 0,
              width: "100%",
              height: `${FIRE_CSS_H}px`,
              imageRendering: "pixelated",
              pointerEvents: "none",
            }}
          />
        )}
      </div>

      {showMeme && memeUrl && (
        <img
          ref={memeImgRef}
          key={memeKey.current}
          src={memeUrl}
          alt="Celebration"
          className="absolute rounded-xl object-cover"
          style={{
            width: 80,
            height: 80,
            bottom: memePos.current.bottom,
            left: memePos.current.left,
            zIndex: 10,
            opacity: 0,
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}
