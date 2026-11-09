import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Play, Plus, X } from "lucide-react";
import { galleryMedia, shop } from "@/data";
export default function MediaGallery() {
  const [selected, setSelected] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const close = () => {
    setSelected(null);
    requestAnimationFrame(() => opener.current?.focus());
  };
  useEffect(() => {
    if (selected === null) return;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelected(null);
        requestAnimationFrame(() => opener.current?.focus());
      }
      if (e.key === "ArrowRight")
        setSelected((s) => (s === null ? null : (s + 1) % galleryMedia.length));
      if (e.key === "ArrowLeft")
        setSelected((s) =>
          s === null
            ? null
            : (s + galleryMedia.length - 1) % galleryMedia.length,
        );
      if (e.key === "Tab") {
        const all = Array.from(
          document.querySelectorAll<HTMLElement>(
            ".media-lightbox button,.media-lightbox video",
          ),
        );
        const first = all[0],
          last = all[all.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = old;
      window.removeEventListener("keydown", key);
    };
  }, [selected]);
  const item = selected === null ? null : galleryMedia[selected];
  return (
    <section className="section gallery" id="galeria">
      <div className="section-top">
        <div>
          <span className="eyebrow">BELEZA QUE ACONTECE POR AQUI</span>
          <h2>
            Nosso jardim de <em>inspirações.</em>
          </h2>
        </div>
        <a
          className="text-link dark"
          href={shop.instagram}
          target="_blank"
          rel="noreferrer"
        >
          @espacodasflores_ ↗
        </a>
      </div>
      <div className="gallery-grid real-gallery">
        {galleryMedia.map((media, i) => (
          <button
            className="gallery-item real-media"
            key={media.id}
            onClick={(e) => {
              opener.current = e.currentTarget;
              setSelected(i);
            }}
            aria-label={`${media.video ? "Reproduzir" : "Ampliar"}: ${media.title}`}
          >
            <img
              src={media.poster}
              alt={media.alt}
              loading="lazy"
              width="720"
              height={media.height}
            />
            <span className="media-caption">
              <span>{media.title}</span>
              <small>
                {media.video
                  ? "VÍDEO DA LOJA · TOQUE PARA ASSISTIR"
                  : "FRAME DO VÍDEO DA LOJA"}
              </small>
            </span>
            <span className="media-icon">
              {media.video ? <Play size={17} /> : <Plus size={18} />}
            </span>
          </button>
        ))}
      </div>
      <p className="media-footnote">
        Momentos reais do Espaço das Flores. Vídeos disponíveis sob demanda, sem
        reprodução automática.
      </p>
      {item && (
        <div
          className="overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div
            className="media-lightbox"
            role="dialog"
            aria-modal="true"
            aria-labelledby="media-title"
          >
            <button
              className="close"
              ref={closeRef}
              aria-label="Fechar galeria"
              onClick={close}
            >
              <X />
            </button>
            <div className="media-stage">
              {item.video ? (
                <video
                  key={item.id}
                  controls
                  playsInline
                  preload="none"
                  poster={item.poster}
                  aria-label={item.alt}
                  tabIndex={0}
                >
                  <source src={item.video} type="video/mp4" />
                  Seu navegador não suporta vídeo.
                </video>
              ) : (
                <img src={item.poster} alt={item.alt} />
              )}
            </div>
            <div className="media-toolbar">
              <button
                aria-label="Imagem anterior"
                onClick={() =>
                  setSelected(
                    (selected! + galleryMedia.length - 1) % galleryMedia.length,
                  )
                }
              >
                <ChevronLeft />
              </button>
              <div>
                <h3 id="media-title">{item.title}</h3>
                <span aria-live="polite">
                  {selected! + 1} / {galleryMedia.length}
                </span>
              </div>
              <button
                aria-label="Próxima imagem"
                onClick={() =>
                  setSelected((selected! + 1) % galleryMedia.length)
                }
              >
                <ChevronRight />
              </button>
            </div>
            <p>
              {item.video
                ? "Vídeo original da loja, otimizado para web e sem áudio."
                : "Imagem extraída do vídeo enviado pela loja."}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
