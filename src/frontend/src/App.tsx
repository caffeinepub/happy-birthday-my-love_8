import { useEffect, useRef, useState } from "react";

// ─── Floating Particles Canvas ───────────────────────────────────────────────
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

    interface Particle {
      x: number;
      y: number;
      size: number;
      speed: number;
      drift: number;
      opacity: number;
      type: "heart" | "star";
      hue: number;
      age: number;
      maxAge: number;
    }

    const particles: Particle[] = [];

    const spawn = (): Particle => ({
      x: Math.random() * W,
      y: H + 20,
      size: Math.random() * 14 + 4,
      speed: Math.random() * 0.6 + 0.3,
      drift: (Math.random() - 0.5) * 0.4,
      opacity: 0,
      type: Math.random() > 0.45 ? "heart" : "star",
      hue: Math.random() > 0.5 ? 72 : 350,
      age: 0,
      maxAge: Math.random() * 300 + 180,
    });

    for (let i = 0; i < 40; i++) {
      const p = spawn();
      p.y = Math.random() * H;
      p.age = Math.floor(Math.random() * p.maxAge);
      particles.push(p);
    }

    const drawHeart = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      size: number,
    ) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.beginPath();
      const s = size * 0.5;
      ctx.moveTo(0, s * 0.4);
      ctx.bezierCurveTo(s * 0.5, -s * 0.8, s * 1.4, s * 0.1, 0, s * 1.2);
      ctx.bezierCurveTo(-s * 1.4, s * 0.1, -s * 0.5, -s * 0.8, 0, s * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const drawStar = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      size: number,
    ) => {
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

        const lifeRatio = p.age / p.maxAge;
        p.opacity =
          lifeRatio < 0.1
            ? lifeRatio * 10
            : lifeRatio > 0.85
              ? (1 - lifeRatio) / 0.15
              : 1;

        if (p.age >= p.maxAge) {
          particles.splice(i, 1);
          particles.push(spawn());
          continue;
        }

        const chroma = p.hue === 72 ? "0.08" : "0.09";
        ctx.fillStyle = `oklch(0.75 ${chroma} ${p.hue} / ${p.opacity * 0.55})`;
        if (p.type === "heart") drawHeart(ctx, p.x, p.y, p.size);
        else drawStar(ctx, p.x, p.y, p.size);
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
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" },
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

// ─── Photo Placeholder ────────────────────────────────────────────────────────
function PhotoSlot({
  label = "Your Photo Here",
  className = "",
  style,
}: { label?: string; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`photo-placeholder ${className}`} style={style}>
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
    { label: "Love Letter", href: "#love-letter" },
  ];

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        background: scrolled ? "oklch(0.085 0.012 300 / 0.9)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled
          ? "1px solid oklch(0.28 0.022 340 / 0.4)"
          : "none",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <a
          href="#home"
          className="font-script text-2xl gold-text"
          data-ocid="nav.link"
        >
          Our Story
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
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

        {/* CTA */}
        <div className="hidden md:block">
          <button
            type="button"
            className="btn-outline text-sm"
            data-ocid="nav.button"
          >
            Happy Birthday ♥
          </button>
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          className="md:hidden text-foreground p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
          data-ocid="nav.toggle"
        >
          <div className="w-6 flex flex-col gap-1.5">
            <span
              className="h-0.5 w-full transition-all"
              style={{
                background: "var(--gold)",
                transform: mobileOpen
                  ? "rotate(45deg) translate(3px, 5px)"
                  : undefined,
              }}
            />
            <span
              className="h-0.5 w-full transition-all"
              style={{ background: "var(--gold)", opacity: mobileOpen ? 0 : 1 }}
            />
            <span
              className="h-0.5 w-full transition-all"
              style={{
                background: "var(--gold)",
                transform: mobileOpen
                  ? "rotate(-45deg) translate(3px, -5px)"
                  : undefined,
              }}
            />
          </div>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden px-6 pb-6 flex flex-col gap-4"
          style={{
            background: "oklch(0.085 0.012 300 / 0.97)",
            borderBottom: "1px solid oklch(0.28 0.022 340 / 0.4)",
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
            Happy Birthday ♥
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
      className="section min-h-screen flex items-center pt-24 pb-16"
    >
      <div className="max-w-6xl mx-auto w-full">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left: text */}
          <div className="flex flex-col gap-6">
            <div className="reveal">
              <p
                className="text-sm uppercase tracking-widest mb-3"
                style={{ color: "var(--blush)" }}
              >
                ✦ A Love Story ✦
              </p>
              <h1
                className="font-script leading-tight"
                style={{
                  fontSize: "clamp(3rem, 7vw, 5.5rem)",
                  lineHeight: 1.15,
                }}
              >
                <span className="shimmer-text">Happy Birthday,</span>
                <br />
                <span className="gold-text">My Love!</span>
              </h1>
            </div>

            <p
              className="reveal text-lg leading-relaxed"
              style={{
                color: "oklch(0.78 0.015 340)",
                maxWidth: "38ch",
                transitionDelay: "0.15s",
              }}
            >
              Every moment with you is a gift. Today, we celebrate you — your
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
              style={{
                transitionDelay: "0.45s",
                color: "oklch(0.55 0.015 340)",
              }}
            >
              <span
                style={{
                  animation: "heartbeat 2s ease-in-out infinite",
                  display: "inline-block",
                  color: "var(--blush)",
                }}
              >
                ♥
              </span>
              <span className="text-sm tracking-wide">
                With all my love, always & forever
              </span>
              <span
                style={{
                  animation: "heartbeat 2s ease-in-out infinite 0.3s",
                  display: "inline-block",
                  color: "var(--blush)",
                }}
              >
                ♥
              </span>
            </div>
          </div>

          {/* Right: photo */}
          <div
            className="reveal flex justify-center"
            style={{ transitionDelay: "0.2s" }}
          >
            <div className="relative" style={{ width: "min(340px, 80vw)" }}>
              {/* Decorative rings */}
              <div
                className="absolute inset-0 rounded-3xl"
                style={{
                  background:
                    "radial-gradient(circle at 60% 40%, oklch(0.72 0.09 350 / 0.15) 0%, transparent 65%)",
                  transform: "scale(1.12)",
                }}
              />
              <PhotoSlot
                label="Your Photo Here"
                className="w-full"
                style={
                  {
                    aspectRatio: "3/4",
                    fontSize: "1rem",
                  } as React.CSSProperties
                }
              />
              {/* Badge */}
              <div
                className="absolute -bottom-4 -right-4 glass-card px-4 py-2 text-sm font-medium"
                style={{ color: "var(--gold)" }}
              >
                🎂 Happy Birthday!
              </div>
            </div>
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
    text: "Add your story about how you first met here. Describe the moment you first saw each other — where you were, what you felt, and why it felt different from any moment before.",
    side: "left" as const,
  },
  {
    title: "Our First Date",
    date: "[ Date ]",
    text: "Describe your first date together here. Every detail — the place, the conversation, the nervous excitement — all those little moments that made the night unforgettable.",
    side: "right" as const,
  },
  {
    title: "When I Knew",
    date: "[ Date ]",
    text: "Tell the story of the moment you realized she was the one. Maybe it was a quiet Tuesday, or a grand adventure — but something clicked and you knew this was real love.",
    side: "left" as const,
  },
  {
    title: "Today & Always",
    date: "[ Date ]",
    text: "The story isn't over — it's just beginning. Today on her birthday, celebrate how far you've come together and all the beautiful chapters still ahead.",
    side: "right" as const,
  },
];

