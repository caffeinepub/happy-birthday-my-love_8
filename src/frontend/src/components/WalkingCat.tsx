import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

type CatAnimation = "walk" | "wave" | "spin" | "purr" | "jump";

const INTERACTIONS: CatAnimation[] = ["wave", "spin", "purr", "jump"];
const CAT_WIDTH = 72;
const INTERACTION_DURATION = 1600;
const CLICKS_TO_CELEBRATE = 5;

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const CAT_CONFIGS = [
  {
    id: 0,
    sectionYPercent: 0.13,
    speed: 0.32,
    color: "196",
    startDir: 1 as 1 | -1,
  },
  {
    id: 1,
    sectionYPercent: 0.28,
    speed: 0.42,
    color: "280",
    startDir: -1 as 1 | -1,
  },
  {
    id: 2,
    sectionYPercent: 0.5,
    speed: 0.28,
    color: "350",
    startDir: 1 as 1 | -1,
  },
  {
    id: 3,
    sectionYPercent: 0.7,
    speed: 0.38,
    color: "72",
    startDir: -1 as 1 | -1,
  },
  {
    id: 4,
    sectionYPercent: 0.87,
    speed: 0.22,
    color: "150",
    startDir: 1 as 1 | -1,
  },
];

interface SingleCatProps {
  speed: number;
  colorHue: string;
  startDir: 1 | -1;
  yPosition: number;
  onCatClick: () => boolean;
  celebrating: boolean;
  celebrationTargetX: number;
  celebrationTargetY: number;
}

