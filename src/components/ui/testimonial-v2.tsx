import { useMotionPreference } from "@/hooks/use-motion-preference";
import { useEffect, useRef, useState } from "react";
import { motion, useAnimationFrame, useMotionValue } from "framer-motion";
import { ArrowUpRight, Star } from "lucide-react";
import { googleReviews } from "@/data";
type Review = (typeof googleReviews.items)[number];
function TestimonialsColumn({
  items,
  duration,
}: {
  items: Review[];
  duration: number;
}) {
  const ref = useRef<HTMLUListElement>(null);
  const y = useMotionValue(0);
  const reduced = useMotionPreference();
  useAnimationFrame((_, delta) => {
    if (reduced || !ref.current) return;
    const distance = ref.current.scrollHeight / 2;
    if (distance)
      y.set(
        -(
          (Math.abs(y.get()) +
            (Math.min(delta, 50) * distance) / (duration * 1000)) %
          distance
        ),
      );
  });
  return (
    <div className={"testimonial-column" + (reduced ? " static-reviews" : "")}>
      <motion.ul ref={ref} style={{ y: reduced ? 0 : y }}>
        {(reduced ? [0] : [0, 1]).map((copy) =>
          items.map((review) => (
            <motion.li
              className="testimonial-card"
              key={`${copy}-${review.id}`}
              aria-hidden={copy === 1 ? true : undefined}
              whileHover={reduced ? undefined : { y: -4 }}
            >
              <div
                className="review-stars"
                aria-label={`${review.stars} de 5 estrelas`}
              >
                {Array.from({ length: review.stars }, (_, i) => (
                  <Star
                    key={i}
                    size={14}
                    fill="currentColor"
                    aria-hidden="true"
                  />
                ))}
              </div>
              <blockquote>
                <p>“{review.text}”</p>
                <div className="review-author">
                  <span className="review-avatar" aria-hidden="true">
                    {review.initials}
                  </span>
                  <div>
                    <cite>{review.name}</cite>
                    <span>Avaliação no Google</span>
                  </div>
                  <span className="google-letter" aria-hidden="true">
                    G
                  </span>
                </div>
                <small>{review.note}</small>
              </blockquote>
            </motion.li>
          )),
        )}
      </motion.ul>
    </div>
  );
}
export default function TestimonialsSection() {
  const reduced = useMotionPreference();
  const [mobile, setMobile] = useState(
    () => window.matchMedia("(max-width: 760px)").matches,
  );
  useEffect(() => {
    const q = window.matchMedia("(max-width: 760px)");
    const change = () => setMobile(q.matches);
    q.addEventListener("change", change);
    return () => q.removeEventListener("change", change);
  }, []);
  return (
    <section
      className="testimonials-section section"
      aria-labelledby="testimonials-heading"
    >
      <motion.div
        className="testimonials-intro"
        initial={reduced ? false : { opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.8 }}
      >
        <span className="eyebrow">AFETO QUE VOLTA EM PALAVRAS</span>
        <h2 id="testimonials-heading">
          Histórias de quem
          <br />
          <em>já floresceu com a gente.</em>
        </h2>
        <p>
          O carinho está nos detalhes. E nas palavras de quem passa por aqui.
        </p>
        <div className="google-summary">
          <b>{googleReviews.rating}</b>
          <div>
            <div className="review-stars" aria-label="4,8 de 5 estrelas">
              ★★★★★
            </div>
            <span>{googleReviews.count} avaliações no Google</span>
          </div>
        </div>
        <small className="reviews-source">{googleReviews.source}</small>
        <a
          className="text-link dark"
          href="https://www.google.com/search?q=Floricultura+Espa%C3%A7o+das+Flores+Blumenau+avalia%C3%A7%C3%B5es"
          target="_blank"
          rel="noreferrer"
        >
          Pesquisar avaliações no Google <ArrowUpRight size={16} />
        </a>
      </motion.div>
      <div
        className={"testimonials-columns" + (reduced ? " reduced" : "")}
        aria-label="Avaliações de clientes"
      >
        {mobile ? (
          <TestimonialsColumn items={googleReviews.items} duration={28} />
        ) : (
          googleReviews.items.map((item, i) => (
            <TestimonialsColumn
              key={item.id}
              items={[item]}
              duration={i === 0 ? 20 : 26}
            />
          ))
        )}
      </div>
    </section>
  );
}
