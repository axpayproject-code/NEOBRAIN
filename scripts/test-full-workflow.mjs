// Disposable local database and mocked payment provider. Never uses production data.
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createPaymentMock } from "./test-payment-provider.mjs";
const require = createRequire(
  new URL("./test-runtime/package.json", import.meta.url),
);
const { PGlite } = await import(require.resolve("@electric-sql/pglite"));
const { PGLiteSocketServer } = await import(
  require.resolve("@electric-sql/pglite-socket")
);
const cwd = fileURLToPath(new URL("../", import.meta.url));
const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "neobrain-workflow-"));
const db = await PGlite.create();
const socket = new PGLiteSocketServer({
  db,
  port: 15439,
  host: "127.0.0.1",
  maxConnections: 20,
});
await socket.start();
const mock = createPaymentMock();
await new Promise((resolve) => mock.listen(18091, "127.0.0.1", resolve));
const env = {
  ...process.env,
  DATABASE_URL: "postgresql://test:test@127.0.0.1:15439/neobrain",
  DB_POOL_MAX: "1",
  NODE_ENV: "test",
  PORT: "18080",
  APP_ORIGIN: "http://127.0.0.1:18080",
  TEST_ORIGIN: "http://127.0.0.1:18080",
  PAYMONGO_TEST_API_BASE: "http://127.0.0.1:18091",
  PAYMONGO_SECRET_KEY: "sk_test_fixture",
  PAYMONGO_WEBHOOK_SECRET: "fixture-secret",
  PAYMONGO_PROVIDER_COLLECTION_APPROVED: "true",
  ORGANIZATION_MONTHLY_FEE_CENTAVOS: "100000",
  PRIVATE_UPLOAD_DIR: path.join(tmp, "uploads"),
  TEST_ACCOUNTS_PATH: path.join(tmp, "accounts.json"),
  RESEND_API_KEY: "",
};
async function run(file) {
  const child = spawn(process.execPath, [file], { cwd, env, stdio: "inherit" });
  const code = await new Promise((resolve) => child.on("exit", resolve));
  if (code !== 0) throw new Error(`${file} failed (${code})`);
}
let server;
try {
  await run("scripts/migrate.mjs");
  await run("scripts/migrate.mjs");
  server = spawn(process.execPath, ["artifacts/api-server/dist/index.mjs"], {
    cwd,
    env,
    stdio: ["ignore", "pipe", "inherit"],
  });
  let log = "";
  server.stdout.on("data", (b) => {
    log += b.toString();
  });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("API startup timeout")),
      15000,
    );
    server.stdout.on("data", (b) => {
      if (b.toString().includes("Server listening")) {
        clearTimeout(timer);
        resolve();
      }
    });
    server.on("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`API exited ${code}`));
    });
  });
  try {
    await run("scripts/workflow-integration.mjs");
    if (process.env.RUN_BROWSER === "true")
      await run("scripts/workflow-browser.mjs");
  } catch (e) {
    console.error(log.slice(-12000));
    throw e;
  }
  console.log("PASS disposable workflow suite; migration replay checked.");
} finally {
  server?.kill();
  await socket.stop();
  await db.close();
  mock.close();
  await fs.rm(tmp, { recursive: true, force: true });
}
