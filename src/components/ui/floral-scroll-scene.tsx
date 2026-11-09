import { useMotionPreference } from "@/hooks/use-motion-preference";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Flower2, Leaf, MoveDown } from "lucide-react";
/** A sticky scroll scene: each outer layer scrubs independently; entrances live inside. */
export default function FloralScrollScene() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useMotionPreference();
  const { scrollYProgress: p } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const photoY = useTransform(p, [0, 0.35, 0.7, 1], [100, 0, -20, -100]);
  const photoRotate = useTransform(p, [0, 0.38, 0.75, 1], [-14, -3, 4, 12]);
  const photoScale = useTransform(p, [0, 0.4, 0.75, 1], [0.68, 1, 1, 0.85]);
  const leftX = useTransform(p, [0, 0.35, 0.7, 1], [-150, 0, -15, -80]);
  const rightX = useTransform(p, [0, 0.35, 0.7, 1], [150, 0, 15, 80]);
  const leftRotate = useTransform(p, [0, 1], [-35, 35]);
  const rightRotate = useTransform(p, [0, 1], [40, -35]);
  const titleY = useTransform(p, [0, 0.35, 0.8, 1], [50, 0, -15, -35]);
  const line = useTransform(p, [0.2, 0.8], [0, 1]);
  return (
    <section
      ref={ref}
      className={"floral-scene" + (reduced ? " scene-reduced" : "")}
      aria-labelledby="floral-scene-heading"
    >
      <div className="floral-scene-stage">
        <div className="scene-paper" />
        <motion.div
          className="scene-heading"
          style={reduced ? undefined : { y: titleY }}
        >
          <span className="eyebrow">DO NOSSO JARDIM PARA A SUA HISTÓRIA</span>
          <h2 id="floral-scene-heading">
            Um gesto.
            <br />
            <em>Mil sentimentos.</em>
          </h2>
        </motion.div>
        <motion.div
          className="scene-photo-layer"
          style={
            reduced
              ? undefined
              : { y: photoY, rotate: photoRotate, scale: photoScale }
          }
        >
          <div className="scene-photo-frame">
            <img
              src="/media/buques-hortensias-detalhe.webp"
              alt="Buquês de hortênsias da Espaço das Flores, em frame do vídeo real da loja"
              loading="lazy"
              width="720"
              height="960"
            />
            <span>feito à mão, entregue com o coração</span>
          </div>
        </motion.div>
        <motion.div
          className="scene-flora scene-flora-left"
          aria-hidden="true"
          style={reduced ? undefined : { x: leftX, rotate: leftRotate }}
        >
          <Flower2 />
          <Leaf />
          <i />
        </motion.div>
        <motion.div
          className="scene-flora scene-flora-right"
          aria-hidden="true"
          style={reduced ? undefined : { x: rightX, rotate: rightRotate }}
        >
          <Leaf />
          <Flower2 />
          <i />
        </motion.div>
        <div className="scene-aside">
          <p>
            Flores escolhidas com cuidado.
            <br />
            Laços que aproximam.
            <br />
            <em>Memórias que ficam.</em>
          </p>
          <span>BUQUÊS REAIS DA NOSSA LOJA</span>
        </div>
        <div className="scene-scroll" aria-hidden="true">
          <MoveDown size={16} />
          <span>DEIXE O AFETO FLORESCER</span>
          <div>
            <motion.i style={{ scaleX: reduced ? 1 : line }} />
          </div>
        </div>
      </div>
    </section>
  );
}
