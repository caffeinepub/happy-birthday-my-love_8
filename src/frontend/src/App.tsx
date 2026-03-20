import { useCallback, useEffect, useRef, useState } from "react";
import { WalkingCatsLayer } from "./components/WalkingCat";
import { createActorWithConfig } from "./config";

// ─── Colorful Particle Canvas ──────────────────────────────────────────────────
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    const onResize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W;
      canvas.height = H;
    };
    window.addEventListener("resize", onResize);

    const hues = [196, 135, 72, 295, 180, 55];

    interface Particle {
      x: number;
      y: number;
      size: number;
      speed: number;
      drift: number;
      opacity: number;
      type: "star" | "circle" | "dot";
      hue: number;
      age: number;
      maxAge: number;
    }

    const particles: Particle[] = [];

    const spawn = (): Particle => ({
      x: Math.random() * W,
      y: H + 20,
      size: Math.random() * 8 + 2,
      speed: Math.random() * 0.5 + 0.2,
      drift: (Math.random() - 0.5) * 0.4,
      opacity: 0,
      type: ["star", "circle", "dot"][Math.floor(Math.random() * 3)] as
        | "star"
        | "circle"
        | "dot",
      hue: hues[Math.floor(Math.random() * hues.length)],
      age: 0,
      maxAge: Math.random() * 300 + 180,
    });

    for (let i = 0; i < 40; i++) {
      const p = spawn();
      p.y = Math.random() * H;
      p.age = Math.floor(Math.random() * p.maxAge);
      particles.push(p);
    }

    const drawStar = (x: number, y: number, size: number) => {
      const r1 = size * 0.5;
      const r2 = size * 0.2;
      ctx.save();
      ctx.translate(x, y);
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a1 = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const a2 = ((i * 4 + 2) * Math.PI) / 5 - Math.PI / 2;
        if (i === 0) ctx.moveTo(Math.cos(a1) * r1, Math.sin(a1) * r1);
        else ctx.lineTo(Math.cos(a1) * r1, Math.sin(a1) * r1);
        ctx.lineTo(Math.cos(a2) * r2, Math.sin(a2) * r2);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const tick = () => {
      ctx.clearRect(0, 0, W, H);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.age++;
        p.y -= p.speed;
        p.x += p.drift;
        const life = p.age / p.maxAge;
        p.opacity =
          life < 0.1 ? life * 10 : life > 0.85 ? (1 - life) / 0.15 : 1;
        if (p.age >= p.maxAge) {
          particles.splice(i, 1);
          particles.push(spawn());
          continue;
        }
        const chroma = p.hue === 72 ? "0.14" : p.hue === 135 ? "0.16" : "0.18";
        ctx.fillStyle = `oklch(0.80 ${chroma} ${p.hue} / ${p.opacity * 0.5})`;
        if (p.type === "star") drawStar(p.x, p.y, p.size);
        else if (p.type === "circle") {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.35, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.18, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <canvas ref={canvasRef} id="particle-canvas" tabIndex={-1} />;
}

// ─── Scroll Reveal Hook ───────────────────────────────────────────────────────
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(
      ".reveal, .reveal-left, .reveal-right",
    );
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
    );
    for (const el of els) observer.observe(el);
    return () => observer.disconnect();
  }, []);
}

// ─── Timeline Draw Hook ────────────────────────────────────────────────────────
function useTimelineSpine() {
  const spineRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const spine = spineRef.current;
    if (!spine) return;
    const section = spine.parentElement;
    if (!section) return;
    const update = () => {
      const rect = section.getBoundingClientRect();
      const viewH = window.innerHeight;
      const progress = Math.max(
        0,
        Math.min(1, (viewH - rect.top) / (rect.height + viewH)),
      );
      spine.style.height = `${progress * 100}%`;
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, []);
  return spineRef;
}

// ─── Section Badge ────────────────────────────────────────────────────────────
function SectionBadge({
  chapter,
  label,
  color,
}: { chapter: string; label: string; color: string }) {
  return (
    <div
      className="section-badge"
      style={{
        color,
        borderColor: color,
      }}
    >
      <span
        style={{
          display: "inline-block",
        }}
      >
        ✦
      </span>
      {chapter} · {label}
    </div>
  );
}

// ─── Kurzgesagt Bird Character ────────────────────────────────────────────────
function KurzgesagtBird({
  src,
  size = 150,
  animDelay = 0,
  className = "",
  style,
}: {
  src: string;
  size?: number;
  animDelay?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      className={`bird-character ${className}`}
      style={{
        width: size,
        animationDelay: `${animDelay}s`,
        ...style,
      }}
    />
  );
}

// ─── Game HUD ─────────────────────────────────────────────────────────────────
interface Achievement {
  id: string;
  text: string;
  emoji: string;
}

