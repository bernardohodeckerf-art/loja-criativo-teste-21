import { useMotionPreference } from "@/hooks/use-motion-preference";
import { useState } from "react";
export default function AmbientLoop() {
  const reduced = useMotionPreference(),
    saveData = Boolean(
      (navigator as Navigator & { connection?: { saveData?: boolean } })
        .connection?.saveData,
    );
  const [failed, setFailed] = useState(false);
  return (
    <>
      <img
        src="/media/arranjos-da-loja.webp"
        alt="Arranjo real da loja com folhagens, flores verdes e vasos decorativos"
        loading="lazy"
      />
      {!reduced && !saveData && !failed && (
        <video
          src="/media/arranjos-da-loja.mp4"
          poster="/media/arranjos-da-loja.webp"
          muted
          autoPlay
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          onError={() => setFailed(true)}
        />
      )}
    </>
  );
}
