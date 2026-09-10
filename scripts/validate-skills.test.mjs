/**
 * Guards the skills catalog: data integrity (local, no network).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";

test("skills catalog passes local validation (no errors)", async () => {
  await new Promise((resolve, reject) => {
    execFile(
      process.execPath,
      ["--experimental-strip-types", "scripts/validate-skills.mjs"],
      { cwd: new URL("..", import.meta.url), timeout: 60000 },
      (err, stdout, stderr) => {
        if (err) {
          reject(new Error(`validate-skills failed:\n${stdout}\n${stderr}`));
          return;
        }
        assert.match(stdout, /0 error\(s\)/, "expected zero validation errors");
        resolve();
      },
    );
  });
});
