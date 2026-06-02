export interface SeatPosition {
  x: number;
  y: number;
  angle: number; // radians, 0 = top, clockwise
}

export function getSeatPositions(
  n: number,
  cx: number,
  cy: number,
  radius: number
): SeatPosition[] {
  return Array.from({ length: n }, (_, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
      angle,
    };
  });
}

export function arcDistance(fromAngle: number, toAngle: number, clockwise: boolean): number {
  let delta = toAngle - fromAngle;
  delta = ((delta % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  if (!clockwise) delta = 2 * Math.PI - delta;
  return delta;
}

export function angleAtProgress(
  startAngle: number,
  totalArc: number,
  progress: number,
  clockwise: boolean
): number {
  const delta = totalArc * progress;
  return startAngle + (clockwise ? delta : -delta);
}

export function positionOnCircle(
  angle: number,
  cx: number,
  cy: number,
  radius: number
): { x: number; y: number } {
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  };
}