function TimelineSection() {
  const spineRef = useTimelineSpine();

  return (
    <section id="story" className="section">
      <div className="max-w-5xl mx-auto">
        {/* Title */}
        <div className="text-center mb-20 reveal">
          <p
            className="text-sm uppercase tracking-widest mb-3"
            style={{ color: "var(--blush)" }}
          >
            Our Journey
          </p>
          <h2
            className="font-display"
            style={{
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              color: "var(--gold)",
            }}
          >
            How We Met ✨
          </h2>
          <div
            className="mx-auto mt-4"
            style={{
              width: 80,
              height: 2,
              background:
                "linear-gradient(90deg, transparent, var(--gold), transparent)",
            }}
          />
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Spine */}
          <div
            className="absolute left-1/2 top-0 w-0.5 h-full -translate-x-1/2 hidden md:block"
            style={{ background: "oklch(0.28 0.022 340 / 0.3)" }}
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
                className={`flex items-center gap-6 md:gap-0 ${
                  entry.side === "left" ? "reveal-left" : "reveal-right"
                }`}
                style={{ transitionDelay: `${i * 0.1}s` }}
              >
                {/* Left content (desktop) */}
                <div
                  className={`hidden md:flex md:w-5/12 ${
                    entry.side === "left"
                      ? "justify-end pr-10"
                      : "justify-start pl-10 order-last"
                  }`}
                >
                  <div className="glass-card p-5 max-w-xs">
                    <PhotoSlot
                      label="Add Photo"
                      className="mb-4"
                      style={{ height: 140 } as React.CSSProperties}
                    />
                    <div
                      className="text-xs mb-1"
                      style={{ color: "var(--blush)" }}
                    >
                      {entry.date}
                    </div>
                    <h3
                      className="font-display text-lg mb-2"
                      style={{ color: "var(--gold)" }}
                    >
                      {entry.title}
                    </h3>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: "oklch(0.70 0.015 340)" }}
                    >
                      {entry.text}
                    </p>
                  </div>
                </div>

                {/* Dot */}
                <div className="hidden md:flex w-2/12 justify-center relative z-10">
                  <div className="timeline-dot" />
                </div>

                {/* Right content (desktop) / full width (mobile) */}
                <div
                  className={`w-full md:w-5/12 ${
                    entry.side === "left"
                      ? "md:justify-start md:pl-10"
                      : "md:justify-end md:pr-10"
                  } md:flex`}
                >
                  {/* Mobile: show everything here */}
                  <div className="glass-card p-5 md:hidden">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="timeline-dot" />
                      <div>
                        <div
                          className="text-xs"
                          style={{ color: "var(--blush)" }}
                        >
                          {entry.date}
                        </div>
                        <h3
                          className="font-display text-lg"
                          style={{ color: "var(--gold)" }}
                        >
                          {entry.title}
                        </h3>
                      </div>
                    </div>
                    <PhotoSlot
                      label="Add Photo"
                      className="mb-3"
                      style={{ height: 120 } as React.CSSProperties}
                    />
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: "oklch(0.70 0.015 340)" }}
                    >
                      {entry.text}
                    </p>
                  </div>

                  {/* Desktop: empty balancing space */}
                  <div className="hidden md:block" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Beauty & Brilliance Section ──────────────────────────────────────────────
