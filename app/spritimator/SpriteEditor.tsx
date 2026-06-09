"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import type { SpriteFrame } from "./types";

interface Props {
  imageSrc: string | null;
  setImageSrc: (s: string | null) => void;
  naturalW: number;
  setNaturalW: (n: number) => void;
  naturalH: number;
  setNaturalH: (n: number) => void;
  frames: SpriteFrame[];
  setFrames: (f: SpriteFrame[]) => void;
  onContinue: () => void;
}

type Mode = "grid" | "manual";

function buildGridFrames(nw: number, nh: number, cols: number, rows: number): SpriteFrame[] {
  const fw = Math.round(nw / cols);
  const fh = Math.round(nh / rows);
  const out: SpriteFrame[] = [];
  let id = 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      out.push({
        id: id++,
        name: rows === 1 ? `frame_${String(r * cols + c).padStart(2, "0")}` : `r${r}_c${c}`,
        x: c * fw,
        y: r * fh,
        w: fw,
        h: fh,
      });
    }
  }
  return out;
}

// Flood-fill from (startX, startY), making matching pixels transparent.
// tolerance is a 0-255 Euclidean RGB distance threshold.
function floodFill(imageData: ImageData, startX: number, startY: number, tolerance: number): void {
  const { data, width, height } = imageData;
  const si = (startY * width + startX) * 4;
  const tr = data[si], tg = data[si + 1], tb = data[si + 2];

  const visited = new Uint8Array(width * height);
  const stack = [startX + startY * width];

  while (stack.length) {
    const pos = stack.pop()!;
    if (visited[pos]) continue;
    visited[pos] = 1;

    const x = pos % width;
    const y = (pos / width) | 0;
    const pi = pos * 4;

    if (data[pi + 3] === 0) continue; // already transparent
    const dr = data[pi] - tr, dg = data[pi + 1] - tg, db = data[pi + 2] - tb;
    if (Math.sqrt(dr * dr + dg * dg + db * db) > tolerance) continue;

    data[pi + 3] = 0;

    if (x + 1 < width) stack.push(pos + 1);
    if (x - 1 >= 0) stack.push(pos - 1);
    if (y + 1 < height) stack.push(pos + width);
    if (y - 1 >= 0) stack.push(pos - width);
  }
}

function thumbStyle(src: string, f: SpriteFrame, nw: number, nh: number, size = 40): React.CSSProperties {
  const scale = Math.max(0.25, size / Math.max(f.w, f.h, 1));
  return {
    width: Math.round(f.w * scale),
    height: Math.round(f.h * scale),
    backgroundImage: `url(${src})`,
    backgroundPosition: `-${f.x * scale}px -${f.y * scale}px`,
    backgroundSize: `${nw * scale}px ${nh * scale}px`,
    backgroundRepeat: "no-repeat",
    imageRendering: "pixelated",
    border: "1px solid #252525",
    borderRadius: 3,
    flexShrink: 0,
  };
}

const GRID_PRESETS = [
  { cols: 4, rows: 1 },
  { cols: 6, rows: 1 },
  { cols: 8, rows: 1 },
  { cols: 4, rows: 2 },
  { cols: 6, rows: 2 },
  { cols: 8, rows: 2 },
  { cols: 6, rows: 4 },
  { cols: 6, rows: 5 },
];

const ACCENT = "#818cf8";
const INP: React.CSSProperties = {
  background: "#141414",
  border: "1px solid #222",
  borderRadius: 6,
  color: "#d4d4d4",
  fontSize: 12,
  padding: "5px 8px",
  outline: "none",
};

