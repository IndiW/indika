"use client";

import { COLORS, SEGMENT_ANGLE, type Assignment } from "./lib";

const SERIF_FONT = "var(--font-instrument-serif), Georgia, 'Times New Roman', serif";

const SIZE = 440;
const CENTER = SIZE / 2;
const WHEEL_R = 168;
const ARROW_TIP_R = WHEEL_R + 14;
const ARROW_BASE_R = WHEEL_R + 30;
const LABEL_R = WHEEL_R + 54;
const LABEL_LINE_HEIGHT = 25;

function polarToCartesian(r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CENTER + r * Math.cos(rad), y: CENTER + r * Math.sin(rad) };
}

function describeSlice(startAngle: number, endAngle: number) {
  const start = polarToCartesian(WHEEL_R, endAngle);
  const end = polarToCartesian(WHEEL_R, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    "M", CENTER, CENTER,
    "L", start.x, start.y,
    "A", WHEEL_R, WHEEL_R, 0, largeArcFlag, 0, end.x, end.y,
    "Z",
  ].join(" ");
}

function labelAnchor(angleDeg: number): "start" | "middle" | "end" {
  const a = ((angleDeg % 360) + 360) % 360;
  if (a > 12 && a < 168) return "start";
  if (a > 192 && a < 348) return "end";
  return "middle";
}

interface WheelProps {
  rotationDeg: number;
  spinning: boolean;
  assignments: Assignment[] | null;
  revealed: boolean;
}

export default function Wheel({ rotationDeg, spinning, assignments, revealed }: WheelProps) {
  const bySlot = new Map<number, Assignment[]>();
  if (assignments) {
    for (const a of assignments) {
      const list = bySlot.get(a.slot) ?? [];
      list.push(a);
      bySlot.set(a.slot, list);
    }
  }

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      width="100%"
      height="100%"
      style={{ maxWidth: 440, overflow: "visible" }}
    >
      <g
        style={{
          transform: `rotate(${rotationDeg}deg)`,
          transformOrigin: `${CENTER}px ${CENTER}px`,
          transition: spinning
            ? "transform 3.2s cubic-bezier(0.15, 0.85, 0.2, 1)"
            : "none",
        }}
      >
        <circle
          cx={CENTER}
          cy={CENTER}
          r={WHEEL_R + 3}
          fill="none"
          stroke="#EFE9DF"
          strokeWidth={2}
        />
        {COLORS.map((color, i) => {
          const startAngle = i * SEGMENT_ANGLE;
          const endAngle = startAngle + SEGMENT_ANGLE;
          return (
            <path
              key={color.name}
              d={describeSlice(startAngle, endAngle)}
              fill={color.hex}
              stroke="#FBF7F1"
              strokeWidth={3}
            />
          );
        })}
        <circle cx={CENTER} cy={CENTER} r={30} fill="#FBF7F1" stroke="#EFE9DF" strokeWidth={2} />
      </g>

      {Array.from(bySlot.entries()).map(([slot, names]) => {
        const angle = slot * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
        const tip = polarToCartesian(ARROW_TIP_R, angle);
        const base = polarToCartesian(ARROW_BASE_R, angle);
        const anchor = labelAnchor(angle);
        const labelStart = polarToCartesian(LABEL_R, angle);
        const dx = anchor === "start" ? 6 : anchor === "end" ? -6 : 0;

        return (
          <g
            key={slot}
            style={{
              opacity: revealed ? 1 : 0,
              transition: "opacity 0.6s ease-out",
              transitionDelay: revealed ? `${slot * 0.05}s` : "0s",
            }}
          >
            <line
              x1={base.x}
              y1={base.y}
              x2={tip.x}
              y2={tip.y}
              stroke="#231F1B"
              strokeWidth={2}
              strokeLinecap="round"
            />
            <circle cx={base.x} cy={base.y} r={3.5} fill="#231F1B" />
            {names.map((a, i) => (
              <text
                key={a.name}
                x={labelStart.x + dx}
                y={labelStart.y + i * LABEL_LINE_HEIGHT}
                textAnchor={anchor}
                dominantBaseline="middle"
                fontSize={22}
                fill="#231F1B"
                style={{ fontFamily: SERIF_FONT }}
              >
                {a.name}
              </text>
            ))}
          </g>
        );
      })}
    </svg>
  );
}
