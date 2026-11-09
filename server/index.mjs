import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import multer from "multer";
import sharp from "sharp";
import { randomBytes, createHash } from "node:crypto";
import { mkdirSync, existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  db,
  dataDir,
  allProducts,
  parseProduct,
  verifyPassword,
} from "./db.mjs";
const app = express(),
  production = process.env.NODE_ENV === "production";
if (process.env.TRUST_PROXY === "1") app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(
  helmet({
    contentSecurityPolicy: production
      ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "https:", "blob:", "data:"],
            fontSrc: ["'self'"],
            mediaSrc: ["'self'"],
            connectSrc: ["'self'"],
            objectSrc: ["'none'"],
            frameAncestors: ["'none'"],
            upgradeInsecureRequests: [],
          },
        }
      : false,
    crossOriginEmbedderPolicy: false,
  }),
);
app.use(
  "/api",
  rateLimit({
    windowMs: 60000,
    limit: 150,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Muitas solicitações. Aguarde um minuto." },
  }),
);
app.use("/api", express.json({ limit: "256kb" }), (req, res, next) => {
  res.set("Cache-Control", "no-store");
  if (!["GET", "HEAD"].includes(req.method) && req.headers.origin) {
    let allowed;
    try {
      allowed =
        process.env.APP_ORIGIN || `${req.protocol}://${req.get("host")}`;
      if (req.headers.origin !== allowed)
        return res.status(403).json({ error: "Origem não permitida." });
    } catch {
      return res.status(403).json({ error: "Origem inválida." });
    }
  }
  next();
});
const digest = (t) => createHash("sha256").update(t).digest("hex");
const cookie = (res, token, age = 28800) =>
  res.set(
    "Set-Cookie",
    `flowers_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${production ? "; Secure" : ""}`,
  );
