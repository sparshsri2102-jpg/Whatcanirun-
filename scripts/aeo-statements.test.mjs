/** Guards AEO answerability (1100+ problem statements, >=97% required). */
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";

test("aeo statements answerable from site content", async () => {
  await new Promise((resolve, reject) => {
    execFile(
      process.execPath,
      ["--experimental-strip-types", "scripts/aeo-statements.mjs"],
      { cwd: new URL("..", import.meta.url), timeout: 180000 },
      (err, stdout, stderr) => {
        if (err) {
          reject(new Error(`aeo-statements failed:\n${stdout}\n${stderr}`));
          return;
        }
        assert.match(stdout, /AEO PASS/, "expected AEO PASS");
        resolve();
      },
    );
  });
});
