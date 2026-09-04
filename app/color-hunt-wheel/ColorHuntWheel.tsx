"use client";

import { useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Wheel from "./Wheel";
import {
  COLORS,
  MAX_NAMES,
  SPIN_DURATION_MS,
  computeSpin,
  decodeShareParams,
  encodeShareParams,
  generateSeed,
  nextRotation,
  type SpinResult,
} from "./lib";

const SERIF_FONT = "var(--font-instrument-serif), Georgia, 'Times New Roman', serif";
const SANS_FONT = "var(--font-geist-sans), system-ui, -apple-system, sans-serif";

const ANIMATION_CSS = `
@keyframes chw-fade-up {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.chw-fade-up { animation: chw-fade-up 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
@keyframes chw-pop {
  0%   { opacity: 0; transform: scale(0.9); }
  100% { opacity: 1; transform: scale(1); }
}
.chw-pop { animation: chw-pop 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
`;

type Phase = "input" | "spinning" | "result";

export default function ColorHuntWheel() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read once, at mount, via a lazy initializer rather than an effect — this
  // is the initial page load's URL, and a shared link never mutates in place.
  const [decoded] = useState(() => decodeShareParams(searchParams));

  const [phase, setPhase] = useState<Phase>(() => (decoded ? "spinning" : "input"));
  const [names, setNames] = useState<string[]>(() => decoded?.names ?? []);
  const [inputValue, setInputValue] = useState("");
  const [seed, setSeed] = useState<string | null>(() => decoded?.seed ?? null);
  const [spinResult, setSpinResult] = useState<SpinResult | null>(() =>
    decoded ? computeSpin(decoded.names, decoded.seed) : null
  );
  const [rotationDeg, setRotationDeg] = useState(0);
  const [spinning, setSpinning] = useState(() => decoded !== null);
  const [revealed, setRevealed] = useState(false);
  const [isSharedView, setIsSharedView] = useState(() => decoded !== null);
  const [copied, setCopied] = useState(false);

  const rotationRef = useRef(0);
  const hasScheduledInitialReveal = useRef(false);

  function scheduleReveal(target: number) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        rotationRef.current = target;
        setRotationDeg(target);
      });
    });
    window.setTimeout(() => {
      setSpinning(false);
      setRevealed(true);
      setPhase("result");
    }, SPIN_DURATION_MS + 150);
  }

  function runSpin(namesList: string[], spinSeed: string) {
    const result = computeSpin(namesList, spinSeed);
    const target = nextRotation(rotationRef.current, result.landingSlot);
    setSpinResult(result);
    setRevealed(false);
    setSpinning(true);
    setPhase("spinning");
    scheduleReveal(target);
  }

  // Kick off the reveal animation for a shared link's already-computed
  // result. State setters here only run inside the rAF/timeout callbacks
  // scheduled by scheduleReveal, not synchronously in the effect body.
  useEffect(() => {
    if (!decoded || !spinResult || hasScheduledInitialReveal.current) return;
    hasScheduledInitialReveal.current = true;
    scheduleReveal(nextRotation(0, spinResult.landingSlot));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addName(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed || names.length >= MAX_NAMES) return;
    setNames((prev) => (prev.length >= MAX_NAMES ? prev : [...prev, trimmed]));
  }

  function commitInput() {
    if (!inputValue.trim()) return;
    addName(inputValue);
    setInputValue("");
  }

  function handleInputKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      commitInput();
    } else if (e.key === "Backspace" && inputValue === "" && names.length > 0) {
      setNames((prev) => prev.slice(0, -1));
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData("text");
    if (/[,\n]/.test(text)) {
      e.preventDefault();
      const parts = text
        .split(/[,\n]/)
        .map((p) => p.trim())
        .filter(Boolean);
      for (const part of parts) {
        addName(part);
      }
      setInputValue("");
    }
  }

  function removeName(index: number) {
    setNames((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSpinClick() {
    if (names.length === 0) return;
    const newSeed = generateSeed();
    setSeed(newSeed);
    runSpin(names, newSeed);
  }

  async function handleCopyLink() {
    if (!seed) return;
    const url = `${window.location.origin}${pathname}?${encodeShareParams(names, seed)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — no secondary fallback UI for this small tool
    }
  }

  function handleStartOwnHunt() {
    router.replace(pathname, { scroll: false });
    setIsSharedView(false);
    setNames([]);
    setSeed(null);
    setSpinResult(null);
    setPhase("input");
    setRevealed(false);
    setSpinning(false);
    setRotationDeg(0);
    rotationRef.current = 0;
  }

  const orderedResults =
    spinResult && names.length
      ? names.map((name) => {
          const a = spinResult.assignments.find((x) => x.name === name);
          return { name, color: a ? COLORS[a.colorIndex] : COLORS[0] };
        })
      : [];

  return (
    <main
      className="min-h-dvh flex flex-col items-center px-6 py-14 md:py-20"
      style={{ background: "#FBF7F1", color: "#231F1B", fontFamily: SANS_FONT }}
    >
      <style dangerouslySetInnerHTML={{ __html: ANIMATION_CSS }} />

      <header className="text-center max-w-md mb-10">
        <h1
          className="text-5xl md:text-6xl mb-3"
          style={{ fontFamily: SERIF_FONT }}
        >
          Color Hunt
        </h1>
        <p className="text-sm md:text-[15px] leading-relaxed" style={{ color: "#8A8275" }}>
          Enter your group, spin the wheel, and everyone gets a color to go
          hunt and shoot.
        </p>
      </header>

      {phase === "input" && (
        <div className="w-full max-w-md chw-fade-up">
          <div
            className="flex flex-wrap gap-2 p-3 rounded-2xl min-h-[64px]"
            style={{ border: "1px solid #E7E0D3", background: "#FFFFFF" }}
          >
            {names.map((name, i) => (
              <span
                key={`${name}-${i}`}
                className="chw-pop flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full text-sm"
                style={{ background: "#F3EEE3", color: "#231F1B" }}
              >
                {name}
                <button
                  type="button"
                  onClick={() => removeName(i)}
                  aria-label={`Remove ${name}`}
                  className="w-4 h-4 flex items-center justify-center rounded-full text-xs leading-none opacity-50 hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </span>
            ))}
            {names.length < MAX_NAMES && (
              <div className="flex-1 min-w-[140px] flex items-center gap-2">
                <input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  onPaste={handlePaste}
                  placeholder={names.length === 0 ? "Add a name…" : "Add another…"}
                  className="flex-1 min-w-0 bg-transparent outline-none text-sm py-1.5"
                  style={{ color: "#231F1B" }}
                />
                {inputValue.trim() && (
                  <button
                    type="button"
                    onClick={commitInput}
                    aria-label="Add name"
                    className="chw-pop w-7 h-7 shrink-0 flex items-center justify-center rounded-full text-base leading-none"
                    style={{ background: "#231F1B", color: "#FBF7F1" }}
                  >
                    +
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between mt-2 px-1">
            <span className="text-xs" style={{ color: "#B0A897" }}>
              {names.length} / {MAX_NAMES}
            </span>
          </div>

          <button
            type="button"
            onClick={handleSpinClick}
            disabled={names.length === 0}
            className="w-full mt-6 py-3.5 rounded-full text-sm tracking-wide transition-opacity disabled:opacity-30"
            style={{ background: "#231F1B", color: "#FBF7F1" }}
          >
            Spin the Wheel
          </button>
        </div>
      )}

      {(phase === "spinning" || phase === "result") && (
        <div className="w-full max-w-md flex flex-col items-center">
          <div className="w-full flex justify-center chw-fade-up">
            <Wheel
              rotationDeg={rotationDeg}
              spinning={spinning}
              assignments={spinResult?.assignments ?? null}
              revealed={revealed}
            />
          </div>

          {phase === "result" && (
            <div className="w-full mt-10 chw-fade-up">
              <ul className="flex flex-col gap-2.5 mb-8">
                {orderedResults.map(({ name, color }) => (
                  <li
                    key={name}
                    className="flex items-center gap-3 text-[15px] pb-2.5"
                    style={{ borderBottom: "1px solid #EFE9DF" }}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{
                        background: color.hex,
                        border: color.hex === "#FDFDFC" ? "1px solid #E7E0D3" : "none",
                      }}
                    />
                    <span>{name}</span>
                    <span style={{ color: "#B0A897" }}>—</span>
                    <span style={{ color: "#8A8275" }}>{color.name}</span>
                  </li>
                ))}
              </ul>

              {isSharedView ? (
                <button
                  type="button"
                  onClick={handleStartOwnHunt}
                  className="w-full py-3.5 rounded-full text-sm tracking-wide"
                  style={{ background: "#231F1B", color: "#FBF7F1" }}
                >
                  Start your own hunt
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full py-3.5 rounded-full text-sm tracking-wide"
                  style={{ background: "#231F1B", color: "#FBF7F1" }}
                >
                  {copied ? "Link copied" : "Copy share link"}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