function session(req) {
  const token = req.headers.cookie
    ?.split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith("flowers_session="))
    ?.slice(16);
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  return (
    db
      .prepare("SELECT * FROM sessions WHERE token=? AND expires>?")
      .get(digest(token), Date.now()) || null
  );
}
function auth(req, res, next) {
  req.session = session(req);
  if (!req.session)
    return res.status(401).json({ error: "Entre para administrar a loja." });
  next();
}
function csrf(req, res, next) {
  if (req.headers["x-csrf-token"] !== req.session.csrf)
    return res.status(403).json({ error: "Sessão inválida. Entre novamente." });
  next();
}
const csrfToken = () => randomBytes(32).toString("hex");
app.get("/api/health", (_req, res) => {
  db.prepare("SELECT 1").get();
  res.json({ status: "ok" });
});
app.get("/api/products", (_req, res) =>
  res.json(allProducts().filter((p) => p.active)),
);
app.get("/api/auth/session", (req, res) => {
  const s = session(req);
  res.json(
    s
      ? { authenticated: true, username: s.username, csrf: s.csrf }
      : {
          authenticated: false,
          configured: !!db.prepare("SELECT username FROM users LIMIT 1").get(),
        },
  );
});
app.post("/api/auth/login", (req, res) => {
  const now = Date.now(),
    ip = req.ip;
  const attempt = db
    .prepare("SELECT * FROM login_attempts WHERE ip=? AND expires>?")
    .get(ip, now);
  if (attempt?.attempts >= 5) {
    res.set("Retry-After", String(Math.ceil((attempt.expires - now) / 1000)));
    return res
      .status(429)
      .json({
        error:
          "Muitas tentativas. Aguarde 15 minutos antes de tentar novamente.",
      });
  }
  const { username, password } = req.body || {};
  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    username.length > 80 ||
    password.length > 200
  )
    return res.status(400).json({ error: "Informe usuário e senha válidos." });
  const user = db.prepare("SELECT * FROM users WHERE username=?").get(username);
  // Always perform the password work, including for unknown users.
  const valid = verifyPassword(
    password,
    user?.password || "00000000000000000000000000000000:" + "00".repeat(64),
  );
  if (!user || !valid) {
    db.prepare(
      "INSERT INTO login_attempts(ip,attempts,expires) VALUES(?,1,?) ON CONFLICT(ip) DO UPDATE SET attempts=CASE WHEN expires<=? THEN 1 ELSE attempts+1 END,expires=CASE WHEN expires<=? THEN excluded.expires ELSE expires END",
    ).run(ip, now + 900000, now, now);
    return res.status(401).json({ error: "Usuário ou senha incorretos." });
  }
  db.prepare("DELETE FROM login_attempts WHERE ip=?").run(ip);
  db.prepare("DELETE FROM sessions WHERE expires<=?").run(now);
  const old = session(req);
  if (old) db.prepare("DELETE FROM sessions WHERE token=?").run(old.token);
  const token = randomBytes(32).toString("hex"),
    csrf = csrfToken();
  db.prepare(
    "INSERT INTO sessions(token,username,csrf,expires) VALUES(?,?,?,?)",
  ).run(digest(token), username, csrf, now + 28800000);
  cookie(res, token);
  res.json({ authenticated: true, username, csrf });
});
app.post("/api/auth/logout", auth, csrf, (req, res) => {
  db.prepare("DELETE FROM sessions WHERE token=?").run(req.session.token);
  cookie(res, "", 0);
  res.json({ ok: true });
});
app.get("/api/admin/products", auth, (_req, res) => res.json(allProducts()));
const categories = [
  "Ramalhetes",
  "Buquês",
  "Arranjos",
  "Cestas",
  "Presentes",
  "Plantas",
  "Ocasiões especiais",
  "Decoração",
  "Coroas",
];
const validPhoto = (p) =>
  typeof p === "string" &&
  (p === "" ||
    /^\/(media|uploads)\/[a-zA-Z0-9._-]+$/.test(p) ||
    (/^https:\/\//.test(p) && p.length < 1500));
function validate(p) {
  return (
    p &&
    /^[a-z0-9][a-z0-9-]{0,99}$/.test(p.id) &&
    typeof p.name === "string" &&
    p.name.trim().length > 0 &&
    p.name.length <= 140 &&
    typeof p.description === "string" &&
    p.description.trim().length > 0 &&
    p.description.length <= 5000 &&
    categories.includes(p.category) &&
    (p.price === null ||
      (Number.isFinite(p.price) && p.price >= 0 && p.price <= 1000000)) &&
    Number.isInteger(p.stock) &&
    p.stock >= 0 &&
    p.stock <= 1000000 &&
    typeof p.active === "boolean" &&
    typeof p.featured === "boolean" &&
    typeof p.variation === "string" &&
    p.variation.length > 0 &&
    p.variation.length <= 1000 &&
    p.variation.split(",").every((v) => v.trim().length > 0) &&
    validPhoto(p.photo) &&
    Array.isArray(p.photos) &&
    p.photos.length <= 8 &&
    p.photos.every(validPhoto)
  );
}
function clean(p) {
  return {
    id: p.id,
    name: p.name.trim(),
    description: p.description.trim(),
    category: p.category,
    price: p.price === null ? null : Math.round(p.price * 100) / 100,
    stock: p.stock,
    active: p.active,
    featured: p.featured,
    variation: p.variation
      .split(",")
      .map((v) => v.trim())
      .join(","),
    photo: p.photo,
    photos: [...new Set(p.photos.filter(Boolean))],
  };
}
app.post("/api/admin/products", auth, csrf, (req, res) => {
  const p = req.body;
  if (!validate(p))
    return res.status(400).json({ error: "Revise os campos do produto." });
  try {
    const value = clean(p);
    db.prepare("INSERT INTO products(id,body) VALUES(?,?)").run(
      p.id,
      JSON.stringify(value),
    );
    res.status(201).json({ ...value, version: 1 });
  } catch (e) {
    if (e.code?.includes("CONSTRAINT") || e.message.includes("UNIQUE"))
      return res
        .status(409)
        .json({ error: "Já existe um produto com esse identificador." });
    throw e;
  }
});
app.put("/api/admin/products/:id", auth, csrf, (req, res) => {
  const p = req.body;
  if (p.id !== req.params.id || !validate(p) || !Number.isInteger(p.version))
    return res.status(400).json({ error: "Revise os campos do produto." });
  const value = clean(p);
  const result = db
    .prepare(
      "UPDATE products SET body=?,version=version+1 WHERE id=? AND version=?",
    )
    .run(JSON.stringify(value), p.id, p.version);
  if (!result.changes)
    return res
      .status(409)
      .json({
        error:
          "Produto alterado em outra sessão. Atualize a página antes de editar.",
      });
  res.json({ ...value, version: p.version + 1 });
});
app.delete("/api/admin/products/:id", auth, csrf, (req, res) => {
  const version = req.body?.version;
  if (!Number.isInteger(version))
    return res.status(400).json({ error: "Versão do produto obrigatória." });
  const result = db
    .prepare("DELETE FROM products WHERE id=? AND version=?")
    .run(req.params.id, version);
  if (!result.changes)
    return res
      .status(409)
      .json({ error: "Produto alterado em outra sessão. Atualize a página." });
  res.json({ ok: true });
});
const uploadDir = resolve(dataDir, "uploads");
mkdirSync(uploadDir, { recursive: true, mode: 0o700 });
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 8, fields: 0 },
});
app.post(
  "/api/admin/photos",
  auth,
  csrf,
  upload.array("photos", 8),
  async (req, res) => {
    if (!req.files?.length)
      return res
        .status(400)
        .json({ error: "Selecione uma foto PNG, JPEG ou WebP." });
    const outputs = [];
    try {
      for (const f of req.files) {
        const image = sharp(f.buffer, {
          limitInputPixels: 40000000,
          animated: false,
        });
        const metadata = await image.metadata();
        if (!["jpeg", "png", "webp"].includes(metadata.format))
          throw new Error("Formato inválido");
        const name = randomBytes(16).toString("hex") + ".webp";
        await image
          .rotate()
          .resize({
            width: 1400,
            height: 1400,
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: 82 })
          .toFile(resolve(uploadDir, name));
        outputs.push("/uploads/" + name);
      }
      res.status(201).json({ photos: outputs });
    } catch {
      return res
        .status(400)
        .json({
          error:
            "Uma das fotos é inválida. Use PNG, JPEG ou WebP de até 8 MB e 40 megapixels.",
        });
    }
  },
);
app.use(
  "/uploads",
  express.static(uploadDir, {
    immutable: true,
    maxAge: "1y",
    dotfiles: "deny",
    fallthrough: false,
  }),
);
// Revalidate cart values from the shared database; the browser never supplies trusted prices.
app.post("/api/checkout", (req, res) => {
  const items = req.body?.items;
  if (!Array.isArray(items) || !items.length || items.length > 100)
    return res.status(400).json({ error: "Carrinho inválido." });
  const products = allProducts(),
    lines = [],
    totals = new Map();
  let subtotal = 0;
  for (const item of items) {
    const p = products.find((p) => p.id === item.id);
    if (
      !p ||
      !p.active ||
      !Number.isInteger(item.qty) ||
      item.qty < 1 ||
      !p.variation.split(",").includes(item.variation)
    )
      return res
        .status(409)
        .json({ error: "Um dos itens foi alterado. Atualize o carrinho." });
    totals.set(p.id, (totals.get(p.id) || 0) + item.qty);
    if (totals.get(p.id) > p.stock)
      return res
        .status(409)
        .json({
          error: `Estoque insuficiente para ${p.name}. Ajuste o carrinho.`,
        });
    const value =
      p.price === null
        ? "sob consulta"
        : (p.price * item.qty).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          });
    subtotal += (p.price || 0) * item.qty;
    lines.push(`${item.qty}x ${p.name} (${item.variation}) — ${value}`);
  }
  const message =
    "Olá! Gostaria de confirmar este pedido:\n" +
    lines.join("\n") +
    "\nSubtotal dos itens com preço: " +
    subtotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) +
    "\nPor favor, confirme a disponibilidade e o valor da entrega.";
  res.json({
    url: `https://wa.me/554792036899?text=${encodeURIComponent(message)}`,
    subtotal,
  });
});
app.use("/api", (_req, res) =>
  res.status(404).json({ error: "Recurso não encontrado." }),
);
const dist = resolve("dist");
if (existsSync(dist)) {
  app.use(
    express.static(dist, { index: false, maxAge: production ? "1h" : 0 }),
  );
  app.get("/{*path}", (req, res) => {
    const product = req.path.startsWith("/loja/")
      ? allProducts().find((p) => p.active && p.id === req.path.split("/")[2])
      : null;
    const routes = {
      "/": "Flores e afeto em Blumenau",
      "/loja": "Nossa loja",
      "/carrinho": "Seu carrinho",
      "/admin": "Administração",
    };
    const title =
      (product?.name || routes[req.path] || "Página não encontrada") +
      " | Espaço das Flores";
    const description =
      product?.description ||
      "Flores, presentes e afeto em Blumenau. Conheça a Floricultura Espaço das Flores.";
    const escape = (s) =>
      s.replace(
        /[&<>"']/g,
        (c) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[c],
      );
    let html = readFileSync(resolve(dist, "index.html"), "utf8")
      .replace(/<title>.*?<\/title>/, `<title>${escape(title)}</title>`)
      .replace(
        /<meta name="description" content="[^"]*"\s*\/?>/,
        `<meta name="description" content="${escape(description)}"/>`,
      )
      .replace(
        /<meta property="og:title" content="[^"]*"\s*\/?>/,
        `<meta property="og:title" content="${escape(title)}"/>`,
      )
      .replace(
        /<meta property="og:description" content="[^"]*"\s*\/?>/,
        `<meta property="og:description" content="${escape(description)}"/>`,
      );
    if (req.path === "/admin" || req.path === "/carrinho")
      html = html.replace(
        "</head>",
        '<meta name="robots" content="noindex,nofollow"/></head>',
      );
    if (process.env.APP_ORIGIN) {
      const base = process.env.APP_ORIGIN.replace(/\/$/, "");
      html = html.replace(
        "</head>",
        `<link rel="canonical" href="${escape(base + req.path)}"/><meta property="og:url" content="${escape(base + req.path)}"/>${product?.photo ? `<meta property="og:image" content="${escape(product.photo.startsWith("/") ? base + product.photo : product.photo)}"/>` : ""}</head>`,
      );
    }
    res.set("Cache-Control", "no-cache");
    res
      .status(product || routes[req.path] ? 200 : 404)
      .type("html")
      .send(html);
  });
}
app.use((err, req, res, _next) => {
  if (err.status === 404) return res.status(404).end();
  if (err instanceof multer.MulterError)
    return res
      .status(400)
      .json({ error: "Use até 8 fotos de no máximo 8 MB cada." });
  if (err.status === 400 || err.status === 413)
    return res
      .status(err.status)
      .json({ error: "Solicitação inválida ou muito grande." });
  console.error("Falha interna:", err.code || err.name);
  res
    .status(500)
    .json({ error: "Não foi possível concluir. Tente novamente." });
});
const port = Number(process.env.PORT || 3001),
  server = app.listen(port, process.env.HOST || "127.0.0.1", () =>
    console.log(`Servidor da loja iniciado na porta ${server.address().port}.`),
  );
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () =>
    server.close(() => {
      db.close();
      process.exit(0);
    }),
  );
