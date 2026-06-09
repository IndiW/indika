"use client";

import { useRef, useState, useEffect } from "react";
import type { SpriteFrame, SpriteAnimation } from "./types";

interface Props {
  imageSrc: string | null;
  naturalW: number;
  naturalH: number;
  frames: SpriteFrame[];
  animations: SpriteAnimation[];
  setAnimations: (a: SpriteAnimation[]) => void;
}

// ── Code generation ──────────────────────────────────────────────────────

function genCSS(frames: SpriteFrame[], fps: number, name: string): string {
  if (!frames.length) return "";
  const slug = name.toLowerCase().replace(/\s+/g, "-");
  const fw = frames[0].w;
  const fh = frames[0].h;
  const dur = (frames.length / fps).toFixed(3);
  const kf = frames
    .map((f, i) => `  ${((i / frames.length) * 100).toFixed(2)}% { background-position: -${f.x}px -${f.y}px; }`)
    .join("\n");
  return `.${slug} {
  width: ${fw}px;
  height: ${fh}px;
  background-image: url('YOUR_SPRITE_SHEET.png');
  background-repeat: no-repeat;
  animation: ${slug} ${dur}s steps(1) infinite;
}

@keyframes ${slug} {
${kf}
  100% { background-position: -${frames[0].x}px -${frames[0].y}px; }
}`;
}

function genCanvas(frames: SpriteFrame[], fps: number, name: string): string {
  if (!frames.length) return "";
  const fw = frames[0].w;
  const fh = frames[0].h;
  const fd = frames.map((f) => `  { x: ${f.x}, y: ${f.y}, w: ${f.w}, h: ${f.h} }`).join(",\n");
  return `// ${name} — ${frames.length} frames @ ${fps}fps
const img = new Image();
img.src = 'YOUR_SPRITE_SHEET.png';

const frames = [
${fd}
];

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.width = ${fw};
canvas.height = ${fh};
let i = 0;

img.onload = () => {
  setInterval(() => {
    const f = frames[i];
    ctx.clearRect(0, 0, ${fw}, ${fh});
    ctx.drawImage(img, f.x, f.y, f.w, f.h, 0, 0, f.w, f.h);
    i = (i + 1) % frames.length;
  }, ${Math.round(1000 / fps)});
};`;
}

function genReact(frames: SpriteFrame[], fps: number, name: string): string {
  if (!frames.length) return "";
  const comp = name.replace(/[^a-zA-Z0-9]/g, " ").trim().replace(/(?:^|\s)(\w)/g, (_, c: string) => c.toUpperCase()).replace(/\s/g, "") || "SpriteAnim";
  const fd = frames.map((f) => `  { x: ${f.x}, y: ${f.y}, w: ${f.w}, h: ${f.h} }`).join(",\n");
  return `import { useEffect, useState } from 'react';

const FRAMES = [
${fd}
];

export function ${comp}({ fps = ${fps}, loop = true }: { fps?: number; loop?: boolean }) {
  const [idx, setIdx] = useState(0);
  const frame = FRAMES[idx];

  useEffect(() => {
    const id = setInterval(() => {
      setIdx(i => {
        const next = i + 1;
        if (next >= FRAMES.length) return loop ? 0 : i;
        return next;
      });
    }, 1000 / fps);
    return () => clearInterval(id);
  }, [fps, loop]);

  return (
    <div
      style={{
        width: frame.w,
        height: frame.h,
        backgroundImage: \`url('/YOUR_SPRITE_SHEET.png')\`,
        backgroundPosition: \`-\${frame.x}px -\${frame.y}px\`,
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
      }}
    />
  );
}`;
}

// ── Thumb helper ──────────────────────────────────────────────────────────

