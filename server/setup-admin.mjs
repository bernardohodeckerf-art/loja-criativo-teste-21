import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";
import { db, hashPassword } from "./db.mjs";
let hidden = false;
const output = new Writable({
  write(chunk, encoding, done) {
    if (!hidden) process.stdout.write(chunk, encoding);
    done();
  },
});
const rl = createInterface({
  input: process.stdin,
  output,
  terminal: !!process.stdin.isTTY,
});
try {
  const username =
    process.env.FLOWERS_ADMIN_USERNAME ||
    (await rl.question("Usuário administrativo: "));
  let password = process.env.FLOWERS_ADMIN_PASSWORD;
  if (!password) {
    process.stdout.write("Senha (mínimo 12 caracteres, não exibida): ");
    hidden = true;
    password = await rl.question("");
    process.stdout.write("\nRepita a senha: ");
    const again = await rl.question("");
    hidden = false;
    process.stdout.write("\n");
    if (password !== again) throw new Error("As senhas não coincidem.");
  }
  if (
    !/^[a-zA-Z0-9_.@-]{3,80}$/.test(username) ||
    password.length < 12 ||
    password.length > 200
  )
    throw new Error(
      "Use usuário de 3–80 caracteres e senha de 12–200 caracteres.",
    );
  db.prepare(
    "INSERT INTO users(username,password) VALUES(?,?) ON CONFLICT(username) DO UPDATE SET password=excluded.password",
  ).run(username, hashPassword(password));
  db.prepare("DELETE FROM sessions WHERE username=?").run(username);
  console.log(
    "Administrador configurado. Sessões anteriores foram encerradas.",
  );
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  rl.close();
  db.close();
}
