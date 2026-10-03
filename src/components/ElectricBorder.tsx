"use client";

import { useEffect, useRef, type ReactNode } from "react";
import "./ElectricBorder.css";

type ElectricBorderProps = {
  children: ReactNode;
  color?: string;
  speed?: number;
  chaos?: number;
  thickness?: number;
};

const inset = 12;
const radius = 22;

// Continuous, periodic value noise: the seam at the end of the perimeter stays smooth.
function hash(n: number) {
  const x = Math.sin(n * 127.1 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function noise(position: number, frequency: number, phase: number) {
  const coordinate = ((position * frequency + phase) % frequency + frequency) % frequency;
  const left = Math.floor(coordinate);
  const blend = coordinate - left;
  const smooth = blend * blend * (3 - 2 * blend);
  return (hash(left % frequency) * (1 - smooth) + hash((left + 1) % frequency) * smooth) * 2 - 1;
}

// Distance along a rounded rectangle, with an outward normal for the spark displacement.
function pointAt(distance: number, width: number, height: number, corner: number) {
  const straightX = width - 2 * corner;
  const straightY = height - 2 * corner;
  const arc = Math.PI * corner / 2;
  let d = distance;
  if (d < straightX) return [corner + d, 0, 0, -1];
  d -= straightX;
  if (d < arc) { const a = -Math.PI / 2 + d / corner; return [width - corner + corner * Math.cos(a), corner + corner * Math.sin(a), Math.cos(a), Math.sin(a)]; }
  d -= arc;
  if (d < straightY) return [width, corner + d, 1, 0];
  d -= straightY;
  if (d < arc) { const a = d / corner; return [width - corner + corner * Math.cos(a), height - corner + corner * Math.sin(a), Math.cos(a), Math.sin(a)]; }
  d -= arc;
  if (d < straightX) return [width - corner - d, height, 0, 1];
  d -= straightX;
  if (d < arc) { const a = Math.PI / 2 + d / corner; return [corner + corner * Math.cos(a), height - corner + corner * Math.sin(a), Math.cos(a), Math.sin(a)]; }
  d -= arc;
  if (d < straightY) return [0, height - corner - d, -1, 0];
  d -= straightY;
  const a = Math.PI + d / corner;
  return [corner + corner * Math.cos(a), corner + corner * Math.sin(a), Math.cos(a), Math.sin(a)];
}

export default function ElectricBorder({ children, color = "#ff6474", speed = 1, chaos = 0.12, thickness = 2 }: ElectricBorderProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const frame = frameRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!frame || !canvas || !context) return;

    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frameId = 0;
    let width = 0;
    let height = 0;
    let start = 0;

    const draw = (time: number) => {
      context.clearRect(0, 0, width, height);
      const w = width - inset * 2;
      const h = height - inset * 2;
      if (w <= 0 || h <= 0) return;
      const r = Math.min(radius, w / 2, h / 2);
      const perimeter = 2 * (w + h - 4 * r) + 2 * Math.PI * r;
      const samples = Math.max(80, Math.ceil(perimeter / 2));
      const phase = preference.matches ? 0 : ((time - start) / 1000) * speed;

      context.beginPath();
      for (let i = 0; i <= samples; i++) {
        const u = i / samples;
        const [x, y, nx, ny] = pointAt(u * perimeter, w, h, r);
        const displacement = preference.matches ? 0 : chaos * 19 * (
          noise(u, 24, phase * 2.2) * 0.55 +
          noise(u, 72, -phase * 3.7) * 0.32 +
          noise(u, 144, phase * 5.1) * 0.13
        );
        const px = inset + x + nx * displacement;
        const py = inset + y + ny * displacement;
        if (i === 0) context.moveTo(px, py);
        else context.lineTo(px, py);
      }
      context.closePath();
      context.lineJoin = "round";
      context.lineCap = "round";
      context.strokeStyle = color;
      context.lineWidth = thickness * 2.7;
      context.globalAlpha = 0.42;
      context.shadowColor = color;
      context.shadowBlur = 9;
      context.stroke();
      context.globalAlpha = 1;
      context.shadowBlur = 0;
      context.lineWidth = thickness;
      context.stroke();
    };

    const tick = (time: number) => {
      if (!start) start = time;
      draw(time);
      frameId = requestAnimationFrame(tick);
    };
    const syncMotion = () => {
      cancelAnimationFrame(frameId);
      frameId = 0;
      start = 0;
      if (preference.matches) draw(0);
      else frameId = requestAnimationFrame(tick);
    };
    const resize = () => {
      const rect = frame.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const scale = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      context.setTransform(scale, 0, 0, scale, 0, 0);
      draw(performance.now());
    };
    const observer = new ResizeObserver(resize);
    observer.observe(frame);
    preference.addEventListener("change", syncMotion);
    resize();
    syncMotion();
    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
      preference.removeEventListener("change", syncMotion);
    };
  }, [color, speed, chaos, thickness]);

  return <div ref={frameRef} className="electric-border"><canvas ref={canvasRef} className="electric-border-canvas" aria-hidden="true" /><div className="electric-border-content">{children}</div></div>;
}
