import { test, expect } from "@playwright/test";
test("opening has moving botanical layers, reveals hero and runs once per session", async ({
  page,
}) => {
  await page.goto("/");
  const opening = page.getByRole("dialog", {
    name: "Abertura do Espaço das Flores",
  });
  await expect(opening).toBeVisible();
  await expect(page.locator(".opening-botanical")).toHaveCount(2);
  await expect(page.locator(".opening-petals i")).toHaveCount(10);
  await expect(page.locator(".opening-paper--left")).toHaveCSS(
    "animation-name",
    "opening-left",
  );
  await expect(page.locator(".hero h1 span").first()).toHaveCSS("opacity", "0");
  await expect(opening).toHaveCount(0, { timeout: 2500 });
  await expect(page.locator(".hero h1 span").first()).toHaveCSS("opacity", "1");
  expect(
    await page.evaluate(() => sessionStorage.getItem("flowers-intro")),
  ).toBe("1");
  await page.reload();
  await expect(page.locator(".opening")).toHaveCount(0);
});
test("opening can be skipped immediately with keyboard and restores scroll", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Pular abertura" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator(".opening")).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe(
    "hidden",
  );
  await expect(
    page.getByRole("link", { name: "Ver nossos produtos" }),
  ).toBeFocused();
});
test("opening is omitted for reduced motion and direct store entry", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".opening")).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Ver nossos produtos" }),
  ).toBeVisible();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/loja");
  await expect(page.locator(".opening")).toHaveCount(0);
});
