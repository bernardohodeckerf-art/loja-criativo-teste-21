import { spawn } from "node:child_process";
const port = process.env.PORT || "3001";
const server = spawn(
  process.execPath,
  ["--env-file-if-exists=.env", "server/index.mjs"],
  { stdio: "inherit", env: { ...process.env, PORT: port } },
);
const vite = spawn(
  process.execPath,
  ["node_modules/vite/bin/vite.js", ...process.argv.slice(2)],
  {
    stdio: "inherit",
    env: { ...process.env, VITE_API_TARGET: `http://127.0.0.1:${port}` },
  },
);
let closing = false;
function stop(code = 0) {
  if (closing) return;
  closing = true;
  server.kill("SIGTERM");
  vite.kill("SIGTERM");
  setTimeout(() => process.exit(code), 300).unref();
}
server.on("exit", (code) => stop(code || 0));
vite.on("exit", (code) => stop(code || 0));
for (const s of ["SIGINT", "SIGTERM"]) process.on(s, () => stop());
