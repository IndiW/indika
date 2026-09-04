// ── Color Hunt Wheel — pure logic ──────────────────────────────────────────
// No storage: everything needed to reproduce a spin travels in the URL as
// `names` + `seed`. The wheel never physically rotates per-pixel — its final
// resting position is quantized to whole color segments, so a deterministic
// seed always reproduces the exact same result on any device.

export interface WheelColor {
  name: string;
  hex: string;
}

export const COLORS: WheelColor[] = [
  { name: "Red", hex: "#E5484D" },
  { name: "Orange", hex: "#F76B15" },
  { name: "Yellow", hex: "#FFC53D" },
  { name: "Green", hex: "#30A46C" },
  { name: "Blue", hex: "#0090FF" },
  { name: "Purple", hex: "#8E4EC6" },
  { name: "Pink", hex: "#E93D82" },
  { name: "Black", hex: "#1C1C1C" },
  { name: "White", hex: "#FDFDFC" },
];

export const SEGMENT_COUNT = COLORS.length;
export const SEGMENT_ANGLE = 360 / SEGMENT_COUNT;
export const MAX_NAMES = 12;
export const FULL_SPINS = 4;
export const SPIN_DURATION_MS = 3200;

export interface Assignment {
  name: string;
  slot: number;
  colorIndex: number;
}

export interface SpinResult {
  assignments: Assignment[];
  landingSlot: number;
}

// xmur3 string hash -> 32-bit seed for mulberry32.
function xmur3(str: string) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createRng(seed: string) {
  return mulberry32(xmur3(seed)());
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function generateSeed(): string {
  return Math.random().toString(36).slice(2, 10);
}

// Slots are fixed points around the rim, spaced at exact multiples of the
// segment width apart. Because the gap between any two slots is always a
// whole number of segments, a single quantized rotation shifts every slot's
// color by the same cyclic amount — so distinct slots always land on
// distinct colors, no matter where the wheel stops.
export function computeSpin(names: string[], seed: string): SpinResult {
  const rng = createRng(seed);
  const slotOrder = shuffle(
    Array.from({ length: SEGMENT_COUNT }, (_, i) => i),
    rng
  );
  const landingSlot = Math.floor(rng() * SEGMENT_COUNT);

  const assignments: Assignment[] = names.map((name, i) => {
    const slot =
      i < SEGMENT_COUNT ? slotOrder[i] : slotOrder[Math.floor(rng() * SEGMENT_COUNT)];
    const colorIndex =
      ((slot - landingSlot) % SEGMENT_COUNT + SEGMENT_COUNT) % SEGMENT_COUNT;
    return { name, slot, colorIndex };
  });

  return { assignments, landingSlot };
}

// Always spins forward from wherever the wheel currently rests, landing
// exactly on `landingSlot`'s absolute angle — so repeated spins accumulate
// rotation instead of snapping backward.
export function nextRotation(currentRotationDeg: number, landingSlot: number): number {
  const targetMod = landingSlot * SEGMENT_ANGLE;
  const currentMod = ((currentRotationDeg % 360) + 360) % 360;
  const forwardDelta = ((targetMod - currentMod) % 360 + 360) % 360;
  return currentRotationDeg + FULL_SPINS * 360 + forwardDelta;
}

export function encodeShareParams(names: string[], seed: string): string {
  const params = new URLSearchParams();
  params.set("names", names.join(","));
  params.set("seed", seed);
  return params.toString();
}

export function decodeShareParams(
  searchParams: URLSearchParams
): { names: string[]; seed: string } | null {
  const rawNames = searchParams.get("names");
  const seed = searchParams.get("seed");
  if (!rawNames || !seed) return null;

  const names = rawNames
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean)
    .slice(0, MAX_NAMES);

  if (names.length === 0) return null;
  return { names, seed };
}
