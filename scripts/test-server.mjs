import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const dir = mkdtempSync(join(tmpdir(), "flowers-e2e-"));
const env = {
  ...process.env,
  FLOWERS_DATA_DIR: dir,
  FLOWERS_ADMIN_USERNAME: "test-admin",
  FLOWERS_ADMIN_PASSWORD: process.env.FLOWERS_TEST_PASSWORD,
  PORT: "3111",
  NODE_ENV: "test",
};
const setup = spawn(process.execPath, ["server/setup-admin.mjs"], {
  env,
  stdio: "inherit",
});
const code = await new Promise((r) => setup.on("exit", r));
if (code) process.exit(code);
delete env.FLOWERS_ADMIN_PASSWORD;
delete env.FLOWERS_TEST_PASSWORD;
const dev = spawn(
  process.execPath,
  ["scripts/dev.mjs", "--host", "127.0.0.1", "--port", "5180", "--strictPort"],
  { env, stdio: "inherit" },
);
let closing = false;
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    if (closing) return;
    closing = true;
    dev.kill(signal);
  });
dev.once("exit", (code) => {
  rmSync(dir, { recursive: true, force: true });
  process.exit(code || 0);
});
