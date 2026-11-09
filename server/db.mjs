import { DatabaseSync } from "node:sqlite";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
export const dataDir = resolve(process.env.FLOWERS_DATA_DIR || ".data");
mkdirSync(dataDir, { recursive: true, mode: 0o700 });
export const db = new DatabaseSync(resolve(dataDir, "flowers.sqlite"));
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS products(id TEXT PRIMARY KEY, body TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS users(username TEXT PRIMARY KEY,password TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,username TEXT NOT NULL,csrf TEXT NOT NULL,expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS login_attempts(ip TEXT PRIMARY KEY,attempts INTEGER NOT NULL,expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);`);
if (!db.prepare("SELECT value FROM settings WHERE key='seeded'").get()) {
  const seed = JSON.parse(
    readFileSync(new URL("./seed.json", import.meta.url), "utf8"),
  );
  db.exec("BEGIN");
  try {
    for (const p of seed)
      db.prepare("INSERT OR IGNORE INTO products(id,body) VALUES(?,?)").run(
        p.id,
        JSON.stringify(p),
      );
    db.prepare("INSERT INTO settings(key,value) VALUES('seeded','true')").run();
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}
export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return salt + ":" + scryptSync(password, salt, 64).toString("hex");
}
export function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  const a = scryptSync(password, salt, 64),
    b = Buffer.from(hash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
export const parseProduct = (row) => ({
  ...JSON.parse(row.body),
  version: row.version,
});
export const allProducts = () =>
  db.prepare("SELECT * FROM products ORDER BY rowid").all().map(parseProduct);

// One-time catalog enrichment. Never overwrite a product edited in the admin.
if (
  !db.prepare("SELECT value FROM settings WHERE key='floral-catalog-v2'").get()
) {
  const previous = JSON.parse(
    readFileSync(new URL("./seed-v1.json", import.meta.url), "utf8"),
  );
  const current = JSON.parse(
    readFileSync(new URL("./seed.json", import.meta.url), "utf8"),
  );
  db.exec("BEGIN");
  try {
    for (const product of current) {
      const row = db
        .prepare("SELECT body,version FROM products WHERE id=?")
        .get(product.id);
      const original = previous.find((p) => p.id === product.id);
      if (
        row &&
        original &&
        row.version === 1 &&
        JSON.stringify(JSON.parse(row.body)) === JSON.stringify(original)
      )
        db.prepare(
          "UPDATE products SET body=?,version=version+1 WHERE id=?",
        ).run(JSON.stringify(product), product.id);
      else if (!original)
        db.prepare("INSERT OR IGNORE INTO products(id,body) VALUES(?,?)").run(
          product.id,
          JSON.stringify(product),
        );
    }
    db.prepare(
      "INSERT INTO settings(key,value) VALUES('floral-catalog-v2','true')",
    ).run();
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