function ForYouSection() {
  return (
    <section id="for-you" className="section">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16 reveal">
          <p
            className="text-sm uppercase tracking-widest mb-3"
            style={{ color: "var(--blush)" }}
          >
            Why I Love You
          </p>
          <h2
            className="font-display"
            style={{
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              color: "var(--gold)",
            }}
          >
            Everything About You
          </h2>
          <div
            className="mx-auto mt-4"
            style={{
              width: 80,
              height: 2,
              background:
                "linear-gradient(90deg, transparent, var(--blush), transparent)",
            }}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Card 1: Radiance */}
          <div
            className="reveal glass-card overflow-hidden"
            style={{ transitionDelay: "0.1s" }}
          >
            <div style={{ padding: "1.75rem" }}>
              <PhotoSlot
                label="Her Beautiful Photo"
                className="mb-5 w-full"
                style={{ height: 220 } as React.CSSProperties}
              />
              <div
                className="inline-block text-xs uppercase tracking-widest mb-3 px-3 py-1 rounded-full"
                style={{
                  background: "oklch(0.72 0.09 350 / 0.15)",
                  color: "var(--blush)",
                }}
              >
                ✦ Her Beauty
              </div>
              <h3
                className="font-display text-2xl mb-3"
                style={{ color: "var(--gold)" }}
              >
                Your Radiance &amp; Grace
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "oklch(0.70 0.015 340)" }}
              >
                Add your heartfelt words about her beauty here. Describe the way
                she smiles, the way she carries herself, or a specific memory
                that took your breath away. This is your space to tell her
                exactly what makes her radiant in your eyes.
              </p>
            </div>
          </div>

          {/* Card 2: Brilliance */}
          <div
            className="reveal glass-card overflow-hidden"
            style={{ transitionDelay: "0.2s" }}
          >
            <div style={{ padding: "1.75rem" }}>
              <PhotoSlot
                label="Her Inspiring Photo"
                className="mb-5 w-full"
                style={{ height: 220 } as React.CSSProperties}
              />
              <div
                className="inline-block text-xs uppercase tracking-widest mb-3 px-3 py-1 rounded-full"
                style={{
                  background: "oklch(0.75 0.08 72 / 0.12)",
                  color: "var(--gold)",
                }}
              >
                ✦ Her Mind
              </div>
              <h3
                className="font-display text-2xl mb-3"
                style={{ color: "var(--gold)" }}
              >
                Your Brilliant Mind
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "oklch(0.70 0.015 340)" }}
              >
                Describe her intelligence, creativity, and wisdom here. Share a
                moment where her brilliance amazed you — a conversation, a
                decision, or a quiet insight that reminded you just how
                extraordinary she truly is.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Love Letter Section ──────────────────────────────────────────────────────
