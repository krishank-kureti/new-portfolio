"use client";

import type { CSSProperties } from "react";
import "./effects-repair.css";

type Props = { position?: "top" | "bottom" | "left" | "right"; height?: string; width?: string; divCount?: number; strength?: number; exponential?: boolean; opacity?: number; target?: "page" | "parent" };

export default function GradualBlur({ position = "bottom", height = "6rem", width = "100%", divCount = 5, strength = 2, exponential = false, opacity = 1, target = "page" }: Props) {
  const vertical = position === "top" || position === "bottom";
  const count = Math.max(1, Math.floor(divCount));
  const direction = position === "top" ? "to top" : position === "left" ? "to left" : position === "right" ? "to right" : "to bottom";
  const layers = Array.from({ length: count }, (_, index) => {
    const progress = (index + 1) / count;
    const start = Math.max(0, (index / count) * 100 - 12);
    const peak = Math.min(100, start + 22);
    // The final mask stays opaque at the edge; otherwise the strongest blur disappears.
    const mask = index === count - 1
      ? `linear-gradient(${direction}, transparent ${start}%, black ${peak}%, black 100%)`
      : `linear-gradient(${direction}, transparent ${start}%, black ${peak}%, transparent ${Math.min(100, peak + 28)}%)`;
    const blur = strength * (exponential ? Math.pow(2, progress * 3) : 1 + progress * 4) * 0.125;
    const style: CSSProperties = {
      backdropFilter: `blur(${blur.toFixed(3)}rem)`,
      WebkitBackdropFilter: `blur(${blur.toFixed(3)}rem)`,
      opacity,
      maskImage: mask,
      WebkitMaskImage: mask,
    };
    return <div className="gradual-blur-layer" key={index} style={style} />;
  });
  return <div aria-hidden="true" className={`gradual-blur gradual-blur-${target} gradual-blur-${position}`} style={{ position: target === "page" ? "fixed" : "absolute", [position]: target === "page" && position === "bottom" ? "56px" : 0, left: vertical ? 0 : undefined, right: vertical ? 0 : undefined, top: !vertical ? 0 : undefined, bottom: !vertical ? 0 : undefined, width: vertical ? width : height, height: vertical ? target === "page" && position === "bottom" ? `max(10rem, ${height})` : height : width, zIndex: target === "page" ? 57 : 1, pointerEvents: "none" }}>{layers}</div>;
}
