"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  GameEngine,
  GameSnapshot,
  SEAT_RADIUS_RATIO,
} from "../engine/GameEngine";
import { positionOnCircle } from "../engine/CircleLayout";

// ── Sprite sheet layout ───────────────────────────────────────────────────────
//
// Image: 1024×1024 px  |  4 columns × 4 rows  |  each cell: 256×256 px
//
//        x=0 (south)    x=256 (east)    x=512 (north)    x=768 (west)
// y=0    standing_s     standing_e      standing_n        standing_w
// y=256  sitting_s      sitting_e       sitting_n         sitting_w
// y=512  walk1_s        walk1_e         walk1_n           walk1_w
// y=768  walk2_s        walk2_e         walk2_n           walk2_w
//
// ── How to adjust ────────────────────────────────────────────────────────────
// • Wrong sprite for a state?  Change sx/sy in SPRITE below.
// • Duck off-centre in a cell? Change cx/cy in SPRITE for that entry.
// • All ducks too big/small?   Change SCALE.
// • Crop cutting off the duck? Increase CROP_W / CROP_H.

const CELL = 256; // px — cell size on the sprite sheet (width and height)
const SCALE = 1; // render scale: 1 = natural size, 0.5 = half size, etc.

// Crop window drawn around the duck centre. Increase if the duck is clipped.
const CROP_W = 100;
const CROP_H = 120;

// SW / SH aliases — used for game-layout proportions (track width, ring sizes).
// If you change CELL, these follow automatically.
const SW = CELL;
const SH = CELL;

// Glow colour keyed by duck name — follows the duck wherever they sit
const DUCK_COLOR: Record<string, string> = {
  YOU: "rgba(96,165,250,0.85)",
  MOE: "rgba(251,146,60,0.85)",
  ACE: "rgba(167,139,250,0.85)",
  DOT: "rgba(251,191,36,0.85)",
  RAE: "rgba(244,114,182,0.85)",
  REX: "rgba(52,211,153,0.85)",
};

type Direction = "south" | "east" | "north" | "west";
type WalkFrame = "walk1" | "walk2";
type Action = "standing" | "sitting" | WalkFrame;
type SpriteKey = `${Action}_${Direction}`;

// Ordered for the debug panel grid (rows × columns)
const ACTIONS: Action[] = ["standing", "sitting", "walk1", "walk2"];
const DIRECTIONS: Direction[] = ["south", "east", "north", "west"];

// ── SPRITE TABLE ──────────────────────────────────────────────────────────────
// sx, sy  — top-left pixel of the cell on the sprite sheet.
//            Edit these if a sprite is in the wrong grid position.
// cx, cy  — duck body centre within the cell (pixels from top-left of cell).
//            Edit these if the duck renders off-centre on its target point.
const SPRITE: Record<
  SpriteKey,
  { sx: number; sy: number; cx: number; cy: number }
> = {
  // ── Standing ──────────────────────────────────────────────  sx    sy   cx   cy
  standing_south: { sx: 0, sy: 0, cx: 128, cy: 128 },
  standing_east: { sx: 256, sy: 0, cx: 128, cy: 128 },
  standing_north: { sx: 512, sy: 0, cx: 128, cy: 128 },
  standing_west: { sx: 768, sy: 0, cx: 128, cy: 128 },

  // ── Sitting ───────────────────────────────────────────────  sx    sy   cx   cy
  sitting_south: { sx: 110, sy: 0, cx: 100, cy: 100 },
  sitting_east: { sx: 420, sy: 0, cx: 100, cy: 100 },
  sitting_north: { sx: 1120, sy: 0, cx: 100, cy: 100 },
  sitting_west: { sx: 780, sy: 0, cx: 100, cy: 100 },

  // ── Walk frame 1 ──────────────────────────────────────────  sx    sy   cx   cy
  walk1_south: { sx: 110, sy: 220, cx: 100, cy: 100 },
  walk1_east: { sx: 420, sy: 220, cx: 100, cy: 100 },
  walk1_north: { sx: 1120, sy: 220, cx: 100, cy: 100 },
  walk1_west: { sx: 870, sy: 220, cx: 100, cy: 100 },

  // ── Walk frame 2 ──────────────────────────────────────────  sx    sy   cx   cy
  walk2_south: { sx: 210, sy: 220, cx: 100, cy: 100 },
  walk2_east: { sx: 770, sy: 220, cx: 100, cy: 100 },
  walk2_north: { sx: 1230, sy: 220, cx: 100, cy: 100 },
  walk2_west: { sx: 560, sy: 225, cx: 100, cy: 100 },
};

// Remove background + sprite-sheet guide grid lines
function removeBackground(img: HTMLImageElement): HTMLCanvasElement {
  const oc = document.createElement("canvas");
  oc.width = img.width;
  oc.height = img.height;
  const ctx = oc.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, oc.width, oc.height);
  const px = data.data;
  const W = oc.width;

  // Pass 1: background chroma-key (distance < 20 from rgb 235,240,244)
  const [br, bg, bb] = [235, 240, 244];
  for (let i = 0; i < px.length; i += 4) {
    const dr = px[i] - br,
      dg = px[i + 1] - bg,
      db = px[i + 2] - bb;
    if (dr * dr + dg * dg + db * db < 400) px[i + 3] = 0;
  }

  // Pass 2: remove sprite-sheet guide grid lines.
  // Grid lines are long continuous runs of grey pixels (R≈G≈B, medium brightness)
  // spanning >40% of a cell in one axis — duck pixels never form such runs.
  const isGrey = (r: number, g: number, b: number) =>
    Math.max(Math.abs(r - g), Math.abs(r - b), Math.abs(g - b)) < 20 && r > 80;

  const numCellCols = Math.round(oc.width / SW);
  const numCellRows = Math.round(oc.height / SH);

  for (let cr = 0; cr < numCellRows; cr++) {
    for (let cc = 0; cc < numCellCols; cc++) {
      const cellX = cc * SW;
      const cellY = cr * SH;

      // horizontal: remove rows where every visible pixel is grey AND span > 40%
      for (let dy = 0; dy < SH; dy++) {
        const y = cellY + dy;
        let grey = 0,
          visible = 0;
        for (let dx = 0; dx < SW; dx++) {
          const i = (y * W + cellX + dx) * 4;
          if (px[i + 3] > 0) {
            visible++;
            if (isGrey(px[i], px[i + 1], px[i + 2])) grey++;
          }
        }
        if (visible > SW * 0.4 && grey === visible) {
          for (let dx = 0; dx < SW; dx++) px[(y * W + cellX + dx) * 4 + 3] = 0;
        }
      }

      // vertical: same logic along columns
      for (let dx = 0; dx < SW; dx++) {
        let grey = 0,
          visible = 0;
        for (let dy = 0; dy < SH; dy++) {
          const i = ((cellY + dy) * W + cellX + dx) * 4;
          if (px[i + 3] > 0) {
            visible++;
            if (isGrey(px[i], px[i + 1], px[i + 2])) grey++;
          }
        }
        if (visible > SH * 0.4 && grey === visible) {
          for (let dy = 0; dy < SH; dy++)
            px[((cellY + dy) * W + cellX + dx) * 4 + 3] = 0;
        }
      }
    }
  }

  // Pass 3: remove isolated artifact dots — pixels with fewer than 2 non-transparent neighbors
  const H = oc.height;
  const toRemove = new Uint8Array(W * H);
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      if (px[(y * W + x) * 4 + 3] === 0) continue;
      let n = 0;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++)
          if (
            (dx !== 0 || dy !== 0) &&
            px[((y + dy) * W + (x + dx)) * 4 + 3] > 0
          )
            n++;
      if (n < 2) toRemove[y * W + x] = 1;
    }
  }
  for (let i = 0; i < W * H; i++) if (toRemove[i]) px[i * 4 + 3] = 0;

  ctx.putImageData(data, 0, 0);
  return oc;
}

