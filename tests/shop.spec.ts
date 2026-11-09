import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("flowers-intro", "1"));
});
test("home, menu, catalog and persistent cart", async ({ page }, info) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "Flores que transformam momentos em memórias.",
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  if (info.project.name === "mobile") {
    await page.getByRole("button", { name: "Abrir menu" }).click();
    await expect(page.getByRole("navigation")).toBeVisible();
    await page.getByRole("button", { name: "Fechar menu" }).click();
  }
  await page.getByRole("link", { name: "Comprar flores", exact: true }).click();
  await page.getByLabel("Buscar produtos").fill("Um gesto de carinho");
  await expect(page.locator(".product-card")).toHaveCount(1);
  await page.locator(".product-card").click();
  await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
  await page.getByRole("link", { name: "Ver carrinho →", exact: true }).click();
  await expect(
    page.getByText("Subtotal dos itens com preço: R$ 110,00"),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator(".cart-row")).toHaveCount(1);
  await page.getByRole("button", { name: "Finalizar pelo WhatsApp" }).click();
  await expect(
    page.getByRole("link", { name: "Abrir pedido no WhatsApp" }),
  ).toHaveAttribute("href", /wa.me\/554792036899/);
});
test("questionnaire retains occasion and galeria closes with keyboard", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "01 Aniversário" }).click();
  await expect(page.getByLabel("Ocasião", { exact: true })).toHaveValue(
    "Aniversário",
  );
  await page.getByLabel("Data desejada").fill("2026-12-10");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByLabel("Seu nome").fill("Maria");
  await page.getByLabel("Telefone com DDD").fill("47999998888");
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(
    page.getByRole("link", { name: "Abrir no WhatsApp" }),
  ).toHaveAttribute("href", /Maria/);
  await page.keyboard.press("Escape");
  await page.locator(".gallery-item").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByText("2 / 5")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
