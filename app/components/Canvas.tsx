"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

type Path = { id: string; d: string };
type Img = {
  id: string;
  src: string;
  x: number;
  y: number;
  w: number;
  h: number;
};
type HandleId = "tl" | "tr" | "bl" | "br";
type Mode = "draw" | "erase" | "select" | "hand";
type Action =
  | { kind: "idle" }
  | { kind: "pan"; ox: number; oy: number; otx: number; oty: number }
  | { kind: "draw" }
  | { kind: "erase" }
  | {
      kind: "move";
      id: string;
      owx: number;
      owy: number;
      oix: number;
      oiy: number;
    }
  | {
      kind: "resize";
      id: string;
      handle: HandleId;
      owx: number;
      owy: number;
      orig: Img;
    };

// ── Theme ─────────────────────────────────────────────────────────────────────
const THEME = {
  canvas: { bg: "#141414", dot: "#222" },
  surface: "#1a1a1a",
  border: "#272727",
  accent: "#60a5fa",
  selection: "#3b82f6",
  activeBtn: "#1d2d45",
  stroke: "#e8e8e8",
  text: {
    primary: "#f0f0f0",
    secondary: "#888",
    muted: "#666",
    subtle: "#555",
    faint: "#575757",
    dim: "#4a4a4a",
    section: "#383838",
    divider: "#252525",
  },
} as const;

const HANDLE_CURSOR: Record<HandleId, string> = {
  tl: "nwse-resize",
  tr: "nesw-resize",
  bl: "nesw-resize",
  br: "nwse-resize",
};
const ERASER_CURSOR = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='22' height='22'%3E%3Ccircle cx='11' cy='11' r='8' fill='rgba(255%2C255%2C255%2C0.1)' stroke='%23aaa' stroke-width='1.5'/%3E%3C%2Fsvg%3E") 11 11, cell`;
const MODE_CURSOR: Record<Mode, string> = {
  draw: "crosshair",
  erase: ERASER_CURSOR,
  hand: "grab",
  select: "default",
};
const LS_PATHS = "indika-canvas-paths-v2";
const LS_IMAGES = "indika-canvas-images";
const MAX_HISTORY = 50;

// ── LocalStorage helpers ──────────────────────────────────────────────────────
function loadLS<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}
function saveLS(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

// ── Felt-tip marker stroke ────────────────────────────────────────────────────
const MARKER_WIDTH = 6; // world-space diameter

function chaikin(pts: [number, number][]): [number, number][] {
  if (pts.length < 3) return pts;
  const out: [number, number][] = [pts[0]];
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
    out.push([x0 * 0.75 + x1 * 0.25, y0 * 0.75 + y1 * 0.25]);
    out.push([x0 * 0.25 + x1 * 0.75, y0 * 0.25 + y1 * 0.75]);
  }
  out.push(pts[pts.length - 1]);
  return out;
}

function markerPath(raw: [number, number][]): string {
  if (raw.length === 0) return "";
  const hw = MARKER_WIDTH / 2;

  if (raw.length === 1) {
    const [x, y] = raw[0];
    return `M${(x - hw).toFixed(1)},${y.toFixed(1)} a${hw},${hw} 0 1,0 ${MARKER_WIDTH},0 a${hw},${hw} 0 1,0 -${MARKER_WIDTH},0 Z`;
  }

  const pts = chaikin(chaikin(raw));

  const dists: number[] = [0];
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i][0] - pts[i - 1][0], dy = pts[i][1] - pts[i - 1][1];
    dists.push(dists[i - 1] + Math.sqrt(dx * dx + dy * dy));
  }
  const total = dists[dists.length - 1];
  if (total < 0.1) {
    const [x, y] = pts[0];
    return `M${(x - hw).toFixed(1)},${y.toFixed(1)} a${hw},${hw} 0 1,0 ${MARKER_WIDTH},0 a${hw},${hw} 0 1,0 -${MARKER_WIDTH},0 Z`;
  }

  const taperLen = Math.min(total * 0.12, 14);
  const left: [number, number][] = [];
  const right: [number, number][] = [];

  for (let i = 0; i < pts.length; i++) {
    const d = dists[i];
    const t = Math.min(d / taperLen, (total - d) / taperLen, 1);
    const w = hw * t;
    const prev = pts[Math.max(0, i - 1)], next = pts[Math.min(pts.length - 1, i + 1)];
    const dx = next[0] - prev[0], dy = next[1] - prev[1];
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = -dy / len, ny = dx / len;
    left.push([pts[i][0] + nx * w, pts[i][1] + ny * w]);
    right.push([pts[i][0] - nx * w, pts[i][1] - ny * w]);
  }

  const f = ([x, y]: [number, number]) => `${x.toFixed(1)},${y.toFixed(1)}`;
  const outline = [...left, ...right.reverse()];
  return `M${f(outline[0])} ` + outline.slice(1).map(p => `L${f(p)}`).join(" ") + " Z";
}