function SingleCat({
  speed,
  colorHue,
  startDir,
  yPosition,
  onCatClick,
  celebrating,
  celebrationTargetX,
  celebrationTargetY,
}: SingleCatProps) {
  const [catX, setCatX] = useState(() =>
    startDir === 1 ? 60 : window.innerWidth - 130,
  );
  const [direction, setDirection] = useState<1 | -1>(startDir);
  const [animation, setAnimation] = useState<CatAnimation>("walk");
  const [showBubble, setShowBubble] = useState(false);
  const [headTilt, setHeadTilt] = useState(0);
  const [puffHearts, setPuffHearts] = useState<
    { id: number; x: number; y: number }[]
  >([]);

  const catXRef = useRef(startDir === 1 ? 60 : window.innerWidth - 130);
  const dirRef = useRef<1 | -1>(startDir);
  const animRef = useRef<CatAnimation>("walk");
  const rafRef = useRef<number>(0);
  const interactionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cursorRef = useRef({ x: window.innerWidth / 2, y: 0 });
  const heartCounterRef = useRef(0);
  const pauseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPausedRef = useRef(false);

  useEffect(() => {
    if (!celebrating) {
      animRef.current = "walk";
      setAnimation("walk");
      setShowBubble(false);
      isPausedRef.current = false;
    }
  }, [celebrating]);

  useEffect(() => {
    const schedulePause = () => {
      const delay = 4000 + Math.random() * 8000;
      pauseTimer.current = setTimeout(() => {
        if (animRef.current !== "walk") {
          schedulePause();
          return;
        }
        isPausedRef.current = true;
        const pauseDuration = 1200 + Math.random() * 2400;
        pauseTimer.current = setTimeout(() => {
          isPausedRef.current = false;
          schedulePause();
        }, pauseDuration);
      }, delay);
    };
    schedulePause();
    return () => {
      if (pauseTimer.current) clearTimeout(pauseTimer.current);
    };
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      cursorRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useEffect(() => {
    let lastTime = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(now - lastTime, 32);
      lastTime = now;
      if (!celebrating && animRef.current === "walk") {
        const maxX = window.innerWidth - CAT_WIDTH - 16;
        if (!isPausedRef.current) {
          let nx = catXRef.current + dirRef.current * speed * (dt / 16);
          let nd = dirRef.current;
          if (nx >= maxX) {
            nx = maxX;
            nd = -1;
          } else if (nx <= 16) {
            nx = 16;
            nd = 1;
          }
          catXRef.current = nx;
          dirRef.current = nd;
          setCatX(nx);
          setDirection(nd);
        }
        const catCenter = catXRef.current + CAT_WIDTH / 2;
        const dx = cursorRef.current.x - catCenter;
        const clampedDx = Math.max(-200, Math.min(200, dx));
        setHeadTilt((clampedDx / 200) * 25);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [speed, celebrating]);

  const handleClick = useCallback(() => {
    if (celebrating) return;
    const isCelebration = onCatClick();
    if (isCelebration) return;
    if (animRef.current !== "walk") return;
    const chosen = pickRandom(INTERACTIONS);
    animRef.current = chosen;
    setAnimation(chosen);
    setHeadTilt(0);
    isPausedRef.current = true;
    if (chosen === "purr" || chosen === "wave") setShowBubble(true);
    if (chosen === "purr") {
      const newHearts = Array.from({ length: 5 }, (_, i) => ({
        id: ++heartCounterRef.current * 100 + i,
        x: Math.random() * 60 - 30,
        y: Math.random() * -20,
      }));
      setPuffHearts(newHearts);
      setTimeout(() => setPuffHearts([]), 1400);
    }
    if (interactionTimer.current) clearTimeout(interactionTimer.current);
    interactionTimer.current = setTimeout(() => {
      animRef.current = "walk";
      setAnimation("walk");
      setShowBubble(false);
      isPausedRef.current = false;
    }, INTERACTION_DURATION);
  }, [celebrating, onCatClick]);

  const flipped = direction === -1;
  const walkTiltDeg =
    animation === "walk" && !isPausedRef.current ? (flipped ? -2 : 2) : 0;

  const celebStyle: React.CSSProperties = celebrating
    ? {
        transition:
          "top 0.7s cubic-bezier(0.34,1.4,0.64,1), left 0.7s cubic-bezier(0.34,1.4,0.64,1), transform 0.7s ease",
        top: celebrationTargetY,
        left: celebrationTargetX,
        transform: "scaleX(1) scale(1.4)",
      }
    : {};

  return (
    <button
      type="button"
      style={{
        position: "absolute",
        top: yPosition,
        left: catX,
        width: CAT_WIDTH,
        height: 90,
        zIndex: 50,
        cursor: "pointer",
        userSelect: "none",
        transform: `scaleX(${flipped ? -1 : 1})`,
        transformOrigin: "center bottom",
        background: "none",
        border: "none",
        padding: 0,
        ...celebStyle,
      }}
      onClick={handleClick}
      aria-label="Click the cat!"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
    >
      {showBubble && !celebrating && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 4px)",
            left: "50%",
            transform: "translateX(-50%)",
            whiteSpace: "nowrap",
            background: "oklch(0.98 0.01 280 / 0.95)",
            color: "oklch(0.25 0.08 280)",
            borderRadius: 12,
            padding: "4px 10px",
            fontSize: "0.78rem",
            fontWeight: 700,
            boxShadow: "0 2px 8px oklch(0 0 0 / 0.25)",
            pointerEvents: "none",
            animation:
              "cat-bubble-pop 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards",
          }}
        >
          {animation === "purr" ? "purrrr ♥" : "hiiii! 👋"}
          <div
            style={{
              position: "absolute",
              bottom: -6,
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: "6px solid oklch(0.98 0.01 280 / 0.95)",
            }}
          />
        </div>
      )}

      {puffHearts.map((h) => (
        <div
          key={h.id}
          style={{
            position: "absolute",
            bottom: "100%",
            left: `calc(50% + ${h.x}px)`,
            fontSize: "1rem",
            animation: "cat-heart-float 1.2s ease-out forwards",
            pointerEvents: "none",
          }}
        >
          ♥
        </div>
      ))}

      {animation === "jump" && !celebrating && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: "1.3rem",
            fontWeight: 900,
            color: "oklch(0.82 0.18 72)",
            animation:
              "cat-exclaim 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards",
            pointerEvents: "none",
          }}
        >
          !
        </div>
      )}

      <CatSVG
        animation={celebrating ? "jump" : animation}
        headTilt={headTilt}
        walkTilt={walkTiltDeg}
        colorHue={colorHue}
        paused={isPausedRef.current}
      />
    </button>
  );
}

// ─── Confetti Types ───────────────────────────────────────────────────────────
interface ConfettiParticle {
  id: number;
  size: number;
  color: string;
  shape: "square" | "circle" | "star";
  angle: number;
  distanceVw: number;
  distanceVh: number;
  duration: number;
  delay: number;
  rotation: number;
}

function generateConfetti(count: number): ConfettiParticle[] {
  const colors = [
    "#ff6b9d",
    "#ffd700",
    "#ff4757",
    "#2ed573",
    "#1e90ff",
    "#ff6348",
    "#eccc68",
    "#a29bfe",
    "#fd79a8",
    "#00cec9",
    "#fdcb6e",
    "#e17055",
  ];
  const shapes: ConfettiParticle["shape"][] = ["square", "circle", "star"];
  return Array.from({ length: count }, (_, i) => {
    const angleRad = (Math.random() * 360 * Math.PI) / 180;
    const dist = 15 + Math.random() * 28;
    return {
      id: i,
      size: 8 + Math.random() * 14,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      angle: Math.random() * 360,
      distanceVw: Math.cos(angleRad) * dist,
      distanceVh: Math.sin(angleRad) * dist,
      duration: 0.8 + Math.random() * 1.0,
      delay: Math.random() * 0.4,
      rotation: Math.random() * 720 - 360,
    };
  });
}

