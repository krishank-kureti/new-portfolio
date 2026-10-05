"use client";

import { Component, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import "./hero-identity.css";

const Lanyard = dynamic(() => import("./Lanyard"), { ssr: false });

class LanyardBoundary extends Component<{ children: React.ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

const subtitles = [
  "AI engineer",
  "Wannabe Polymath",
  "Prompt Whisperer",
  "Ather Intern",
  "Caffeine-Driven Optimization",
];
const glyphs = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*";

function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reducedMotion;
}

export function HeroName() {
  const [subtitle, setSubtitle] = useState(subtitles[0]);
  const [announcedSubtitle, setAnnouncedSubtitle] = useState(subtitles[0]);
  const [liveRegionReady, setLiveRegionReady] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    setLiveRegionReady(true);
  }, []);

  useEffect(() => {
    let phraseIndex = 0;
    let interval: ReturnType<typeof setInterval> | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const cycle = () => {
      phraseIndex = (phraseIndex + 1) % subtitles.length;
      const phrase = subtitles[phraseIndex];

      if (reducedMotion) {
        setSubtitle(phrase);
        setAnnouncedSubtitle(phrase);
        timeout = setTimeout(cycle, 4000);
        return;
      }

      let settled = 0;
      let ticks = 0;
      interval = setInterval(() => {
        ticks += 1;
        if (ticks % 2 === 0) settled += 1;
        setSubtitle(
          Array.from(phrase, (character, index) =>
            index < settled || character === " "
              ? character
              : glyphs[Math.floor(Math.random() * glyphs.length)],
          ).join(""),
        );

        if (settled >= phrase.length) {
          clearInterval(interval);
          interval = undefined;
          setSubtitle(phrase);
          setAnnouncedSubtitle(phrase);
          timeout = setTimeout(cycle, 2800);
        }
      }, 35);
    };

    timeout = setTimeout(cycle, 2800);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [reducedMotion]);

  return (
    <>
      <span className="identity-name" aria-hidden="true">
        <span className="identity-name-line">{Array.from("Krishank").map((letter, index) => <span className="identity-letter" style={{ animationDelay: `${-index * .14}s` }} key={`${letter}-${index}`}>{letter}</span>)}</span>
        <em className="identity-name-line">{Array.from("Kureti").map((letter, index) => <span className="identity-letter" style={{ animationDelay: `${-(index + 8) * .14}s` }} key={`${letter}-${index}`}>{letter}</span>)}</em>
      </span>
      <span className="identity-subtitle" aria-hidden="true">{subtitle}</span>
      {liveRegionReady && createPortal(
        <span className="identity-subtitle-announcement" role="status" aria-live="polite" aria-atomic="true">
          {announcedSubtitle}
        </span>,
        document.body,
      )}
    </>
  );
}

export function HeroPortrait() {
  const reducedMotion = useReducedMotion();
  const container = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [entered, setEntered] = useState(false);
  const [supported, setSupported] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      setSupported(Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl")));
    } catch { setSupported(false); }
  }, []);
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new IntersectionObserver(entries => {
      const inView = entries[0]?.isIntersecting ?? false;
      setVisible(inView);
      if (inView) setEntered(true);
    }, { rootMargin: "100px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const enabled = !reducedMotion && supported && !failed && entered;
  return <div ref={container} className={`identity-portrait${enabled && ready ? " identity-portrait-ready" : ""}`}>
    <img className="identity-portrait-fallback" src="/images/krishank-portrait.png" alt="Portrait of Krishank Kureti" width="627" height="627" fetchPriority="high" />
    {enabled && <LanyardBoundary onError={() => setFailed(true)}><Lanyard active={visible} onReady={() => setReady(true)} onFailure={() => setFailed(true)} /></LanyardBoundary>}
  </div>;
}

export function Signature({ placement }: { placement: "hero" | "contact" }) {
  return <img className={`identity-signature identity-signature-${placement}`} src="/images/krishank-signature.png" alt="Krishank Kureti's signature" width="449" height="556" loading={placement === "hero" ? "eager" : "lazy"} />;
}
