/** Guards problem-keyword index coverage (368 keywords, 100% required). */
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";

test("seo keywords all covered by indexable surfaces", async () => {
  await new Promise((resolve, reject) => {
    execFile(
      process.execPath,
      ["--experimental-strip-types", "scripts/seo-keywords.mjs"],
      { cwd: new URL("..", import.meta.url), timeout: 120000 },
      (err, stdout, stderr) => {
        if (err) {
          reject(new Error(`seo-keywords failed:\n${stdout}\n${stderr}`));
          return;
        }
        assert.match(stdout, /KEYWORDS PASS/, "expected KEYWORDS PASS");
        resolve();
      },
    );
  });
});