test("admin protects login and shares saved products across browsers", async ({
  page,
  browser,
}, info) => {
  await page.goto("/admin");
  await expect(
    page.getByRole("button", { name: "Entrar no painel" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Novo produto" })).toHaveCount(
    0,
  );
  await page.getByLabel("Usuário", { exact: true }).fill("test-admin");
  await page
    .getByLabel("Senha", { exact: true })
    .fill(process.env.FLOWERS_TEST_PASSWORD!);
  await page.getByRole("button", { name: "Entrar no painel" }).click();
  await page.getByRole("button", { name: "Novo produto" }).click();
  const name = "Teste floral " + info.project.name;
  await page.getByLabel("Nome", { exact: true }).fill(name);
  await page
    .getByLabel("Descrição", { exact: true })
    .fill("Produto criado no teste");
  await page
    .getByLabel("Fotos do produto (PNG, JPEG ou WebP)")
    .setInputFiles("public/media/buques-hortensias-capa.webp");
  await expect(
    page.getByRole("button", { name: "Foto de capa", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Salvar produto" }).click();
  await expect(page.getByText("Produto salvo na loja.")).toBeVisible();
  const visitor = await browser.newPage();
  await visitor.goto("http://127.0.0.1:5180/loja");
  await visitor.getByLabel("Buscar produtos").fill(name);
  await expect(visitor.locator(".product-card")).toHaveCount(1);
  await visitor.close();
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Entrar no painel" }),
  ).toBeVisible();
});
test("real gallery loads videos only on demand and supports navigation", async ({
  page,
}) => {
  const videos: string[] = [];
  page.on("request", (r) => {
    if (
      r.url().endsWith("/buques-hortensias.mp4") ||
      r.url().endsWith("/decoracao-natalina.mp4")
    )
      videos.push(r.url());
  });
  await page.goto("/");
  await expect(page.locator(".real-media")).toHaveCount(5);
  expect(videos).toHaveLength(0);
  await page
    .getByRole("button", {
      name: "Reproduzir: Hortênsias, delicadeza em cada pétala",
    })
    .click();
  const video = page.locator(".media-lightbox video");
  await expect(video).toHaveAttribute("preload", "none");
  await expect(video).not.toHaveAttribute("autoplay");
  expect(videos).toHaveLength(0);
  await video.evaluate((v: HTMLVideoElement) => v.play());
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime))
    .toBeGreaterThan(0);
  expect(videos.length).toBeGreaterThan(0);
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#media-title")).toHaveText(
    "O encanto do Natal ganha forma",
  );
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", {
      name: "Reproduzir: Hortênsias, delicadeza em cada pétala",
    }),
  ).toBeFocused();
});
test("scroll reveals content and honors reduced motion", async ({ page }) => {
  await page.goto("/");
  const scene = page.locator(".floral-scene");
  await scene.scrollIntoViewIfNeeded();
  const image = page.locator(".scene-photo-layer");
  const before = await image.getAttribute("style");
  await page.evaluate(() => scrollBy(0, 220));
  await page.waitForTimeout(150);
  expect(await image.getAttribute("style")).not.toBe(before);
  const card = page.locator(".product-card").first();
  await card.scrollIntoViewIfNeeded();
  await expect(card).toHaveClass(/is-revealed/);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(scene).toHaveClass(/scene-reduced/);
  await expect(page.locator(".testimonials-columns")).toHaveClass(/reduced/);
  await expect(
    page.getByRole("button", { name: "Pausar movimento" }),
  ).toHaveCount(0);
});
test("testimonials and hero continue without pause controls", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#testimonials-heading").scrollIntoViewIfNeeded();
  await expect(
    page.getByText("189 avaliações no Google", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: /pausar|retomar|reproduzir vídeo de fundo/i,
    }),
  ).toHaveCount(0);
  const track = page.locator(".testimonial-column ul").first();
  const before = await track.getAttribute("style");
  await page.waitForTimeout(200);
  expect(await track.getAttribute("style")).not.toBe(before);
});
test("hero uses a real poster and avoids automatic video for reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const requests: string[] = [];
  page.on("request", (r) => {
    if (r.url().endsWith("/hero.mp4")) requests.push(r.url());
  });
  await page.goto("/");
  await expect(page.locator(".hero-media img")).toHaveAttribute(
    "src",
    "/media/hero.webp",
  );
  await expect(page.locator(".hero-media video")).toHaveCount(0);
  expect(requests).toHaveLength(0);
  await expect(
    page.getByRole("button", { name: "Reproduzir vídeo de fundo" }),
  ).toHaveCount(0);
});
test("photos, purchase buttons and map stay available without the API", async ({
  page,
}) => {
  await page.route("**/api/products", (r) =>
    r.fulfill({
      status: 503,
      contentType: "application/json",
      body: '{"error":"Unavailable"}',
    }),
  );
  await page.goto("/");
  const cards = page.locator(".product-card");
  await expect(cards).toHaveCount(4);
  await cards.first().scrollIntoViewIfNeeded();
  await expect(cards.first().locator("img")).toBeVisible();
  expect(
    await cards
      .first()
      .locator("img")
      .evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0),
  ).toBeTruthy();
  await expect(cards.first().locator(".card-buy")).toHaveText("Comprar flores");
  await expect(page.locator('iframe[title*="Localização"]')).toHaveAttribute(
    "src",
    /google.com\/maps\?q=/,
  );
  await expect(
    page.getByRole("link", { name: "Traçar rota no Google Maps" }),
  ).toHaveAttribute("href", /Frei%20Estanislau%20Schaette/);
  await cards.first().click();
  await expect(
    page.getByRole("link", { name: "Comprar pelo WhatsApp" }),
  ).toHaveAttribute("href", /wa.me\/554792036899/);
  await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
  await page.getByRole("link", { name: "Ver carrinho →", exact: true }).click();
  await page.getByRole("button", { name: "Finalizar pelo WhatsApp" }).click();
  await expect(
    page.getByRole("link", { name: "Abrir pedido no WhatsApp" }),
  ).toHaveAttribute("href", /confirme%20valores/);
});