function GameHUD() {
  const [views, setViews] = useState<number>(0);

  useEffect(() => {
    createActorWithConfig()
      .then((actor: any) => {
        actor
          .recordVisit()
          .then((count) => {
            setViews(Number(count));
          })
          .catch(() => {
            /* silently ignore */
          });
      })
      .catch(() => {
        /* silently ignore */
      });
  }, []);
  const [scrollPct, setScrollPct] = useState(0);
  const [achievement, setAchievement] = useState<Achievement | null>(null);
  const [hiding, setHiding] = useState(false);
  const unlockedRef = useRef<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sectionAchievements: Record<string, Achievement> = {
    story: { id: "story", emoji: "✨", text: "Chapter Unlocked!" },
    "for-you": { id: "for-you", emoji: "💫", text: "Love Story Found!" },
    gallery: { id: "gallery", emoji: "📸", text: "Gallery Discovered!" },
    gifts: { id: "gifts", emoji: "🎁", text: "Gifts Revealed!" },
    "love-letter": {
      id: "love-letter",
      emoji: "💌",
      text: "Love Letter Unlocked!",
    },
  };

  const showAchievement = useCallback((ach: Achievement) => {
    if (unlockedRef.current.has(ach.id)) return;
    unlockedRef.current.add(ach.id);
    setHiding(false);
    setAchievement(ach);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setHiding(true);
      timerRef.current = setTimeout(() => setAchievement(null), 400);
    }, 2200);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docH > 0 ? (scrollTop / docH) * 100 : 0;
      setScrollPct(pct);

      // Section detection
      for (const [id, ach] of Object.entries(sectionAchievements)) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.6) {
          showAchievement(ach);
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [showAchievement]);

  return (
    <>
      {/* Rainbow scroll progress bar */}
      <div
        id="scroll-progress"
        style={{ width: `${scrollPct}%` }}
        aria-hidden="true"
      />

      {/* Views counter */}
      <div
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full"
        style={{
          background: "oklch(0.14 0.06 220 / 0.90)",
          border: "2px solid oklch(0.55 0.16 196 / 0.50)",
          backdropFilter: "blur(12px)",
        }}
        data-ocid="hud.panel"
      >
        <span style={{ fontSize: "1.1rem" }}>👁</span>
        <span
          className="font-bold text-sm tabular-nums"
          style={{ color: "oklch(0.82 0.18 196)", minWidth: "3ch" }}
        >
          {views.toLocaleString()}
        </span>
        <span className="text-xs" style={{ color: "oklch(0.60 0.08 196)" }}>
          views
        </span>
      </div>

      {/* Achievement toast */}
      {achievement && (
        <div
          className={`fixed bottom-20 right-6 z-50 achievement-toast${
            hiding ? " hiding" : ""
          } flex items-center gap-3 px-5 py-3 rounded-2xl`}
          style={{
            background: "oklch(0.18 0.06 280 / 0.92)",
            border: "2px solid oklch(0.82 0.18 196 / 0.50)",
            backdropFilter: "blur(16px)",
          }}
          data-ocid="hud.toast"
        >
          <span style={{ fontSize: "1.5rem" }}>{achievement.emoji}</span>
          <div>
            <div
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: "oklch(0.82 0.18 196)" }}
            >
              Achievement
            </div>
            <div
              className="text-sm font-semibold"
              style={{ color: "oklch(0.95 0.02 280)" }}
            >
              {achievement.text}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Photo Slot ───────────────────────────────────────────────────────────────
function PhotoSlot({
  label = "Meghna's Photo",
  src,
  className = "",
  style,
  glowColor,
}: {
  label?: string;
  src?: string;
  className?: string;
  style?: React.CSSProperties;
  glowColor?: string;
}) {
  if (src) {
    return (
      <div
        className={`photo-placeholder ${className}`}
        style={{
          ...style,
          border: glowColor ? `2px solid ${glowColor}` : undefined,
          padding: 0,
          overflow: "hidden",
        }}
      >
        <img
          src={src}
          alt={label}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`photo-placeholder ${className}`}
      style={{
        ...style,
        border: glowColor ? `2px solid ${glowColor}` : undefined,
      }}
    >
      <span style={{ fontSize: "2rem" }}>📷</span>
      <span style={{ opacity: 0.7 }}>[ {label} ]</span>
    </div>
  );
}

// ─── Navigation ───────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { label: "Home", href: "#home" },
    { label: "Our Story", href: "#story" },
    { label: "For You", href: "#for-you" },
    { label: "Gallery", href: "#gallery" },
    { label: "Gifts", href: "#gifts" },
    { label: "Love Letter", href: "#love-letter" },
  ];

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        background: scrolled ? "oklch(0.14 0.07 280 / 0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(24px)" : "none",
        borderBottom: scrolled
          ? "1px solid oklch(0.40 0.10 280 / 0.35)"
          : "none",
        marginTop: "4px",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <a
          href="#home"
          className="font-script text-2xl"
          style={{ color: "var(--neon-amber)" }}
          data-ocid="nav.link"
        >
          Our Story
        </a>
        <nav className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="nav-link"
              data-ocid="nav.link"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="hidden lg:block">
          <button
            type="button"
            className="btn-primary text-sm py-2"
            data-ocid="nav.button"
          >
            🎂 Happy Birthday!
          </button>
        </div>
        <button
          type="button"
          className="lg:hidden p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
          data-ocid="nav.toggle"
          style={{ color: "var(--neon-cyan)" }}
        >
          <div className="w-6 flex flex-col gap-1.5">
            {["top", "mid", "bot"].map((lineId) => (
              <span
                key={lineId}
                className="h-0.5 w-full block transition-all"
                style={{
                  background: "var(--neon-cyan)",
                  transform:
                    mobileOpen && lineId === "top"
                      ? "rotate(45deg) translate(3px, 5px)"
                      : mobileOpen && lineId === "bot"
                        ? "rotate(-45deg) translate(3px, -5px)"
                        : undefined,
                  opacity: mobileOpen && lineId === "mid" ? 0 : 1,
                }}
              />
            ))}
          </div>
        </button>
      </div>
      {mobileOpen && (
        <div
          className="lg:hidden px-6 pb-6 flex flex-col gap-4"
          style={{
            background: "oklch(0.14 0.07 280 / 0.97)",
            borderBottom: "1px solid oklch(0.40 0.10 280 / 0.35)",
          }}
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="nav-link text-base"
              onClick={() => setMobileOpen(false)}
              data-ocid="nav.link"
            >
              {link.label}
            </a>
          ))}
          <button
            type="button"
            className="btn-primary self-start mt-2"
            data-ocid="nav.button"
          >
            🎂 Happy Birthday!
          </button>
        </div>
      )}
    </header>
  );
}