function FrameThumb({
  src, f, nw, nh, size = 36, index, onClick, onRemove, disabled,
}: {
  src: string; f: SpriteFrame; nw: number; nh: number; size?: number;
  index: number; onClick?: () => void; onRemove?: () => void; disabled?: boolean;
}) {
  const scale = Math.max(0.25, size / Math.max(f.w, f.h, 1));
  const w = Math.max(size, Math.round(f.w * scale));
  const h = Math.max(size, Math.round(f.h * scale));
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={onClick}
        disabled={disabled}
        title={`${f.name}  (${f.x},${f.y}  ${f.w}×${f.h})`}
        style={{
          width: w, height: h,
          backgroundImage: `url(${src})`,
          backgroundPosition: `-${f.x * scale}px -${f.y * scale}px`,
          backgroundSize: `${nw * scale}px ${nh * scale}px`,
          backgroundRepeat: "no-repeat",
          imageRendering: "pixelated",
          border: "1px solid #252525",
          borderRadius: 3,
          cursor: disabled ? "default" : "pointer",
          opacity: disabled ? 0.35 : 1,
          padding: 0,
          display: "block",
        }}
      />
      <span style={{ position: "absolute", bottom: 2, right: 2, fontSize: 8, color: "rgba(255,255,255,0.4)", fontFamily: "monospace", lineHeight: 1, pointerEvents: "none" }}>
        {index}
      </span>
      {onRemove && (
        <button
          onClick={onRemove}
          style={{ position: "absolute", top: -5, right: -5, width: 14, height: 14, background: "#1e1e1e", border: "1px solid #333", borderRadius: "50%", color: "#666", fontSize: 9, cursor: "pointer", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}
        >
          ×
        </button>
      )}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────

type CodeTab = "react" | "css" | "canvas";

const ACCENT = "#818cf8";
const PANEL: React.CSSProperties = { background: "#0f0f0f", border: "1px solid #1a1a1a", borderRadius: 8, padding: 12 };
const PANEL_TITLE: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: "#444", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 };
const INP: React.CSSProperties = { background: "#141414", border: "1px solid #222", borderRadius: 6, color: "#d4d4d4", fontSize: 13, padding: "6px 10px", outline: "none" };

export default function AnimationStudio({ imageSrc, naturalW, naturalH, frames: allFrames, animations, setAnimations }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spriteRef = useRef<HTMLImageElement | null>(null);
  const rafRef = useRef<number>(0);
  const animRef = useRef<SpriteAnimation | null>(null);
  const framesRef = useRef<SpriteFrame[]>(allFrames);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [newName, setNewName] = useState("walk");
  const [isPlaying, setIsPlaying] = useState(false);
  const [codeTab, setCodeTab] = useState<CodeTab>("react");
  const [copied, setCopied] = useState(false);

  const selectedAnim = animations.find((a) => a.id === selectedId) ?? null;
  const animFrames: SpriteFrame[] = selectedAnim
    ? (selectedAnim.sequence.map((id) => allFrames.find((f) => f.id === id)).filter(Boolean) as SpriteFrame[])
    : [];

  // Keep refs fresh for the RAF loop
  useEffect(() => { animRef.current = selectedAnim; }, [selectedAnim]);
  useEffect(() => { framesRef.current = allFrames; }, [allFrames]);

  // Load sprite image
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.onload = () => { spriteRef.current = img; };
    img.src = imageSrc;
  }, [imageSrc]);

  // Playback loop
  useEffect(() => {
    if (!isPlaying) { cancelAnimationFrame(rafRef.current); return; }
    let idx = 0;
    let last = 0;

    const tick = (now: number) => {
      const anim = animRef.current;
      const img = spriteRef.current;
      const canvas = canvasRef.current;
      if (!anim?.sequence.length || !img || !canvas) { rafRef.current = requestAnimationFrame(tick); return; }

      const seq = anim.sequence.map((id) => framesRef.current.find((f) => f.id === id)).filter(Boolean) as SpriteFrame[];
      if (!seq.length) { rafRef.current = requestAnimationFrame(tick); return; }

      const interval = 1000 / anim.fps;
      if (now - last >= interval) {
        const f = seq[idx % seq.length];
        const maxSide = Math.max(f.w, f.h, 1);
        const scale = Math.max(1, Math.floor(160 / maxSide));
        canvas.width = f.w * scale;
        canvas.height = f.h * scale;
        const ctx = canvas.getContext("2d")!;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, f.x, f.y, f.w, f.h, 0, 0, f.w * scale, f.h * scale);
        idx = (idx + 1) % seq.length;
        last = now;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying]);

  const addAnimation = () => {
    if (!newName.trim()) return;
    const a: SpriteAnimation = { id: Date.now(), name: newName.trim(), sequence: [], fps: 12, loop: true };
    setAnimations([...animations, a]);
    setSelectedId(a.id);
    setNewName("");
    setIsPlaying(false);
  };

  const removeAnimation = (id: number) => {
    setAnimations(animations.filter((a) => a.id !== id));
    if (selectedId === id) { setSelectedId(null); setIsPlaying(false); }
  };

  const updateAnim = (patch: Partial<SpriteAnimation>) => {
    if (!selectedAnim) return;
    setAnimations(animations.map((a) => (a.id === selectedAnim.id ? { ...a, ...patch } : a)));
  };

  const addToSeq = (frameId: number) => {
    if (!selectedAnim) return;
    updateAnim({ sequence: [...selectedAnim.sequence, frameId] });
  };

  const addAllToSeq = () => {
    if (!selectedAnim) return;
    updateAnim({ sequence: [...selectedAnim.sequence, ...allFrames.map((f) => f.id)] });
  };

  const clearSeq = () => {
    if (!selectedAnim) return;
    updateAnim({ sequence: [] });
  };

  const removeFromSeq = (seqIdx: number) => {
    if (!selectedAnim) return;
    const seq = [...selectedAnim.sequence];
    seq.splice(seqIdx, 1);
    updateAnim({ sequence: seq });
  };

  const getCode = () => {
    if (!animFrames.length || !selectedAnim) return "";
    if (codeTab === "css") return genCSS(animFrames, selectedAnim.fps, selectedAnim.name);
    if (codeTab === "canvas") return genCanvas(animFrames, selectedAnim.fps, selectedAnim.name);
    return genReact(animFrames, selectedAnim.fps, selectedAnim.name);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(getCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!imageSrc || !allFrames.length) {
    return <div style={{ fontSize: 13, color: "#3a3a3a" }}>Define frames in the Map tab first.</div>;
  }

  return (
    <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
      {/* ── Left: Animations + Frame palette ── */}
      <div style={{ flex: "0 0 260px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={PANEL}>
          <div style={PANEL_TITLE}>Animations</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            <input
              style={{ ...INP, flex: 1 }}
              value={newName}
              placeholder="animation name"
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addAnimation(); }}
            />
            <button onClick={addAnimation} style={{ background: "#4f46e5", border: "none", color: "#fff", fontSize: 13, padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>
              +
            </button>
          </div>
          {animations.length === 0 && (
            <div style={{ fontSize: 12, color: "#2a2a2a" }}>No animations yet</div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {animations.map((a) => (
              <div
                key={a.id}
                onClick={() => { setSelectedId(a.id); setIsPlaying(false); }}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", borderRadius: 5, cursor: "pointer", background: selectedId === a.id ? "#1a1a2e" : "transparent", border: selectedId === a.id ? "1px solid #312e81" : "1px solid transparent" }}
              >
                <span style={{ flex: 1, fontSize: 13, color: "#ccc" }}>{a.name}</span>
                <span style={{ fontSize: 11, color: "#333", fontFamily: "monospace" }}>{a.sequence.length}f</span>
                <button onClick={(e) => { e.stopPropagation(); removeAnimation(a.id); }} style={{ background: "none", border: "none", color: "#2a2a2a", cursor: "pointer", fontSize: 15, padding: "0 2px", lineHeight: 1 }}>×</button>
              </div>
            ))}
          </div>
        </div>

        {/* Frame palette */}
        <div style={PANEL}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
            <span style={PANEL_TITLE}>Frame palette</span>
            {selectedAnim && allFrames.length > 0 && (
              <button
                onClick={addAllToSeq}
                style={{ marginLeft: "auto", background: "#141414", border: "1px solid #222", color: "#888", fontSize: 11, padding: "3px 10px", borderRadius: 5, cursor: "pointer" }}
                title="Append all frames to sequence in order"
              >
                Add all ↓
              </button>
            )}
          </div>
          {!selectedAnim && (
            <div style={{ fontSize: 12, color: "#2a2a2a" }}>Select an animation first</div>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {allFrames.map((f, i) => (
              <FrameThumb
                key={f.id}
                src={imageSrc}
                f={f}
                nw={naturalW}
                nh={naturalH}
                size={36}
                index={i}
                onClick={() => addToSeq(f.id)}
                disabled={!selectedAnim}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Center: Preview + Sequence ── */}
      <div style={{ flex: "1 1 300px", minWidth: 0, display: "flex", flexDirection: "column", gap: 12 }}>
        {selectedAnim ? (
          <>
            {/* Controls */}
            <div style={{ ...PANEL, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
              <label style={{ fontSize: 11, color: "#555", display: "flex", alignItems: "center", gap: 7 }}>
                FPS
                <input
                  type="range" min={1} max={60} value={selectedAnim.fps}
                  onChange={(e) => updateAnim({ fps: Number(e.target.value) })}
                  style={{ width: 80 }}
                />
                <span style={{ fontSize: 12, color: "#666", minWidth: 22, fontFamily: "monospace" }}>{selectedAnim.fps}</span>
              </label>
              <label style={{ fontSize: 11, color: "#555", display: "flex", alignItems: "center", gap: 5 }}>
                <input type="checkbox" checked={selectedAnim.loop} onChange={(e) => updateAnim({ loop: e.target.checked })} />
                Loop
              </label>
              <button
                onClick={() => setIsPlaying((p) => !p)}
                disabled={!animFrames.length}
                style={{ background: isPlaying ? "#1c1c1c" : "#4f46e5", border: isPlaying ? "1px solid #333" : "none", color: "#fff", fontSize: 12, padding: "5px 16px", borderRadius: 6, cursor: animFrames.length ? "pointer" : "default", opacity: animFrames.length ? 1 : 0.4, minWidth: 70 }}
              >
                {isPlaying ? "⏸ Pause" : "▶ Play"}
              </button>
            </div>

            {/* Canvas preview */}
            <div style={{ ...PANEL, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 120, background: "#070707", gap: 8 }}>
              {animFrames.length === 0 ? (
                <div style={{ fontSize: 12, color: "#2a2a2a" }}>Add frames from the palette to preview</div>
              ) : (
                <>
                  <canvas ref={canvasRef} style={{ imageRendering: "pixelated", maxWidth: "100%" }} />
                  {!isPlaying && <div style={{ fontSize: 11, color: "#2a2a2a" }}>Press Play</div>}
                </>
              )}
            </div>

            {/* Sequence */}
            <div style={PANEL}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
                <span style={PANEL_TITLE}>Sequence — {animFrames.length} frames · {(animFrames.length / selectedAnim.fps).toFixed(2)}s</span>
                {animFrames.length > 0 && (
                  <button
                    onClick={clearSeq}
                    style={{ marginLeft: "auto", background: "none", border: "none", color: "#3a3a3a", fontSize: 11, cursor: "pointer", padding: "0 4px" }}
                  >
                    Clear
                  </button>
                )}
              </div>
              {animFrames.length === 0 ? (
                <div style={{ fontSize: 12, color: "#2a2a2a" }}>Click frames in the palette above to build the sequence</div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {selectedAnim.sequence.map((frameId, si) => {
                    const f = allFrames.find((fr) => fr.id === frameId);
                    if (!f) return null;
                    return (
                      <FrameThumb
                        key={si}
                        src={imageSrc}
                        f={f}
                        nw={naturalW}
                        nh={naturalH}
                        size={32}
                        index={si}
                        onRemove={() => removeFromSeq(si)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ fontSize: 13, color: "#2a2a2a" }}>Select or create an animation on the left</div>
        )}
      </div>

      {/* ── Right: Code output ── */}
      <div style={{ flex: "0 0 380px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={PANEL}>
          <div style={{ display: "flex", gap: 2, marginBottom: 12 }}>
            {(["react", "css", "canvas"] as CodeTab[]).map((t) => (
              <button
                key={t}
                onClick={() => setCodeTab(t)}
                style={{ background: codeTab === t ? "#1c1c2e" : "none", border: codeTab === t ? "1px solid #312e81" : "1px solid transparent", color: codeTab === t ? ACCENT : "#444", fontSize: 11, padding: "4px 12px", borderRadius: 5, cursor: "pointer", fontWeight: codeTab === t ? 600 : 400, textTransform: "uppercase", letterSpacing: "0.05em" }}
              >
                {t}
              </button>
            ))}
          </div>

          {animFrames.length > 0 ? (
            <>
              <pre style={{ background: "#080808", border: "1px solid #1a1a1a", borderRadius: 6, padding: 14, overflow: "auto", maxHeight: 400, fontSize: 11, fontFamily: "ui-monospace, 'Cascadia Code', Menlo, monospace", color: "#a5b4fc", lineHeight: 1.7, whiteSpace: "pre", margin: 0, tabSize: 2 }}>
                {getCode()}
              </pre>
              <button
                onClick={copyCode}
                style={{ marginTop: 10, width: "100%", background: "#4f46e5", border: "none", color: "#fff", fontSize: 12, padding: "8px 0", borderRadius: 6, cursor: "pointer", fontWeight: 500 }}
              >
                {copied ? "✓ Copied!" : "Copy code"}
              </button>
              <div style={{ marginTop: 8, fontSize: 11, color: "#2a2a2a", lineHeight: 1.6 }}>
                Replace <code style={{ color: "#3a3a3a" }}>YOUR_SPRITE_SHEET.png</code> with your image path.
              </div>
            </>
          ) : (
            <div style={{ fontSize: 12, color: "#2a2a2a", padding: "16px 0" }}>
              {!selectedAnim ? "Select an animation to generate code" : "Add frames to the sequence to generate code"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