// ── Mobile-aware initial view ─────────────────────────────────────────────────
function getInitialView(): { x: number; y: number; s: number } {
  if (typeof window === "undefined") return { x: 60, y: 60, s: 1 };
  const vw = window.innerWidth;
  if (vw >= 640) return { x: 60, y: 60, s: 1 };
  const CONTENT_W = 540;
  const PAD = 20;
  const s = (vw - PAD * 2) / CONTENT_W;
  return { x: PAD, y: 72, s };
}

// ── Default portfolio content ─────────────────────────────────────────────────
const PROJECTS: { name: string; desc: string; href?: string }[] = [
  { name: "Wijelaw", desc: "Law firm website" },
  { name: "Dr. Kemi", desc: "Medical practice website" },
  { name: "Athena", desc: "Study App" },
  { name: "Flashcards", desc: "Study anything. Scroll endlessly.", href: "/flashcards" },
  { name: "Duck Duck Goose", desc: "Ranked Duck Duck Goose.", href: "/duck-duck-goose" },
];

function DefaultContent() {
  const font = "'system-ui','-apple-system',sans-serif";

  const stopProp = (e: React.PointerEvent) => e.stopPropagation();

  return (
    <g fontFamily={font}>
      {/* Name & role */}
      <text
        x={0}
        y={48}
        fontSize={46}
        fontWeight={700}
        fill={THEME.text.primary}
        letterSpacing={-1}
        pointerEvents="none"
      >
        Indika Wijesundera
      </text>
      <text
        x={2}
        y={76}
        fontSize={15}
        fill={THEME.text.subtle}
        letterSpacing={0.3}
        pointerEvents="none"
      >
        Software Engineer · Builder · Toronto, ON
      </text>

      <line
        x1={0}
        y1={100}
        x2={540}
        y2={100}
        stroke={THEME.text.divider}
        strokeWidth={1}
        pointerEvents="none"
      />

      {/* Bio */}
      <text x={0} y={132} fontSize={14} fill={THEME.text.secondary} pointerEvents="none">
        I ship full-stack products from zero to one — fast.
      </text>
      <text x={0} y={154} fontSize={14} fill={THEME.text.muted} pointerEvents="none">
        More experience talking to Artificial Intelligences than Human
        Intelligences.
      </text>

      {/* Selected work */}
      <text
        x={0}
        y={204}
        fontSize={11}
        fill={THEME.text.section}
        fontWeight={600}
        letterSpacing={2}
        pointerEvents="none"
      >
        SELECTED WORK
      </text>
      {PROJECTS.map(({ name, desc, href }, i) => {
        const y = 232 + i * 30;
        if (href) {
          return (
            <foreignObject
              key={name}
              x={0}
              y={y - 13}
              width={540}
              height={20}
              onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
            >
              <Link
                href={href}
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  fontSize: 14,
                  fontFamily: font,
                  textDecoration: "none",
                  lineHeight: "20px",
                  cursor: "pointer",
                }}
              >
                <span style={{ color: THEME.accent, fontWeight: 600 }}>{name}</span>
                <span style={{ color: THEME.text.dim }}>{"  ·  "}{desc}</span>
              </Link>
            </foreignObject>
          );
        }
        return (
          <text key={name} x={0} y={y} fontSize={14} pointerEvents="none">
            <tspan fill={THEME.accent} fontWeight={600}>{name}</tspan>
            <tspan fill={THEME.text.dim}>{"  ·  "}{desc}</tspan>
          </text>
        );
      })}

      <line
        x1={0}
        y1={420}
        x2={540}
        y2={420}
        stroke={THEME.text.divider}
        strokeWidth={1}
        pointerEvents="none"
      />

      {/* Contact — links are interactive */}
      <text
        x={0}
        y={450}
        fontSize={11}
        fill={THEME.text.section}
        fontWeight={600}
        letterSpacing={2}
        pointerEvents="none"
      >
        CONTACT
      </text>
      <text
        x={0}
        y={478}
        fontSize={14}
        fill={THEME.accent}
        pointerEvents="all"
        style={{ cursor: "pointer" }}
        onPointerDown={stopProp}
        onClick={() =>
          window.open("https://github.com/IndiW", "_blank", "noopener")
        }
      >
        github.com/IndiW ↗
      </text>
      <text
        x={0}
        y={502}
        fontSize={14}
        fill={THEME.accent}
        pointerEvents="all"
        style={{ cursor: "pointer" }}
        onPointerDown={stopProp}
        onClick={() => window.open("https://www.linkedin.com/in/indika-wijesundera/")}
      >
        linkedin.com/in/indika-wijesundera ↗
      </text>
    </g>
  );
}

