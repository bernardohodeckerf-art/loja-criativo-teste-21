import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useMotionPreference } from "@/hooks/use-motion-preference";
import { shop } from "@/data";
export default function HeroMedia() {
  const reduced = useMotionPreference();
  const saveData = Boolean(
    (navigator as Navigator & { connection?: { saveData?: boolean } })
      .connection?.saveData,
  );
  const [enabled, setEnabled] = useState(!reduced && !saveData),
    [paused, setPaused] = useState(reduced || saveData),
    [failed, setFailed] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 850], [0, 90]);
  useEffect(() => {
    if (reduced || saveData) {
      video.current?.pause();
      setEnabled(false);
      setPaused(true);
    }
  }, [reduced, saveData]);
  useEffect(() => {
    const el = video.current;
    if (!el || !enabled) return;
    if (paused) {
      el.pause();
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) el.play().catch(() => setPaused(true));
        else el.pause();
      },
      { threshold: 0.05 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [enabled, paused]);
  function toggle() {
    if (failed) return;
    if (!enabled) {
      setEnabled(true);
      setPaused(false);
    } else setPaused((p) => !p);
  }
  return (
    <>
      <motion.div
        className="hero-media"
        style={{ y: reduced ? 0 : y }}
        aria-hidden="true"
      >
        <img
          src={shop.hero}
          alt=""
          fetchPriority="high"
          width="1280"
          height="720"
        />
        {enabled && !failed && (
          <video
            ref={video}
            src={shop.video}
            poster={shop.hero}
            muted
            loop
            playsInline
            preload="metadata"
            autoPlay={!paused}
            onError={() => {
              setFailed(true);
              setPaused(true);
            }}
          />
        )}
      </motion.div>
      <div className="hero-video-shade" />
      {!failed && (
        <button
          className="hero-video-control"
          onClick={toggle}
          aria-label={
            paused ? "Reproduzir vídeo de fundo" : "Pausar vídeo de fundo"
          }
        >
          {paused ? <Play size={13} /> : <Pause size={13} />}
          <span>{paused ? "Reproduzir vídeo" : "Pausar vídeo"}</span>
        </button>
      )}
      <span className="hero-credit">
        Imagem de ambientação · Anna Shvets / Pexels
      </span>
    </>
  );
}