// Returns the compass direction a duck faces at `facingAngle` (radians, 0=east, clockwise).
function facingDir(facingAngle: number): Direction {
  const a = ((facingAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  if (a >= (7 * Math.PI) / 4 || a < Math.PI / 4) return "east";
  if (a < (3 * Math.PI) / 4) return "south";
  if (a < (5 * Math.PI) / 4) return "west";
  return "north";
}

// Alternates walk1 / walk2 at ~8 steps per second.
function walkFrame(elapsed: number): WalkFrame {
  return Math.floor(elapsed * 8) % 2 === 0 ? "walk1" : "walk2";
}

// Facing direction for a duck sitting at `seatAngle`, toward the circle center
function inwardFacing(seatAngle: number): number {
  return seatAngle + Math.PI;
}

// Tangent direction for clockwise movement at `angle`
function cwTangent(angle: number): number {
  return angle + Math.PI / 2;
}

// Tangent direction for counter-clockwise movement at `angle`
function ccwTangent(angle: number): number {
  return angle - Math.PI / 2;
}

// ── Draw helpers ──────────────────────────────────────────────────────────────
function drawSprite(
  ctx: CanvasRenderingContext2D,
  sheet: HTMLCanvasElement,
  key: SpriteKey,
  destX: number, // canvas point where the duck body centre should land
  destY: number,
) {
  const { sx, sy, cx, cy } = SPRITE[key];
  // Crop a CROP_W × CROP_H window centred on (cx, cy) within the cell, clamped to cell bounds.
  const srcX = Math.max(0, Math.min(cx - CROP_W / 2, CELL - CROP_W));
  const srcY = Math.max(0, Math.min(cy - CROP_H / 2, CELL - CROP_H));
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (key === "sitting_west") {
    // sitting_west is mirrored on the sheet — flip horizontally around the body centre
    ctx.translate(destX, 0);
    ctx.scale(-1, 1);
    ctx.translate(-destX, 0);
  }
  ctx.drawImage(
    sheet,
    sx + srcX, // source x on sheet
    sy + srcY, // source y on sheet
    CROP_W,
    CROP_H,
    destX - (cx - srcX) * SCALE, // dest x so that cell pixel (cx,cy) lands at destX
    destY - (cy - srcY) * SCALE,
    CROP_W * SCALE,
    CROP_H * SCALE,
  );
  ctx.restore();
}

function drawGlow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  color: string,
  r = 18,
) {
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  grad.addColorStop(0, color);
  grad.addColorStop(1, "transparent");
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();
}

// ── Leaderboard ───────────────────────────────────────────────────────────────
function drawLeaderboard(
  ctx: CanvasRenderingContext2D,
  playerScore: number,
  npcScore: number,
  npcSeatWins: number[],
) {
  const PX = 16,
    PY = 16,
    PW = 264;
  const ROW_H = 20;
  const PH = 58 + 6 * ROW_H + 12; // 190

  const entries = [
    { label: "YOU", score: playerScore, color: "#60a5fa" },
    { label: "MOE", score: npcSeatWins[1], color: "#fb923c" },
    { label: "ACE", score: npcSeatWins[2], color: "#a78bfa" },
    { label: "DOT", score: npcSeatWins[3], color: "#fbbf24" },
    { label: "RAE", score: npcSeatWins[4], color: "#f472b6" },
    { label: "REX", score: npcScore, color: "#34d399" },
  ].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.label === "YOU") return -1;
    if (b.label === "YOU") return 1;
    return a.label.localeCompare(b.label);
  });

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  // Panel
  ctx.fillStyle = "rgba(8,12,24,0.9)";
  ctx.fillRect(PX, PY, PW, PH);
  ctx.strokeStyle = "rgba(80,110,150,0.7)";
  ctx.lineWidth = 2;
  ctx.strokeRect(PX + 1, PY + 1, PW - 2, PH - 2);
  ctx.strokeStyle = "rgba(20,40,70,0.8)";
  ctx.lineWidth = 1;
  ctx.strokeRect(PX + 4, PY + 4, PW - 8, PH - 8);

  const mid = PX + PW / 2;

  // Title
  ctx.font = "bold 16px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#fbbf24";
  ctx.shadowColor = "rgba(0,0,0,1)";
  ctx.shadowBlur = 6;
  ctx.fillText("RANKED DUCK DUCK GOOSE", mid, PY + 9);

  const rule = (y: number) => {
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(80,110,150,0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PX + 10, y);
    ctx.lineTo(PX + PW - 10, y);
    ctx.stroke();
  };

  rule(PY + 29);

  // Description
  ctx.font = "12px monospace";
  ctx.fillStyle = "rgba(150,185,215,0.85)";
  ctx.shadowColor = "rgba(0,0,0,0.9)";
  ctx.shadowBlur = 3;
  ctx.fillText("Tag a duck · race · take the seat", mid, PY + 34);

  rule(PY + 52);

  // Rows
  const maxScore = Math.max(playerScore, npcScore, 1);
  const BAR_X = PX + 78;
  const BAR_W = PW - 78 - 32;

  entries.forEach((entry, idx) => {
    const ry = PY + 58 + idx * ROW_H;
    const leading = idx === 0 && entry.score > 0;

    ctx.font = "bold 13px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    // Rank
    ctx.fillStyle = leading ? "#fbbf24" : "rgba(120,140,160,0.75)";
    ctx.shadowColor = "rgba(0,0,0,0.9)";
    ctx.shadowBlur = 2;
    ctx.fillText(`#${idx + 1}`, PX + 8, ry + 2);

    // Name
    ctx.fillStyle = entry.color;
    ctx.fillText(entry.label, PX + 32, ry + 2);

    // Bar track
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fillRect(BAR_X, ry + 6, BAR_W, 7);

    // Bar fill
    if (entry.score > 0) {
      ctx.fillStyle = entry.color;
      ctx.fillRect(
        BAR_X,
        ry + 6,
        Math.max((entry.score / maxScore) * BAR_W, 3),
        7,
      );
    }

    // Score
    ctx.font = "bold 13px monospace";
    ctx.textAlign = "right";
    ctx.fillStyle = entry.score > 0 ? "#ffffff" : "rgba(120,140,160,0.5)";
    ctx.shadowColor = "rgba(0,0,0,0.9)";
    ctx.shadowBlur = 2;
    ctx.fillText(String(entry.score), PX + PW - 8, ry + 2);
  });

  ctx.restore();
}

// ── Button layout (shared between render and pointer handler) ─────────────────
function getButtonBounds(w: number, h: number) {
  const btnH = 88;
  const margin = 20;
  const gap = 16;
  const btnW = (w - margin * 2 - gap) / 2;
  const btnY = h - btnH - margin * 2;
  return {
    waddle: { x: margin, y: btnY, w: btnW, h: btnH },
    goose: { x: margin + btnW + gap, y: btnY, w: btnW, h: btnH },
  };
}

function drawButton(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  enabled: boolean,
  color: string,
) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  const S = 6;

  // Drop shadow
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.fillRect(x + S, y + S, w, h);

  // Face
  ctx.fillStyle = enabled ? color : "#1e293b";
  ctx.fillRect(x, y, w, h);

  if (enabled) {
    // Top-left pixel bevel highlight
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.fillRect(x, y, w, 4);
    ctx.fillRect(x, y, 4, h);
    // Bottom-right pixel bevel shade
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.fillRect(x, y + h - 4, w, 4);
    ctx.fillRect(x + w - 4, y, 4, h);
  } else {
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    ctx.fillRect(x, y, w, 3);
  }

  // Pixel-art outer border
  ctx.strokeStyle = enabled ? "rgba(0,0,0,0.75)" : "rgba(0,0,0,0.35)";
  ctx.lineWidth = 3;
  ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);

  // Label
  ctx.font = "bold 24px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.9)";
  ctx.shadowBlur = enabled ? 6 : 0;
  ctx.fillStyle = enabled ? "#ffffff" : "#475569";
  ctx.fillText(label, x + w / 2, y + h / 2);

  ctx.restore();
}

