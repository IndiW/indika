"use client";

import { useState, useMemo } from "react";

const STYLES = [
  { value: "pixel-16", label: "Pixel art 16×16" },
  { value: "pixel-32", label: "Pixel art 32×32" },
  { value: "pixel-48", label: "Pixel art 48×48" },
  { value: "pixel-64", label: "Pixel art 64×64" },
  { value: "cartoon", label: "Cartoon 2D" },
  { value: "painted", label: "Painterly 2D" },
  { value: "vector", label: "Flat vector" },
];

const ANIMATIONS = [
  { value: "walk", label: "Walk cycle", frames: 12 },
  { value: "run", label: "Run cycle", frames: 8 },
  { value: "idle", label: "Idle / breathe", frames: 6 },
  { value: "attack", label: "Attack swing", frames: 8 },
  { value: "jump", label: "Jump arc", frames: 8 },
  { value: "death", label: "Death / fall", frames: 10 },
  { value: "cast", label: "Cast spell", frames: 12 },
  { value: "combo", label: "Combat combo", frames: 24 },
  { value: "custom", label: "Custom…", frames: 12 },
];

const DIRECTIONS = [
  { value: "right", label: "Right-facing (side view →)" },
  { value: "left", label: "Left-facing (side view ←)" },
  { value: "front", label: "Front-facing" },
  { value: "all4", label: "All 4 directions (grid)" },
];

const FRAME_SIZES: Record<string, string> = {
  "pixel-16": "16×16",
  "pixel-32": "32×32",
  "pixel-48": "48×48",
  "pixel-64": "64×64",
  cartoon: "128×128",
  painted: "128×128",
  vector: "128×128",
};

// Returns the most square-like (slightly wider) factorisation of n.
function gridDims(n: number): { cols: number; rows: number } {
  for (let cols = Math.ceil(Math.sqrt(n)); cols <= n; cols++) {
    if (n % cols === 0) return { cols, rows: n / cols };
  }
  return { cols: n, rows: 1 };
}

function buildPrompt(
  style: string,
  subject: string,
  animation: string,
  customAnim: string,
  frameCount: number,
  layout: string,
  direction: string,
  notes: string
): string {
  const styleMap: Record<string, string> = {
    "pixel-16": "retro pixel art, 16×16 pixels per frame,",
    "pixel-32": "pixel art, 32×32 pixels per frame,",
    "pixel-48": "pixel art, 48×48 pixels per frame,",
    "pixel-64": "pixel art, 64×64 pixels per frame,",
    cartoon: "clean cartoon 2D illustration,",
    painted: "painterly 2D art style,",
    vector: "flat vector 2D art style,",
  };

  const animLabel =
    animation === "custom"
      ? customAnim || "custom animation"
      : ANIMATIONS.find((a) => a.value === animation)?.label ?? animation;

  const layoutStr = (() => {
    if (layout === "row") return `${frameCount} frames in a single horizontal strip`;
    const { cols, rows } = gridDims(frameCount);
    return `${frameCount} frames in a ${cols}×${rows} grid (${cols} columns, ${rows} rows)`;
  })();

  const dirMap: Record<string, string> = {
    right: "right-facing side view,",
    left: "left-facing side view,",
    front: "front-facing view,",
    all4: "four-directional (up/down/left/right) views arranged in a 4-row grid,",
  };

  const sub = subject.trim() || "[describe your character here]";
  const frameSize = FRAME_SIZES[style] ?? "64×64";

  const parts = [
    `Sprite sheet of ${sub},`,
    styleMap[style],
    `${animLabel} animation,`,
    `${layoutStr},`,
    `${frameSize} pixels per frame,`,
    "transparent PNG background,",
    dirMap[direction],
    "consistent character proportions across all frames,",
    "game-ready sprite sheet asset, clean separated frames.",
  ];

  if (notes.trim()) parts.push(notes.trim());

  return parts.join(" ");
}

const INP: React.CSSProperties = {
  background: "#141414",
  border: "1px solid #222",
  borderRadius: 6,
  color: "#d4d4d4",
  fontSize: 13,
  padding: "8px 10px",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const LBL: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "#666",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: 5,
  display: "block",
};

