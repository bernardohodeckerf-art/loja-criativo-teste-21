import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useMotionPreference } from "@/hooks/use-motion-preference";
import { shop } from "@/data";
export default function HeroMedia() {
  const reduced = useMotionPreference();
  const saveData = Boolean(
    (navigator as Navigator & { connection?: { saveData?: boolean } })
      .connection?.saveData,
  );
  const [failed, setFailed] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 850], [0, 90]);
  const enabled = !reduced && !saveData && !failed;
  useEffect(() => {
    const el = video.current;
    if (!el || !enabled) return;
    el.play().catch(() => {});
  }, [enabled]);
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
          width="720"
          height="1280"
        />
        {enabled && (
          <video
            ref={video}
            src={shop.video}
            poster={shop.hero}
            muted
            loop
            playsInline
            preload="metadata"
            autoPlay
            onError={() => setFailed(true)}
          />
        )}
      </motion.div>
      <div className="hero-video-shade" />
      <span className="hero-credit">
        Flores, detalhes e afeto · Espaço das Flores
      </span>
    </>
  );
}