// ─── Birthday Celebration Overlay ────────────────────────────────────────────
const EMOJI_POPPERS = ["🎉", "🎊", "🎆", "🎇", "✨", "🎈", "💥", "🌟"];

function BirthdayCelebrationOverlay({ onDone }: { onDone: () => void }) {
  const [confetti] = useState(() => generateConfetti(50));
  const [phase, setPhase] = useState<"burst" | "text" | "fading">("burst");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("text"), 500);
    const t2 = setTimeout(() => setPhase("fading"), 3200);
    const t3 = setTimeout(() => onDone(), 4000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onDone]);

  // Build all keyframe CSS as one string to avoid inline style repetition
  const confettiKeyframes = confetti
    .map(
      (p) =>
        `@keyframes confetti-fly-${p.id} {
          0% { transform: translate(-50%,-50%) translateX(0) translateY(0) rotate(0deg) scale(0); opacity: 1; }
          60% { opacity: 1; }
          100% { transform: translate(-50%,-50%) translateX(${p.distanceVw}vw) translateY(${p.distanceVh}vh) rotate(${p.rotation}deg) scale(0.5); opacity: 0; }
        }`,
    )
    .join("\n");

  const emojiKeyframes = EMOJI_POPPERS.map((_emoji, i) => {
    const angleRad = ((i / EMOJI_POPPERS.length) * 360 * Math.PI) / 180;
    const tx = Math.cos(angleRad) * 35;
    const ty = Math.sin(angleRad) * 35;
    return `@keyframes emoji-fly-${i} {
      0% { transform: translate(-50%,-50%) translateX(0) translateY(0) scale(0) rotate(0deg); opacity: 1; }
      30% { transform: translate(-50%,-50%) translateX(${tx * 0.5}vw) translateY(${ty * 0.5}vh) scale(1.4) rotate(${i * 45}deg); opacity: 1; }
      100% { transform: translate(-50%,-50%) translateX(${tx}vw) translateY(${ty}vh) scale(0.8) rotate(${i * 90}deg); opacity: 0; }
    }`;
  }).join("\n");

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: phase === "fading" ? "rgba(0,0,0,0)" : "rgba(0,0,0,0.78)",
        transition: "background 0.8s ease",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <style>
        {confettiKeyframes}
        {emojiKeyframes}
        {`
          @keyframes birthday-text-in {
            0% { transform: scale(0) rotate(-10deg); opacity: 0; }
            100% { transform: scale(1) rotate(0deg); opacity: 1; }
          }
          @keyframes birthday-text-out {
            0% { transform: scale(1); opacity: 1; }
            100% { transform: scale(1.1); opacity: 0; }
          }
        `}
      </style>

      {/* Confetti particles */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        {confetti.map((p) => (
          <div
            key={p.id}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: p.size,
              height: p.size,
              background: p.shape !== "star" ? p.color : "transparent",
              borderRadius:
                p.shape === "circle" ? "50%" : p.shape === "square" ? "2px" : 0,
              fontSize: p.shape === "star" ? p.size : undefined,
              lineHeight: p.shape === "star" ? 1 : undefined,
              color: p.shape === "star" ? p.color : undefined,
              animation: `confetti-fly-${p.id} ${p.duration}s ${p.delay}s cubic-bezier(0.25,0.46,0.45,0.94) both`,
            }}
          >
            {p.shape === "star" ? "★" : null}
          </div>
        ))}

        {/* Emoji poppers flying out */}
        {EMOJI_POPPERS.map((emoji, i) => (
          <div
            key={emoji}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              fontSize: "2.2rem",
              animation: `emoji-fly-${i} 1.6s ${i * 0.08}s cubic-bezier(0.34,1.56,0.64,1) both`,
              pointerEvents: "none",
              lineHeight: 1,
            }}
          >
            {emoji}
          </div>
        ))}
      </div>

      {/* Birthday text */}
      {phase !== "burst" && (
        <div
          style={{
            position: "relative",
            textAlign: "center",
            animation:
              phase === "fading"
                ? "birthday-text-out 0.8s ease forwards"
                : "birthday-text-in 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards",
            zIndex: 2,
          }}
        >
          <div
            style={{
              fontSize: "clamp(2.2rem, 8vw, 5rem)",
              fontWeight: 900,
              lineHeight: 1.1,
              background:
                "linear-gradient(135deg, #ff6b9d, #ffd700, #ff4757, #a29bfe)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 0 20px rgba(255,107,157,0.5))",
              marginBottom: "0.5rem",
            }}
          >
            🎂 Happy Birthday
          </div>
          <div
            style={{
              fontSize: "clamp(2.8rem, 10vw, 6.5rem)",
              fontWeight: 900,
              lineHeight: 1,
              background: "linear-gradient(135deg, #ffd700, #ff6b9d, #ff4757)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 0 30px rgba(255,215,0,0.6))",
              marginBottom: "0.5rem",
            }}
          >
            Meghna!
          </div>
          <div
            style={{
              fontSize: "clamp(2rem, 7vw, 4rem)",
              animation: "cat-purr-shake 0.15s ease-in-out infinite alternate",
            }}
          >
            ❤️
          </div>
          <div
            style={{
              marginTop: "1rem",
              fontSize: "clamp(1rem, 3vw, 1.6rem)",
              color: "rgba(255,255,255,0.9)",
              fontWeight: 600,
            }}
          >
            🐱 The cats love you too! 🐱
          </div>
        </div>
      )}
    </div>
  );
}

