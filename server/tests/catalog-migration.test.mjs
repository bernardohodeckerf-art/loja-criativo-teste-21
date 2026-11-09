import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { spawnSync } from "node:child_process";
test("catalog enrichment preserves admin edits and deleted products, and runs once", () => {
  const dir = mkdtempSync(join(tmpdir(), "flowers-migration-"));
  try {
    const db = new DatabaseSync(join(dir, "flowers.sqlite"));
    db.exec(
      "CREATE TABLE products(id TEXT PRIMARY KEY,body TEXT NOT NULL,version INTEGER NOT NULL DEFAULT 1);CREATE TABLE settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);",
    );
    db.prepare("INSERT INTO settings VALUES('seeded','true')").run();
    const old = JSON.parse(
      readFileSync(new URL("../seed-v1.json", import.meta.url), "utf8"),
    );
    for (const p of old.filter((p) => p.id !== "cesta-amanhecer"))
      db.prepare("INSERT INTO products(id,body,version) VALUES(?,?,?)").run(
        p.id,
        JSON.stringify(
          p.id === "buque-jardim"
            ? { ...p, name: "Nome editado pelo responsável" }
            : p,
        ),
        p.id === "buque-jardim" ? 2 : 1,
      );
    db.close();
    const run = () => {
      const r = spawnSync(
        process.execPath,
        [
          "--input-type=module",
          "-e",
          "const {db}=await import('./server/db.mjs');db.close()",
        ],
        { env: { ...process.env, FLOWERS_DATA_DIR: dir }, encoding: "utf8" },
      );
      assert.equal(r.status, 0, r.stderr);
    };
    run();
    let verify = new DatabaseSync(join(dir, "flowers.sqlite"));
    assert.equal(
      JSON.parse(
        verify
          .prepare("SELECT body FROM products WHERE id=?")
          .get("buque-jardim").body,
      ).name,
      "Nome editado pelo responsável",
    );
    assert.ok(
      JSON.parse(
        verify
          .prepare("SELECT body FROM products WHERE id=?")
          .get("ramalhete-tres-rosas").body,
      ).photo,
    );
    assert.equal(
      verify
        .prepare("SELECT * FROM products WHERE id=?")
        .get("cesta-amanhecer"),
      undefined,
    );
    const count = verify.prepare("SELECT count(*) AS n FROM products").get().n;
    assert.equal(count, 10);
    verify.close();
    run();
    verify = new DatabaseSync(join(dir, "flowers.sqlite"));
    assert.equal(
      verify.prepare("SELECT count(*) AS n FROM products").get().n,
      count,
    );
    verify.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
