"use client";

import { useRef, useState, useCallback } from "react";

interface Pin {
  id: number;
  x: number; // image-space px
  y: number;
  label: string;
}

export default function SpriteMapInspector() {
  const [src, setSrc] = useState<string | null>(null);
  const [naturalW, setNaturalW] = useState(0);
  const [naturalH, setNaturalH] = useState(0);
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  const [pins, setPins] = useState<Pin[]>([]);
  const [nextId, setNextId] = useState(1);
  const [zoom, setZoom] = useState(1);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── File upload ───────────────────────────────────────────────────────────
  const onFile = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    setPins([]);
    const img = new Image();
    img.onload = () => {
      setNaturalW(img.naturalWidth);
      setNaturalH(img.naturalHeight);
    };
    img.src = url;
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) onFile(file);
  };

  // ── Coordinate helpers ────────────────────────────────────────────────────
  // Convert a mouse event on the <img> to image-space pixel coordinates.
  function toImageCoords(e: React.MouseEvent): { x: number; y: number } {
    const rect = imgRef.current!.getBoundingClientRect();
    const rx = (e.clientX - rect.left) / rect.width;
    const ry = (e.clientY - rect.top) / rect.height;
    return {
      x: Math.round(rx * naturalW),
      y: Math.round(ry * naturalH),
    };
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (!imgRef.current) return;
    setHover(toImageCoords(e));
  };

  const onMouseLeave = () => setHover(null);

  const onImageClick = (e: React.MouseEvent) => {
    if (!imgRef.current) return;
    const { x, y } = toImageCoords(e);
    const label = `${x}, ${y}`;
    setPins((prev) => [...prev, { id: nextId, x, y, label }]);
    setNextId((n) => n + 1);
  };

  const removePin = (id: number) => setPins((prev) => prev.filter((p) => p.id !== id));

  const copyCoords = (x: number, y: number) => {
    navigator.clipboard.writeText(`{ x: ${x}, y: ${y} }`);
  };

  // ── Pin overlay position (% of displayed image) ───────────────────────────
  const pinStyle = (p: Pin) => ({
    left: `${(p.x / naturalW) * 100}%`,
    top: `${(p.y / naturalH) * 100}%`,
  });

  return (
    <div style={{ minHeight: "100vh", background: "#111", color: "#e0e0e0", fontFamily: "system-ui, sans-serif", padding: 24 }}>
      <h1 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 600, color: "#fff" }}>
        Sprite Map Inspector
      </h1>

      {/* ── Upload area ─────────────────────────────────────────────────────── */}
      {!src && (
        <label
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            width: "100%",
            maxWidth: 480,
            height: 200,
            border: "2px dashed #444",
            borderRadius: 10,
            cursor: "pointer",
            color: "#666",
            fontSize: 14,
          }}
        >
          <span style={{ fontSize: 32 }}>🖼</span>
          <span>Click to upload or drag &amp; drop an image</span>
          <input
            type="file"
            accept="image/*"
            onChange={onInputChange}
            style={{ display: "none" }}
          />
        </label>
      )}

      {src && (
        <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
          {/* ── Image + overlays ──────────────────────────────────────────── */}
          <div style={{ flex: "1 1 400px" }}>
            {/* Toolbar */}
            <div style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#888" }}>
                {naturalW} × {naturalH} px
              </span>
              <span style={{ color: "#444" }}>·</span>
              <label style={{ fontSize: 12, color: "#888", display: "flex", alignItems: "center", gap: 6 }}>
                Zoom
                <input
                  type="range"
                  min={0.25}
                  max={4}
                  step={0.25}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  style={{ width: 100 }}
                />
                <span style={{ minWidth: 32 }}>{zoom}×</span>
              </label>
              <span style={{ color: "#444" }}>·</span>
              <label style={{ fontSize: 12, color: "#aaa", cursor: "pointer" }}>
                Change image
                <input type="file" accept="image/*" onChange={onInputChange} style={{ display: "none" }} />
              </label>
              {pins.length > 0 && (
                <>
                  <span style={{ color: "#444" }}>·</span>
                  <button
                    onClick={() => setPins([])}
                    style={{ fontSize: 12, color: "#888", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    Clear pins
                  </button>
                </>
              )}
            </div>

            {/* Canvas */}
            <div ref={containerRef} style={{ overflow: "auto", maxHeight: "75vh", border: "1px solid #2a2a2a", borderRadius: 6, background: "#1a1a1a" }}>
              <div
                style={{
                  position: "relative",
                  display: "inline-block",
                  cursor: "crosshair",
                  width: naturalW * zoom,
                  height: naturalH * zoom,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imgRef}
                  src={src}
                  alt="sprite sheet"
                  onMouseMove={onMouseMove}
                  onMouseLeave={onMouseLeave}
                  onClick={onImageClick}
                  style={{
                    display: "block",
                    width: naturalW * zoom,
                    height: naturalH * zoom,
                    imageRendering: zoom >= 2 ? "pixelated" : "auto",
                    userSelect: "none",
                  }}
                  draggable={false}
                />

                {/* Crosshair on hover */}
                {hover && (
                  <>
                    <div style={{
                      position: "absolute",
                      left: `${(hover.x / naturalW) * 100}%`,
                      top: 0,
                      width: 1,
                      height: "100%",
                      background: "rgba(255,100,100,0.5)",
                      pointerEvents: "none",
                    }} />
                    <div style={{
                      position: "absolute",
                      top: `${(hover.y / naturalH) * 100}%`,
                      left: 0,
                      height: 1,
                      width: "100%",
                      background: "rgba(255,100,100,0.5)",
                      pointerEvents: "none",
                    }} />
                  </>
                )}

                {/* Pins */}
                {pins.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      position: "absolute",
                      ...pinStyle(p),
                      transform: "translate(-50%, -50%)",
                      pointerEvents: "none",
                    }}
                  >
                    {/* Dot */}
                    <div style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#60a5fa",
                      border: "2px solid #fff",
                      boxShadow: "0 0 0 1px #000",
                      position: "absolute",
                      transform: "translate(-50%, -50%)",
                    }} />
                    {/* Label */}
                    <div style={{
                      position: "absolute",
                      left: 8,
                      top: -10,
                      background: "rgba(0,0,0,0.75)",
                      color: "#60a5fa",
                      fontSize: 11,
                      padding: "1px 5px",
                      borderRadius: 3,
                      whiteSpace: "nowrap",
                      fontFamily: "monospace",
                    }}>
                      {p.x}, {p.y}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hover coords */}
            <div style={{ marginTop: 8, fontSize: 12, color: "#555", fontFamily: "monospace", minHeight: 18 }}>
              {hover ? `x: ${hover.x}  y: ${hover.y}` : "Hover over the image to see coordinates · Click to pin"}
            </div>
          </div>

          {/* ── Pin list ─────────────────────────────────────────────────────── */}
          {pins.length > 0 && (
            <div style={{ flex: "0 0 220px", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 6, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#888", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>
                Pinned coords
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {pins.map((p) => (
                  <div
                    key={p.id}
                    style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontFamily: "monospace" }}
                  >
                    <span style={{ color: "#60a5fa", flex: 1 }}>
                      {p.x}, {p.y}
                    </span>
                    <button
                      onClick={() => copyCoords(p.x, p.y)}
                      title="Copy"
                      style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 12, padding: "2px 4px" }}
                    >
                      copy
                    </button>
                    <button
                      onClick={() => removePin(p.id)}
                      title="Remove"
                      style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 12, padding: "2px 4px" }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  const text = pins.map((p) => `{ x: ${p.x}, y: ${p.y} }`).join("\n");
                  navigator.clipboard.writeText(text);
                }}
                style={{
                  marginTop: 12,
                  width: "100%",
                  padding: "6px 0",
                  background: "#272727",
                  border: "1px solid #333",
                  borderRadius: 5,
                  color: "#aaa",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Copy all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
