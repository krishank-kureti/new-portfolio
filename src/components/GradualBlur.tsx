"use client";

import { memo, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import "./GradualBlur.css";
import "./effects-repair.css";

export type BlurPosition = "top" | "bottom" | "left" | "right";
export type BlurCurve = keyof typeof CURVE_FUNCTIONS;
export type BlurPreset = keyof typeof PRESETS;
type Size = string | number;
type ResponsiveSettings = { height?: Size; width?: Size };

export const CURVE_FUNCTIONS = {
  linear: (progress: number) => progress,
  bezier: (p: number) => p * p * (3 - 2 * p),
  'ease-in': (p: number) => p * p,
  'ease-out': (p: number) => 1 - (1 - p) ** 2,
  'ease-in-out': (p: number) => p < .5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2,
  easeIn: (progress: number) => progress * progress,
  easeOut: (progress: number) => 1 - (1 - progress) ** 2,
  easeInOut: (progress: number) => progress < 0.5 ? 2 * progress ** 2 : 1 - (-2 * progress + 2) ** 2 / 2,
} as const;

export const PRESETS = {
  top: { position: "top" },
  bottom: { position: "bottom" },
  left: { position: "left" },
  right: { position: "right" },
   subtle: { strength: 1, height: "4rem", opacity: .8, divCount: 3 },
   intense: { strength: 4, height: "10rem", divCount: 8, exponential: true },
   smooth: { height: "8rem", curve: "bezier", divCount: 10 },
   sharp: { height: "5rem", curve: "linear", divCount: 4 },
  header: { position: "top", height: "8rem" },
  footer: { position: "bottom", height: "8rem" },
  sidebar: { position: "left", width: "6rem" },
  "page-header": { position: "top", target: "page", height: "8rem" },
  "page-footer": { position: "bottom", target: "page", height: "8rem" },
} as const;

export type GradualBlurProps = {
  position?: BlurPosition;
  strength?: number;
  height?: Size;
  width?: Size;
  divCount?: number;
  exponential?: boolean;
  zIndex?: number;
  animated?: boolean | "scroll";
  duration?: string;
  easing?: string;
  opacity?: number;
  curve?: BlurCurve;
  responsive?: false | { mobile?: ResponsiveSettings; tablet?: ResponsiveSettings; desktop?: ResponsiveSettings };
  target?: "parent" | "page";
  preset?: BlurPreset;
  hoverIntensity?: number;
  onAnimationComplete?: () => void;
  className?: string;
  style?: CSSProperties;
};

function viewportSize() {
  if (typeof window === "undefined") return "desktop" as const;
  return window.innerWidth < 768 ? "mobile" as const : window.innerWidth < 1024 ? "tablet" as const : "desktop" as const;
}

function GradualBlur({
  preset, position, strength, height, width, divCount, exponential, zIndex, animated = false,
  duration = ".3s", easing = "ease-out", opacity, curve, responsive = false,
  target, hoverIntensity = 1, onAnimationComplete, className, style,
}: GradualBlurProps) {
  const presetValues: Partial<GradualBlurProps> = preset ? PRESETS[preset] : {};
  const selectedCurve = curve ?? presetValues.curve ?? 'linear';
  const selectedOpacity = opacity ?? presetValues.opacity ?? 1;
  const settings = { position: "bottom" as BlurPosition, strength: 2, height: "6rem" as Size,
    width: "100%" as Size, divCount: 5, exponential: false, zIndex: 1000,
    target: "parent" as "parent" | "page", ...presetValues,
    ...(position !== undefined && { position }), ...(strength !== undefined && { strength }),
    ...(height !== undefined && { height }), ...(width !== undefined && { width }),
    ...(divCount !== undefined && { divCount }), ...(exponential !== undefined && { exponential }),
    ...(zIndex !== undefined && { zIndex }), ...(target !== undefined && { target }) };
  const [breakpoint, setBreakpoint] = useState<ReturnType<typeof viewportSize>>("desktop");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [visible, setVisible] = useState(!animated);
  const [hovered, setHovered] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const complete = useRef(onAnimationComplete);
  complete.current = onAnimationComplete;

  useEffect(() => {
    if (!responsive) return;
    let timeout: ReturnType<typeof setTimeout>;
    const update = () => { clearTimeout(timeout); timeout = setTimeout(() => setBreakpoint(viewportSize()), 100); };
    setBreakpoint(viewportSize());
    window.addEventListener("resize", update);
    return () => { clearTimeout(timeout); window.removeEventListener("resize", update); };
  }, [responsive]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!animated || reducedMotion) return;
    if (animated === "scroll" && typeof IntersectionObserver !== "undefined") {
      const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
      if (root.current) observer.observe(root.current);
      return () => observer.disconnect();
    }
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, [animated, reducedMotion]);

  useEffect(() => {
    if (hoverIntensity === 1 || reducedMotion) return;
    const element = settings.target === "parent" ? root.current?.parentElement : document;
    if (!element) return;
    const move = (event: Event) => {
      if (settings.target === "parent") { setHovered(true); return; }
      const pointer = event as PointerEvent;
      const bounds = root.current?.getBoundingClientRect();
      setHovered(Boolean(bounds && pointer.clientX >= bounds.left && pointer.clientX <= bounds.right && pointer.clientY >= bounds.top && pointer.clientY <= bounds.bottom));
    };
    const leave = () => setHovered(false);
    element.addEventListener(settings.target === "parent" ? "pointerenter" : "pointermove", move);
    element.addEventListener("pointerleave", leave);
    return () => {
      element.removeEventListener(settings.target === "parent" ? "pointerenter" : "pointermove", move);
      element.removeEventListener("pointerleave", leave);
    };
  }, [hoverIntensity, reducedMotion, settings.target]);

  const size = responsive ? responsive[breakpoint] : undefined;
  const vertical = settings.position === "top" || settings.position === "bottom";
  const count = Number.isFinite(settings.divCount) ? Math.max(1, Math.floor(settings.divCount)) : 5;
  const increment = 100 / count;
  const direction = `to ${settings.position}`;
  const layers = Array.from({ length: count }, (_, index) => {
    const i = index + 1;
    const progress = CURVE_FUNCTIONS[selectedCurve](i / count);
    const blur = (settings.exponential
      ? 2 ** (progress * 4) * .0625 * settings.strength
      : .0625 * (progress * count + 1) * settings.strength) * (hovered && !reducedMotion ? hoverIntensity : 1);
    const p1 = increment * (i - 1);
    const p2 = increment * i;
    const p3 = increment * (i + 1);
    const p4 = increment * (i + 2);
    const stops = [`transparent ${p1}%`, `black ${p2}%`];
    if (p3 <= 100) stops.push(`black ${p3}%`);
    if (p4 <= 100) stops.push(`transparent ${p4}%`);
    const mask = `linear-gradient(${direction}, ${stops.join(", ")})`;
    return <div key={index} className="gradual-blur-layer" style={{
      backdropFilter: `blur(${blur}rem)`, WebkitBackdropFilter: `blur(${blur}rem)`,
      maskImage: mask, WebkitMaskImage: mask,
    }} />;
  });
  const active = !animated || reducedMotion || visible;
  const rootStyle: CSSProperties = {
    position: settings.target === "page" ? "fixed" : "absolute",
    [settings.position]: 0,
    ...(vertical ? { left: 0, right: 0, height: size?.height ?? settings.height, width: size?.width ?? settings.width }
      : { top: 0, bottom: 0, width: size?.width ?? (settings.width === "100%" ? settings.height : settings.width), height: size?.height ?? "100%" }),
    zIndex: settings.zIndex + (settings.target === "page" ? 100 : 0),
    pointerEvents: "none",
    ...style,
  };
  return <div ref={root} aria-hidden="true" className={`gradual-blur gradual-blur-${settings.target} gradual-blur-${settings.position}${className ? ` ${className}` : ""}`} style={rootStyle}>
    <div className="gradual-blur-inner" style={{ opacity: active ? selectedOpacity : 0, transitionDuration: reducedMotion ? "0s" : duration, transitionTimingFunction: easing }}
      onTransitionEnd={(event) => { if (event.target === event.currentTarget && event.propertyName === "opacity" && active) complete.current?.(); }}>
      {layers}
    </div>
  </div>;
}

export default Object.assign(memo(GradualBlur), { PRESETS, CURVE_FUNCTIONS });
