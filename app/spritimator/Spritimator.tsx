"use client";

import { useState } from "react";
import PromptBuilder from "./PromptBuilder";
import SpriteEditor from "./SpriteEditor";
import AnimationStudio from "./AnimationStudio";
import type { SpriteFrame, SpriteAnimation } from "./types";

type Tab = "prompt" | "editor" | "studio";

const TABS: { id: Tab; label: string }[] = [
  { id: "prompt", label: "1 · Prompt" },
  { id: "editor", label: "2 · Map" },
  { id: "studio", label: "3 · Animate" },
];

export default function Spritimator() {
  const [tab, setTab] = useState<Tab>("prompt");
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [naturalW, setNaturalW] = useState(0);
  const [naturalH, setNaturalH] = useState(0);
  const [frames, setFrames] = useState<SpriteFrame[]>([]);
  const [animations, setAnimations] = useState<SpriteAnimation[]>([]);

  const resetAll = () => {
    if (!window.confirm("Start over? This clears your image, frames, and animations.")) return;
    setImageSrc(null);
    setNaturalW(0);
    setNaturalH(0);
    setFrames([]);
    setAnimations([]);
    setTab("prompt");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0c0c0c", color: "#d4d4d4", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ borderBottom: "1px solid #1a1a1a", padding: "0 24px", display: "flex", alignItems: "center", gap: 20, height: 50 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", userSelect: "none" }}>
          Spritimator
        </span>
        <nav style={{ display: "flex", gap: 2 }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                background: tab === t.id ? "#1c1c1c" : "none",
                border: "none",
                color: tab === t.id ? "#e5e5e5" : "#4a4a4a",
                fontSize: 12,
                fontWeight: tab === t.id ? 600 : 400,
                padding: "5px 14px",
                borderRadius: 6,
                cursor: "pointer",
                letterSpacing: "0.02em",
              }}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <button
          onClick={resetAll}
          style={{ marginLeft: "auto", background: "none", border: "none", color: "#333", fontSize: 12, cursor: "pointer", padding: "5px 10px", borderRadius: 6 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#666")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#333")}
        >
          Start over
        </button>
      </div>

      <div style={{ padding: 24 }}>
        {tab === "prompt" && (
          <PromptBuilder onContinue={() => setTab("editor")} />
        )}
        {tab === "editor" && (
          <SpriteEditor
            imageSrc={imageSrc}
            setImageSrc={setImageSrc}
            naturalW={naturalW}
            setNaturalW={setNaturalW}
            naturalH={naturalH}
            setNaturalH={setNaturalH}
            frames={frames}
            setFrames={setFrames}
            onContinue={() => setTab("studio")}
          />
        )}
        {tab === "studio" && (
          <AnimationStudio
            imageSrc={imageSrc}
            naturalW={naturalW}
            naturalH={naturalH}
            frames={frames}
            animations={animations}
            setAnimations={setAnimations}
          />
        )}
      </div>
    </div>
  );
}