export default function SpriteEditor({
  imageSrc, setImageSrc,
  naturalW, setNaturalW,
  naturalH, setNaturalH,
  frames, setFrames,
  onContinue,
}: Props) {
  const imgRef = useRef<HTMLImageElement>(null);

  const [mode, setMode] = useState<Mode>("grid");
  const [zoom, setZoom] = useState(1);
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  const [gridCols, setGridCols] = useState(8);
  const [gridRows, setGridRows] = useState(1);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameVal, setRenameVal] = useState("");
  const [bgPickMode, setBgPickMode] = useState(false);
  const [tolerance, setTolerance] = useState(30);
  const [originalSrc, setOriginalSrc] = useState<string | null>(null);
  const [stampSize, setStampSize] = useState<{ w: number; h: number } | null>(null);
  const [stampMode, setStampMode] = useState(false);

  const onFile = useCallback(
    (file: File) => {
      const url = URL.createObjectURL(file);
      setImageSrc(url);
      setFrames([]);
      setSelectedId(null);
      setOriginalSrc(null);
      setBgPickMode(false);
      const img = new Image();
      img.onload = () => {
        setNaturalW(img.naturalWidth);
        setNaturalH(img.naturalHeight);
      };
      img.src = url;
    },
    [setImageSrc, setFrames, setNaturalW, setNaturalH]
  );

  const toImg = useCallback(
    (e: React.MouseEvent): { x: number; y: number } => {
      const rect = imgRef.current!.getBoundingClientRect();
      return {
        x: Math.round(((e.clientX - rect.left) / rect.width) * naturalW),
        y: Math.round(((e.clientY - rect.top) / rect.height) * naturalH),
      };
    },
    [naturalW, naturalH]
  );

  const doRemoveBg = useCallback(
    (clickX: number, clickY: number) => {
      if (!imgRef.current || !naturalW || !naturalH) return;
      const canvas = document.createElement("canvas");
      canvas.width = naturalW;
      canvas.height = naturalH;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(imgRef.current, 0, 0, naturalW, naturalH);
      const imageData = ctx.getImageData(0, 0, naturalW, naturalH);
      floodFill(imageData, clickX, clickY, tolerance);
      ctx.putImageData(imageData, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const newUrl = URL.createObjectURL(blob);
        setOriginalSrc((prev) => prev ?? imageSrc);
        setImageSrc(newUrl);
        setBgPickMode(false);
      }, "image/png");
    },
    [imageSrc, naturalW, naturalH, tolerance, setImageSrc]
  );

  // Auto-generate grid frames whenever grid settings change while in grid mode
  useEffect(() => {
    if (mode === "grid" && naturalW && naturalH) {
      setFrames(buildGridFrames(naturalW, naturalH, gridCols, gridRows));
    }
  }, [mode, gridCols, gridRows, naturalW, naturalH, setFrames]);

  const onMouseDown = (e: React.MouseEvent) => {
    if (bgPickMode) {
      e.preventDefault();
      const { x, y } = toImg(e);
      doRemoveBg(x, y);
      return;
    }
    if (mode !== "manual") return;
    e.preventDefault();
    const c = toImg(e);
    setDrawStart(c);
    setDrawCurrent(c);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!imgRef.current) return;
    const c = toImg(e);
    setHover(c);
    if (drawStart) setDrawCurrent(c);
  };

  const onMouseUp = (e: React.MouseEvent) => {
    if (!drawStart || !drawCurrent || mode !== "manual") return;
    const x = Math.min(drawStart.x, drawCurrent.x);
    const y = Math.min(drawStart.y, drawCurrent.y);
    const w = Math.abs(drawCurrent.x - drawStart.x);
    const h = Math.abs(drawCurrent.y - drawStart.y);

    if (w > 4 && h > 4) {
      // Drew a new size — create frame, lock it as the new stamp
      const f: SpriteFrame = {
        id: Date.now(),
        name: `frame_${String(frames.length).padStart(2, "0")}`,
        x, y, w, h,
      };
      setFrames([...frames, f]);
      setSelectedId(f.id);
      setStampSize({ w, h });
      setStampMode(true);
    } else if (stampMode && stampSize) {
      // Click — place stamp with top-left at the click point
      const f: SpriteFrame = {
        id: Date.now(),
        name: `frame_${String(frames.length).padStart(2, "0")}`,
        x: drawStart.x,
        y: drawStart.y,
        w: stampSize.w,
        h: stampSize.h,
      };
      setFrames([...frames, f]);
      setSelectedId(f.id);
    }
    setDrawStart(null);
    setDrawCurrent(null);
  };

  const deleteFrame = (id: number) => {
    setFrames(frames.filter((f) => f.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const commitRename = () => {
    if (renamingId === null) return;
    setFrames(frames.map((f) => (f.id === renamingId ? { ...f, name: renameVal } : f)));
    setRenamingId(null);
  };

  const hoverCell =
    hover && mode === "grid" && gridCols && gridRows
      ? {
          col: Math.min(gridCols - 1, Math.floor((hover.x / naturalW) * gridCols)),
          row: Math.min(gridRows - 1, Math.floor((hover.y / naturalH) * gridRows)),
        }
      : null;

  // ── Overlays ─────────────────────────────────────────────────────────────

  const isDragging = !!(
    drawStart && drawCurrent &&
    (Math.abs(drawCurrent.x - drawStart.x) > 4 || Math.abs(drawCurrent.y - drawStart.y) > 4)
  );

  const stampGhost = mode === "manual" && stampMode && stampSize && hover && !isDragging ? (
    <div style={{
      position: "absolute",
      left: `${(hover.x / naturalW) * 100}%`,
      top: `${(hover.y / naturalH) * 100}%`,
      width: `${(stampSize.w / naturalW) * 100}%`,
      height: `${(stampSize.h / naturalH) * 100}%`,
      border: "1px dashed rgba(129,140,248,0.75)",
      background: "rgba(129,140,248,0.08)",
      boxSizing: "border-box",
      pointerEvents: "none",
    }} />
  ) : null;

  const gridOverlay = mode === "grid" && naturalW ? (
    <>
      {Array.from({ length: gridCols - 1 }, (_, i) => (
        <div key={`v${i}`} style={{ position: "absolute", top: 0, bottom: 0, left: `${((i + 1) / gridCols) * 100}%`, width: 1, background: "rgba(129,140,248,0.45)", pointerEvents: "none" }} />
      ))}
      {Array.from({ length: gridRows - 1 }, (_, i) => (
        <div key={`h${i}`} style={{ position: "absolute", left: 0, right: 0, top: `${((i + 1) / gridRows) * 100}%`, height: 1, background: "rgba(129,140,248,0.45)", pointerEvents: "none" }} />
      ))}
      {hoverCell && (
        <div style={{
          position: "absolute",
          left: `${(hoverCell.col / gridCols) * 100}%`,
          top: `${(hoverCell.row / gridRows) * 100}%`,
          width: `${(1 / gridCols) * 100}%`,
          height: `${(1 / gridRows) * 100}%`,
          background: "rgba(129,140,248,0.12)",
          border: "1px solid rgba(129,140,248,0.6)",
          boxSizing: "border-box",
          pointerEvents: "none",
        }}>
          <span style={{ fontSize: 10, color: ACCENT, fontFamily: "monospace", background: "rgba(0,0,0,0.6)", padding: "0 3px", borderRadius: 2, position: "absolute", top: 3, left: 3, lineHeight: 1.5 }}>
            {hoverCell.row * gridCols + hoverCell.col}
          </span>
        </div>
      )}
    </>
  ) : null;

  const manualOverlay = mode === "manual" ? (
    <>
      {frames.map((f, i) => (
        <div
          key={f.id}
          onClick={() => setSelectedId((p) => (p === f.id ? null : f.id))}
          style={{
            position: "absolute",
            left: `${(f.x / naturalW) * 100}%`,
            top: `${(f.y / naturalH) * 100}%`,
            width: `${(f.w / naturalW) * 100}%`,
            height: `${(f.h / naturalH) * 100}%`,
            border: `1px solid ${selectedId === f.id ? ACCENT : "rgba(129,140,248,0.4)"}`,
            background: selectedId === f.id ? "rgba(129,140,248,0.1)" : "transparent",
            boxSizing: "border-box",
            cursor: "pointer",
          }}
        >
          <span style={{ position: "absolute", top: 2, left: 3, fontSize: 9, color: ACCENT, fontFamily: "monospace", background: "rgba(0,0,0,0.65)", padding: "0 2px", borderRadius: 2, pointerEvents: "none", lineHeight: 1.5 }}>
            {i}
          </span>
        </div>
      ))}
      {isDragging && drawStart && drawCurrent && (
        <div style={{ position: "absolute", left: `${(Math.min(drawStart.x, drawCurrent.x) / naturalW) * 100}%`, top: `${(Math.min(drawStart.y, drawCurrent.y) / naturalH) * 100}%`, width: `${(Math.abs(drawCurrent.x - drawStart.x) / naturalW) * 100}%`, height: `${(Math.abs(drawCurrent.y - drawStart.y) / naturalH) * 100}%`, border: "1px dashed #818cf8", background: "rgba(129,140,248,0.12)", boxSizing: "border-box", pointerEvents: "none" }} />
      )}
    </>
  ) : null;

  const crosshair = hover && mode === "grid" ? (
    <>
      <div style={{ position: "absolute", left: `${(hover.x / naturalW) * 100}%`, top: 0, bottom: 0, width: 1, background: "rgba(255,100,100,0.25)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: `${(hover.y / naturalH) * 100}%`, left: 0, right: 0, height: 1, background: "rgba(255,100,100,0.25)", pointerEvents: "none" }} />
    </>
  ) : null;

  if (!imageSrc) {
    return (
      <label
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type.startsWith("image/")) onFile(f); }}
        onDragOver={(e) => e.preventDefault()}
        style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, width: "100%", maxWidth: 520, height: 220, border: "2px dashed #252525", borderRadius: 12, cursor: "pointer", color: "#444", fontSize: 13, background: "#0f0f0f" }}
      >
        <span style={{ fontSize: 36 }}>🗺️</span>
        <span>Click to upload your sprite sheet — or drag &amp; drop</span>
        <span style={{ fontSize: 11, color: "#333" }}>PNG · GIF · WebP · transparent backgrounds recommended</span>
        <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} style={{ display: "none" }} />
      </label>
    );
  }

  const fw = naturalW && gridCols ? Math.round(naturalW / gridCols) : 0;
  const fh = naturalH && gridRows ? Math.round(naturalH / gridRows) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Toolbar */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 2, marginRight: 4 }}>
          {(["grid", "manual"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{ background: mode === m ? "#1c1c2e" : "#141414", border: `1px solid ${mode === m ? "#312e81" : "#222"}`, color: mode === m ? ACCENT : "#666", fontSize: 12, fontWeight: mode === m ? 600 : 400, padding: "5px 14px", borderRadius: 6, cursor: "pointer", textTransform: "capitalize" }}
            >
              {m}
            </button>
          ))}
        </div>
        <div style={{ width: 1, height: 18, background: "#222" }} />

        {mode === "grid" && (
          <>
            <label style={{ fontSize: 11, color: "#555", display: "flex", alignItems: "center", gap: 5 }}>
              Cols
              <input type="number" min={1} max={64} value={gridCols} onChange={(e) => setGridCols(Math.max(1, Number(e.target.value) || 1))} style={{ ...INP, width: 48 }} />
            </label>
            <label style={{ fontSize: 11, color: "#555", display: "flex", alignItems: "center", gap: 5 }}>
              Rows
              <input type="number" min={1} max={64} value={gridRows} onChange={(e) => setGridRows(Math.max(1, Number(e.target.value) || 1))} style={{ ...INP, width: 48 }} />
            </label>
            <span style={{ fontSize: 11, color: "#3a3a3a", fontFamily: "monospace" }}>
              → {frames.length} frames · {fw}×{fh}px each
            </span>
            <div style={{ display: "flex", gap: 3 }}>
              {GRID_PRESETS.map((p) => (
                <button
                  key={`${p.cols}x${p.rows}`}
                  onClick={() => { setGridCols(p.cols); setGridRows(p.rows); }}
                  title={`${p.cols * p.rows} frames`}
                  style={{ background: gridCols === p.cols && gridRows === p.rows ? "#1c1c2e" : "#141414", border: `1px solid ${gridCols === p.cols && gridRows === p.rows ? "#312e81" : "#222"}`, color: gridCols === p.cols && gridRows === p.rows ? ACCENT : "#555", fontSize: 11, padding: "3px 7px", borderRadius: 5, cursor: "pointer", fontFamily: "monospace" }}
                >
                  {p.cols}×{p.rows}
                </button>
              ))}
            </div>
            <div style={{ width: 1, height: 18, background: "#222" }} />
          </>
        )}
        {mode === "manual" && (
          <>
            {stampSize ? (
              <>
                <button
                  onClick={() => setStampMode((p) => !p)}
                  style={{ background: stampMode ? "#1c1c2e" : "#141414", border: `1px solid ${stampMode ? "#312e81" : "#222"}`, color: stampMode ? ACCENT : "#666", fontSize: 12, fontWeight: stampMode ? 600 : 400, padding: "5px 12px", borderRadius: 6, cursor: "pointer" }}
                >
                  {stampMode ? `↓ ${stampSize.w}×${stampSize.h}` : `Stamp ${stampSize.w}×${stampSize.h}`}
                </button>
                <button
                  onClick={() => { setStampSize(null); setStampMode(false); }}
                  style={{ background: "none", border: "none", color: "#3a3a3a", fontSize: 12, cursor: "pointer", padding: "0 2px" }}
                  title="Clear stamp size"
                >
                  ×
                </button>
              </>
            ) : (
              <span style={{ fontSize: 12, color: "#444" }}>Drag to draw first frame</span>
            )}
            <div style={{ width: 1, height: 18, background: "#222" }} />
          </>
        )}

        <label style={{ fontSize: 11, color: "#555", display: "flex", alignItems: "center", gap: 5 }}>
          Zoom
          <input type="range" min={0.5} max={8} step={0.5} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} style={{ width: 80 }} />
          <span style={{ fontSize: 11, color: "#3a3a3a", minWidth: 28 }}>{zoom}×</span>
        </label>
        <div style={{ width: 1, height: 18, background: "#222" }} />
        <span style={{ fontSize: 11, color: "#3a3a3a", fontFamily: "monospace" }}>{naturalW}×{naturalH}</span>
        <div style={{ width: 1, height: 18, background: "#222" }} />
        <label style={{ fontSize: 12, color: "#555", cursor: "pointer" }}>
          Change image
          <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} style={{ display: "none" }} />
        </label>
        <div style={{ width: 1, height: 18, background: "#222" }} />
        <button
          onClick={() => setBgPickMode((p) => !p)}
          style={{ background: bgPickMode ? "#2d1a1a" : "#141414", border: `1px solid ${bgPickMode ? "#7f1d1d" : "#222"}`, color: bgPickMode ? "#fca5a5" : "#888", fontSize: 12, padding: "5px 12px", borderRadius: 6, cursor: "pointer", fontWeight: bgPickMode ? 600 : 400 }}
        >
          {bgPickMode ? "✕ Cancel" : "Remove BG"}
        </button>
        {bgPickMode && (
          <label style={{ fontSize: 11, color: "#888", display: "flex", alignItems: "center", gap: 5 }}>
            Tolerance
            <input type="range" min={0} max={150} value={tolerance} onChange={(e) => setTolerance(Number(e.target.value))} style={{ width: 70 }} />
            <span style={{ fontSize: 11, color: "#555", minWidth: 22, fontFamily: "monospace" }}>{tolerance}</span>
          </label>
        )}
        {originalSrc && !bgPickMode && (
          <>
            <button
              onClick={() => { setImageSrc(originalSrc); setOriginalSrc(null); }}
              style={{ background: "none", border: "none", color: "#555", fontSize: 12, cursor: "pointer", padding: 0, textDecoration: "underline" }}
            >
              Restore original
            </button>
          </>
        )}
        {mode === "manual" && frames.length > 0 && (
          <>
            <div style={{ width: 1, height: 18, background: "#222" }} />
            <button onClick={() => { setFrames([]); setSelectedId(null); }} style={{ background: "none", border: "none", color: "#444", fontSize: 12, cursor: "pointer", padding: 0 }}>
              Clear frames
            </button>
          </>
        )}
      </div>

      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
        {/* Image canvas */}
        <div style={{ flex: "1 1 400px", minWidth: 0 }}>
          <div style={{ overflow: "auto", border: "1px solid #1a1a1a", borderRadius: 8, maxHeight: "65vh", backgroundImage: "linear-gradient(45deg,#141414 25%,transparent 25%,transparent 75%,#141414 75%),linear-gradient(45deg,#141414 25%,transparent 25%,transparent 75%,#141414 75%)", backgroundSize: "16px 16px", backgroundPosition: "0 0,8px 8px", backgroundColor: "#1a1a1a" }}>
            <div
              style={{ position: "relative", display: "inline-block", cursor: bgPickMode ? "crosshair" : "crosshair", width: naturalW * zoom, height: naturalH * zoom }}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={() => { setHover(null); setDrawStart(null); setDrawCurrent(null); }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                src={imageSrc}
                alt="sprite sheet"
                draggable={false}
                style={{ display: "block", width: naturalW * zoom, height: naturalH * zoom, imageRendering: zoom >= 2 ? "pixelated" : "auto", userSelect: "none" }}
              />
              {gridOverlay}
              {manualOverlay}
              {crosshair}
              {stampGhost}
            </div>
          </div>
          <div style={{ marginTop: 6, fontSize: 11, color: bgPickMode ? "#fca5a5" : "#3a3a3a", fontFamily: "monospace", minHeight: 16 }}>
            {bgPickMode
              ? `Click the background color to remove it · tolerance ${tolerance}`
              : hover
              ? isDragging && drawStart
                ? `x: ${Math.min(hover.x, drawStart.x)}  y: ${Math.min(hover.y, drawStart.y)}  →  w: ${Math.abs(hover.x - drawStart.x)}  h: ${Math.abs(hover.y - drawStart.y)}`
                : `x: ${hover.x}  y: ${hover.y}`
              : mode === "manual" && stampMode && stampSize
              ? `↓ Click to stamp ${stampSize.w}×${stampSize.h} · drag to draw new size`
              : mode === "manual"
              ? "Drag to draw first frame"
              : "Hover to inspect · coordinates snap to image pixels"}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ flex: "0 0 240px", display: "flex", flexDirection: "column", gap: 10 }}>
          {frames.length > 0 && (
            <div style={{ background: "#0f0f0f", border: "1px solid #1a1a1a", borderRadius: 8, padding: 10, maxHeight: 380, overflow: "auto" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#444", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                {frames.length} frames
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {frames.map((f) => (
                  <div
                    key={f.id}
                    onClick={() => setSelectedId((p) => (p === f.id ? null : f.id))}
                    style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 7px", borderRadius: 5, cursor: "pointer", background: selectedId === f.id ? "#1a1a2e" : "transparent", border: selectedId === f.id ? "1px solid #312e81" : "1px solid transparent" }}
                  >
                    <div style={thumbStyle(imageSrc, f, naturalW, naturalH, 24)} />
                    {renamingId === f.id ? (
                      <input
                        autoFocus
                        value={renameVal}
                        onChange={(e) => setRenameVal(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setRenamingId(null); }}
                        onClick={(e) => e.stopPropagation()}
                        style={{ flex: 1, background: "#1a1a1a", border: "1px solid #312e81", borderRadius: 4, color: "#d4d4d4", fontSize: 11, padding: "2px 5px", fontFamily: "monospace", outline: "none" }}
                      />
                    ) : (
                      <>
                        <span onDoubleClick={(e) => { e.stopPropagation(); setRenamingId(f.id); setRenameVal(f.name); }} style={{ flex: 1, fontSize: 11, color: "#aaa", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {f.name}
                        </span>
                        <span style={{ fontSize: 10, color: "#3a3a3a", fontFamily: "monospace", whiteSpace: "nowrap" }}>
                          {f.x},{f.y}
                        </span>
                        {mode === "manual" && (
                          <button onClick={(e) => { e.stopPropagation(); deleteFrame(f.id); }} style={{ background: "none", border: "none", color: "#3a3a3a", cursor: "pointer", fontSize: 13, padding: "0 1px", lineHeight: 1 }}>×</button>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedId !== null && (() => {
            const f = frames.find((fr) => fr.id === selectedId);
            if (!f) return null;
            const scale = Math.max(1, Math.min(4, Math.floor(120 / Math.max(f.w, f.h, 1))));
            return (
              <div style={{ background: "#0f0f0f", border: "1px solid #1a1a1a", borderRadius: 8, padding: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#444", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Frame detail</div>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{
                    width: f.w * scale, height: f.h * scale,
                    backgroundImage: `url(${imageSrc})`,
                    backgroundPosition: `-${f.x * scale}px -${f.y * scale}px`,
                    backgroundSize: `${naturalW * scale}px ${naturalH * scale}px`,
                    backgroundRepeat: "no-repeat",
                    imageRendering: "pixelated",
                    border: "1px solid #252525",
                    borderRadius: 4,
                    flexShrink: 0,
                  }} />
                  <div style={{ fontSize: 11, fontFamily: "monospace", lineHeight: 2 }}>
                    {[["x", f.x], ["y", f.y], ["w", f.w], ["h", f.h]].map(([k, v]) => (
                      <div key={k}><span style={{ color: "#444" }}>{k}: </span><span style={{ color: "#888" }}>{v}</span></div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {frames.length > 0 && (
            <button
              onClick={onContinue}
              style={{ background: "#4f46e5", border: "none", color: "#fff", fontSize: 13, padding: "8px 0", borderRadius: 7, cursor: "pointer", fontWeight: 500, width: "100%" }}
            >
              Animate {frames.length} frames →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
