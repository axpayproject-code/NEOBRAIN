import assert from "node:assert/strict";
import { createRequire } from "node:module";
import fs from "node:fs/promises";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE ?? "playwright");
let launch = { headless: true };
if (process.env.CHROMIUM_MODULE) {
  const bundled = (await import(process.env.CHROMIUM_MODULE)).default;
  launch = {
    ...launch,
    args: bundled.args,
    executablePath: await bundled.executablePath(),
  };
}
let browser;
const origin = process.env.TEST_ORIGIN ?? "http://127.0.0.1:8080";
const accounts = JSON.parse(
  await fs.readFile(process.env.TEST_ACCOUNTS_PATH, "utf8"),
);
const failures = [];
try {
  for (const [account, path] of [
    ["family", "family"],
    ["clinician", "clinic"],
    ["coordinator", "coordination"],
    ["teacher", "school"],
    ["analyst", "government"],
    ["manager", "organization"],
    ["admin", "admin"],
  ]) {
    browser = await chromium.launch(launch);
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    });
    const [name, value] = accounts[account].cookie.split("=");
    await context.addCookies([{ name, value, url: origin }]);
    const page = await context.newPage();
    page.on("pageerror", (e) => failures.push(`${path}: ${e.message}`));
    page.on("response", (r) => {
      if (r.url().includes("/api/workflow") && r.status() >= 500)
        failures.push(`${path}: ${r.status()} ${r.url()}`);
    });
    await page.goto(`${origin}/${path}`);
    await page.getByRole("heading", { level: 1 }).waitFor();
    assert.ok(
      !(await page.locator("body").innerText()).includes(
        "Workspace access required",
      ),
      path,
    );
    const nav = page
      .locator("aside button")
      .filter({ has: page.locator("svg") });
    const labels = await nav.allTextContents();
    for (const label of labels) {
      const clean = label.trim();
      if (
        !clean ||
        clean.includes("Sign Out") ||
        clean.includes("Logout") ||
        clean.includes("NEOBRAIN")
      )
        continue;
      const candidate = page
        .locator("aside button")
        .filter({ hasText: clean })
        .first();
      await candidate.click();
      await page.waitForTimeout(100);
    }
    await page.screenshot({
      path: `/tmp/neobrain-${path}-desktop.png`,
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: `/tmp/neobrain-${path}-mobile.png`,
      fullPage: true,
    });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 2,
    );
    assert.equal(overflow, false, `${path} mobile overflow`);
    await context.close();
    await browser.close();
    console.log(`PASS browser ${path}: desktop tabs and mobile layout`);
  }
  assert.deepEqual(failures, []);
} finally {
  if (browser) await browser.close();
}
