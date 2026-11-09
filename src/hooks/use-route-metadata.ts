import { useEffect } from "react";
import { Product } from "@/data";
export function useRouteMetadata(path: string, products: Product[]) {
  useEffect(() => {
    const p = path.startsWith("/loja/")
      ? products.find((p) => p.id === path.split("/")[2])
      : null;
    const names: Record<string, string> = {
      "/": "Flores e afeto em Blumenau",
      "/loja": "Nossa loja",
      "/carrinho": "Seu carrinho",
      "/admin": "Administração",
    };
    const title = `${p?.name || names[path] || "Espaço das Flores"} | Espaço das Flores`;
    const description =
      p?.description ||
      "Flores, presentes e afeto em Blumenau. Conheça a Floricultura Espaço das Flores.";
    document.title = title;
    const meta = (name: string, value: string, property = false) => {
      let el = document.head.querySelector<HTMLMetaElement>(
        `meta[${property ? "property" : "name"}="${name}"]`,
      );
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(property ? "property" : "name", name);
        document.head.append(el);
      }
      el.content = value;
    };
    meta("description", description);
    meta("og:title", title, true);
    meta("og:description", description, true);
    meta(
      "robots",
      path === "/admin" || path === "/carrinho"
        ? "noindex,nofollow"
        : "index,follow",
    );
  }, [path, products]);
}