export default function PromptBuilder({ onContinue }: { onContinue: () => void }) {
  const [style, setStyle] = useState("pixel-32");
  const [subject, setSubject] = useState("");
  const [animation, setAnimation] = useState("walk");
  const [customAnim, setCustomAnim] = useState("");
  const [frameCount, setFrameCount] = useState(8);
  const [layout, setLayout] = useState("row");
  const [direction, setDirection] = useState("right");
  const [notes, setNotes] = useState("");
  const [copied, setCopied] = useState(false);

  const prompt = useMemo(
    () => buildPrompt(style, subject, animation, customAnim, frameCount, layout, direction, notes),
    [style, subject, animation, customAnim, frameCount, layout, direction, notes]
  );

  const copy = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ maxWidth: 620, display: "flex", flexDirection: "column", gap: 22 }}>
      <div>
        <h2 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 600, color: "#fff" }}>
          Prompt Builder
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: "#555" }}>
          Generate a prompt for Midjourney, DALL-E, or Stable Diffusion.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={LBL}>Character or subject</label>
          <input
            style={INP}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. a small knight in shining armor with a red cape"
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={LBL}>Art style</label>
            <select style={{ ...INP }} value={style} onChange={(e) => setStyle(e.target.value)}>
              {STYLES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={LBL}>Animation type</label>
            <select
              style={{ ...INP }}
              value={animation}
              onChange={(e) => {
                setAnimation(e.target.value);
                const found = ANIMATIONS.find((a) => a.value === e.target.value);
                if (found) setFrameCount(found.frames);
              }}
            >
              {ANIMATIONS.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>
        </div>

        {animation === "custom" && (
          <div>
            <label style={LBL}>Describe the animation</label>
            <input
              style={INP}
              value={customAnim}
              onChange={(e) => setCustomAnim(e.target.value)}
              placeholder="e.g. swimming stroke cycle"
            />
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div>
            <label style={LBL}>Frame count</label>
            <select
              style={{ ...INP }}
              value={frameCount}
              onChange={(e) => {
                const n = Number(e.target.value);
                setFrameCount(n);
                if (n > 12) setLayout("grid");
              }}
            >
              {[2, 3, 4, 5, 6, 8, 10, 12, 16, 18, 20, 24, 28, 30].map((n) => (
                <option key={n} value={n}>{n} frames</option>
              ))}
            </select>
          </div>
          <div>
            <label style={LBL}>Sheet layout</label>
            <select style={{ ...INP }} value={layout} onChange={(e) => setLayout(e.target.value)}>
              <option value="row">Horizontal row</option>
              <option value="grid">Grid</option>
            </select>
            {layout === "row" && frameCount > 12 && (
              <div style={{ fontSize: 10, color: "#7c4a00", marginTop: 4 }}>
                {frameCount} frames horizontal = very wide sheet — grid recommended
              </div>
            )}
          </div>
          <div>
            <label style={LBL}>Facing direction</label>
            <select style={{ ...INP }} value={direction} onChange={(e) => setDirection(e.target.value)}>
              {DIRECTIONS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label style={LBL}>Additional notes (optional)</label>
          <textarea
            style={{ ...INP, resize: "vertical", minHeight: 60, fontFamily: "inherit" }}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. warm color palette, medieval fantasy, big expressive eyes"
          />
        </div>
      </div>

      <div style={{ background: "#0a0a0a", border: "1px solid #1e1e1e", borderRadius: 8, padding: 16 }}>
        <div style={{ ...LBL, marginBottom: 10 }}>Generated prompt</div>
        <p style={{ margin: 0, fontSize: 13, color: "#a5b4fc", lineHeight: 1.75, fontFamily: "ui-monospace, monospace", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {prompt}
        </p>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={copy}
          style={{ background: "#1a1a2e", border: "1px solid #2e2e5e", color: "#a5b4fc", fontSize: 12, padding: "7px 16px", borderRadius: 6, cursor: "pointer", fontWeight: 500 }}
        >
          {copied ? "✓ Copied" : "Copy prompt"}
        </button>
        <button
          onClick={onContinue}
          style={{ background: "#4f46e5", border: "none", color: "#fff", fontSize: 12, padding: "7px 16px", borderRadius: 6, cursor: "pointer", fontWeight: 500 }}
        >
          Upload sprite sheet →
        </button>
      </div>

      <div style={{ background: "#0f0f0f", border: "1px solid #1a1a1a", borderRadius: 8, padding: 14 }}>
        <div style={{ ...LBL, marginBottom: 8 }}>Tips for better results</div>
        <ul style={{ margin: 0, padding: "0 0 0 16px", color: "#444", fontSize: 12, lineHeight: 1.9 }}>
          <li>Always request a transparent background — makes frame extraction much cleaner</li>
          <li>Specify the exact frame count so the AI spaces frames consistently</li>
          <li>Pixel art is easiest to map — sharp edges, no antialiasing bleed between frames</li>
          <li>Use grid layout for &gt;12 frames — a 30-frame horizontal strip at 64px = 1920px wide</li>
          <li>30fps at 30 frames = 1-second loop; 30fps at 12 frames = 0.4s loop</li>
          <li>Midjourney tip: for a 6×5 grid add <code style={{ color: "#555" }}>--ar 6:5</code></li>
        </ul>
      </div>
    </div>
  );
}
