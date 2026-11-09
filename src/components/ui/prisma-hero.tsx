import HeroMedia from "./hero-media";
import { useMotionPreference } from "@/hooks/use-motion-preference";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight, Flower2, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { googleReviews, shop, whatsapp } from "@/data";
export function WordsPullUpMultiStyle({ reveal = true }: { reveal?: boolean }) {
  const reduced = useMotionPreference();
  return (
    <h1>
      {"Flores que transformam momentos em memórias."
        .split(" ")
        .map((word, i) => (
          <motion.span
            key={i}
            initial={reduced ? false : { opacity: 0, y: 20 }}
            animate={
              reveal || reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }
            }
            transition={{ delay: i * 0.09, duration: 0.6 }}
          >
            {word}{" "}
          </motion.span>
        ))}
    </h1>
  );
}
export default function PrismaHero({ reveal = true }: { reveal?: boolean }) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 850], [0, 100]);
  const textY = useTransform(scrollY, [0, 850], [0, -45]);
  const reduced = useMotionPreference();
  return (
    <section className="hero" id="inicio">
      <HeroMedia />
      <div className="hero-glow" />
      <motion.div
        className="hero-art"
        style={{ y: reduced ? 0 : y }}
        aria-label="Composição botânica ilustrativa"
      >
        <motion.div
          className="hero-art-entry"
          initial={reduced ? false : { x: 100, opacity: 0, rotate: 8 }}
          animate={
            reveal || reduced
              ? { x: 0, opacity: 1, rotate: 0 }
              : { x: 100, opacity: 0, rotate: 8 }
          }
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="art-ring" />
          <Flower2 className="flower f1" />
          <Flower2 className="flower f2" />
          <Flower2 className="flower f3" />
          <span className="stem s1" />
          <span className="stem s2" />
          <span className="leaf l1" />
          <span className="leaf l2" />
          <span className="leaf l3" />
          <div className="bouquet-wrap" />
          <span className="art-caption">
            UM POUCO DE NATUREZA. MUITO SENTIMENTO.
          </span>
        </motion.div>
      </motion.div>
      <motion.div className="hero-copy" style={{ y: reduced ? 0 : textY }}>
        <span className="eyebrow light">
          <MapPin size={13} /> ATENDEMOS BLUMENAU E REGIÃO
        </span>
        <WordsPullUpMultiStyle reveal={reveal} />
        <p>
          Há sentimentos que só as flores conseguem dizer.
          <br />
          Nós ajudamos você a transformá-los em presentes.
        </p>
        <div className="hero-actions">
          <Link className="button cream" to="/loja">
            Comprar flores <ArrowUpRight size={17} />
          </Link>
          <a
            className="text-link"
            href={whatsapp("Olá! Gostaria de conhecer as flores e presentes.")}
            target="_blank"
            rel="noreferrer"
          >
            Fale conosco pelo WhatsApp ↗
          </a>
        </div>
        <div className="hero-proof">
          <span>
            <b>
              4,8 <small>★★★★★</small>
            </b>
            no Google · {googleReviews.count} avaliações
          </span>
          <span>
            <b>Desde 2007</b>cultivando histórias
          </span>
          <span>
            <b>Entrega local</b>seg. a sáb.
          </span>
        </div>
      </motion.div>
      <div className="hero-note">
        <span>feito com afeto</span>
        <Flower2 size={27} />
        <small>
          para quem faz
          <br />
          sua vida florescer
        </small>
      </div>
      <a href="#colecao" className="scroll-note">
        DESCUBRA NOSSO JARDIM <span>↓</span>
      </a>
    </section>
  );
}