// ── Main render ───────────────────────────────────────────────────────────────
function render(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  snap: GameSnapshot,
  cx: number,
  cy: number,
  radius: number,
  sheet: HTMLCanvasElement | null,
  elapsed: number,
  playerWalkFrame: WalkFrame,
  hint: { text: string; x: number; y: number } | null,
) {
  ctx.clearRect(0, 0, w, h);

  const { seats, gooseSeatIndex, openSeatIndex, itNearestIndex, phase } = snap;
  const wFrame = walkFrame(elapsed); // NPC animation frame — time-based

  // ── Seats ──────────────────────────────────────────────────────────────────
  for (let i = 0; i < seats.length; i++) {
    const { x, y, angle } = seats[i];
    const duckName = snap.seatOccupants[i];
    const isPlayer = duckName === "YOU";
    const isGoose = i === gooseSeatIndex;
    const isOpen =
      i === openSeatIndex && (phase === "racing" || phase === "round_over");
    // Vacated seat: draw dashed ring
    if (isOpen || (isGoose && (phase === "racing" || phase === "round_over"))) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, 14, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      continue;
    }

    if (!sheet) {
      ctx.beginPath();
      ctx.arc(x, y, 22, 0, Math.PI * 2);
      ctx.fillStyle = isPlayer ? "#60a5fa" : "#555";
      ctx.fill();
    } else {
      const facing = inwardFacing(angle);
      const spriteKey: SpriteKey = `sitting_${facingDir(facing)}`;
      ctx.save();
      ctx.shadowColor = duckName
        ? (DUCK_COLOR[duckName] ?? "rgba(255,255,255,0.5)")
        : "rgba(255,255,255,0.5)";
      ctx.shadowBlur = isPlayer ? 26 : 14;
      drawSprite(ctx, sheet, spriteKey, x, y);
      ctx.restore();
    }

    // "duck" callout — shows which duck can be tagged; gated by canTag when player is IT
    const isNearIt =
      phase === "waiting" &&
      i === itNearestIndex &&
      (!snap.playerIsIt || snap.canTag);
    if (isNearIt) {
      ctx.save();
      ctx.font = "bold 13px system-ui,sans-serif";
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.shadowColor = "rgba(0,0,0,0.9)";
      ctx.shadowBlur = 6;
      ctx.fillText("duck", x, y - SW * SCALE * 0.36);
      ctx.restore();
    }

    if (duckName) {
      ctx.save();
      ctx.font = "bold 11px system-ui,sans-serif";
      ctx.fillStyle = DUCK_COLOR[duckName] ?? "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.shadowColor = "rgba(0,0,0,0.9)";
      ctx.shadowBlur = 1;
      ctx.fillText(duckName, x, y + SW * SCALE * 0.2);
      ctx.restore();
    }
  }

  // ── IT walker ──────────────────────────────────────────────────────────────
  if (phase === "waiting") {
    const p = positionOnCircle(snap.itAngle, cx, cy, radius);
    const facing = cwTangent(snap.itAngle);
    if (sheet) {
      const itFrame = snap.playerIsIt ? playerWalkFrame : wFrame;
      const spriteKey: SpriteKey = `${itFrame}_${facingDir(facing)}`;
      ctx.save();
      if (snap.playerIsIt) {
        ctx.shadowColor = "rgba(34,197,94,0.85)";
        ctx.shadowBlur = 14;
      }
      drawSprite(ctx, sheet, spriteKey, p.x, p.y);
      ctx.restore();
      ctx.save();
      ctx.font = "bold 11px system-ui,sans-serif";
      ctx.fillStyle = snap.playerIsIt ? "#60a5fa" : (DUCK_COLOR[snap.itName] ?? "#fff");
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.shadowColor = "rgba(0,0,0,0.9)";
      ctx.shadowBlur = 5;
      ctx.fillText(
        snap.playerIsIt ? "YOU" : snap.itName,
        p.x,
        p.y - CROP_H * SCALE * 0.5,
      );
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 14, 0, Math.PI * 2);
      ctx.fillStyle = "#f0f0f0";
      ctx.fill();
    }
  }

  // ── Race runners ───────────────────────────────────────────────────────────
  if (phase === "racing" || phase === "round_over") {
    // Player runner — CW (IT) when playerIsIt, CCW (goose) otherwise
    const pr = positionOnCircle(snap.playerRaceAngle, cx, cy, radius);
    const playerFacing = snap.playerIsIt
      ? cwTangent(snap.playerRaceAngle)
      : ccwTangent(snap.playerRaceAngle);
    if (sheet) {
      const pFrame =
        snap.playerIsGoose || snap.playerIsIt ? playerWalkFrame : wFrame;
      ctx.save();
      if (snap.playerIsIt) {
        ctx.shadowColor = "rgba(34,197,94,0.85)";
        ctx.shadowBlur = 14;
      } else if (snap.playerIsGoose) {
        ctx.shadowColor = "rgba(96,165,250,0.95)";
        ctx.shadowBlur = 26;
      }
      drawSprite(
        ctx,
        sheet,
        `${pFrame}_${facingDir(playerFacing)}`,
        pr.x,
        pr.y,
      );
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.arc(pr.x, pr.y, 16, 0, Math.PI * 2);
      ctx.fillStyle =
        snap.playerIsGoose || snap.playerIsIt ? "#60a5fa" : "#555";
      ctx.fill();
    }

    // NPC runner — CCW (goose) when playerIsIt, CW (IT) otherwise
    const nr = positionOnCircle(snap.npcRaceAngle, cx, cy, radius);
    const npcFacing = snap.playerIsIt
      ? ccwTangent(snap.npcRaceAngle)
      : cwTangent(snap.npcRaceAngle);
    if (sheet) {
      ctx.save();
      const npcRunnerName = snap.playerIsIt ? snap.gooseName : snap.itName;
      if (npcRunnerName && DUCK_COLOR[npcRunnerName]) {
        ctx.shadowColor = DUCK_COLOR[npcRunnerName];
        ctx.shadowBlur = 14;
      }
      drawSprite(ctx, sheet, `${wFrame}_${facingDir(npcFacing)}`, nr.x, nr.y);
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.arc(nr.x, nr.y, 14, 0, Math.PI * 2);
      ctx.fillStyle = "#f0f0f0";
      ctx.fill();
    }
  }

  // ── Leaderboard ────────────────────────────────────────────────────────────
  if (phase !== "game_over") {
    drawLeaderboard(ctx, snap.score, snap.strikes, snap.npcSeatWins);
  }

  // Waiting hint (NPC IT only — player IT uses buttons)
  if (phase === "waiting" && !snap.playerIsIt) {
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.9)";
    ctx.shadowBlur = 6;
    ctx.font = "12px system-ui,sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText("waiting to be picked…", cx, h - 18);
    ctx.restore();
  }

  // Round over
  if (phase === "round_over" && snap.lastRoundWinner) {
    const won = snap.lastRoundWinner === "player";
    ctx.save();
    ctx.font = "bold 22px system-ui,sans-serif";
    ctx.fillStyle = won ? "#60a5fa" : "#ef4444";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0,0,0,0.9)";
    ctx.shadowBlur = 8;
    ctx.fillText(won ? "Escaped!" : "Caught!", cx, cy);
    ctx.restore();
  }

  // Game over
  if (phase === "game_over") {
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.fillRect(0, 0, w, h);
    ctx.font = "bold 34px system-ui,sans-serif";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("GAME OVER", cx, cy - 44);
    ctx.font = "18px system-ui,sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillText(
      `You escaped ${snap.score} time${snap.score !== 1 ? "s" : ""}`,
      cx,
      cy,
    );
    ctx.font = "bold 14px system-ui,sans-serif";
    ctx.fillStyle = "#60a5fa";
    ctx.fillText("Click to play again", cx, cy + 44);
    ctx.restore();
  }

  // ── Buttons ──────────────────────────────────────────────────────────────────
  if (phase !== "game_over") {
    const btns = getButtonBounds(w, h);
    drawButton(
      ctx,
      btns.waddle.x,
      btns.waddle.y,
      btns.waddle.w,
      btns.waddle.h,
      "WADDLE",
      snap.canWaddle,
      "#22c55e",
    );
    drawButton(
      ctx,
      btns.goose.x,
      btns.goose.y,
      btns.goose.w,
      btns.goose.h,
      "GOOSE!",
      snap.canTag,
      "#f97316",
    );
  }

  // ── Hint text (e.g. "wait your turn!") ───────────────────────────────────────
  if (hint) {
    ctx.save();
    ctx.font = "bold 14px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#fbbf24";
    ctx.shadowColor = "rgba(0,0,0,0.9)";
    ctx.shadowBlur = 6;
    ctx.fillText(hint.text, hint.x, hint.y);
    ctx.restore();
  }
}