// ─── Hero Section ─────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section
      id="home"
      className="section section-hero min-h-screen flex items-center pt-24 pb-16"
    >
      <div className="max-w-6xl mx-auto w-full">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-6">
            <div className="reveal">
              <SectionBadge
                chapter="Chapter 1"
                label="The Beginning"
                color="oklch(0.82 0.18 196)"
              />
              <h1
                className="font-script leading-tight mt-4"
                style={{
                  fontSize: "clamp(3rem, 7vw, 5.5rem)",
                  lineHeight: 1.15,
                }}
              >
                <span className="shimmer-text">Happy Birthday,</span>
                <br />
                <span className="gold-text">Meghna!</span>
              </h1>
            </div>

            <p
              className="reveal text-lg leading-relaxed"
              style={{
                color: "oklch(0.82 0.04 280)",
                maxWidth: "38ch",
                transitionDelay: "0.15s",
              }}
            >
              Every moment with you is a gift. Today, we celebrate you your
              radiance, your brilliance, and the beautiful love we share.
            </p>

            <div
              className="reveal flex flex-wrap gap-4"
              style={{ transitionDelay: "0.3s" }}
            >
              <a
                href="#story"
                className="btn-primary"
                data-ocid="hero.primary_button"
              >
                Explore Our Story ↓
              </a>
              <a
                href="#love-letter"
                className="btn-outline"
                data-ocid="hero.secondary_button"
              >
                Read Your Letter
              </a>
            </div>

            <div
              className="reveal flex items-center gap-3 mt-2"
              style={{ transitionDelay: "0.45s" }}
            >
              <span
                style={{ color: "oklch(0.65 0.08 280)", fontSize: "0.9rem" }}
              >
                ✦ With all my love, always &amp; forever
              </span>
            </div>
          </div>

          <div
            className="reveal flex justify-center relative"
            style={{ transitionDelay: "0.2s" }}
          >
            <div className="relative" style={{ width: "min(340px, 80vw)" }}>
              <img
                src="/assets/uploads/20260114_180045-1-1.jpg"
                alt="Meghna"
                className="w-full rounded-3xl object-cover"
                style={{
                  aspectRatio: "3/4",
                  boxShadow: "0 0 40px oklch(0.55 0.18 196 / 0.5)",
                }}
              />
              <div
                className="absolute -bottom-4 -right-4 px-4 py-2 text-sm font-bold rounded-2xl"
                style={{
                  background: "oklch(0.20 0.08 280 / 0.9)",
                  border: "2px solid oklch(0.65 0.16 72 / 0.6)",
                  color: "var(--neon-amber)",
                  backdropFilter: "blur(8px)",
                }}
              >
                🎂 Happy Birthday!
              </div>
            </div>

            {/* Waving bird mascot */}
            <KurzgesagtBird
              src="/assets/generated/kurzgesagt-bird-wave-transparent.dim_300x350.png"
              size={160}
              animDelay={0}
              style={{
                position: "absolute",
                top: -30,
                right: -20,
                zIndex: 10,
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Timeline Section ─────────────────────────────────────────────────────────
const timelineEntries = [
  {
    title: "The Day We Met",
    date: "[ Date ]",
    text: "The story of how we met our universe began the moment I first saw you, Meghna. From that very instant, everything changed.",
    side: "left" as const,
    accent: "oklch(0.82 0.18 196)",
  },
  {
    title: "Our First Date",
    date: "[ Date ]",
    text: "Describe your first date together here. Every detail the place, the conversation, the nervous excitement all those little moments that made the night unforgettable.",
    side: "right" as const,
    accent: "oklch(0.75 0.20 350)",
    image: "/assets/uploads/IMG_20240501_190730-1.jpg",
  },
  {
    title: "When I Knew",
    date: "[ Date ]",
    text: "Tell the story of the moment you realized she was the one. Maybe it was a quiet Tuesday, or a grand adventure but something clicked and you knew this was real love.",
    side: "left" as const,
    accent: "oklch(0.82 0.16 72)",
    image: "/assets/uploads/IMG_20240501_190730-1.jpg",
  },
  {
    title: "Today & Always",
    date: "[ Date ]",
    text: "The story isn't over it's just beginning. Today on her birthday, celebrate how far you've come together and all the beautiful chapters still ahead.",
    side: "right" as const,
    accent: "oklch(0.82 0.18 135)",
    image: "/assets/uploads/20260114_180045-1-1.jpg",
  },
];

function TimelineSection() {
  const spineRef = useTimelineSpine();

  return (
    <section id="story" className="section section-story">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-20 reveal relative">
          <SectionBadge
            chapter="Chapter 2"
            label="Our Journey"
            color="oklch(0.75 0.20 350)"
          />
          <h2
            className="font-display mt-5"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
          >
            <span className="rainbow-text">How We Met ✨</span>
          </h2>
          <div
            className="mx-auto mt-4"
            style={{
              width: 80,
              height: 3,
              background:
                "linear-gradient(90deg, transparent, oklch(0.75 0.20 350), transparent)",
              borderRadius: 4,
            }}
          />
          {/* Wonder bird beside heading */}
          <KurzgesagtBird
            src="/assets/generated/kurzgesagt-bird-wonder-transparent.dim_280x320.png"
            size={130}
            animDelay={0.6}
            style={{
              position: "absolute",
              right: -20,
              top: -10,
            }}
          />
        </div>

        <div className="relative">
          <div
            className="absolute left-1/2 top-0 w-0.5 h-full -translate-x-1/2 hidden md:block"
            style={{ background: "oklch(0.35 0.06 310 / 0.4)" }}
          >
            <div
              ref={spineRef}
              className="timeline-spine absolute left-0 top-0 w-full"
              style={{ height: "0%" }}
            />
          </div>

          <div className="flex flex-col gap-16">
            {timelineEntries.map((entry, i) => (
              <div
                key={entry.title}
                className={
                  entry.side === "left" ? "reveal-left" : "reveal-right"
                }
                style={{ transitionDelay: `${i * 0.12}s` }}
              >
                <div className="flex items-center gap-6 md:gap-0">
                  <div
                    className={`hidden md:flex md:w-5/12 ${
                      entry.side === "left"
                        ? "justify-end pr-10"
                        : "justify-start pl-10 order-last"
                    }`}
                  >
                    <div
                      className="glass-card p-5 max-w-xs"
                      style={{ border: `1px solid ${entry.accent}44` }}
                    >
                      <PhotoSlot
                        label="Meghna's Photo"
                        src={(entry as any).image}
                        className="mb-4"
                        style={{ height: 140 } as React.CSSProperties}
                        glowColor={entry.accent}
                      />
                      <div
                        className="text-xs mb-1"
                        style={{ color: entry.accent }}
                      >
                        ◆ {entry.date}
                      </div>
                      <h3
                        className="font-display text-lg mb-2"
                        style={{ color: "oklch(0.95 0.02 280)" }}
                      >
                        {entry.title}
                      </h3>
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: "oklch(0.72 0.04 280)" }}
                      >
                        {entry.text}
                      </p>
                    </div>
                  </div>

                  <div className="hidden md:flex w-2/12 justify-center relative z-10">
                    <div
                      className="timeline-dot"
                      style={{
                        background: `linear-gradient(135deg, ${entry.accent}, oklch(0.72 0.22 295))`,
                      }}
                    />
                  </div>

                  <div className="w-full md:w-5/12">
                    <div className="glass-card p-5 md:hidden">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="timeline-dot" />
                        <div>
                          <div
                            className="text-xs"
                            style={{ color: entry.accent }}
                          >
                            ◆ {entry.date}
                          </div>
                          <h3
                            className="font-display text-lg"
                            style={{ color: "oklch(0.95 0.02 280)" }}
                          >
                            {entry.title}
                          </h3>
                        </div>
                      </div>
                      <PhotoSlot
                        label="Meghna's Photo"
                        src={(entry as any).image}
                        className="mb-3"
                        style={{ height: 120 } as React.CSSProperties}
                        glowColor={entry.accent}
                      />
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: "oklch(0.72 0.04 280)" }}
                      >
                        {entry.text}
                      </p>
                    </div>
                    <div className="hidden md:block" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── For You Section ──────────────────────────────────────────────────────────
function ForYouSection() {
  return (
    <section id="for-you" className="section section-foryou">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16 reveal relative">
          <SectionBadge
            chapter="Chapter 3"
            label="Why I Love You"
            color="oklch(0.82 0.18 135)"
          />
          <h2
            className="font-display mt-5"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
          >
            <span className="shimmer-text">Everything About You 💫</span>
          </h2>
          <div
            className="mx-auto mt-4"
            style={{
              width: 80,
              height: 3,
              background:
                "linear-gradient(90deg, transparent, oklch(0.82 0.18 135), transparent)",
              borderRadius: 4,
            }}
          />
          {/* Heart bird mascot */}
          <KurzgesagtBird
            src="/assets/generated/kurzgesagt-bird-heart-transparent.dim_300x350.png"
            size={140}
            animDelay={1.0}
            style={{
              position: "absolute",
              left: -10,
              top: -20,
            }}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-8 stagger-grid">
          {[
            {
              color: "oklch(0.75 0.20 350)",
              tag: "✦ Her Beauty",
              title: "Your Radiance & Grace",
              photo: "Meghna's Photo",
              text: "Meghna, your beauty is unlike anything in this universe the way you smile lights up every room, and every moment with you feels like the most beautiful thing I've ever witnessed.",
            },
            {
              color: "oklch(0.82 0.16 72)",
              tag: "✦ Her Mind",
              title: "Your Brilliant Mind",
              photo: "Meghna's Photo",
              text: "Meghna, your mind is one of the most extraordinary things about you. Your brilliance, creativity, and the way you see the world never ceases to amaze me you inspire me every single day.",
            },
          ].map((card, cardIdx) => (
            <div
              key={card.title}
              className="reveal glass-card overflow-hidden"
              style={{
                transitionDelay: `${(cardIdx + 1) * 0.12}s`,
                border: `1px solid ${card.color}33`,
              }}
            >
              <div style={{ padding: "1.75rem" }}>
                <PhotoSlot
                  label={card.photo}
                  className="mb-5 w-full"
                  style={{ height: 220 } as React.CSSProperties}
                  glowColor={card.color}
                />
                <div
                  className="inline-block text-xs uppercase tracking-widest mb-3 px-3 py-1 rounded-full"
                  style={{
                    background: `${card.color}22`,
                    color: card.color,
                    border: `1px solid ${card.color}55`,
                  }}
                >
                  {card.tag}
                </div>
                <h3
                  className="font-display text-2xl mb-3"
                  style={{ color: "oklch(0.95 0.02 280)" }}
                >
                  {card.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "oklch(0.72 0.04 280)" }}
                >
                  {card.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Gallery Section ──────────────────────────────────────────────────────────
const gallerySlots = [
  {
    label: "Little Meghna 🌊",
    color: "oklch(0.82 0.18 196)",
    src: "/assets/uploads/WhatsApp-Image-2026-03-20-at-3.23.26-PM-1-4.jpeg",
  },
  {
    label: "Sun-Kissed Queen ☀️",
    color: "oklch(0.75 0.18 50)",
    src: "/assets/uploads/WhatsApp-Image-2026-03-20-at-3.19.26-PM-5.jpeg",
  },
  {
    label: "Gokarna Vibes 🌺",
    color: "oklch(0.72 0.22 295)",
    src: "/assets/uploads/20260208_124551-11.jpg",
  },
  {
    label: "Burger Queen 🍔",
    color: "oklch(0.75 0.20 350)",
    src: "/assets/uploads/WhatsApp-Image-2026-03-20-at-3.19.49-PM-2.jpeg",
  },
  {
    label: "Our First Years ☕",
    color: "oklch(0.82 0.16 72)",
    src: "/assets/uploads/IMG-20191002-WA0084-1.jpg",
  },
  {
    label: "Christmas Together 🎄",
    color: "oklch(0.82 0.18 135)",
    src: "/assets/uploads/IMG-20191224-WA0012-3.jpg",
  },
  {
    label: "Winter Times 🥂",
    color: "oklch(0.75 0.20 350)",
    src: "/assets/uploads/IMG_20211231_172143-10.jpg",
  },
  {
    label: "Snow & Smiles ⛄",
    color: "oklch(0.80 0.14 196)",
    src: "/assets/uploads/IMG-20250413-WA0012-6.jpg",
  },
  {
    label: "Coldplay with You 🎵",
    color: "oklch(0.82 0.18 135)",
    src: "/assets/uploads/IMG-20250119-WA0027-7.jpg",
  },
  {
    label: "Sunset Together 🌅",
    color: "oklch(0.75 0.20 350)",
    src: "/assets/uploads/IMG-20250121-WA0170-8.jpg",
  },
  {
    label: "Gateway of India 🏛️",
    color: "oklch(0.82 0.16 72)",
    src: "/assets/uploads/IMG-20250121-WA0120-9.jpg",
  },
];

function GallerySection() {
  const [selectedPhoto, setSelectedPhoto] = useState<
    (typeof gallerySlots)[0] | null
  >(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedPhoto(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <section id="gallery" className="section section-gallery">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 reveal relative">
          <SectionBadge
            chapter="Chapter 4"
            label="Her Most Beautiful Moments"
            color="oklch(0.82 0.18 196)"
          />
          <h2
            className="font-display mt-5"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
          >
            <span className="shimmer-text">📸 A Gallery of Beauty</span>
          </h2>
          <p
            className="mt-3 text-base"
            style={{ color: "oklch(0.70 0.06 200)" }}
          >
            Every photo of Meghna is a masterpiece. Every moment, irreplaceable.
          </p>
          <div
            className="mx-auto mt-4"
            style={{
              width: 80,
              height: 3,
              background:
                "linear-gradient(90deg, transparent, oklch(0.82 0.18 196), transparent)",
              borderRadius: 4,
            }}
          />
          {/* Dancing bird mascot */}
          <KurzgesagtBird
            src="/assets/generated/kurzgesagt-bird-dance-transparent.dim_280x340.png"
            size={130}
            animDelay={0.4}
            style={{
              position: "absolute",
              right: 20,
              top: -15,
            }}
          />
        </div>

        {/* Row 1: 3 featured photos */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          {gallerySlots.slice(0, 3).map((slot, i) => (
            <div
              key={slot.label}
              className="gallery-slot reveal relative"
              style={{ transitionDelay: `${i * 0.1}s` }}
              data-ocid={`gallery.item.${i + 1}`}
            >
              <div
                className="w-full overflow-hidden rounded-[18px] cursor-pointer transition-transform duration-200 hover:scale-[1.02]"
                onKeyDown={(e) => {
                  if (e.key === "Enter") setSelectedPhoto(slot);
                }}
                style={{
                  height: 300,
                  border: `2px solid ${slot.color}`,
                  background: "oklch(0.10 0.04 260)",
                }}
                onClick={() => setSelectedPhoto(slot)}
              >
                <img
                  src={slot.src}
                  alt={slot.label}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              </div>
              <div
                className="absolute bottom-3 left-3 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest"
                style={{
                  background: `${slot.color}33`,
                  color: slot.color,
                  border: `1px solid ${slot.color}55`,
                  backdropFilter: "blur(8px)",
                }}
              >
                {slot.label}
              </div>
            </div>
          ))}
        </div>

        {/* Row 2: 4 medium photos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {gallerySlots.slice(3, 7).map((slot, i) => (
            <div
              key={slot.label}
              className="gallery-slot reveal relative"
              style={{ transitionDelay: `${(i + 3) * 0.1}s` }}
              data-ocid={`gallery.item.${i + 4}`}
            >
              <div
                className="w-full overflow-hidden rounded-[14px] cursor-pointer transition-transform duration-200 hover:scale-[1.02]"
                onKeyDown={(e) => {
                  if (e.key === "Enter") setSelectedPhoto(slot);
                }}
                style={{
                  height: 220,
                  border: `2px solid ${slot.color}`,
                  background: "oklch(0.10 0.04 260)",
                }}
                onClick={() => setSelectedPhoto(slot)}
              >
                <img
                  src={slot.src}
                  alt={slot.label}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              </div>
              <div
                className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
                style={{
                  background: `${slot.color}33`,
                  color: slot.color,
                  border: `1px solid ${slot.color}55`,
                  backdropFilter: "blur(8px)",
                  fontSize: "0.6rem",
                }}
              >
                {slot.label}
              </div>
            </div>
          ))}
        </div>

        {/* Row 3: 4 medium photos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {gallerySlots.slice(7, 11).map((slot, i) => (
            <div
              key={slot.label}
              className="gallery-slot reveal relative"
              style={{ transitionDelay: `${(i + 7) * 0.1}s` }}
              data-ocid={`gallery.item.${i + 8}`}
            >
              <div
                className="w-full overflow-hidden rounded-[14px] cursor-pointer transition-transform duration-200 hover:scale-[1.02]"
                onKeyDown={(e) => {
                  if (e.key === "Enter") setSelectedPhoto(slot);
                }}
                style={{
                  height: 220,
                  border: `2px solid ${slot.color}`,
                  background: "oklch(0.10 0.04 260)",
                }}
                onClick={() => setSelectedPhoto(slot)}
              >
                <img
                  src={slot.src}
                  alt={slot.label}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              </div>
              <div
                className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
                style={{
                  background: `${slot.color}33`,
                  color: slot.color,
                  border: `1px solid ${slot.color}55`,
                  backdropFilter: "blur(8px)",
                  fontSize: "0.6rem",
                }}
              >
                {slot.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {selectedPhoto && (
        <div
          data-ocid="gallery.modal"
          tabIndex={-1}
          onKeyDown={(e) => {
            if (e.key === "Escape") setSelectedPhoto(null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "oklch(0.05 0.02 260 / 0.93)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            animation: "fadeIn 0.2s ease",
          }}
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            onKeyDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <img
              src={selectedPhoto.src}
              alt={selectedPhoto.label}
              style={{
                maxWidth: "90vw",
                maxHeight: "80vh",
                objectFit: "contain",
                borderRadius: 16,
                boxShadow: `0 0 60px ${selectedPhoto.color}44`,
                border: `2px solid ${selectedPhoto.color}88`,
              }}
            />
          </div>
          <div
            className="mt-4 px-5 py-2 rounded-full font-bold uppercase tracking-widest text-sm"
            style={{
              background: `${selectedPhoto.color}22`,
              color: selectedPhoto.color,
              border: `1px solid ${selectedPhoto.color}66`,
              backdropFilter: "blur(10px)",
            }}
          >
            {selectedPhoto.label}
          </div>
          <button
            type="button"
            data-ocid="gallery.close_button"
            onClick={() => setSelectedPhoto(null)}
            className="mt-4 px-4 py-1 rounded-full text-sm opacity-60 hover:opacity-100 transition-opacity"
            style={{
              color: "oklch(0.85 0.04 260)",
              border: "1px solid oklch(0.40 0.04 260)",
            }}
          >
            ✕ Close
          </button>
        </div>
      )}
    </section>
  );
}

// ─── Gifts Section ────────────────────────────────────────────────────────────
const giftCards = [
  {
    title: "Special Gift #1 for Meghna",
    gradient:
      "linear-gradient(135deg, oklch(0.22 0.10 40), oklch(0.28 0.12 350))",
    accent: "oklch(0.82 0.16 72)",
    emoji: "🎁",
    sparkles: ["✨", "⭐", "💫"],
  },
  {
    title: "Special Gift #2 for Meghna",
    gradient:
      "linear-gradient(135deg, oklch(0.22 0.10 350), oklch(0.26 0.12 295))",
    accent: "oklch(0.75 0.20 350)",
    emoji: "🎀",
    sparkles: ["💖", "✨", "🌸"],
  },
  {
    title: "Special Gift #3 for Meghna",
    gradient:
      "linear-gradient(135deg, oklch(0.20 0.10 295), oklch(0.24 0.12 196))",
    accent: "oklch(0.82 0.18 196)",
    emoji: "🌟",
    sparkles: ["💜", "⭐", "✨"],
  },
];

function GiftsSection() {
  return (
    <section id="gifts" className="section section-gifts">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16 reveal">
          <SectionBadge
            chapter="Chapter 5"
            label="Gifts For You"
            color="oklch(0.82 0.16 72)"
          />
          <h2
            className="font-display mt-5"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
          >
            <span className="gold-text">With Love, For You 🎁</span>
          </h2>
          <p
            className="mt-3 text-base"
            style={{ color: "oklch(0.72 0.08 40)" }}
          >
            Something special is coming... check back soon!
          </p>
          <div
            className="mx-auto mt-4"
            style={{
              width: 80,
              height: 3,
              background:
                "linear-gradient(90deg, transparent, oklch(0.82 0.16 72), transparent)",
              borderRadius: 4,
            }}
          />
        </div>

        <div className="grid sm:grid-cols-3 gap-6 stagger-grid">
          {giftCards.map((card, i) => (
            <div
              key={card.title}
              className="gift-card reveal"
              style={{
                background: card.gradient,
                transitionDelay: `${i * 0.14}s`,
                minHeight: 280,
              }}
              data-ocid={`gifts.item.${i + 1}`}
            >
              {/* Sparkle overlay */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(circle at 30% 30%, oklch(1 0 0 / 0.06) 0%, transparent 60%)",
                  borderRadius: 24,
                }}
              />
              {/* Lock overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
                {/* Floating sparkles */}
                <div className="flex gap-2 mb-1">
                  {card.sparkles.map((s, sparkleIdx) => (
                    <span
                      key={s}
                      className="sparkle"
                      style={{
                        fontSize: "1.2rem",
                        animationDelay: `${sparkleIdx * 0.4}s`,
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>

                <span
                  style={{
                    fontSize: "4rem",
                    animation: "bounce-float 3s ease-in-out infinite",
                    display: "inline-block",
                    animationDelay: `${i * 0.4}s`,
                  }}
                >
                  {card.emoji}
                </span>

                <div>
                  <div
                    className="text-2xl mb-1"
                    style={{ color: "oklch(0.95 0.02 40)" }}
                  >
                    🔒
                  </div>
                  <h3
                    className="font-display text-lg font-bold"
                    style={{ color: card.accent }}
                  >
                    {card.title}
                  </h3>
                  <p
                    className="text-xs mt-1 uppercase tracking-widest"
                    style={{ color: "oklch(0.70 0.06 40)" }}
                  >
                    Mystery unlocking soon…
                  </p>
                </div>

                {/* Dotted border decoration */}
                <div
                  style={{
                    position: "absolute",
                    inset: 8,
                    borderRadius: 18,
                    border: `2px dashed ${card.accent}44`,
                    pointerEvents: "none",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Love Letter Section ──────────────────────────────────────────────────────
function LoveLetter() {
  return (
    <section id="love-letter" className="section section-letter">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12 reveal relative">
          <SectionBadge
            chapter="Chapter 6"
            label="From My Heart"
            color="oklch(0.75 0.20 350)"
          />
          <h2
            className="font-script mt-5"
            style={{
              fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
              color: "var(--neon-pink)",
            }}
          >
            A Love Letter to You
          </h2>
        </div>

        <div
          className="glass-card reveal overflow-hidden"
          style={{
            transitionDelay: "0.1s",
            border: "1px solid oklch(0.75 0.20 350 / 0.30)",
          }}
        >
          <div className="grid md:grid-cols-5 gap-0">
            <div
              className="md:col-span-3 p-8 md:p-12"
              style={{ borderRight: "1px solid oklch(0.35 0.08 350 / 0.3)" }}
            >
              <div
                className="font-script text-2xl mb-6"
                style={{ color: "var(--neon-pink)" }}
              >
                Meghna,
              </div>
              <div
                className="space-y-4 text-base leading-relaxed"
                style={{ color: "oklch(0.80 0.04 280)" }}
              >
                <p>
                  Already been like 7 years eh since I know you, and they say if
                  your friendship lasts longer than 7 years then it is gonna
                  last for your life. I hope and am sure that&#39;s true because
                  you are much more than just my best friend, you&#39;re the
                  love of my life.
                </p>
                <p>
                  We have been through so many highs and that many lows that
                  I&#39;ve lost count. But the good news is, it means no matter
                  what may come, we jump over it together and forever.
                </p>
                <p>
                  May your day and everyday be happier than the last. May you
                  achieve all the good things in life. May we achieve them
                  together.
                </p>
                <p>I love you hon. Have a good 26th &lt;3</p>
              </div>
              <div
                className="mt-8 pt-6"
                style={{ borderTop: "1px solid oklch(0.35 0.08 350 / 0.3)" }}
              >
                <p
                  className="font-script text-3xl"
                  style={{ color: "var(--neon-amber)" }}
                >
                  Yours lovingly,
                </p>
                <p
                  className="font-script text-2xl mt-1"
                  style={{ color: "oklch(0.65 0.12 72)" }}
                >
                  Kaustuv ❤️
                </p>
              </div>
            </div>
            <div className="md:col-span-2 p-8 flex flex-col items-center gap-6">
              <PhotoSlot
                label="Meghna & Me"
                className="w-full"
                style={{ minHeight: 240 } as React.CSSProperties}
                glowColor="oklch(0.55 0.18 350 / 0.7)"
              />
              {/* Heart bird mascot in letter section */}
              <KurzgesagtBird
                src="/assets/generated/kurzgesagt-bird-heart-transparent.dim_300x350.png"
                size={140}
                animDelay={1.5}
                className="bird-sway"
              />
            </div>
          </div>
        </div>

        <div
          className="reveal text-center mt-12 flex justify-center gap-4"
          style={{ transitionDelay: "0.2s" }}
        >
          {[
            "oklch(0.82 0.18 196)",
            "oklch(0.75 0.20 350)",
            "oklch(0.82 0.16 72)",
            "oklch(0.82 0.18 135)",
            "oklch(0.72 0.22 295)",
          ].map((c) => (
            <span
              key={c}
              style={{ color: c, fontSize: "1.6rem", display: "inline-block" }}
            >
              ♥
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  const year = new Date().getFullYear();
  const host = typeof window !== "undefined" ? window.location.hostname : "";
  const caffeineUrl = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(host)}`;

  const footerLinks = [
    { label: "Home", href: "#home" },
    { label: "Our Story", href: "#story" },
    { label: "For You", href: "#for-you" },
    { label: "Gallery", href: "#gallery" },
    { label: "Gifts", href: "#gifts" },
    { label: "Love Letter", href: "#love-letter" },
  ];

  return (
    <footer
      className="relative z-10 py-12 px-6"
      style={{
        borderTop: "1px solid oklch(0.35 0.08 280 / 0.35)",
        background: "oklch(0.14 0.07 280 / 0.95)",
      }}
    >
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8 items-center">
          <div>
            <div
              className="font-script text-3xl mb-1"
              style={{ color: "var(--neon-amber)" }}
            >
              A &amp; L
            </div>
            <p className="text-xs" style={{ color: "oklch(0.50 0.06 280)" }}>
              A love story written in stars.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 items-center md:justify-center">
            {footerLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="nav-link text-xs"
                data-ocid="footer.link"
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="flex flex-col items-start md:items-end gap-1">
            <p className="text-xs" style={{ color: "oklch(0.45 0.05 280)" }}>
              © {year}. Built with{" "}
              <span style={{ color: "var(--neon-pink)" }}>♥</span> using{" "}
              <a
                href={caffeineUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:opacity-80 transition-opacity"
                style={{ color: "var(--neon-cyan)" }}
              >
                caffeine.ai
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  useScrollReveal();

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--cosmic-indigo)", position: "relative" }}
    >
      {/* Particle canvas */}
      <ParticleCanvas />

      {/* Game HUD */}
      <GameHUD />

      {/* Navigation */}
      <Navbar />

      {/* Main content */}
      <main>
        <Hero />
        <TimelineSection />
        <ForYouSection />
        <GallerySection />
        <GiftsSection />
        <LoveLetter />
      </main>

      <Footer />

      {/* Walking Cat */}
      <WalkingCatsLayer />
    </div>
  );
}
