import { createRequire } from "node:module";

// Bundled CommonJS dependencies (e.g. Express) need `require` when this function is bundled as ESM.
// When Netlify bundles it as CommonJS, `require` already exists and `import.meta.url` is undefined.
if (import.meta.url && !(globalThis as any).require) {
  (globalThis as any).require = createRequire(import.meta.url);
}

// Production defaults for the deployed API (must be set before the app modules load)
process.env.NODE_ENV ??= "production";
process.env.PRIVATE_UPLOAD_DIR ??= "/tmp/private-uploads";

const handlerPromise = Promise.all([
  import("serverless-http"),
  import("../../artifacts/api-server/src/app"),
]).then(([{ default: serverless }, { default: app }]) =>
  serverless(app, { binary: ["image/*", "application/pdf", "application/octet-stream"] }),
);

// Runs the Express API server for every /api/* request
export const handler = async (event: any, context: any) => {
  // Requests are rewritten to /.netlify/functions/api/*; restore the /api prefix Express routes expect
  if (typeof event.path === "string" && event.path.startsWith("/.netlify/functions/api")) {
    event.path = "/api" + event.path.slice("/.netlify/functions/api".length);
  }
  const handle = await handlerPromise;
  return handle(event, context);
};
