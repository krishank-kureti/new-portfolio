"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { HeroName, HeroPortrait, Signature } from "./hero-identity";
import ProjectReel from "./project-reel";
import GradualBlur from "./GradualBlur";
import ElectricBorder from "./ElectricBorder";
import MacOSSidebar from "./ui/macos-sidebar";

const projects = [
  { title: "Memory for Machines", label: "RAG / SYSTEMS", metric: "01", colour: "lime", blurb: "A codebase-aware retrieval system that makes complex repositories easier to understand." },
  { title: "Signal Garden", label: "GENERATIVE AI / PRODUCT", metric: "02", colour: "blue", blurb: "A research companion that turns noisy information into focused, human-facing tools." },
  { title: "Quiet Queue", label: "DISTRIBUTED SYSTEMS", metric: "03", colour: "pink", blurb: "Reliable background work for the parts of a product that should never interrupt the user." },
  { title: "Vector Atlas", label: "SEARCH / EMBEDDINGS", metric: "04", colour: "blue", blurb: "A visual map of semantic neighbourhoods for navigating a living knowledge base." },
  { title: "Field Notes", label: "RESEARCH / OPEN SOURCE", metric: "05", colour: "lime", blurb: "Small tools and careful notes for making technical ideas easier to share." },
];

const stack = [
  ["Postgres", "postgresql"], ["Redis", "redis"], ["Qdrant", "qdrant"], ["Next.js", "nextdotjs"],
  ["React", "react"], ["TypeScript", "typescript"], ["Python", "python"], ["Docker", "docker"],
  ["FastAPI", "fastapi"], ["Flask", "flask"], ["C", "c"], ["C++", "cplusplus"],
  ["Devtron", "devtron"], ["AWS", "aws"], ["GCP", "googlecloud"],
];

function TechLogo({ slug, name }: { slug: string; name: string }) {
  return <img src={`/logos/${slug}.${slug === "devtron" ? "png" : "svg"}`} alt={`${name} logo`} width="34" height="34" loading="lazy" />;
}