function LoveLetter() {
  return (
    <section id="love-letter" className="section">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12 reveal">
          <p
            className="text-sm uppercase tracking-widest mb-3"
            style={{ color: "var(--blush)" }}
          >
            From My Heart
          </p>
          <h2
            className="font-script"
            style={{
              fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
              color: "var(--gold)",
            }}
          >
            A Love Letter to You
          </h2>
        </div>

        <div
          className="glass-card reveal overflow-hidden"
          style={{ transitionDelay: "0.1s" }}
        >
          <div className="grid md:grid-cols-5 gap-0">
            {/* Letter text */}
            <div
              className="md:col-span-3 p-8 md:p-12"
              style={{
                borderRight: "1px solid oklch(0.28 0.022 340 / 0.3)",
              }}
            >
              <div
                className="font-script text-2xl mb-6"
                style={{ color: "var(--blush)" }}
              >
                My Dearest Love,
              </div>

              <div
                className="space-y-4 text-base leading-relaxed"
                style={{ color: "oklch(0.78 0.015 340)" }}
              >
                <p>
                  Write your love letter here. Start by telling her how she
                  makes every single day feel like an adventure worth living.
                  Let her know she is your favorite person on this earth.
                </p>
                <p>
                  Describe a moment that changed everything for you — one that
                  made you realize she was the one you wanted to build your life
                  with. Be specific. Be raw. Be honest.
                </p>
                <p>
                  Tell her about the future you imagine together. The small
                  things — morning coffee, long walks, quiet evenings — and the
                  big things — dreams, adventures, a family. Whatever your heart
                  holds, write it here.
                </p>
                <p>
                  On this birthday, remind her that she is seen, she is loved,
                  she is celebrated — today and every day that follows.
                </p>
              </div>

              <div
                className="mt-8 pt-6"
                style={{ borderTop: "1px solid oklch(0.28 0.022 340 / 0.3)" }}
              >
                <p
                  className="font-script text-3xl"
                  style={{ color: "var(--gold)" }}
                >
                  Forever yours,
                </p>
                <p
                  className="font-script text-2xl mt-1"
                  style={{ color: "oklch(0.65 0.07 72)" }}
                >
                  [ Your Name ]
                </p>
              </div>
            </div>

            {/* Photo */}
            <div className="md:col-span-2 p-8 flex items-center">
              <PhotoSlot
                label="Favorite Photo Together"
                className="w-full"
                style={{ minHeight: 320 } as React.CSSProperties}
              />
            </div>
          </div>
        </div>

        {/* Decorative hearts row */}
        <div
          className="reveal text-center mt-12 text-2xl tracking-widest"
          style={{
            color: "oklch(0.72 0.09 350 / 0.5)",
            transitionDelay: "0.2s",
          }}
        >
          ♥ &nbsp; ♥ &nbsp; ♥ &nbsp; ♥ &nbsp; ♥
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

  return (
    <footer
      className="relative z-10 py-12 px-6"
      style={{
        borderTop: "1px solid oklch(0.28 0.022 340 / 0.3)",
        background: "oklch(0.085 0.012 300 / 0.95)",
      }}
    >
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8 items-center">
          {/* Monogram */}
          <div>
            <div
              className="font-script text-3xl mb-1"
              style={{ color: "var(--gold)" }}
            >
              A &amp; L
            </div>
            <p className="text-xs" style={{ color: "oklch(0.50 0.015 340)" }}>
              A love story written in stars.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center md:justify-center">
            {["#home", "#story", "#for-you", "#love-letter"].map((href, i) => (
              <a
                key={href}
                href={href}
                className="nav-link text-xs"
                data-ocid="footer.link"
              >
                {["Home", "Our Story", "For You", "Love Letter"][i]}
              </a>
            ))}
          </div>

          {/* Attribution */}
          <div className="flex flex-col items-start md:items-end gap-1">
            <p className="text-xs" style={{ color: "oklch(0.45 0.015 340)" }}>
              © {year}. Built with{" "}
              <span
                style={{
                  color: "var(--blush)",
                  animation: "heartbeat 2s ease-in-out infinite",
                  display: "inline-block",
                }}
              >
                ♥
              </span>{" "}
              using{" "}
              <a
                href={caffeineUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:opacity-80 transition-opacity"
                style={{ color: "var(--gold-dim)" }}
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
      style={{ background: "oklch(0.085 0.012 300)" }}
    >
      {/* Animated background */}
      <ParticleCanvas />

      {/* Vignette overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, oklch(0.06 0.01 300 / 0.6) 100%)",
        }}
        aria-hidden="true"
      />

      {/* Subtle warm glow accents */}
      <div
        className="fixed top-0 left-1/4 w-96 h-96 rounded-full pointer-events-none z-0"
        style={{
          background: "oklch(0.72 0.09 350 / 0.04)",
          filter: "blur(80px)",
        }}
        aria-hidden="true"
      />
      <div
        className="fixed bottom-1/4 right-1/4 w-80 h-80 rounded-full pointer-events-none z-0"
        style={{
          background: "oklch(0.75 0.08 72 / 0.05)",
          filter: "blur(100px)",
        }}
        aria-hidden="true"
      />

      {/* Navigation */}
      <Navbar />

      {/* Main content */}
      <main>
        <Hero />
        <TimelineSection />
        <ForYouSection />
        <LoveLetter />
      </main>

      <Footer />
    </div>
  );
}
