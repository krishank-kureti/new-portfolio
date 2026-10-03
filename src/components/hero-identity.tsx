"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import "./hero-identity.css";

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
  return <div className="identity-portrait"><img src="/images/krishank-cutout.png" alt="Portrait of Krishank Kureti" width="500" height="500" fetchPriority="high" /><span className="identity-portrait-sheen" aria-hidden="true" /></div>;
}

export function Signature({ placement }: { placement: "hero" | "contact" }) {
  return <img className={`identity-signature identity-signature-${placement}`} src="/images/krishank-signature.png" alt="Krishank Kureti's signature" width="449" height="556" loading={placement === "hero" ? "eager" : "lazy"} />;
}