export default function Portfolio() {
  const [activeProject, setActiveProject] = useState<number | null>(null);
  const [selectedProject, setSelectedProject] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [formStatus, setFormStatus] = useState<"idle" | "pending" | "saved" | "error">("idle");
  const [chatQuery, setChatQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [scrolling, setScrolling] = useState(false);
  const modalRef = useRef<HTMLDialogElement>(null);
  const modalTriggerRef = useRef<HTMLButtonElement | null>(null);
  const orbitTriggerRef = useRef<HTMLButtonElement | null>(null);
  const orbitCloseRef = useRef<HTMLButtonElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const artY = useTransform(scrollYProgress, [0, 1], [0, 110]);
  const titleY = useTransform(scrollYProgress, [0, 1], [0, -55]);
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.55]);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 800);
    let scrollIdleTimer: number | undefined;
    const updateScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0);
      setScrolled(window.scrollY > 40);
    };
    const onScroll = () => {
      updateScroll();
      setScrolling(true);
      window.clearTimeout(scrollIdleTimer);
      scrollIdleTimer = window.setTimeout(() => setScrolling(false), 200);
    };
    updateScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const observer = reduce ? null : new IntersectionObserver((entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("is-visible")), { threshold: 0.12 });
    document.querySelectorAll(".reveal").forEach((element) => reduce ? element.classList.add("is-visible") : observer?.observe(element));
    return () => { window.clearTimeout(timer); window.clearTimeout(scrollIdleTimer); window.removeEventListener("scroll", onScroll); observer?.disconnect(); };
  }, []);

  useEffect(() => {
    const dialog = modalRef.current;
    if (!dialog) return;
    if (activeProject !== null && !dialog.open) dialog.showModal();
    if (activeProject === null && dialog.open) dialog.close();
  }, [activeProject]);

  useEffect(() => {
    if (!chatOpen) return;
    orbitCloseRef.current?.focus();
    const onEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setChatOpen(false); };
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [chatOpen]);

  function openProject(index: number, trigger: HTMLButtonElement) {
    modalTriggerRef.current = trigger;
    setActiveProject(index);
  }
  function openOrbit(trigger: HTMLButtonElement, index = selectedProject) {
    orbitTriggerRef.current = trigger;
    setSelectedProject(index);
    setChatOpen(true);
  }
  function closeOrbit() { setChatOpen(false); requestAnimationFrame(() => orbitTriggerRef.current?.focus()); }

  return <main id="content" className="dark-site">
    <a className="skip-link" href="#work">Skip to selected work</a>
    <div className={`preloader ${loading ? "is-loading" : "is-done"}`} aria-hidden="true"><div className="preloader-mark"><img src="/images/krishank-signature.png" alt="" /></div><div className="preloader-bottom"><span>KRISHANK KURETI / PORTFOLIO</span><span>WELCOME ↓</span></div></div>
    <div className="scroll-progress" style={{ width: `${scrollProgress}%` }} aria-hidden="true" /><GradualBlur position="bottom" height="12rem" divCount={8} strength={4} exponential opacity={1} target="page" style={{ bottom: "56px", zIndex: 60, opacity: scrolling ? 1 : 0, transition: reducedMotion ? "none" : `opacity ${scrolling ? "200ms" : "1500ms"} ease-out` }} />
    <nav className={`nav shell ${scrolled ? "nav-scrolled" : ""}`} aria-label="Main navigation"><a className="wordmark signature-wordmark" href="#top" onClick={() => setMenuOpen(false)}><img src="/images/krishank-signature.png" alt="Krishank Kureti home" /></a><MacOSSidebar open={menuOpen} onOpenChange={setMenuOpen} triggerRef={menuTriggerRef} items={[{ label: "Home", href: "#top" }, { label: "Work", href: "#work" }, { label: "About", href: "#about" }, { label: "Orbit", href: "#orbit" }, { label: "Contact", href: "#contact" }]} /></nav>

    <section id="top" ref={heroRef} className="hero shell"><div className="hero-meta"><span><i /> CS / AI ENGINEER</span><span>INDIA · 2026</span></div><div className="hero-stage"><motion.div className="hero-art identity-art hero-reveal" style={reducedMotion ? undefined : { y: artY, opacity: heroOpacity }}><HeroPortrait /></motion.div><motion.h1 className="hero-title" aria-label="Krishank Kureti" style={reducedMotion ? undefined : { y: titleY }}><HeroName /></motion.h1><div className="hero-caption"><span>SCROLL TO EXPLORE<br />↓</span></div></div><div className="hero-footer"><span>SELECTED WORK</span><span>01 — 04</span></div></section>

    <ProjectReel projects={projects} onOpen={openProject} />

    <section id="about" className="quote-section section-pad"><div className="shell quote-layout"><span className="eyebrow reveal">02 / BEYOND THE CODE</span><div className="quote-copy reveal"><blockquote>“The best systems<br />leave room for<br /><em>people.</em>”</blockquote><p>Curiosity belongs on both sides of the screen. This space is for the moments and ideas that shape the work beyond code.</p></div><div className="quote-photo quote-gallery reveal" aria-label="Three abstract photo placeholders"><div className="gallery-frame gallery-frame-a"><span>FRAME 01</span><small>PHOTO PLACEHOLDER</small></div><div className="gallery-frame gallery-frame-b"><span>FRAME 02</span><small>PHOTO PLACEHOLDER</small></div><div className="gallery-frame gallery-frame-c"><span>FRAME 03</span><small>PHOTO PLACEHOLDER</small></div></div></div></section>

    <section className="stack-section stack-dock" aria-label="Technologies"><div className="stack-track">{[...stack, ...stack].map(([name, slug], index) => <div className="stack-item" key={`${slug}-${index}`} aria-hidden={index >= stack.length}><TechLogo slug={slug} name={name} /><span>{name}</span><b aria-hidden="true">✳</b></div>)}</div></section>

    <section id="orbit" className="orbit-section shell section-pad"><div className="orbit-copy reveal"><span className="eyebrow">03 / ASK THE WORK</span><h2>Meet <em>Orbit.</em></h2><p>Explore a preview of a project-aware guide. Select a project to see its summary. Chat is not connected yet.</p><button className="light-button" type="button" onClick={(event) => openOrbit(event.currentTarget)}>OPEN ORBIT PREVIEW <span>↗</span></button></div><div className="orbit-card reveal"><div className="orbit-card-graphic"><div className="orbit-card-ring ring-a" /><div className="orbit-card-ring ring-b" /><strong>O</strong></div><div className="orbit-card-footer"><span>ORBIT / PROJECT PREVIEW</span><span>CHAT NOT CONNECTED</span></div></div></section>

    <section id="contact" className="contact-section shell section-pad"><div className="contact-heading"><span className="eyebrow">04 / INQUIRIES</span><h2>Let&apos;s make<br /><em>something useful.</em></h2><p>For collaborations, ideas, or a thoughtful hello.</p><Signature placement="contact" /></div><div className="contact-grid"><form onSubmit={async (event) => { event.preventDefault(); if (formStatus === "pending") return; const form = event.currentTarget; setFormStatus("pending"); try { const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(form))) }); if (!response.ok) throw new Error("Submission failed"); form.reset(); setFormStatus("saved"); } catch { setFormStatus("error"); } }} onChange={() => { if (formStatus === "saved" || formStatus === "error") setFormStatus("idle"); }}><label>Name<input name="name" required placeholder="Your name" /></label><label>Email<input name="email" type="email" required placeholder="you@example.com" /></label><label>Message<textarea name="message" required rows={4} placeholder="Tell me a little about it..." /></label><button className="light-button" type="submit" disabled={formStatus === "pending"}>{formStatus === "pending" ? "SAVING…" : "SEND MESSAGE ↗"}</button><small className={formStatus === "error" ? "form-error" : "form-status"} role="status" aria-live="polite">{formStatus === "error" ? "Couldn’t save your message. Please try again." : formStatus === "saved" ? "Message saved. Delivery or reply isn’t guaranteed." : ""}</small></form><div className="socials"><span className="eyebrow">FIND ME ONLINE</span><a href="https://www.linkedin.com/in/krishank-kureti-7a2771290/" target="_blank" rel="noreferrer">LinkedIn ↗</a><a href="https://github.com/krishank-kureti" target="_blank" rel="noreferrer">GitHub ↗</a><a href="https://x.com/KuretiKrishank" target="_blank" rel="noreferrer">X ↗</a></div></div></section>

    <footer className="shell footer"><span>© 2026 KRISHANK KURETI</span><span>BUILT WITH CURIOSITY + CAFFEINE</span><a href="#top">BACK TO TOP ↑</a></footer>

      <dialog ref={modalRef} className="project-modal electric-project-modal" aria-labelledby="project-dialog-title" onClose={() => { setActiveProject(null); modalTriggerRef.current?.focus(); }} onClick={(event) => { if (event.target === event.currentTarget) event.currentTarget.close(); }}>{activeProject !== null && <ElectricBorder color="#ff6474" speed={1} chaos={0.12} thickness={2}><button className="modal-close" type="button" onClick={() => modalRef.current?.close()} aria-label="Close project details">CLOSE ×</button><div className="modal-video">VIDEO PLACEHOLDER<div className="play" aria-hidden="true">▶</div></div><span className="eyebrow">{projects[activeProject].label}</span><h3 id="project-dialog-title">{projects[activeProject].title}</h3><p>{projects[activeProject].blurb}</p><button className="light-button" type="button" onClick={() => { const index = activeProject; orbitTriggerRef.current = modalTriggerRef.current; modalRef.current?.close(); setSelectedProject(index); setChatOpen(true); }}>VIEW IN ORBIT PREVIEW ↗</button></ElectricBorder>}</dialog>
     {chatOpen && <aside className="chat-widget" aria-label="Orbit project preview"><div className="chat-header"><div><b>ORBIT</b><span>PROJECT PREVIEW · CHAT NOT CONNECTED</span></div><button ref={orbitCloseRef} type="button" aria-label="Close Orbit preview" onClick={closeOrbit}>×</button></div><div className="chat-body"><p className="chat-bubble">Preview only: choose a project to read its summary. Questions cannot be sent yet.</p>{projects.map((project, index) => <button type="button" className="chat-choice" key={project.title} aria-pressed={selectedProject === index} onClick={() => setSelectedProject(index)}>{project.title}<span aria-hidden="true">{selectedProject === index ? "✓" : "↗"}</span></button>)}<p className="chat-bubble"><strong>{projects[selectedProject].title}</strong><br />{projects[selectedProject].blurb}</p></div><div className="orbit-search"><span className="orbit-search-icon" aria-hidden="true">⌕</span><input value={chatQuery} onChange={(event) => setChatQuery(event.target.value)} aria-label="Ask Orbit" placeholder="Ask about this project…" /><button type="button" disabled={!chatQuery.trim()} aria-label="Send question">↑</button></div></aside>}
    <style jsx global>{`
      .quote-gallery{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:9px;padding:9px;background:#282d29}
      .gallery-frame{position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:space-between;padding:12px;color:#f8f7ed;font:9px 'DM Mono';letter-spacing:.08em;isolation:isolate}
      .gallery-frame::before{content:"";position:absolute;z-index:-1;inset:-12%;filter:blur(2px);transform:rotate(-7deg)}
      .gallery-frame-a{grid-row:span 2}.gallery-frame-a::before{background:radial-gradient(ellipse at 58% 66%,#d1bc8a 0 12%,transparent 40%),linear-gradient(155deg,#4c615e 0 35%,#c8a886 36% 53%,#303d39 54%)}
      .gallery-frame-b::before{background:radial-gradient(circle at 68% 35%,#ead9a4 0 12%,transparent 13%),linear-gradient(130deg,#52695e 0 40%,#b8a68e 41% 60%,#535d4e 61%)}
      .gallery-frame-c::before{background:linear-gradient(155deg,#b6c4b6 0 37%,#455c54 38% 44%,#c9b894 45% 70%,#303f39 71%)}
      .gallery-frame small{font:8px 'DM Mono';letter-spacing:.08em}
      .form-status{display:block;color:var(--acid);font:10px 'DM Mono';margin-top:14px}
       .project-modal.electric-project-modal{border:0;max-height:calc(100dvh - 32px);overflow:visible}
      .project-modal::backdrop{background:#000b}
      .chat-choice{width:100%;background:transparent;color:var(--paper);text-align:left;cursor:pointer}
      .chat-choice[aria-pressed="true"]{border-color:var(--acid);color:var(--acid)}
      .chat-input input:disabled,.chat-input button:disabled{opacity:.5;cursor:not-allowed}
      .skip-link{position:absolute;z-index:100;top:10px;left:10px;transform:translateY(-150%);background:var(--acid);color:var(--ink);padding:12px}.skip-link:focus{transform:none}
      #work:focus{outline:none}
        @media(max-width:800px){.nav{position:relative;z-index:82}.nav .menu-pill{display:none}}
      @media(prefers-reduced-motion:reduce){.stack-track{animation:none}.reveal,.hero-reveal{opacity:1!important;transform:none!important}.preloader{transition:none!important}}
    `}</style>
  </main>;
}
