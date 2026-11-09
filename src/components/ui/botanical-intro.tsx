import { useEffect, useRef } from "react";
import { ArrowUpRight, Flower2 } from "lucide-react";
import { useMotionPreference } from "@/hooks/use-motion-preference";
function PaintedBranch({ side }: { side: "left" | "right" }) {
  return (
    <div
      className={`opening-botanical opening-botanical--${side}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 260 540" fill="none">
        <path
          className="opening-stem"
          d="M-12 552C97 438 37 365 137 254S176 87 257-10"
        />
        <g className="opening-leaves">
          <path d="M67 435C-8 421 9 360 67 381C83 387 86 405 67 435Z" />
          <path d="M77 401C139 417 168 356 123 349C95 343 76 367 77 401Z" />
          <path d="M100 311C36 325 21 271 53 255C80 243 102 280 100 311Z" />
          <path d="M143 243C201 262 226 209 194 190C164 174 147 211 143 243Z" />
          <path d="M175 159C112 179 98 126 128 109C157 93 176 123 175 159Z" />
          <path d="M203 81C250 99 272 57 249 43C226 28 204 55 203 81Z" />
        </g>
        <g className="opening-blossom" transform="translate(81 335)">
          <ellipse cy="-21" rx="15" ry="24" />
          <ellipse cy="-21" rx="15" ry="24" transform="rotate(72)" />
          <ellipse cy="-21" rx="15" ry="24" transform="rotate(144)" />
          <ellipse cy="-21" rx="15" ry="24" transform="rotate(216)" />
          <ellipse cy="-21" rx="15" ry="24" transform="rotate(288)" />
          <circle r="8" />
        </g>
        <g
          className="opening-blossom opening-blossom-small"
          transform="translate(170 185)"
        >
          <ellipse cy="-16" rx="12" ry="19" />
          <ellipse cy="-16" rx="12" ry="19" transform="rotate(72)" />
          <ellipse cy="-16" rx="12" ry="19" transform="rotate(144)" />
          <ellipse cy="-16" rx="12" ry="19" transform="rotate(216)" />
          <ellipse cy="-16" rx="12" ry="19" transform="rotate(288)" />
          <circle r="6" />
        </g>
      </svg>
    </div>
  );
}
export default function BotanicalIntro({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const reduced = useMotionPreference();
  const complete = useRef(onComplete);
  complete.current = onComplete;
  useEffect(() => {
    if (reduced) {
      complete.current();
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => complete.current(), 1950);
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = previous;
    };
  }, [reduced]);
  if (reduced) return null;
  return (
    <div
      className="opening"
      role="dialog"
      aria-modal="true"
      aria-label="Abertura do Espaço das Flores"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          complete.current();
        }
        if (e.key === "Tab") {
          e.preventDefault();
          e.currentTarget.querySelector("button")?.focus();
        }
      }}
    >
      <div className="opening-paper opening-paper--left" />
      <div className="opening-paper opening-paper--right" />
      <div className="opening-ink opening-ink--sage" aria-hidden="true" />
      <div className="opening-ink opening-ink--rose" aria-hidden="true" />
      <PaintedBranch side="left" />
      <PaintedBranch side="right" />
      <div className="opening-petals" aria-hidden="true">
        {Array.from({ length: 10 }, (_, i) => (
          <i
            key={i}
            style={
              {
                "--petal-x": `${12 + i * 8.4}%`,
                "--petal-delay": `${i * 0.025}s`,
                "--petal-drift": `${i % 2 ? 45 : -35}px`,
                "--petal-turn": `${i % 2 ? 160 : -140}deg`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
      <div className="opening-logo">
        <div className="opening-logo-mark">
          <svg
            className="opening-logo-orbit"
            viewBox="0 0 110 110"
            aria-hidden="true"
          >
            <circle cx="55" cy="55" r="48" />
          </svg>
          <Flower2 size={49} strokeWidth={1} />
        </div>
        <div className="opening-wordmark">
          <span>espaço das flores</span>
        </div>
        <p>ONDE O AFETO FLORESCE</p>
        <span className="opening-flourish" aria-hidden="true" />
      </div>
      <button
        className="opening-skip"
        autoFocus
        onClick={() => complete.current()}
      >
        Pular abertura <ArrowUpRight size={14} />
      </button>
      <span className="opening-caption" aria-hidden="true">
        UM NOVO MOMENTO ESTÁ PRESTES A FLORESCER
      </span>
    </div>
  );
}
