import { useEffect } from "react";
/** Entry animation is separate from the inner parallax layer. Content stays visible without JS. */
export function useScrollStory(route: string) {
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    let cleanup = () => {};
    const setup = () => {
      cleanup();
      if (query.matches) return;
      const targets = Array.from(
        document.querySelectorAll<HTMLElement>(
          ".section-top,.product-card,.benefits>div,.occasions>div,.about>div,.contact>div,.gallery-item,.testimonials-intro,.testimonials-columns,footer>.brand,.page>h1,.page>.filters",
        ),
      );
      targets.forEach((el, index) => {
        el.classList.add("scroll-reveal");
        el.style.setProperty(
          "--reveal-delay",
          `${Math.min(index % 4, 3) * 80}ms`,
        );
        el.dataset.revealDirection = el.matches(
          ".about>div:first-child,.occasions>div:first-child",
        )
          ? "left"
          : el.matches(".about>div:last-child,.contact-details")
            ? "right"
            : "up";
      });
      const observer = new IntersectionObserver(
        (entries) =>
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-revealed");
              observer.unobserve(entry.target);
            }
          }),
        { threshold: 0.1, rootMargin: "0px 0px -25px 0px" },
      );
      targets.forEach((el) => observer.observe(el));
      const layers = Array.from(
        document.querySelectorAll<HTMLElement>(
          ".about-art>svg,.product-art>svg,.real-media img",
        ),
      );
      let frame = 0;
      const update = () => {
        frame = 0;
        const height = innerHeight;
        const mobile = innerWidth <= 760;
        for (const el of layers) {
          const rect = el.parentElement!.getBoundingClientRect();
          if (rect.bottom < 0 || rect.top > height) continue;
          const fraction = (rect.top + rect.height / 2 - height / 2) / height;
          const distance =
            Math.max(-1, Math.min(1, fraction)) * (mobile ? 10 : 22);
          el.style.setProperty("--scroll-drift", `${distance.toFixed(2)}px`);
        }
        const total = document.documentElement.scrollHeight - height;
        document.documentElement.style.setProperty(
          "--page-progress",
          `${total > 0 ? scrollY / total : 0}`,
        );
      };
      const scroll = () => {
        if (!frame) frame = requestAnimationFrame(update);
      };
      addEventListener("scroll", scroll, { passive: true });
      addEventListener("resize", scroll);
      update();
      cleanup = () => {
        observer.disconnect();
        removeEventListener("scroll", scroll);
        removeEventListener("resize", scroll);
        cancelAnimationFrame(frame);
        targets.forEach((el) => {
          el.classList.remove("scroll-reveal", "is-revealed");
          el.style.removeProperty("--reveal-delay");
          delete el.dataset.revealDirection;
        });
        layers.forEach((el) => el.style.removeProperty("--scroll-drift"));
        document.documentElement.style.removeProperty("--page-progress");
      };
    };
    setup();
    query.addEventListener("change", setup);
    return () => {
      cleanup();
      query.removeEventListener("change", setup);
    };
  }, [route]);
}