export function WalkingCatsLayer() {
  const [pageHeight, setPageHeight] = useState(0);
  const [clickCount, setClickCount] = useState(0);
  const [celebrating, setCelebrating] = useState(false);

  const centerX =
    typeof window !== "undefined" ? window.innerWidth / 2 - CAT_WIDTH / 2 : 300;
  const centerY =
    typeof window !== "undefined"
      ? window.scrollY + window.innerHeight / 2 - 45
      : 300;

  useEffect(() => {
    const update = () => setPageHeight(document.body.scrollHeight);
    update();
    window.addEventListener("resize", update);
    const t = setTimeout(update, 1000);
    return () => {
      window.removeEventListener("resize", update);
      clearTimeout(t);
    };
  }, []);

  const handleCatClick = useCallback((): boolean => {
    const next = clickCount + 1;
    setClickCount(next);
    if (next >= CLICKS_TO_CELEBRATE) {
      setCelebrating(true);
      return true;
    }
    return false;
  }, [clickCount]);

  const handleCelebrationDone = useCallback(() => {
    setCelebrating(false);
    setClickCount(0);
  }, []);

  if (!pageHeight) return null;

  return (
    <>
      {celebrating && (
        <BirthdayCelebrationOverlay onDone={handleCelebrationDone} />
      )}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: pageHeight,
          pointerEvents: "none",
          zIndex: 50,
        }}
      >
        {CAT_CONFIGS.map((cfg) => (
          <SingleCat
            key={cfg.id}
            speed={cfg.speed}
            colorHue={cfg.color}
            startDir={cfg.startDir}
            yPosition={pageHeight * cfg.sectionYPercent - 90}
            onCatClick={handleCatClick}
            celebrating={celebrating}
            celebrationTargetX={centerX + (cfg.id - 2) * 30}
            celebrationTargetY={centerY}
          />
        ))}
      </div>
    </>
  );
}

