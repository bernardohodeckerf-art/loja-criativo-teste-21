import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import sharp from "sharp";
async function launch() {
  const dir = mkdtempSync(join(tmpdir(), "flowers-api-")),
    password = randomBytes(24).toString("base64url");
  const env = {
    ...process.env,
    FLOWERS_DATA_DIR: dir,
    FLOWERS_ADMIN_USERNAME: "test-admin",
    FLOWERS_ADMIN_PASSWORD: password,
    PORT: "0",
    HOST: "127.0.0.1",
    NODE_ENV: "test",
  };
  const setup = spawn(process.execPath, ["server/setup-admin.mjs"], {
    env,
    stdio: "pipe",
  });
  await new Promise((resolve, reject) =>
    setup.once("exit", (code) =>
      code ? reject(new Error("Admin setup failed")) : resolve(),
    ),
  );
  delete env.FLOWERS_ADMIN_PASSWORD;
  const child = spawn(process.execPath, ["server/index.mjs"], {
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const url = await new Promise((resolve, reject) => {
    child.stdout.on("data", (buf) => {
      const m = buf.toString().match(/porta (\d+)/);
      if (m) resolve("http://127.0.0.1:" + m[1]);
    });
    child.once("exit", () => reject(new Error("Server exited")));
  });
  return {
    url,
    password,
    async close() {
      child.kill("SIGTERM");
      await new Promise((r) => child.once("exit", r));
      rmSync(dir, { recursive: true, force: true });
    },
  };
}
test("shared catalog, protected session, uploads and checkout", async (t) => {
  const server = await launch();
  t.after(() => server.close());
  const request = (path, options = {}) => fetch(server.url + path, options);
  const payload = (method, body, headers = {}) => ({
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  let cookie, csrf, product;
  await t.test("guests cannot read or mutate admin data", async () => {
    assert.equal((await request("/api/admin/products")).status, 401);
    assert.equal(
      (await request("/api/admin/products", payload("POST", {}))).status,
      401,
    );
    const products = await (await request("/api/products")).json();
    assert.ok(products.length >= 4);
    assert.ok(products.every((p) => p.active));
  });
  await t.test(
    "login sets a protected cookie and rejects invalid credentials",
    async () => {
      assert.equal(
        (
          await request(
            "/api/auth/login",
            payload("POST", { username: "test-admin", password: "wrong" }),
          )
        ).status,
        401,
      );
      const response = await request(
        "/api/auth/login",
        payload("POST", { username: "test-admin", password: server.password }),
      );
      assert.equal(response.status, 200);
      cookie = response.headers.get("set-cookie");
      assert.match(cookie, /HttpOnly/);
      assert.match(cookie, /SameSite=Strict/);
      cookie = cookie.split(";")[0];
      const body = await response.json();
      csrf = body.csrf;
      assert.ok(body.authenticated);
      assert.equal(body.password, undefined);
      assert.equal(
        (
          await (
            await request("/api/auth/session", { headers: { cookie } })
          ).json()
        ).authenticated,
        true,
      );
    },
  );
  const headers = () => ({ cookie, "X-CSRF-Token": csrf });
  await t.test(
    "mutations reject missing CSRF and cross-origin requests",
    async () => {
      assert.equal(
        (await request("/api/admin/products", payload("POST", {}, { cookie })))
          .status,
        403,
      );
      assert.equal(
        (
          await request(
            "/api/admin/products",
            payload(
              "POST",
              {},
              { ...headers(), Origin: "https://attacker.invalid" },
            ),
          )
        ).status,
        403,
      );
    },
  );
  await t.test(
    "product CRUD persists server-side with conflict detection",
    async () => {
      product = {
        id: "teste-real",
        name: "Produto de teste",
        description: "Uma descrição",
        category: "Buquês",
        price: 100,
        stock: 3,
        active: false,
        featured: true,
        variation: "Rosa,Branco",
        photo: "",
        photos: [],
      };
      let response = await request(
        "/api/admin/products",
        payload("POST", product, headers()),
      );
      assert.equal(response.status, 201);
      product = await response.json();
      assert.equal(
        (await (await request("/api/products")).json()).some(
          (p) => p.id === product.id,
        ),
        false,
      );
      const stale = { ...product };
      response = await request(
        "/api/admin/products/" + product.id,
        payload("PUT", { ...product, active: true }, headers()),
      );
      assert.equal(response.status, 200);
      product = await response.json();
      assert.ok(
        (await (await request("/api/products")).json()).some(
          (p) => p.id === product.id,
        ),
      );
      assert.equal(
        (
          await request(
            "/api/admin/products/" + product.id,
            payload("PUT", stale, headers()),
          )
        ).status,
        409,
      );
      assert.equal(
        (
          await request(
            "/api/admin/products",
            payload(
              "POST",
              { ...product, id: "invalid", stock: -1 },
              headers(),
            ),
          )
        ).status,
        400,
      );
    },
  );
  await t.test(
    "upload validates image bytes and creates optimized WebP",
    async () => {
      const body = new FormData();
      body.append(
        "photos",
        new Blob(
          [
            await sharp({
              create: {
                width: 80,
                height: 100,
                channels: 3,
                background: "#dca6ac",
              },
            })
              .png()
              .toBuffer(),
          ],
          { type: "image/png" },
        ),
        "foto.png",
      );
      const response = await request("/api/admin/photos", {
        method: "POST",
        headers: headers(),
        body,
      });
      assert.equal(response.status, 201);
      const data = await response.json();
      const image = await request(data.photos[0]);
      assert.equal(image.headers.get("content-type"), "image/webp");
      const invalid = new FormData();
      invalid.append(
        "photos",
        new Blob(["<script>alert(1)</script>"], { type: "image/png" }),
        "fake.png",
      );
      assert.equal(
        (
          await request("/api/admin/photos", {
            method: "POST",
            headers: headers(),
            body: invalid,
          })
        ).status,
        400,
      );
    },
  );
  await t.test(
    "checkout trusts only server prices and aggregates stock across variations",
    async () => {
      let response = await request(
        "/api/checkout",
        payload("POST", {
          items: [{ id: product.id, variation: "Rosa", qty: 2, price: 0 }],
        }),
      );
      assert.equal(response.status, 200);
      const data = await response.json();
      assert.equal(data.subtotal, 200);
      assert.ok(data.url.startsWith("https://wa.me/554792036899?text="));
      assert.equal(
        (
          await request(
            "/api/checkout",
            payload("POST", {
              items: [
                { id: product.id, variation: "Rosa", qty: 2 },
                { id: product.id, variation: "Branco", qty: 2 },
              ],
            }),
          )
        ).status,
        409,
      );
      assert.equal(
        (
          await request(
            "/api/checkout",
            payload("POST", {
              items: [{ id: product.id, variation: "Inexistente", qty: 1 }],
            }),
          )
        ).status,
        409,
      );
    },
  );
  await t.test("delete and logout revoke access", async () => {
    assert.equal(
      (
        await request(
          "/api/admin/products/" + product.id,
          payload("DELETE", { version: product.version }, headers()),
        )
      ).status,
      200,
    );
    assert.equal(
      (await request("/api/auth/logout", payload("POST", {}, headers())))
        .status,
      200,
    );
    assert.equal(
      (await request("/api/admin/products", { headers: { cookie } })).status,
      401,
    );
  });
  await t.test(
    "failed logins are limited and reveal no account details",
    async () => {
      for (let i = 0; i < 5; i++)
        assert.equal(
          (
            await request(
              "/api/auth/login",
              payload("POST", { username: "unknown", password: "wrong" }),
            )
          ).status,
          401,
        );
      const blocked = await request(
        "/api/auth/login",
        payload("POST", { username: "test-admin", password: server.password }),
      );
      assert.equal(blocked.status, 429);
      assert.ok(blocked.headers.get("retry-after"));
    },
  );
});