// ─── Main canvas ──────────────────────────────────────────────────────────────
export default function Canvas() {
  const svgRef = useRef<SVGSVGElement>(null);

  const [paths, setPaths] = useState<Path[]>(() => loadLS(LS_PATHS, []));
  const [images, setImages] = useState<Img[]>(() => loadLS(LS_IMAGES, []));
  const [livePath, setLivePath] = useState("");
  const [view, setView] = useState(getInitialView);
  const [mode, setMode] = useState<Mode>("draw");
  const [sel, setSel] = useState<string | null>(null);

  const vRef = useRef(getInitialView());
  const action = useRef<Action>({ kind: "idle" });
  const modeRef = useRef<Mode>("draw");
  const selRef = useRef<string | null>(null);
  const pathsRef = useRef<Path[]>([]);
  const imgsRef = useRef<Img[]>([]);
  const liveRef = useRef("");
  const livePointsRef = useRef<[number, number][]>([]);
  const prevModeRef = useRef<Mode | null>(null); // mode before spacebar
  const imgSaveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const historyRef = useRef<Array<{ paths: Path[]; images: Img[] }>>([]);
  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStateRef = useRef<{ dist: number; cx: number; cy: number } | null>(null);

  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { selRef.current = sel; }, [sel]);
  useEffect(() => { pathsRef.current = paths; }, [paths]);
  useEffect(() => { imgsRef.current = images; }, [images]);

  // ── Undo history ──────────────────────────────────────────────────────────
  const pushHistory = useCallback(() => {
    historyRef.current.push({
      paths: pathsRef.current,
      images: imgsRef.current,
    });
    if (historyRef.current.length > MAX_HISTORY) historyRef.current.shift();
  }, []);

  const undo = useCallback(() => {
    const prev = historyRef.current.pop();
    if (prev) {
      setPaths(prev.paths);
      setImages(prev.images);
    }
  }, []);

  // ── Cursor management (direct DOM to avoid React overriding during drag) ───
  const setCursor = (c: string) => {
    if (svgRef.current) svgRef.current.style.cursor = c;
  };
  useEffect(() => {
    setCursor(MODE_CURSOR[mode]);
  }, [mode]);

  // ── Persist paths immediately on change ───────────────────────────────────
  useEffect(() => {
    saveLS(LS_PATHS, paths);
  }, [paths]);

  // ── Persist images debounced (drag-resize fires many updates) ────────────
  useEffect(() => {
    if (imgSaveTimer) {
      clearTimeout(imgSaveTimer.current);
      imgSaveTimer.current = setTimeout(() => saveLS(LS_IMAGES, images), 600);
    }
  }, [images]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      // Spacebar → temp hand tool
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        if (modeRef.current !== "hand") {
          prevModeRef.current = modeRef.current;
          setMode("hand");
        }
      }
      // Undo
      if ((e.metaKey || e.ctrlKey) && e.code === "KeyZ") {
        e.preventDefault();
        undo();
        return;
      }
      if (e.metaKey || e.ctrlKey) return;
      if (e.code === "Delete" || e.code === "Backspace") {
        const id = selRef.current;
        if (id) {
          pushHistory();
          setImages((prev) => prev.filter((i) => i.id !== id));
          setSel(null);
          selRef.current = null;
        }
        return;
      }
      if (e.code === "KeyD") setMode("draw");
      if (e.code === "KeyE") setMode("erase");
      if (e.code === "KeyH") setMode("hand");
      if (e.code === "KeyS") setMode("select");
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space" && prevModeRef.current !== null) {
        e.preventDefault();
        setMode(prevModeRef.current);
        prevModeRef.current = null;
      }
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [undo]);

  const flush = () => setView({ ...vRef.current });
  const toWorld = (sx: number, sy: number) => ({
    x: (sx - vRef.current.x) / vRef.current.s,
    y: (sy - vRef.current.y) / vRef.current.s,
  });

  const eraseAt = (cx: number, cy: number) => {
    const pathId = document
      .elementsFromPoint(cx, cy)
      .find((el) => el.hasAttribute("data-path-id"))
      ?.getAttribute("data-path-id");
    if (pathId) setPaths((prev) => prev.filter((p) => p.id !== pathId));
  };

  const startPan = (e: React.PointerEvent) => {
    action.current = {
      kind: "pan",
      ox: e.clientX,
      oy: e.clientY,
      otx: vRef.current.x,
      oty: vRef.current.y,
    };
    setCursor("grabbing");
    svgRef.current!.setPointerCapture(e.pointerId);
  };

  // ── Wheel ─────────────────────────────────────────────────────────────────
  const onWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const v = vRef.current;
    if (e.ctrlKey || e.metaKey) {
      const factor = e.deltaY < 0 ? 1.06 : 1 / 1.06;
      const ns = Math.max(0.05, Math.min(20, v.s * factor));
      const r = ns / v.s;
      vRef.current = {
        x: e.clientX - r * (e.clientX - v.x),
        y: e.clientY - r * (e.clientY - v.y),
        s: ns,
      };
    } else {
      vRef.current = { ...v, x: v.x - e.deltaX, y: v.y - e.deltaY };
    }
    flush();
  };

  // ── SVG pointer down ───────────────────────────────────────────────────────
  const onSvgPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Two or more fingers: start/reinitialize pinch-to-zoom
    if (activePointersRef.current.size >= 2) {
      liveRef.current = "";
      setLivePath("");
      action.current = { kind: "idle" };
      const pts = Array.from(activePointersRef.current.values()).slice(0, 2);
      const cx = (pts[0].x + pts[1].x) / 2;
      const cy = (pts[0].y + pts[1].y) / 2;
      pinchStateRef.current = {
        dist: Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y),
        cx,
        cy,
      };
      return;
    }

    if (
      e.button === 1 ||
      (e.button === 0 && e.altKey) ||
      (e.button === 0 && modeRef.current === "hand")
    ) {
      e.preventDefault();
      startPan(e);
      return;
    }
    if (e.button !== 0) return;

    if (modeRef.current === "draw") {
      const w = toWorld(e.clientX, e.clientY);
      livePointsRef.current = [[w.x, w.y]];
      liveRef.current = "";
      setLivePath("");
      action.current = { kind: "draw" };
      svgRef.current!.setPointerCapture(e.pointerId);
    } else if (modeRef.current === "erase") {
      pushHistory();
      eraseAt(e.clientX, e.clientY);
      action.current = { kind: "erase" };
      svgRef.current!.setPointerCapture(e.pointerId);
    } else if (modeRef.current === "select") {
      setSel(null);
      selRef.current = null;
    }
  };

  // ── SVG pointer move ───────────────────────────────────────────────────────
  const onSvgPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Pinch-to-zoom: handle when two or more fingers are active
    if (activePointersRef.current.size >= 2 && pinchStateRef.current) {
      const pts = Array.from(activePointersRef.current.values()).slice(0, 2);
      const newDist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      const newCx = (pts[0].x + pts[1].x) / 2;
      const newCy = (pts[0].y + pts[1].y) / 2;
      const factor = newDist / pinchStateRef.current.dist;
      const v = vRef.current;
      const ns = Math.max(0.05, Math.min(20, v.s * factor));
      const r = ns / v.s;
      vRef.current = {
        x: newCx - r * (pinchStateRef.current.cx - v.x),
        y: newCy - r * (pinchStateRef.current.cy - v.y),
        s: ns,
      };
      pinchStateRef.current = { dist: newDist, cx: newCx, cy: newCy };
      flush();
      return;
    }

    const a = action.current;
    if (a.kind === "pan") {
      vRef.current = {
        ...vRef.current,
        x: a.otx + (e.clientX - a.ox),
        y: a.oty + (e.clientY - a.oy),
      };
      flush();
    } else if (a.kind === "draw") {
      const w = toWorld(e.clientX, e.clientY);
      const last = livePointsRef.current[livePointsRef.current.length - 1];
      const dx = w.x - last[0], dy = w.y - last[1];
      if (dx * dx + dy * dy > 1) {
        livePointsRef.current.push([w.x, w.y]);
        liveRef.current = markerPath(livePointsRef.current);
        setLivePath(liveRef.current);
      }
    } else if (a.kind === "erase") {
      eraseAt(e.clientX, e.clientY);
    } else if (a.kind === "move") {
      const w = toWorld(e.clientX, e.clientY);
      setImages((prev) =>
        prev.map((img) =>
          img.id === a.id
            ? { ...img, x: a.oix + (w.x - a.owx), y: a.oiy + (w.y - a.owy) }
            : img,
        ),
      );
    } else if (a.kind === "resize") {
      const w = toWorld(e.clientX, e.clientY);
      const o = a.orig;
      const ar = o.w / o.h;
      const min = 40 / vRef.current.s;
      const dx = w.x - a.owx;
      setImages((prev) =>
        prev.map((img) => {
          if (img.id !== a.id) return img;
          let nw = a.handle === "br" || a.handle === "tr" ? o.w + dx : o.w - dx;
          nw = Math.max(min, nw);
          const nh = nw / ar;
          const nx =
            a.handle === "bl" || a.handle === "tl" ? o.x + o.w - nw : o.x;
          const ny =
            a.handle === "tr" || a.handle === "tl" ? o.y + o.h - nh : o.y;
          return { ...img, x: nx, y: ny, w: nw, h: nh };
        }),
      );
    }
  };

  // ── SVG pointer up ─────────────────────────────────────────────────────────
  const onSvgPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    activePointersRef.current.delete(e.pointerId);
    if (activePointersRef.current.size < 2) pinchStateRef.current = null;

    if (action.current.kind === "draw") {
      const d = markerPath(livePointsRef.current);
      livePointsRef.current = [];
      liveRef.current = "";
      setLivePath("");
      if (d) {
        pushHistory();
        setPaths((prev) => [...prev, { id: crypto.randomUUID(), d }]);
      }
    }
    if (action.current.kind === "pan") setCursor(MODE_CURSOR[modeRef.current]);
    action.current = { kind: "idle" };
  };

  // ── Image & handle pointer events ─────────────────────────────────────────
  const onImagePointerDown = (
    e: React.PointerEvent<SVGForeignObjectElement>,
    id: string,
  ) => {
    if (modeRef.current !== "select") return;
    e.stopPropagation();
    setSel(id);
    selRef.current = id;
    const img = imgsRef.current.find((i) => i.id === id)!;
    const w = toWorld(e.clientX, e.clientY);
    pushHistory();
    action.current = {
      kind: "move",
      id,
      owx: w.x,
      owy: w.y,
      oix: img.x,
      oiy: img.y,
    };
    svgRef.current!.setPointerCapture(e.pointerId);
  };

  const onHandlePointerDown = (
    e: React.PointerEvent<SVGRectElement>,
    handle: HandleId,
  ) => {
    e.stopPropagation();
    const id = selRef.current!;
    const img = imgsRef.current.find((i) => i.id === id)!;
    const w = toWorld(e.clientX, e.clientY);
    pushHistory();
    action.current = {
      kind: "resize",
      id,
      handle,
      owx: w.x,
      owy: w.y,
      orig: { ...img },
    };
    svgRef.current!.setPointerCapture(e.pointerId);
  };

  // ── Shared image placement: FileReader → data URL → canvas ──────────────
  const placeImageBlob = useCallback((blob: Blob, dropX?: number, dropY?: number) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const el = new Image();
      el.onload = () => {
        const v = vRef.current;
        const maxW = 500 / v.s;
        const sc = Math.min(1, maxW / el.naturalWidth);
        const w = el.naturalWidth * sc;
        const h = el.naturalHeight * sc;
        const cx = dropX !== undefined ? (dropX - v.x) / v.s : (window.innerWidth / 2 - v.x) / v.s;
        const cy = dropY !== undefined ? (dropY - v.y) / v.s : (window.innerHeight / 2 - v.y) / v.s;
        pushHistory();
        setImages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), src: dataUrl, x: cx - w / 2, y: cy - h / 2, w, h },
        ]);
      };
      el.src = dataUrl;
    };
    reader.readAsDataURL(blob);
  }, [pushHistory]);

  // ── Paste ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items ?? []).find((i) =>
        i.type.startsWith("image/"),
      );
      if (!item) return;
      const blob = item.getAsFile();
      if (blob) placeImageBlob(blob);
    };
    window.addEventListener("paste", handler);
    return () => window.removeEventListener("paste", handler);
  }, [placeImageBlob]);

  // ── Drag and drop ─────────────────────────────────────────────────────────
  useEffect(() => {
    const onDragOver = (e: DragEvent) => e.preventDefault();
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      const file = Array.from(e.dataTransfer?.files ?? []).find((f) =>
        f.type.startsWith("image/"),
      );
      if (file) placeImageBlob(file, e.clientX, e.clientY);
    };
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("drop", onDrop);
    };
  }, [placeImageBlob]);

  // ── Render ────────────────────────────────────────────────────────────────
  const selImg =
    mode === "select" ? images.find((i) => i.id === sel) : undefined;
  const toScreen = (wx: number, wy: number) => ({
    x: wx * view.s + view.x,
    y: wy * view.s + view.y,
  });
  const H = 8;
  const ds = 20 * view.s;
  const dox = ((view.x % ds) + ds) % ds;
  const doy = ((view.y % ds) + ds) % ds;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: THEME.canvas.bg,
        userSelect: "none",
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          position: "absolute",
          top: 16,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 4,
          background: THEME.surface,
          borderRadius: 10,
          padding: "6px 8px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.6)",
          zIndex: 10,
          alignItems: "center",
          border: `1px solid ${THEME.border}`,
        }}
      >
        <Btn
          active={mode === "draw"}
          onClick={() => setMode("draw")}
          title="Draw (D)"
        >
          <PencilIcon />
        </Btn>
        <Btn
          active={mode === "erase"}
          onClick={() => setMode("erase")}
          title="Eraser (E)"
        >
          <EraserIcon />
        </Btn>
        <Btn
          active={mode === "hand"}
          onClick={() => setMode("hand")}
          title="Hand — hold Space (H)"
        >
          <HandIcon />
        </Btn>
        <Btn
          active={mode === "select"}
          onClick={() => setMode("select")}
          title="Select images (S)"
        >
          <SelectIcon />
        </Btn>
        <div
          style={{
            width: 1,
            height: 24,
            background: THEME.border,
            margin: "0 4px",
          }}
        />
        <Btn active={false} onClick={undo} title="Undo (Ctrl+Z)">
          <UndoIcon />
        </Btn>
        <Btn
          active={false}
          onClick={() => {
            if (sel) {
              pushHistory();
              setImages((prev) => prev.filter((i) => i.id !== sel));
              setSel(null);
            } else {
              setPaths([]);
              setImages([]);
            }
          }}
          title={sel ? "Delete selected image" : "Clear all drawings"}
        >
          <TrashIcon />
        </Btn>
      </div>

      {/* Hint */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: 11,
          color: THEME.text.faint,
          pointerEvents: "none",
          whiteSpace: "nowrap",
        }}
      >
        D · E · H · S to switch tools &nbsp;·&nbsp; Hold Space to pan
        &nbsp;·&nbsp; Scroll to pan &nbsp;·&nbsp; Pinch or Ctrl+scroll to zoom
      </div>

      {/* SVG canvas */}
      <svg
        ref={svgRef}
        style={{
          width: "100%",
          height: "100%",
          touchAction: "none",
          display: "block",
        }}
        onPointerDown={onSvgPointerDown}
        onPointerMove={onSvgPointerMove}
        onPointerUp={onSvgPointerUp}
        onPointerCancel={onSvgPointerUp}
        onWheel={onWheel}
      >
        <defs>
          <pattern
            id="dots"
            x={dox}
            y={doy}
            width={ds}
            height={ds}
            patternUnits="userSpaceOnUse"
          >
            <circle cx={0} cy={0} r={0.8} fill={THEME.canvas.dot} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots)" />

        <g transform={`translate(${view.x} ${view.y}) scale(${view.s})`}>
          <DefaultContent />

          {paths.map((p) => (
            <path
              key={p.id}
              data-path-id={p.id}
              d={p.d}
              fill={THEME.stroke}
              stroke="none"
            />
          ))}
          {livePath && (
            <path
              d={livePath}
              fill={THEME.stroke}
              stroke="none"
            />
          )}
          {images.map((img) => (
            <foreignObject
              key={img.id}
              x={img.x}
              y={img.y}
              width={img.w}
              height={img.h}
              overflow="hidden"
              style={{ cursor: mode === "select" ? "move" : undefined }}
              onPointerDown={
                mode === "select"
                  ? (e) => onImagePointerDown(e, img.id)
                  : undefined
              }
              pointerEvents={mode === "select" ? "all" : "none"}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.src}
                alt=""
                style={{ width: "100%", height: "100%", display: "block", pointerEvents: "none" }}
              />
            </foreignObject>
          ))}
        </g>

        {/* Selection handles — screen space */}
        {selImg &&
          (() => {
            const tl = toScreen(selImg.x, selImg.y);
            const br = toScreen(selImg.x + selImg.w, selImg.y + selImg.h);
            const handles: { id: HandleId; x: number; y: number }[] = [
              { id: "tl", x: tl.x, y: tl.y },
              { id: "tr", x: br.x, y: tl.y },
              { id: "bl", x: tl.x, y: br.y },
              { id: "br", x: br.x, y: br.y },
            ];
            return (
              <g>
                <rect
                  x={tl.x}
                  y={tl.y}
                  width={br.x - tl.x}
                  height={br.y - tl.y}
                  fill="none"
                  stroke={THEME.selection}
                  strokeWidth={1.5}
                  strokeDasharray="5 3"
                  pointerEvents="none"
                />
                {handles.map(({ id, x, y }) => (
                  <rect
                    key={id}
                    x={x - H / 2}
                    y={y - H / 2}
                    width={H}
                    height={H}
                    fill={THEME.surface}
                    stroke={THEME.selection}
                    strokeWidth={1.5}
                    style={{ cursor: HANDLE_CURSOR[id] }}
                    onPointerDown={(e) =>
                      onHandlePointerDown(
                        e as React.PointerEvent<SVGRectElement>,
                        id,
                      )
                    }
                  />
                ))}
              </g>
            );
          })()}
      </svg>
    </div>
  );
}