// ─── Cat SVG Art ──────────────────────────────────────────────────────────────
function CatSVG({
  animation,
  headTilt,
  walkTilt,
  colorHue,
  paused,
}: {
  animation: CatAnimation;
  headTilt: number;
  walkTilt: number;
  colorHue: string;
  paused: boolean;
}) {
  const isWalking = animation === "walk" && !paused;

  const bodyAnim = isWalking
    ? "cat-body-walk 0.55s ease-in-out infinite"
    : animation === "spin"
      ? "cat-spin 0.7s cubic-bezier(0.45,0,0.55,1) forwards"
      : animation === "jump"
        ? "cat-jump 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards"
        : animation === "purr"
          ? "cat-purr-shake 0.12s ease-in-out infinite alternate"
          : "none";

  const rightPawAnim =
    animation === "wave"
      ? "cat-wave 0.4s ease-in-out infinite alternate"
      : isWalking
        ? "cat-paw-walk 0.55s ease-in-out infinite"
        : "none";

  const leftPawAnim = isWalking
    ? "cat-paw-walk-alt 0.55s ease-in-out infinite"
    : "none";

  const tailAnim =
    animation === "purr" || paused
      ? "cat-tail-wag 0.5s ease-in-out infinite alternate"
      : "cat-tail-idle 3s ease-in-out infinite";

  const mainColor = `oklch(0.72 0.18 ${colorHue})`;
  const lightColor = `oklch(0.86 0.12 ${colorHue})`;
  const darkColor = `oklch(0.60 0.20 ${colorHue})`;

  return (
    <svg
      viewBox="0 0 72 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Kurzgesagt-style cat"
      role="img"
      style={{
        width: "100%",
        height: "100%",
        overflow: "visible",
        transform: `rotate(${walkTilt}deg)`,
        transformOrigin: "center bottom",
        transition: "transform 0.2s ease",
        pointerEvents: "auto",
      }}
    >
      {/* Tail */}
      <g style={{ transformOrigin: "20px 68px", animation: tailAnim }}>
        <path
          d="M20 68 Q4 60 6 48 Q8 38 16 42"
          stroke={mainColor}
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="16" cy="42" r="4" fill="oklch(0.82 0.16 72)" />
      </g>

      {/* Body */}
      <g style={{ transformOrigin: "36px 72px", animation: bodyAnim }}>
        <ellipse cx="36" cy="65" rx="22" ry="18" fill={mainColor} />
        <ellipse cx="36" cy="67" rx="13" ry="11" fill={lightColor} />

        {/* Left paw */}
        <g style={{ transformOrigin: "26px 80px", animation: leftPawAnim }}>
          <ellipse cx="26" cy="82" rx="7" ry="5" fill={darkColor} />
          <ellipse cx="26" cy="82" rx="4" ry="3" fill="oklch(0.82 0.16 72)" />
        </g>

        {/* Right paw */}
        <g style={{ transformOrigin: "46px 80px", animation: rightPawAnim }}>
          <ellipse cx="46" cy="82" rx="7" ry="5" fill={mainColor} />
          <ellipse cx="46" cy="82" rx="4" ry="3" fill="oklch(0.82 0.16 72)" />
        </g>

        {/* Stripes */}
        <path
          d="M28 58 Q36 55 44 58"
          stroke={darkColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.6"
        />
        <path
          d="M30 62 Q36 60 42 62"
          stroke={darkColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.4"
        />

        {/* Head */}
        <g
          style={{
            transformOrigin: "36px 48px",
            transform: `rotate(${headTilt}deg)`,
            transition: "transform 0.3s ease",
          }}
        >
          <circle cx="36" cy="44" r="20" fill={mainColor} />

          {/* Left ear */}
          <polygon points="18,34 14,20 26,28" fill={mainColor} />
          <polygon points="19,33 16,23 25,28" fill="oklch(0.85 0.16 350)" />

          {/* Right ear */}
          <polygon points="54,34 58,20 46,28" fill={mainColor} />
          <polygon points="53,33 56,23 47,28" fill="oklch(0.85 0.16 350)" />

          {/* Eyes */}
          <ellipse
            cx="29"
            cy="43"
            rx="4"
            ry="4.5"
            fill="oklch(0.98 0.02 196)"
          />
          <ellipse
            cx="43"
            cy="43"
            rx="4"
            ry="4.5"
            fill="oklch(0.98 0.02 196)"
          />
          <circle
            cx={29 + headTilt * 0.06}
            cy="43"
            r="2.2"
            fill="oklch(0.18 0.04 280)"
          />
          <circle
            cx={43 + headTilt * 0.06}
            cy="43"
            r="2.2"
            fill="oklch(0.18 0.04 280)"
          />
          <circle cx={30 + headTilt * 0.04} cy="41.5" r="0.8" fill="white" />
          <circle cx={44 + headTilt * 0.04} cy="41.5" r="0.8" fill="white" />

          {/* Nose */}
          <ellipse
            cx="36"
            cy="49"
            rx="2.5"
            ry="1.8"
            fill="oklch(0.85 0.16 350)"
          />

          {/* Mouth */}
          <path
            d="M33 51 Q36 54 39 51"
            stroke="oklch(0.55 0.14 350)"
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
          />

          {/* Whiskers */}
          <line
            x1="16"
            y1="48"
            x2="28"
            y2="49"
            stroke="oklch(0.90 0.02 280)"
            strokeWidth="0.8"
            opacity="0.7"
          />
          <line
            x1="16"
            y1="51"
            x2="28"
            y2="50.5"
            stroke="oklch(0.90 0.02 280)"
            strokeWidth="0.8"
            opacity="0.7"
          />
          <line
            x1="44"
            y1="49"
            x2="56"
            y2="48"
            stroke="oklch(0.90 0.02 280)"
            strokeWidth="0.8"
            opacity="0.7"
          />
          <line
            x1="44"
            y1="50.5"
            x2="56"
            y2="51"
            stroke="oklch(0.90 0.02 280)"
            strokeWidth="0.8"
            opacity="0.7"
          />
        </g>
      </g>
    </svg>
  );
}
