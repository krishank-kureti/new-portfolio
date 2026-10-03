"use client";

import { useEffect, useRef } from "react";
import "./project-reel.css";

export type ReelProject = {
  title: string;
  label: string;
  metric: string;
  colour: string;
  blurb: string;
};

type ProjectReelProps = {
  projects: ReelProject[];
  onOpen: (index: number, trigger: HTMLButtonElement) => void;
};

const nativeQuery = "(max-width: 800px), (max-height: 700px), (prefers-reduced-motion: reduce)";

export default function ProjectReel({ projects, onOpen }: ProjectReelProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const runwayRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const geometryRef = useRef({ start: 0, distance: 0, travel: 0, top: 0, native: true });
  const updateRef = useRef<() => void>(() => {});

  useEffect(() => {
    const section = sectionRef.current;
    const runway = runwayRef.current;
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!section || !runway || !viewport || !track) return;

    const nativeMedia = window.matchMedia(nativeQuery);
    const nav = document.querySelector<HTMLElement>(".nav");
    const dock = document.querySelector<HTMLElement>(".stack-dock");
    let frame = 0;

    const render = () => {
      frame = 0;
      const { start, distance, travel, native } = geometryRef.current;
      if (native) {
        track.style.transform = "";
        return;
      }
      const progress = distance > 0 ? Math.max(0, Math.min(1, (window.scrollY - start) / distance)) : 0;
      track.style.transform = `translate3d(${-progress * travel}px, 0, 0)`;
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(render); };

    const measure = () => {
      const native = nativeMedia.matches;
      const top = native ? 0 : nav?.getBoundingClientRect().height ?? 0;
      const bottom = native ? 0 : dock?.getBoundingClientRect().height ?? 0;
      // Reserve a little breathing room above the fixed dock and below the nav.
      const pinHeight = Math.max(0, window.innerHeight - top - bottom - 12);
      const first = track.querySelector<HTMLButtonElement>(".reel-card");
      const edge = first ? Math.max(0, (viewport.clientWidth - first.offsetWidth) / 2) : 0;
      section.style.setProperty("--reel-top", `${top}px`);
      section.style.setProperty("--reel-pin-height", `${pinHeight}px`);
      track.style.setProperty("--reel-edge", `${edge}px`);

      // In native mode the runway is normal flow; the viewport itself scrolls and snaps.
      const travel = native ? 0 : Math.max(0, track.scrollWidth - viewport.clientWidth);
      const height = native ? 0 : pinHeight + travel;
      runway.style.height = native ? "" : `${height}px`;
      geometryRef.current = {
        start: runway.getBoundingClientRect().top + window.scrollY - top,
        distance: travel,
        travel,
        top,
        native,
      };
      if (native) {
        track.style.transform = "";
      } else {
        schedule();
      }
    };
    updateRef.current = measure;

    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(track);
    if (nav) observer.observe(nav);
    if (dock) observer.observe(dock);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", schedule, { passive: true });
    nativeMedia.addEventListener("change", measure);
    measure();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", schedule);
      nativeMedia.removeEventListener("change", measure);
      updateRef.current = () => {};
    };
  }, [projects]);

  const bringIntoView = (button: HTMLButtonElement) => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;
    updateRef.current();
    const { start, travel, native } = geometryRef.current;
    const center = button.offsetLeft + button.offsetWidth / 2 - viewport.clientWidth / 2;
    const target = Math.max(0, Math.min(travel, center));
    if (native) {
      viewport.scrollTo({ left: center, behavior: "instant" });
    } else {
      window.scrollTo({ top: start + target, behavior: "instant" });
    }
  };

  return (
    <section id="work" ref={sectionRef} tabIndex={-1} className="reel-section" aria-labelledby="reel-heading">
      <div className="reel-header">
        <div>
          <span className="reel-eyebrow">01 / SIGNATURE MOMENTS</span>
          <h2 id="reel-heading">Projects that<br /><em>made a mark.</em></h2>
        </div>
        <p>Scroll through the work. Each card is a doorway into a project, its decisions, and the questions it left behind.</p>
      </div>
      <div ref={runwayRef} className="reel-runway">
        <div className="reel-pin">
          <div ref={viewportRef} className="reel-viewport" aria-label="Selected projects">
            <div ref={trackRef} className="reel-track">
              {projects.map((project, index) => (
                <button
                  type="button"
                  key={`${project.title}-${index}`}
                  className={`reel-card reel-card--${["lime", "blue", "pink"].includes(project.colour) ? project.colour : "lime"}`}
                  aria-label={`View ${project.title} project`}
                  onFocus={(event) => bringIntoView(event.currentTarget)}
                  onClick={(event) => onOpen(index, event.currentTarget)}
                >
                  <span className="reel-card-top"><span>{project.metric}</span><span>OPEN PROJECT ↗</span></span>
                  <span className="reel-visual" aria-hidden="true"><span className="reel-visual-mark">▶</span><span className="reel-visual-caption">VIDEO / PLACEHOLDER</span></span>
                  <span className="reel-card-copy"><small>{project.label}</small><strong>{project.title}</strong><span>{project.blurb}</span></span>
                </button>
              ))}
            </div>
          </div>
          <div className="reel-ruler" aria-hidden="true"><span>01</span><span>SELECTED WORK</span><span>{String(projects.length).padStart(2, "0")}</span></div>
        </div>
      </div>
    </section>
  );
}
