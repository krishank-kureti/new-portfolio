"use client";

import { useEffect, useId, useRef, useState, type RefObject } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import "./macos-sidebar.css";

type MenuItem = { label: string; href: string };

export type MacOSSidebarProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: MenuItem[];
  triggerRef: RefObject<HTMLButtonElement | null>;
};

export default function MacOSSidebar({ open, onOpenChange, items, triggerRef }: MacOSSidebarProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const highlightId = useId();
  const reducedMotion = useReducedMotion();
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);
  const [selectedHref, setSelectedHref] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) onOpenChange(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onOpenChange(false);
      triggerRef.current?.focus();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onOpenChange, triggerRef]);

  return (
    <div className="macos-menu" ref={rootRef}>
      <motion.div
        className="macos-menu__panel"
        initial={false}
        animate={{ width: open ? 240 : 64 }}
        transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 38 }}
      >
        <div className="macos-menu__toolbar">
          <button
            ref={triggerRef}
            className="macos-menu__toggle"
            type="button"
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => onOpenChange(!open)}
          >
            <span className="macos-menu__hamburger" aria-hidden="true">
              <span className="macos-menu__hamburger-line" />
              <span className="macos-menu__hamburger-line" />
              <span className="macos-menu__hamburger-line" />
            </span>
          </button>
        </div>
        <div id={panelId} className="macos-menu__content" hidden={!open}>
          <nav aria-label="Portfolio sections" className="macos-menu__inner" onMouseLeave={() => setHoveredHref(null)}>
            <AnimatePresence initial={false}>
              {open && items.map((item, index) => (
                <motion.a
                  key={item.href}
                  href={item.href}
                  className="macos-menu__link"
                  aria-current={selectedHref === item.href ? "location" : undefined}
                  initial={reducedMotion ? false : { opacity: 0, y: 7, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, transition: { duration: 0 } }}
                  transition={reducedMotion ? { duration: 0 } : { duration: 0.22, delay: index * 0.045 }}
                  onMouseEnter={() => setHoveredHref(item.href)}
                  onFocus={() => setHoveredHref(item.href)}
                  onClick={() => {
                    setSelectedHref(item.href);
                    setHoveredHref(null);
                    onOpenChange(false);
                  }}
                >
                   {selectedHref === item.href && <motion.span className="macos-menu__selection" initial={false} animate={{ opacity: 1 }} aria-hidden="true" />}
                   {hoveredHref === item.href && selectedHref !== item.href && (
                    <motion.span
                      layoutId={highlightId}
                      className="macos-menu__highlight"
                      transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 40 }}
                      aria-hidden="true"
                    />
                  )}
                  <span className="macos-menu__label">{item.label}</span>
                  <span className="macos-menu__arrow" aria-hidden="true">↗</span>
                </motion.a>
              ))}
            </AnimatePresence>
          </nav>
        </div>
      </motion.div>
    </div>
  );
}