// ─── Toolbar button ───────────────────────────────────────────────────────────
function Btn({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 36,
        height: 36,
        border: "none",
        borderRadius: 6,
        cursor: "pointer",
        background: active ? THEME.activeBtn : "transparent",
        color: active ? THEME.accent : THEME.text.subtle,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background 0.15s, color 0.15s",
      }}
    >
      {children}
    </button>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const ico = {
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function PencilIcon() {
  return (
    <svg {...ico}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
function EraserIcon() {
  return (
    <svg {...ico}>
      <path d="M20 20H7L3 16l10-10 7 7-1.5 1.5" />
      <path d="M6.5 17.5l4-4" />
    </svg>
  );
}
function HandIcon() {
  return (
    <svg {...ico}>
      <path d="M18 11V6a2 2 0 0 0-4 0v0" />
      <path d="M14 10V4a2 2 0 0 0-4 0v2" />
      <path d="M10 10.5V6a2 2 0 0 0-4 0v8" />
      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
    </svg>
  );
}
function SelectIcon() {
  return (
    <svg {...ico}>
      <path d="M5 3l14 9-7 1-4 7z" />
    </svg>
  );
}
function UndoIcon() {
  return (
    <svg {...ico}>
      <path d="M3 7v6h6" />
      <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg {...ico}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}