// ── React component ───────────────────────────────────────────────────────────
export default function DuckDuckGooseGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const elapsedRef = useRef<number>(0);
  const sheetRef = useRef<HTMLCanvasElement | null>(null);
  const imagesLoadedRef = useRef(0);
  const playerFrameRef = useRef<WalkFrame>("walk1");
  const hintRef = useRef<{
    text: string;
    x: number;
    y: number;
    until: number;
  } | null>(null);

  const getLayout = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return null;
    const w = c.width,
      h = c.height;
    return { w, h, cx: w / 2, cy: h / 2, radius: Math.min(w, h) * 0.18 };
  }, []);

  const loop = useCallback(
    (time: number) => {
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = time;
      elapsedRef.current += dt;

      const canvas = canvasRef.current;
      const engine = engineRef.current;
      if (!canvas || !engine) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const layout = getLayout();
      if (!layout) return;

      engine.tick(dt);
      const elapsed = elapsedRef.current;
      const hint =
        hintRef.current && elapsed < hintRef.current.until
          ? {
              text: hintRef.current.text,
              x: hintRef.current.x,
              y: hintRef.current.y,
            }
          : null;
      render(
        ctx,
        layout.w,
        layout.h,
        engine.getSnapshot(),
        layout.cx,
        layout.cy,
        layout.radius,
        sheetRef.current,
        elapsed,
        playerFrameRef.current,
        hint,
      );

      rafRef.current = requestAnimationFrame(loop);
    },
    [getLayout],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth * devicePixelRatio;
      canvas.height = canvas.offsetHeight * devicePixelRatio;
      const layout = getLayout();
      if (layout && engineRef.current) {
        engineRef.current.resize(layout.cx, layout.cy, layout.radius);
      }
    };

    const startIfReady = () => {
      imagesLoadedRef.current++;
      if (imagesLoadedRef.current < 1) return;
      resize();
      const layout = getLayout()!;
      engineRef.current = new GameEngine(layout.cx, layout.cy, layout.radius);
      lastTimeRef.current = performance.now();
      rafRef.current = requestAnimationFrame(loop);
      const ro = new ResizeObserver(resize);
      ro.observe(canvas);
      // Store ro for cleanup
      (canvas as HTMLCanvasElement & { _ro?: ResizeObserver })._ro = ro;
    };

    const sheet = new Image();
    sheet.onload = () => {
      sheetRef.current = removeBackground(sheet);
      startIfReady();
    };
    sheet.src = "/ddg_sprite_map.png";

    return () => {
      cancelAnimationFrame(rafRef.current);
      const ro = (canvas as HTMLCanvasElement & { _ro?: ResizeObserver })._ro;
      ro?.disconnect();
    };
  }, [loop, getLayout]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const engine = engineRef.current;
      if (!engine) return;

      if (engine.phase === "game_over") {
        engine.restart();
        return;
      }

      const layout = getLayout();
      if (!layout) return;
      const { w, h } = layout;

      // Use getBoundingClientRect for robust canvas→CSS→canvas-pixel conversion
      const canvas = e.currentTarget;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const px = (e.clientX - rect.left) * scaleX;
      const py = (e.clientY - rect.top) * scaleY;

      const snap = engine.getSnapshot();
      const btns = getButtonBounds(w, h);
      const hit = (b: { x: number; y: number; w: number; h: number }) =>
        px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h;

      const showHint = (b: { x: number; y: number; w: number; h: number }) => {
        hintRef.current = {
          text: "wait your turn!",
          x: b.x + b.w / 2,
          y: b.y + b.h + 14,
          until: elapsedRef.current + 2,
        };
      };

      if (hit(btns.waddle)) {
        if (snap.canWaddle) {
          playerFrameRef.current =
            playerFrameRef.current === "walk1" ? "walk2" : "walk1";
          engine.waddleClick();
        } else {
          showHint(btns.waddle);
        }
      } else if (hit(btns.goose)) {
        if (snap.canTag) {
          engine.gooseClick();
        } else {
          showHint(btns.goose);
        }
      } else if (engine.phase === "racing" && snap.canWaddle) {
        // Tap anywhere outside buttons to advance during a race
        playerFrameRef.current =
          playerFrameRef.current === "walk1" ? "walk2" : "walk1";
        engine.waddleClick();
      }
    },
    [getLayout],
  );

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <style>{`
        .ddg-meadow { position:absolute; inset:0; overflow:hidden; }
        .ddg-meadow .sky {
          position:absolute; inset:0 0 auto 0; height:16%;
          background:linear-gradient(to bottom,
            #54b3f0 0%,#54b3f0 17%, #6cc0f4 17%,#6cc0f4 34%,
            #8fd2f7 34%,#8fd2f7 51%, #b3e3fb 51%,#b3e3fb 68%,
            #d6f1fd 68%,#d6f1fd 85%, #eef9ff 85%,#eef9ff 100%);
        }
        .ddg-meadow .grass {
          position:absolute; top:16%; inset-inline:0; bottom:0;
          background:linear-gradient(to bottom, #95cf54 0%,#95cf54 3%, #82c33f 3%,#82c33f 100%);
        }
        .ddg-meadow .cloud-a { position:absolute; opacity:.95; will-change:transform; top:10%; left:-12%; height:34px; animation:ddg-drift-a 220s steps(170) infinite; }
        @keyframes ddg-drift-a { from{transform:translateX(0)} to{transform:translateX(120vw)} }
        .ddg-meadow .tree { position:absolute; right:4%; top:16%; height:150px; transform:translateY(-92%); }
        .ddg-meadow .tband { animation-duration:14s; animation-timing-function:step-end; animation-iteration-count:infinite; will-change:transform; }
        .ddg-meadow .b-top    { animation-name:ddg-tbTop; }
        .ddg-meadow .b-upper  { animation-name:ddg-tbUpper; }
        .ddg-meadow .b-mid    { animation-name:ddg-tbMid; }
        .ddg-meadow .b-lower  { animation-name:ddg-tbLower; }
        .ddg-meadow .b-base   { animation-name:ddg-tbBase; }
        .ddg-meadow .tuft { position:absolute; overflow:visible; transform:translate(-50%,-100%); }
        .ddg-meadow .tt-top { animation:ddg-tuftTop var(--dur,9s) step-end var(--delay,0s) infinite; will-change:transform; }
        .ddg-meadow .tt-bot { animation:ddg-tuftBot var(--dur,9s) step-end var(--delay,0s) infinite; will-change:transform; }
        .ddg-meadow .fleck { position:absolute; width:3px; height:3px; background:#69a838; opacity:.5; transform:translate(-50%,-50%); }
        @keyframes ddg-tbTop{0%{transform:translateX(0)}40%{transform:translateX(0)}50%{transform:translateX(1px)}60%{transform:translateX(0)}100%{transform:translateX(0)}}
        @keyframes ddg-tbUpper{0%{transform:translateX(0)}50%{transform:translateX(1px)}60%{transform:translateX(0)}100%{transform:translateX(0)}}
        @keyframes ddg-tbMid{0%{transform:translateX(0)}100%{transform:translateX(0)}}
        @keyframes ddg-tbLower{0%{transform:translateX(0)}100%{transform:translateX(0)}}
        @keyframes ddg-tbBase{0%{transform:translateX(0)}100%{transform:translateX(0)}}
        @keyframes ddg-tuftTop{0%{transform:translateX(0)}50%{transform:translateX(1px)}62.5%{transform:translateX(0)}100%{transform:translateX(0)}}
        @keyframes ddg-tuftBot{0%{transform:translateX(0)}100%{transform:translateX(0)}}
        @media (prefers-reduced-motion: reduce) {
          .ddg-meadow .tband,.ddg-meadow .tt-top,.ddg-meadow .tt-bot,.ddg-meadow .cloud-a { animation:none; }
        }
      `}</style>
      <div className="ddg-meadow" aria-hidden="true">
        <div className="sky" />
        <div className="grass" />
        <svg
          className="cloud-a"
          viewBox="0 0 12 5"
          shapeRendering="crispEdges"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="4" y="0" width="1.05" height="1.05" fill="#ffffff" />
          <rect x="5" y="0" width="1.05" height="1.05" fill="#ffffff" />
          <rect x="6" y="0" width="1.05" height="1.05" fill="#ffffff" />
          <rect x="7" y="0" width="1.05" height="1.05" fill="#ffffff" />
          <rect x="2" y="1" width="1.05" height="1.05" fill="#ffffff" />
          <rect x="3" y="1" width="1.05" height="1.05" fill="#ffffff" />
          <rect x="4" y="1" width="1.05" height="1.05" fill="#ffffff" />
          <rect x="5" y="1" width="1.05" height="1.05" fill="#ffffff" />
          <rect x="6" y="1" width="1.05" height="1.05" fill="#ffffff" />
          <rect x="7" y="1" width="1.05" height="1.05" fill="#ffffff" />
          <rect x="8" y="1" width="1.05" height="1.05" fill="#ffffff" />
          <rect x="9" y="1" width="1.05" height="1.05" fill="#ffffff" />
          <rect x="1" y="2" width="1.05" height="1.05" fill="#ffffff" />
          <rect x="2" y="2" width="1.05" height="1.05" fill="#ffffff" />
          <rect x="3" y="2" width="1.05" height="1.05" fill="#ffffff" />
          <rect x="4" y="2" width="1.05" height="1.05" fill="#ffffff" />
          <rect x="5" y="2" width="1.05" height="1.05" fill="#ffffff" />
          <rect x="6" y="2" width="1.05" height="1.05" fill="#ffffff" />
          <rect x="7" y="2" width="1.05" height="1.05" fill="#ffffff" />
          <rect x="8" y="2" width="1.05" height="1.05" fill="#ffffff" />
          <rect x="9" y="2" width="1.05" height="1.05" fill="#ffffff" />
          <rect x="10" y="2" width="1.05" height="1.05" fill="#ffffff" />
          <rect x="0" y="3" width="1.05" height="1.05" fill="#ffffff" />
          <rect x="1" y="3" width="1.05" height="1.05" fill="#ffffff" />
          <rect x="2" y="3" width="1.05" height="1.05" fill="#ffffff" />
          <rect x="3" y="3" width="1.05" height="1.05" fill="#ffffff" />
          <rect x="4" y="3" width="1.05" height="1.05" fill="#ffffff" />
          <rect x="5" y="3" width="1.05" height="1.05" fill="#ffffff" />
          <rect x="6" y="3" width="1.05" height="1.05" fill="#ffffff" />
          <rect x="7" y="3" width="1.05" height="1.05" fill="#ffffff" />
          <rect x="8" y="3" width="1.05" height="1.05" fill="#ffffff" />
          <rect x="9" y="3" width="1.05" height="1.05" fill="#ffffff" />
          <rect x="10" y="3" width="1.05" height="1.05" fill="#ffffff" />
          <rect x="11" y="3" width="1.05" height="1.05" fill="#ffffff" />
          <rect x="1" y="4" width="1.05" height="1.05" fill="#eaf6ff" />
          <rect x="2" y="4" width="1.05" height="1.05" fill="#eaf6ff" />
          <rect x="3" y="4" width="1.05" height="1.05" fill="#eaf6ff" />
          <rect x="4" y="4" width="1.05" height="1.05" fill="#eaf6ff" />
          <rect x="5" y="4" width="1.05" height="1.05" fill="#eaf6ff" />
          <rect x="6" y="4" width="1.05" height="1.05" fill="#eaf6ff" />
          <rect x="7" y="4" width="1.05" height="1.05" fill="#eaf6ff" />
          <rect x="8" y="4" width="1.05" height="1.05" fill="#eaf6ff" />
          <rect x="9" y="4" width="1.05" height="1.05" fill="#eaf6ff" />
          <rect x="10" y="4" width="1.05" height="1.05" fill="#eaf6ff" />
        </svg>
        <svg
          className="tree"
          viewBox="0 0 18 22"
          shapeRendering="crispEdges"
          xmlns="http://www.w3.org/2000/svg"
          style={{ overflow: "visible" }}
        >
          <g className="tband b-top">
            <rect x="3" y="0" width="1.05" height="1.05" fill="#2e7d32" />
            <rect x="7" y="0" width="1.05" height="1.05" fill="#2e7d32" />
            <rect x="8" y="0" width="1.05" height="1.05" fill="#2e7d32" />
            <rect x="12" y="0" width="1.05" height="1.05" fill="#2e7d32" />
            <rect x="2" y="1" width="1.05" height="1.05" fill="#2e7d32" />
            <rect x="3" y="1" width="1.05" height="1.05" fill="#43a047" />
            <rect x="4" y="1" width="1.05" height="1.05" fill="#2e7d32" />
            <rect x="6" y="1" width="1.05" height="1.05" fill="#2e7d32" />
            <rect x="7" y="1" width="1.05" height="1.05" fill="#43a047" />
            <rect x="8" y="1" width="1.05" height="1.05" fill="#43a047" />
            <rect x="9" y="1" width="1.05" height="1.05" fill="#2e7d32" />
            <rect x="11" y="1" width="1.05" height="1.05" fill="#2e7d32" />
            <rect x="12" y="1" width="1.05" height="1.05" fill="#43a047" />
            <rect x="13" y="1" width="1.05" height="1.05" fill="#2e7d32" />
            <rect x="1" y="2" width="1.05" height="1.05" fill="#2e7d32" />
            <rect x="2" y="2" width="1.05" height="1.05" fill="#43a047" />
            <rect x="3" y="2" width="1.05" height="1.05" fill="#43a047" />
            <rect x="4" y="2" width="1.05" height="1.05" fill="#2e7d32" />
            <rect x="5" y="2" width="1.05" height="1.05" fill="#2e7d32" />
            <rect x="6" y="2" width="1.05" height="1.05" fill="#43a047" />
            <rect x="7" y="2" width="1.05" height="1.05" fill="#43a047" />
            <rect x="8" y="2" width="1.05" height="1.05" fill="#43a047" />
            <rect x="9" y="2" width="1.05" height="1.05" fill="#43a047" />
            <rect x="10" y="2" width="1.05" height="1.05" fill="#2e7d32" />
            <rect x="11" y="2" width="1.05" height="1.05" fill="#43a047" />
            <rect x="12" y="2" width="1.05" height="1.05" fill="#43a047" />
            <rect x="13" y="2" width="1.05" height="1.05" fill="#43a047" />
            <rect x="14" y="2" width="1.05" height="1.05" fill="#2e7d32" />
            <rect x="0" y="3" width="1.05" height="1.05" fill="#2e7d32" />
            <rect x="1" y="3" width="1.05" height="1.05" fill="#43a047" />
            <rect x="2" y="3" width="1.05" height="1.05" fill="#43a047" />
            <rect x="3" y="3" width="1.05" height="1.05" fill="#43a047" />
            <rect x="4" y="3" width="1.05" height="1.05" fill="#43a047" />
            <rect x="5" y="3" width="1.05" height="1.05" fill="#43a047" />
            <rect x="6" y="3" width="1.05" height="1.05" fill="#43a047" />
            <rect x="7" y="3" width="1.05" height="1.05" fill="#43a047" />
            <rect x="8" y="3" width="1.05" height="1.05" fill="#43a047" />
            <rect x="9" y="3" width="1.05" height="1.05" fill="#43a047" />
            <rect x="10" y="3" width="1.05" height="1.05" fill="#43a047" />
            <rect x="11" y="3" width="1.05" height="1.05" fill="#43a047" />
            <rect x="12" y="3" width="1.05" height="1.05" fill="#43a047" />
            <rect x="13" y="3" width="1.05" height="1.05" fill="#43a047" />
            <rect x="14" y="3" width="1.05" height="1.05" fill="#43a047" />
            <rect x="15" y="3" width="1.05" height="1.05" fill="#2e7d32" />
          </g>
          <g className="tband b-upper">
            <rect x="0" y="4" width="1.05" height="1.05" fill="#2e7d32" />
            <rect x="1" y="4" width="1.05" height="1.05" fill="#43a047" />
            <rect x="2" y="4" width="1.05" height="1.05" fill="#43a047" />
            <rect x="3" y="4" width="1.05" height="1.05" fill="#4caf50" />
            <rect x="4" y="4" width="1.05" height="1.05" fill="#43a047" />
            <rect x="5" y="4" width="1.05" height="1.05" fill="#43a047" />
            <rect x="6" y="4" width="1.05" height="1.05" fill="#43a047" />
            <rect x="7" y="4" width="1.05" height="1.05" fill="#43a047" />
            <rect x="8" y="4" width="1.05" height="1.05" fill="#2e7d32" />
            <rect x="9" y="4" width="1.05" height="1.05" fill="#43a047" />
            <rect x="10" y="4" width="1.05" height="1.05" fill="#43a047" />
            <rect x="11" y="4" width="1.05" height="1.05" fill="#43a047" />
            <rect x="12" y="4" width="1.05" height="1.05" fill="#43a047" />
            <rect x="13" y="4" width="1.05" height="1.05" fill="#43a047" />
            <rect x="14" y="4" width="1.05" height="1.05" fill="#43a047" />
            <rect x="15" y="4" width="1.05" height="1.05" fill="#43a047" />
            <rect x="16" y="4" width="1.05" height="1.05" fill="#2e7d32" />
            <rect x="0" y="5" width="1.05" height="1.05" fill="#2e7d32" />
            <rect x="1" y="5" width="1.05" height="1.05" fill="#43a047" />
            <rect x="2" y="5" width="1.05" height="1.05" fill="#43a047" />
            <rect x="3" y="5" width="1.05" height="1.05" fill="#43a047" />
            <rect x="4" y="5" width="1.05" height="1.05" fill="#43a047" />
            <rect x="5" y="5" width="1.05" height="1.05" fill="#43a047" />
            <rect x="6" y="5" width="1.05" height="1.05" fill="#43a047" />
            <rect x="7" y="5" width="1.05" height="1.05" fill="#43a047" />
            <rect x="8" y="5" width="1.05" height="1.05" fill="#43a047" />
            <rect x="9" y="5" width="1.05" height="1.05" fill="#43a047" />
            <rect x="10" y="5" width="1.05" height="1.05" fill="#43a047" />
            <rect x="11" y="5" width="1.05" height="1.05" fill="#43a047" />
            <rect x="12" y="5" width="1.05" height="1.05" fill="#4caf50" />
            <rect x="13" y="5" width="1.05" height="1.05" fill="#43a047" />
            <rect x="14" y="5" width="1.05" height="1.05" fill="#43a047" />
            <rect x="15" y="5" width="1.05" height="1.05" fill="#43a047" />
            <rect x="16" y="5" width="1.05" height="1.05" fill="#43a047" />
            <rect x="17" y="5" width="1.05" height="1.05" fill="#2e7d32" />
            <rect x="0" y="6" width="1.05" height="1.05" fill="#2e7d32" />
            <rect x="1" y="6" width="1.05" height="1.05" fill="#43a047" />
            <rect x="2" y="6" width="1.05" height="1.05" fill="#43a047" />
            <rect x="3" y="6" width="1.05" height="1.05" fill="#43a047" />
            <rect x="4" y="6" width="1.05" height="1.05" fill="#43a047" />
            <rect x="5" y="6" width="1.05" height="1.05" fill="#43a047" />
            <rect x="6" y="6" width="1.05" height="1.05" fill="#43a047" />
            <rect x="7" y="6" width="1.05" height="1.05" fill="#43a047" />
            <rect x="8" y="6" width="1.05" height="1.05" fill="#43a047" />
            <rect x="9" y="6" width="1.05" height="1.05" fill="#43a047" />
            <rect x="10" y="6" width="1.05" height="1.05" fill="#43a047" />
            <rect x="11" y="6" width="1.05" height="1.05" fill="#43a047" />
            <rect x="12" y="6" width="1.05" height="1.05" fill="#43a047" />
            <rect x="13" y="6" width="1.05" height="1.05" fill="#43a047" />
            <rect x="14" y="6" width="1.05" height="1.05" fill="#43a047" />
            <rect x="15" y="6" width="1.05" height="1.05" fill="#43a047" />
            <rect x="16" y="6" width="1.05" height="1.05" fill="#43a047" />
            <rect x="17" y="6" width="1.05" height="1.05" fill="#2e7d32" />
            <rect x="1" y="7" width="1.05" height="1.05" fill="#2e7d32" />
            <rect x="2" y="7" width="1.05" height="1.05" fill="#43a047" />
            <rect x="3" y="7" width="1.05" height="1.05" fill="#43a047" />
            <rect x="4" y="7" width="1.05" height="1.05" fill="#43a047" />
            <rect x="5" y="7" width="1.05" height="1.05" fill="#43a047" />
            <rect x="6" y="7" width="1.05" height="1.05" fill="#43a047" />
            <rect x="7" y="7" width="1.05" height="1.05" fill="#43a047" />
            <rect x="8" y="7" width="1.05" height="1.05" fill="#2e7d32" />
            <rect x="9" y="7" width="1.05" height="1.05" fill="#43a047" />
            <rect x="10" y="7" width="1.05" height="1.05" fill="#43a047" />
            <rect x="11" y="7" width="1.05" height="1.05" fill="#43a047" />
            <rect x="12" y="7" width="1.05" height="1.05" fill="#43a047" />
            <rect x="13" y="7" width="1.05" height="1.05" fill="#43a047" />
            <rect x="14" y="7" width="1.05" height="1.05" fill="#43a047" />
            <rect x="15" y="7" width="1.05" height="1.05" fill="#43a047" />
            <rect x="16" y="7" width="1.05" height="1.05" fill="#2e7d32" />
            <rect x="0" y="8" width="1.05" height="1.05" fill="#2e7d32" />
            <rect x="1" y="8" width="1.05" height="1.05" fill="#43a047" />
            <rect x="2" y="8" width="1.05" height="1.05" fill="#43a047" />
            <rect x="3" y="8" width="1.05" height="1.05" fill="#43a047" />
            <rect x="4" y="8" width="1.05" height="1.05" fill="#4caf50" />
            <rect x="5" y="8" width="1.05" height="1.05" fill="#43a047" />
            <rect x="6" y="8" width="1.05" height="1.05" fill="#43a047" />
            <rect x="7" y="8" width="1.05" height="1.05" fill="#43a047" />
            <rect x="8" y="8" width="1.05" height="1.05" fill="#43a047" />
            <rect x="9" y="8" width="1.05" height="1.05" fill="#43a047" />
            <rect x="10" y="8" width="1.05" height="1.05" fill="#43a047" />
            <rect x="11" y="8" width="1.05" height="1.05" fill="#43a047" />
            <rect x="12" y="8" width="1.05" height="1.05" fill="#43a047" />
            <rect x="13" y="8" width="1.05" height="1.05" fill="#43a047" />
            <rect x="14" y="8" width="1.05" height="1.05" fill="#43a047" />
            <rect x="15" y="8" width="1.05" height="1.05" fill="#43a047" />
            <rect x="16" y="8" width="1.05" height="1.05" fill="#43a047" />
            <rect x="17" y="8" width="1.05" height="1.05" fill="#2e7d32" />
          </g>
          <g className="tband b-mid">
            <rect x="0" y="9" width="1.05" height="1.05" fill="#2e7d32" />
            <rect x="1" y="9" width="1.05" height="1.05" fill="#43a047" />
            <rect x="2" y="9" width="1.05" height="1.05" fill="#43a047" />
            <rect x="3" y="9" width="1.05" height="1.05" fill="#43a047" />
            <rect x="4" y="9" width="1.05" height="1.05" fill="#43a047" />
            <rect x="5" y="9" width="1.05" height="1.05" fill="#43a047" />
            <rect x="6" y="9" width="1.05" height="1.05" fill="#43a047" />
            <rect x="7" y="9" width="1.05" height="1.05" fill="#43a047" />
            <rect x="8" y="9" width="1.05" height="1.05" fill="#43a047" />
            <rect x="9" y="9" width="1.05" height="1.05" fill="#43a047" />
            <rect x="10" y="9" width="1.05" height="1.05" fill="#43a047" />
            <rect x="11" y="9" width="1.05" height="1.05" fill="#43a047" />
            <rect x="12" y="9" width="1.05" height="1.05" fill="#43a047" />
            <rect x="13" y="9" width="1.05" height="1.05" fill="#43a047" />
            <rect x="14" y="9" width="1.05" height="1.05" fill="#66bb6a" />
            <rect x="15" y="9" width="1.05" height="1.05" fill="#43a047" />
            <rect x="16" y="9" width="1.05" height="1.05" fill="#43a047" />
            <rect x="17" y="9" width="1.05" height="1.05" fill="#2e7d32" />
            <rect x="0" y="10" width="1.05" height="1.05" fill="#2e7d32" />
            <rect x="1" y="10" width="1.05" height="1.05" fill="#43a047" />
            <rect x="2" y="10" width="1.05" height="1.05" fill="#43a047" />
            <rect x="3" y="10" width="1.05" height="1.05" fill="#43a047" />
            <rect x="4" y="10" width="1.05" height="1.05" fill="#43a047" />
            <rect x="5" y="10" width="1.05" height="1.05" fill="#43a047" />
            <rect x="6" y="10" width="1.05" height="1.05" fill="#43a047" />
            <rect x="7" y="10" width="1.05" height="1.05" fill="#43a047" />
            <rect x="8" y="10" width="1.05" height="1.05" fill="#43a047" />
            <rect x="9" y="10" width="1.05" height="1.05" fill="#43a047" />
            <rect x="10" y="10" width="1.05" height="1.05" fill="#43a047" />
            <rect x="11" y="10" width="1.05" height="1.05" fill="#43a047" />
            <rect x="12" y="10" width="1.05" height="1.05" fill="#43a047" />
            <rect x="13" y="10" width="1.05" height="1.05" fill="#43a047" />
            <rect x="14" y="10" width="1.05" height="1.05" fill="#43a047" />
            <rect x="15" y="10" width="1.05" height="1.05" fill="#43a047" />
            <rect x="16" y="10" width="1.05" height="1.05" fill="#43a047" />
            <rect x="17" y="10" width="1.05" height="1.05" fill="#2e7d32" />
            <rect x="1" y="11" width="1.05" height="1.05" fill="#2e7d32" />
            <rect x="2" y="11" width="1.05" height="1.05" fill="#43a047" />
            <rect x="3" y="11" width="1.05" height="1.05" fill="#43a047" />
            <rect x="4" y="11" width="1.05" height="1.05" fill="#43a047" />
            <rect x="5" y="11" width="1.05" height="1.05" fill="#43a047" />
            <rect x="6" y="11" width="1.05" height="1.05" fill="#2e7d32" />
            <rect x="7" y="11" width="1.05" height="1.05" fill="#43a047" />
            <rect x="8" y="11" width="1.05" height="1.05" fill="#43a047" />
            <rect x="9" y="11" width="1.05" height="1.05" fill="#43a047" />
            <rect x="10" y="11" width="1.05" height="1.05" fill="#43a047" />
            <rect x="11" y="11" width="1.05" height="1.05" fill="#43a047" />
            <rect x="12" y="11" width="1.05" height="1.05" fill="#43a047" />
            <rect x="13" y="11" width="1.05" height="1.05" fill="#43a047" />
            <rect x="14" y="11" width="1.05" height="1.05" fill="#43a047" />
            <rect x="15" y="11" width="1.05" height="1.05" fill="#43a047" />
            <rect x="16" y="11" width="1.05" height="1.05" fill="#2e7d32" />
            <rect x="0" y="12" width="1.05" height="1.05" fill="#2e7d32" />
            <rect x="1" y="12" width="1.05" height="1.05" fill="#43a047" />
            <rect x="2" y="12" width="1.05" height="1.05" fill="#43a047" />
            <rect x="3" y="12" width="1.05" height="1.05" fill="#43a047" />
            <rect x="4" y="12" width="1.05" height="1.05" fill="#43a047" />
            <rect x="5" y="12" width="1.05" height="1.05" fill="#43a047" />
            <rect x="6" y="12" width="1.05" height="1.05" fill="#43a047" />
            <rect x="7" y="12" width="1.05" height="1.05" fill="#43a047" />
            <rect x="8" y="12" width="1.05" height="1.05" fill="#43a047" />
            <rect x="9" y="12" width="1.05" height="1.05" fill="#43a047" />
            <rect x="10" y="12" width="1.05" height="1.05" fill="#43a047" />
            <rect x="11" y="12" width="1.05" height="1.05" fill="#43a047" />
            <rect x="12" y="12" width="1.05" height="1.05" fill="#43a047" />
            <rect x="13" y="12" width="1.05" height="1.05" fill="#43a047" />
            <rect x="14" y="12" width="1.05" height="1.05" fill="#43a047" />
            <rect x="15" y="12" width="1.05" height="1.05" fill="#43a047" />
            <rect x="16" y="12" width="1.05" height="1.05" fill="#43a047" />
            <rect x="17" y="12" width="1.05" height="1.05" fill="#2e7d32" />
          </g>
          <g className="tband b-lower">
            <rect x="1" y="13" width="1.05" height="1.05" fill="#2e7d32" />
            <rect x="2" y="13" width="1.05" height="1.05" fill="#43a047" />
            <rect x="3" y="13" width="1.05" height="1.05" fill="#43a047" />
            <rect x="4" y="13" width="1.05" height="1.05" fill="#43a047" />
            <rect x="5" y="13" width="1.05" height="1.05" fill="#2e7d32" />
            <rect x="6" y="13" width="1.05" height="1.05" fill="#43a047" />
            <rect x="7" y="13" width="1.05" height="1.05" fill="#43a047" />
            <rect x="8" y="13" width="1.05" height="1.05" fill="#43a047" />
            <rect x="9" y="13" width="1.05" height="1.05" fill="#43a047" />
            <rect x="10" y="13" width="1.05" height="1.05" fill="#43a047" />
            <rect x="11" y="13" width="1.05" height="1.05" fill="#43a047" />
            <rect x="12" y="13" width="1.05" height="1.05" fill="#2e7d32" />
            <rect x="13" y="13" width="1.05" height="1.05" fill="#43a047" />
            <rect x="14" y="13" width="1.05" height="1.05" fill="#43a047" />
            <rect x="15" y="13" width="1.05" height="1.05" fill="#43a047" />
            <rect x="16" y="13" width="1.05" height="1.05" fill="#2e7d32" />
            <rect x="2" y="14" width="1.05" height="1.05" fill="#2e7d32" />
            <rect x="3" y="14" width="1.05" height="1.05" fill="#2e7d32" />
            <rect x="4" y="14" width="1.05" height="1.05" fill="#43a047" />
            <rect x="5" y="14" width="1.05" height="1.05" fill="#43a047" />
            <rect x="6" y="14" width="1.05" height="1.05" fill="#43a047" />
            <rect x="7" y="14" width="1.05" height="1.05" fill="#43a047" />
            <rect x="8" y="14" width="1.05" height="1.05" fill="#43a047" />
            <rect x="9" y="14" width="1.05" height="1.05" fill="#43a047" />
            <rect x="10" y="14" width="1.05" height="1.05" fill="#43a047" />
            <rect x="11" y="14" width="1.05" height="1.05" fill="#43a047" />
            <rect x="12" y="14" width="1.05" height="1.05" fill="#43a047" />
            <rect x="13" y="14" width="1.05" height="1.05" fill="#43a047" />
            <rect x="14" y="14" width="1.05" height="1.05" fill="#2e7d32" />
            <rect x="15" y="14" width="1.05" height="1.05" fill="#2e7d32" />
            <rect x="3" y="15" width="1.05" height="1.05" fill="#2e7d32" />
            <rect x="4" y="15" width="1.05" height="1.05" fill="#43a047" />
            <rect x="5" y="15" width="1.05" height="1.05" fill="#43a047" />
            <rect x="6" y="15" width="1.05" height="1.05" fill="#2e7d32" />
            <rect x="7" y="15" width="1.05" height="1.05" fill="#43a047" />
            <rect x="8" y="15" width="1.05" height="1.05" fill="#43a047" />
            <rect x="9" y="15" width="1.05" height="1.05" fill="#43a047" />
            <rect x="10" y="15" width="1.05" height="1.05" fill="#43a047" />
            <rect x="11" y="15" width="1.05" height="1.05" fill="#2e7d32" />
            <rect x="12" y="15" width="1.05" height="1.05" fill="#43a047" />
            <rect x="13" y="15" width="1.05" height="1.05" fill="#43a047" />
            <rect x="14" y="15" width="1.05" height="1.05" fill="#2e7d32" />
          </g>
          <g className="tband b-base">
            <rect x="4" y="16" width="1.05" height="1.05" fill="#2e7d32" />
            <rect x="5" y="16" width="1.05" height="1.05" fill="#2e7d32" />
            <rect x="6" y="16" width="1.05" height="1.05" fill="#43a047" />
            <rect x="7" y="16" width="1.05" height="1.05" fill="#43a047" />
            <rect x="8" y="16" width="1.05" height="1.05" fill="#43a047" />
            <rect x="9" y="16" width="1.05" height="1.05" fill="#43a047" />
            <rect x="10" y="16" width="1.05" height="1.05" fill="#43a047" />
            <rect x="11" y="16" width="1.05" height="1.05" fill="#2e7d32" />
            <rect x="12" y="16" width="1.05" height="1.05" fill="#2e7d32" />
            <rect x="6" y="17" width="1.05" height="1.05" fill="#2e7d32" />
            <rect x="7" y="17" width="1.05" height="1.05" fill="#43a047" />
            <rect x="8" y="17" width="1.05" height="1.05" fill="#43a047" />
            <rect x="9" y="17" width="1.05" height="1.05" fill="#43a047" />
            <rect x="10" y="17" width="1.05" height="1.05" fill="#2e7d32" />
          </g>
          <g className="trunk">
            <rect x="7" y="18" width="1.05" height="1.05" fill="#7a5237" />
            <rect x="8" y="18" width="1.05" height="1.05" fill="#5d3a23" />
            <rect x="9" y="18" width="1.05" height="1.05" fill="#7a5237" />
            <rect x="7" y="19" width="1.05" height="1.05" fill="#7a5237" />
            <rect x="8" y="19" width="1.05" height="1.05" fill="#5d3a23" />
            <rect x="9" y="19" width="1.05" height="1.05" fill="#7a5237" />
            <rect x="6" y="20" width="1.05" height="1.05" fill="#7a5237" />
            <rect x="7" y="20" width="1.05" height="1.05" fill="#5d3a23" />
            <rect x="8" y="20" width="1.05" height="1.05" fill="#5d3a23" />
            <rect x="9" y="20" width="1.05" height="1.05" fill="#5d3a23" />
            <rect x="10" y="20" width="1.05" height="1.05" fill="#7a5237" />
            <rect x="6" y="21" width="1.05" height="1.05" fill="#7a5237" />
            <rect x="7" y="21" width="1.05" height="1.05" fill="#7a5237" />
            <rect x="8" y="21" width="1.05" height="1.05" fill="#5d3a23" />
            <rect x="9" y="21" width="1.05" height="1.05" fill="#5d3a23" />
            <rect x="10" y="21" width="1.05" height="1.05" fill="#7a5237" />
            <rect x="11" y="21" width="1.05" height="1.05" fill="#7a5237" />
          </g>
        </svg>
        {[
          { left: "12%", top: "80%", h: 30, dur: "9.5s", delay: "-1.2s" },
          { left: "33%", top: "60%", h: 24, dur: "11s", delay: "-5s" },
          { left: "50%", top: "88%", h: 34, dur: "8.5s", delay: "-3.3s" },
          { left: "69%", top: "54%", h: 22, dur: "12s", delay: "-7.1s" },
          { left: "87%", top: "74%", h: 28, dur: "10s", delay: "-2s" },
        ].map((t, i) => (
          <svg
            key={i}
            className="tuft"
            style={{
              left: t.left,
              top: t.top,
              height: t.h,
              ["--dur" as string]: t.dur,
              ["--delay" as string]: t.delay,
            }}
            viewBox="0 0 8 4"
            shapeRendering="crispEdges"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g className="tt-top">
              <rect x="1" y="0" width="1.05" height="1.05" fill="#57932c" />
              <rect x="5" y="0" width="1.05" height="1.05" fill="#69a838" />
              <rect x="1" y="1" width="1.05" height="1.05" fill="#57932c" />
              <rect x="3" y="1" width="1.05" height="1.05" fill="#69a838" />
              <rect x="5" y="1" width="1.05" height="1.05" fill="#69a838" />
              <rect x="7" y="1" width="1.05" height="1.05" fill="#57932c" />
            </g>
            <g className="tt-bot">
              <rect x="0" y="2" width="1.05" height="1.05" fill="#57932c" />
              <rect x="1" y="2" width="1.05" height="1.05" fill="#57932c" />
              <rect x="3" y="2" width="1.05" height="1.05" fill="#69a838" />
              <rect x="5" y="2" width="1.05" height="1.05" fill="#69a838" />
              <rect x="6" y="2" width="1.05" height="1.05" fill="#69a838" />
              <rect x="7" y="2" width="1.05" height="1.05" fill="#57932c" />
              <rect x="1" y="3" width="1.05" height="1.05" fill="#57932c" />
              <rect x="2" y="3" width="1.05" height="1.05" fill="#57932c" />
              <rect x="3" y="3" width="1.05" height="1.05" fill="#69a838" />
              <rect x="5" y="3" width="1.05" height="1.05" fill="#69a838" />
              <rect x="6" y="3" width="1.05" height="1.05" fill="#57932c" />
            </g>
          </svg>
        ))}
        {[
          ["46.72%", "84.98%"],
          ["86.73%", "47.77%"],
          ["65.07%", "37.87%"],
          ["0.59%", "56.86%"],
          ["5.13%", "37.41%"],
          ["36.37%", "59.36%"],
          ["50.89%", "84.36%"],
          ["5.55%", "38.87%"],
          ["11.09%", "30.00%"],
          ["89.78%", "37.91%"],
        ].map(([l, t], i) => (
          <span key={i} className="fleck" style={{ left: l, top: t }} />
        ))}
      </div>
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
          cursor: "pointer",
          touchAction: "manipulation",
        }}
      />
    </div>
  );
}
