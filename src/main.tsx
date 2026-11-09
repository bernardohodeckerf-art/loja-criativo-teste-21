import React, { useEffect, useState, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Link, useLocation, useParams } from "react-router-dom";
import {
  ArrowUpRight,
  ArrowRight,
  Flower2,
  Menu,
  X,
  ShoppingBag,
  Truck,
  Heart,
  Sprout,
  Plus,
  Minus,
  Trash2,
  MessageCircle,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { api, json } from "./api";
import Admin from "./components/ui/admin";
import Checkout from "./components/ui/checkout";
import PrismaHero from "./components/ui/prisma-hero";
import MediaGallery from "./components/ui/media-gallery";
import TestimonialsSection from "./components/ui/testimonial-v2";
import FloralScrollScene from "./components/ui/floral-scroll-scene";
import {
  categories,
  initialProducts,
  money,
  Product,
  shop,
  whatsapp,
} from "./data";
import "./index.css";
import { useScrollStory } from "./hooks/use-scroll-story";
import { useRouteMetadata } from "./hooks/use-route-metadata";
type Item = { id: string; variation: string; qty: number };
function read<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
}
function App() {
  const location = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [catalogError, setCatalogError] = useState("");
  const [loading, setLoading] = useState(true);
  useScrollStory(location.pathname + products.length);
  const refreshProducts = useCallback(async () => {
    try {
      const result = await api<Product[]>("/api/products");
      setProducts(result);
      setCatalogError("");
    } catch (e) {
      setCatalogError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refreshProducts();
    const refresh = () => {
      if (document.visibilityState === "visible") void refreshProducts();
    };
    document.addEventListener("visibilitychange", refresh);
    return () => document.removeEventListener("visibilitychange", refresh);
  }, [refreshProducts, location.pathname]);
  useRouteMetadata(location.pathname, products);
  const [cart, setCart] = useState<Item[]>(() => read("flowers-cart", []));
  const [menu, setMenu] = useState(false);
  const [question, setQuestion] = useState<string | null>(null);
  const [intro, setIntro] = useState(
    () =>
      !sessionStorage.getItem("flowers-intro") &&
      !matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const t = setTimeout(() => {
      setIntro(false);
      sessionStorage.setItem("flowers-intro", "1");
    }, 1700);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    localStorage.setItem("flowers-cart", JSON.stringify(cart));
  }, [cart]);
  useEffect(() => {
    setMenu(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setQuestion(null);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  const add = (p: Product, qty: number, variation: string) =>
    setCart((c) => {
      const found = c.find((i) => i.id === p.id && i.variation === variation);
      return found
        ? c.map((i) =>
            i === found ? { ...i, qty: Math.min(p.stock, i.qty + qty) } : i,
          )
        : [...c, { id: p.id, qty, variation }];
    });
  const active = products.filter((p) => p.active);
  return (
    <>
      {intro && (
        <div className="intro">
          <Flower2 size={64} />
          <h2>Espaço das Flores</h2>
          <p>onde o afeto floresce</p>
          <button
            onClick={() => {
              setIntro(false);
              sessionStorage.setItem("flowers-intro", "1");
            }}
          >
            Pular abertura →
          </button>
        </div>
      )}
      <header>
        <Link to="/" className="brand">
          <Flower2 />
          <span>
            espaço das flores<small>FLORICULTURA · BLUMENAU</small>
          </span>
        </Link>
        <nav className={menu ? "open" : ""}>
          {[
            ["Início", "/"],
            ["Produtos", "/#colecao"],
            ["Ocasiões", "/#ocasioes"],
            ["Sobre", "/#sobre"],
            ["Galeria", "/#galeria"],
            ["Contato", "/#contato"],
          ].map(([n, h]) => (
            <a key={n} href={h} onClick={() => setMenu(false)}>
              {n}
            </a>
          ))}
          <Link className="nav-shop" to="/loja">
            Nossa loja <ArrowUpRight size={14} />
          </Link>
        </nav>
        <Link
          className="bag"
          to="/carrinho"
          aria-label={`Carrinho, ${cart.reduce((s, i) => s + i.qty, 0)} itens`}
        >
          <ShoppingBag size={21} />
          <span>{cart.reduce((s, i) => s + i.qty, 0)}</span>
        </Link>
        <button
          className="mobile-menu"
          aria-label={menu ? "Fechar menu" : "Abrir menu"}
          aria-expanded={menu}
          onClick={() => setMenu(!menu)}
        >
          {menu ? <X /> : <Menu />}
        </button>
      </header>
      <div className="scroll-progress" aria-hidden="true" />
      <main>
        {catalogError && (
          <div className="catalog-status" role="alert">
            Não foi possível atualizar o catálogo.{" "}
            <button onClick={() => refreshProducts()}>Tentar novamente</button>
          </div>
        )}
        {loading && (
          <p className="catalog-status" role="status">
            Carregando o catálogo…
          </p>
        )}
        {location.pathname === "/" ? (
          <>
            <PrismaHero />
            <div className="benefits">
              <div>
                <Truck />
                <span>
                  <b>Flores a caminho</b>
                  <small>Entrega em Blumenau e região</small>
                </span>
              </div>
              <div>
                <Sprout />
                <span>
                  <b>Beleza em cada detalhe</b>
                  <small>Flores frescas, escolhidas com carinho</small>
                </span>
              </div>
              <div>
                <Heart />
                <span>
                  <b>De pessoa para pessoa</b>
                  <small>Atendimento feito para você</small>
                </span>
              </div>
            </div>
            <FloralScrollScene />
            <section className="section collection" id="colecao">
              <div className="section-top">
                <div>
                  <span className="eyebrow">NOSSA COLEÇÃO</span>
                  <h2>
                    Para cada sentimento,
                    <br />
                    <em>uma flor.</em>
                  </h2>
                </div>
                <div>
                  <p>
                    Pequenos gestos. Grandes memórias.
                    <br />
                    Encontre o presente que fala por você.
                  </p>
                  <Link className="text-link dark" to="/loja">
                    Conheça toda a coleção <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
              <div className="product-grid">
                {active
                  .filter((p) => p.featured)
                  .slice(0, 4)
                  .map((p, i) => (
                    <Card key={p.id} p={p} index={i} />
                  ))}
              </div>
              <div className="category-line">
                {categories.map((c) => (
                  <Link to={"/loja?categoria=" + encodeURIComponent(c)} key={c}>
                    {c} ↗
                  </Link>
                ))}
              </div>
            </section>
            <section className="occasions" id="ocasioes">
              <div>
                <span className="eyebrow light">
                  A VIDA MERECE SER CELEBRADA
                </span>
                <h2>
                  Há flores para
                  <br />
                  <em>todos os momentos.</em>
                </h2>
                <p>E um jeito especial de tornar cada um inesquecível.</p>
              </div>
              <div className="occasion-grid">
                {["Aniversário", "Casamento", "Formatura", "Homenagens"].map(
                  (v, i) => (
                    <button key={v} onClick={() => setQuestion(v)}>
                      <span>0{i + 1}</span>
                      <h3>{v}</h3>
                      <ArrowUpRight />
                    </button>
                  ),
                )}
                <a
                  href={whatsapp(
                    "Olá! Quero flores para uma ocasião especial.",
                  )}
                >
                  Outra ocasião? Vamos conversar ↗
                </a>
              </div>
            </section>
            <section className="section about" id="sobre">
              <div className="about-art">
                <Flower2 size={130} />
                <span>
                  Um lugar onde
                  <br />
                  <em>o carinho cria raízes.</em>
                </span>
                <small>ILUSTRAÇÃO BOTÂNICA · FOTO DA FACHADA A INSERIR</small>
              </div>
              <div>
                <span className="eyebrow">
                  PRAZER, SOMOS O ESPAÇO DAS FLORES
                </span>
                <h2>
                  Mais que flores.
                  <br />
                  <em>Parte da sua história.</em>
                </h2>
                <p>
                  Em Blumenau, nosso espaço é um convite para desacelerar,
                  sentir e encontrar beleza nas pequenas coisas.
                </p>
                <p>
                  Cada buquê é preparado com cuidado. Cada presente carrega uma
                  intenção. Desde 2007, fazemos parte de encontros, celebrações
                  e gestos de amor.
                </p>
                <button
                  className="button green"
                  onClick={() => setQuestion("")}
                >
                  Vamos criar algo especial <ArrowUpRight size={17} />
                </button>
              </div>
            </section>
            <MediaGallery />
            <TestimonialsSection />
            <section className="section contact" id="contato">
              <div>
                <span className="eyebrow">VAMOS FLORESCER SEU DIA?</span>
                <h2>
                  O próximo gesto de carinho
                  <br />
                  <em>começa aqui.</em>
                </h2>
                <a
                  className="button green"
                  href={whatsapp("Olá! Gostaria de fazer um pedido.")}
                  target="_blank"
                  rel="noreferrer"
                >
                  Converse pelo WhatsApp <ArrowUpRight size={17} />
                </a>
              </div>
              <div className="contact-details">
                <b>Venha nos visitar</b>
                <p>{shop.address}</p>
                <b>Nosso horário</b>
                <p>{shop.hours}</p>
                <a href="tel:+554733251889">{shop.phone}</a>
                <small>
                  Pedidos e entregas confirmados pelo nosso atendimento.
                </small>
              </div>
            </section>
          </>
        ) : location.pathname === "/loja" ? (
          <Catalog products={active} />
        ) : location.pathname.startsWith("/loja/") ? (
          loading ? (
            <section className="section page">
              <p>Carregando produto…</p>
            </section>
          ) : (
            <Detail products={active} add={add} />
          )
        ) : location.pathname === "/carrinho" ? (
          <section className="section page">
            <span className="eyebrow">ESCOLHIDOS COM CARINHO</span>
            <h1>Seu carrinho</h1>
            {cart.length === 0 ? (
              <>
                <p>Seu próximo gesto de afeto está esperando por você.</p>
                <Link className="button green" to="/loja">
                  Explorar a loja →
                </Link>
              </>
            ) : (
              <>
                <div className="cart-list">
                  {cart.map((item, index) => {
                    const p = products.find((p) => p.id === item.id);
                    return (
                      <div className="cart-row" key={index}>
                        <div>
                          <h3>{p?.name || "Produto removido"}</h3>
                          <p>
                            {item.variation} ·{" "}
                            {p?.price !== null && p?.price !== undefined
                              ? money(p.price)
                              : "Sob consulta"}
                          </p>
                          {(!p?.active || p.stock < item.qty) && (
                            <strong>
                              Indisponível na quantidade selecionada
                            </strong>
                          )}
                        </div>
                        <div className="quantity">
                          <button
                            aria-label="Diminuir quantidade"
                            onClick={() =>
                              setCart((c) =>
                                c.map((i, j) =>
                                  j === index
                                    ? { ...i, qty: Math.max(1, i.qty - 1) }
                                    : i,
                                ),
                              )
                            }
                          >
                            <Minus size={15} />
                          </button>
                          {item.qty}
                          <button
                            aria-label="Aumentar quantidade"
                            disabled={!p || item.qty >= p.stock}
                            onClick={() =>
                              setCart((c) =>
                                c.map((i, j) =>
                                  j === index ? { ...i, qty: i.qty + 1 } : i,
                                ),
                              )
                            }
                          >
                            <Plus size={15} />
                          </button>
                        </div>
                        <button
                          aria-label="Remover item"
                          onClick={() =>
                            setCart((c) => c.filter((_, j) => j !== index))
                          }
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    );
                  })}
                </div>
                <h3>
                  Subtotal dos itens com preço:{" "}
                  {money(
                    cart.reduce(
                      (s, i) =>
                        s +
                        (products.find((p) => p.id === i.id)?.price || 0) *
                          i.qty,
                      0,
                    ),
                  )}
                </h3>
                <p>
                  Itens sob consulta e entrega serão confirmados no atendimento.
                </p>
                {cart.every((i) => {
                  const p = products.find((p) => p.id === i.id);
                  return p?.active && p.stock >= i.qty;
                }) ? (
                  <Checkout
                    key={JSON.stringify(cart)}
                    items={cart}
                    onRefresh={refreshProducts}
                  />
                ) : (
                  <p>Remova ou ajuste os itens indisponíveis para continuar.</p>
                )}
              </>
            )}
          </section>
        ) : location.pathname === "/admin" ? (
          <Admin onChange={refreshProducts} />
        ) : (
          <section className="section page">
            <h1>Página não encontrada</h1>
            <Link to="/">Voltar ao início</Link>
          </section>
        )}
      </main>
      <footer>
        <Link to="/" className="brand">
          <Flower2 />
          <span>
            espaço das flores<small>FLORES, PRESENTES E AFETO.</small>
          </span>
        </Link>
        <p>Feito de natureza. Feito de carinho.</p>
        <div>
          <Link to="/loja">Loja</Link>
          <Link to="/admin">Administração</Link>
          <a href={shop.instagram}>Instagram ↗</a>
        </div>
        <small>
          © {new Date().getFullYear()} Espaço das Flores · Blumenau, SC
        </small>
      </footer>
      <a
        className="floating-whatsapp"
        href={whatsapp("Olá! Vim pelo site e gostaria de atendimento.")}
        aria-label="Conversar pelo WhatsApp"
        target="_blank"
        rel="noreferrer"
      >
        <MessageCircle />
      </a>
      {question !== null && (
        <Question occasion={question} close={() => setQuestion(null)} />
      )}
    </>
  );
}
function Art({ p, index = 0 }: { p: Product; index?: number }) {
  return p.photo ? (
    <img className="product-photo" src={p.photo} alt={p.name} loading="lazy" />
  ) : (
    <div className={"product-art tone-" + (index % 4)}>
      <span className="paper-petal p1" />
      <span className="paper-petal p2" />
      <span className="paper-petal p3" />
      <Flower2 />
      <span className="paper-stem" />
      <small>IMAGEM ILUSTRATIVA</small>
    </div>
  );
}
function Card({ p, index }: { p: Product; index: number }) {
  return (
    <Link className="product-card" to={"/loja/" + p.id}>
      <div className="product-image">
        <Art p={p} index={index} />
        <span className="product-arrow">
          <ArrowUpRight size={19} />
        </span>
        {index === 0 && <span className="tag">UM CLÁSSICO DO AFETO</span>}
      </div>
      <span className="eyebrow">{p.category}</span>
      <h3>{p.name}</h3>
      <p>{p.price !== null ? money(p.price) : "Consulte nosso atendimento"}</p>
    </Link>
  );
}
function Catalog({ products }: { products: Product[] }) {
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState(
    new URLSearchParams(window.location.search).get("categoria") || "",
  );
  const [sort, setSort] = useState("destaque");
  const norm = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const filtered = products
    .filter(
      (p) =>
        (!cat || p.category === cat) &&
        norm(p.name + " " + p.description).includes(norm(search)),
    )
    .sort((a, b) =>
      sort === "nome"
        ? a.name.localeCompare(b.name)
        : sort === "preco"
          ? (a.price ?? Infinity) - (b.price ?? Infinity)
          : Number(b.featured) - Number(a.featured),
    );
  return (
    <section className="section page">
      <span className="eyebrow">ESCOLHA COM O CORAÇÃO</span>
      <h1>Nosso jardim de presentes.</h1>
      <p>Flores e delicadezas para transformar o dia de alguém.</p>
      <div className="filters">
        <input
          aria-label="Buscar produtos"
          placeholder="O que você procura?"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          aria-label="Categoria"
          value={cat}
          onChange={(e) => setCat(e.target.value)}
        >
          <option value="">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select
          aria-label="Ordenar por"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="destaque">Destaques</option>
          <option value="nome">Nome</option>
          <option value="preco">Menor preço</option>
        </select>
      </div>
      <p>{filtered.length} produtos encontrados</p>
      <div className="product-grid">
        {filtered.map((p, i) => (
          <Card key={p.id} p={p} index={i} />
        ))}
      </div>
      {!filtered.length && (
        <p>Nenhuma flor por aqui. Experimente outra busca.</p>
      )}
    </section>
  );
}
function Detail({
  products,
  add,
}: {
  products: Product[];
  add: (p: Product, q: number, v: string) => void;
}) {
  const slug = useLocation().pathname.split("/")[2],
    p = products.find((p) => p.id === slug);
  const [qty, setQty] = useState(1),
    [variation, setVariation] = useState(""),
    [done, setDone] = useState(false),
    [selectedPhoto, setSelectedPhoto] = useState("");
  if (!p)
    return (
      <section className="section page">
        <h1>Produto não encontrado</h1>
        <Link to="/loja">Voltar à loja</Link>
      </section>
    );
  const photos = p.photos?.length ? p.photos : p.photo ? [p.photo] : [];
  const selectedVariation = variation || p.variation.split(",")[0];
  return (
    <section className="section page">
      <Link className="text-link dark" to="/loja">
        ← Voltar à coleção
      </Link>
      <div className="detail">
        <div>
          {photos.length ? (
            <>
              <img
                className="detail-photo"
                src={selectedPhoto || p.photo || photos[0]}
                alt={p.name}
              />
              <div className="product-thumbs">
                {photos.map((photo, i) => (
                  <button
                    key={photo}
                    aria-label={`Ver foto ${i + 1}`}
                    className={
                      (selectedPhoto || p.photo) === photo ? "selected" : ""
                    }
                    onClick={() => setSelectedPhoto(photo)}
                  >
                    <img src={photo} alt={`${p.name}, foto ${i + 1}`} />
                  </button>
                ))}
              </div>
            </>
          ) : (
            <Art p={p} />
          )}
        </div>
        <div>
          <span className="eyebrow">{p.category}</span>
          <h1>{p.name}</h1>
          <p>{p.description}</p>
          <h3>{p.price !== null ? money(p.price) : "Valor sob consulta"}</h3>
          <p>
            {p.stock > 0
              ? `${p.stock} disponíveis · sujeito à confirmação`
              : "Indisponível"}
          </p>
          <label>
            Variação
            <select
              value={selectedVariation}
              onChange={(e) => {
                setVariation(e.target.value);
                setDone(false);
              }}
            >
              {p.variation.split(",").map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label>
            Quantidade
            <input
              type="number"
              min="1"
              max={p.stock}
              value={qty}
              disabled={!p.stock}
              onChange={(e) => {
                setQty(Math.min(p.stock, Math.max(1, Number(e.target.value))));
                setDone(false);
              }}
            />
          </label>
          <button
            className="button green"
            disabled={p.stock === 0}
            onClick={() => {
              add(p, qty, selectedVariation);
              setDone(true);
            }}
          >
            {done ? (
              <>
                <Check size={18} />
                Adicionado ao carrinho
              </>
            ) : (
              <>
                Adicionar ao carrinho <ShoppingBag size={18} />
              </>
            )}
          </button>
          {done && (
            <Link className="text-link dark" to="/carrinho">
              Ver carrinho →
            </Link>
          )}
          <a
            className="text-link dark"
            href={whatsapp(
              `Olá! Gostaria de consultar ${p.name}, variação ${selectedVariation}.`,
            )}
          >
            Consultar pelo WhatsApp ↗
          </a>
        </div>
      </div>
    </section>
  );
}
function Question({
  occasion,
  close,
}: {
  occasion: string;
  close: () => void;
}) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<Record<string, string>>({
    ocasião: occasion,
    tipo: "Buquês",
    cores: "",
    data: "",
    orçamento: "",
    detalhes: "",
    nome: "",
    telefone: "",
    modalidade: "Retirada",
    endereço: "",
    cartão: "",
  });
  const field = (
    key: string,
    label: string,
    required = false,
    type = "text",
  ) => (
    <label key={key}>
      {label}
      <input
        type={type}
        required={required}
        value={data[key]}
        onChange={(e) => setData({ ...data, [key]: e.target.value })}
        {...(key === "telefone"
          ? { pattern: "[+0-9() .-]{10,18}", title: "Informe telefone com DDD" }
          : {})}
      />
    </label>
  );
  return (
    <div
      className="overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Pedido personalizado"
    >
      <form
        className="question"
        onSubmit={(e) => {
          e.preventDefault();
          setStep(step + 1);
        }}
      >
        <button
          className="close"
          type="button"
          aria-label="Fechar formulário"
          onClick={close}
        >
          <X />
        </button>
        <span className="eyebrow">
          FEITO ESPECIALMENTE PARA VOCÊ · {step}/3
        </span>
        <h2>
          {step === 1
            ? "Vamos imaginar seu presente?"
            : step === 2
              ? "Para quem vai esse carinho?"
              : "Tudo pronto para florescer."}
        </h2>
        <progress max="3" value={step} />
        {step === 1 ? (
          <div className="form-grid">
            {field("ocasião", "Ocasião", true)}
            <label>
              Tipo de produto
              <select
                value={data.tipo}
                onChange={(e) => setData({ ...data, tipo: e.target.value })}
              >
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            {field("cores", "Cores preferidas")}
            {field("data", "Data desejada", true, "date")}
            {field("orçamento", "Orçamento (opcional)")}
            {field("detalhes", "Outros detalhes")}
          </div>
        ) : step === 2 ? (
          <div className="form-grid">
            {field("nome", "Seu nome", true)}
            {field("telefone", "Telefone com DDD", true, "tel")}
            <label>
              Como receber?
              <select
                value={data.modalidade}
                onChange={(e) =>
                  setData({ ...data, modalidade: e.target.value })
                }
              >
                <option>Retirada</option>
                <option>Entrega</option>
              </select>
            </label>
            {data.modalidade === "Entrega" &&
              field("endereço", "Endereço completo", true)}
            {field("cartão", "Mensagem do cartão (opcional)")}
          </div>
        ) : (
          <>
            <dl>
              {Object.entries(data)
                .filter(
                  ([k, v]) =>
                    v && (k !== "endereço" || data.modalidade === "Entrega"),
                )
                .map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
            </dl>
            <p>
              Você poderá revisar a mensagem no WhatsApp antes de enviar. O
              pedido depende de confirmação.
            </p>
          </>
        )}
        <div className="form-actions">
          {step > 1 && (
            <button type="button" onClick={() => setStep(step - 1)}>
              ← Voltar
            </button>
          )}
          {step < 3 ? (
            <button className="button green" type="submit">
              Continuar <ArrowRight size={16} />
            </button>
          ) : (
            <a
              className="button green"
              target="_blank"
              rel="noreferrer"
              href={whatsapp(
                "Olá! Gostaria de um presente personalizado:\n" +
                  Object.entries(data)
                    .filter(
                      ([k, v]) =>
                        v &&
                        (k !== "endereço" || data.modalidade === "Entrega"),
                    )
                    .map(([k, v]) => `${k}: ${v}`)
                    .join("\n"),
              )}
            >
              Abrir no WhatsApp ↗
            </a>
          )}
        </div>
      </form>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
