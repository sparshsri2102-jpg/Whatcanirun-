/**
 * Guards skill matching quality: 264 role queries must resolve
 * (top1 >= 85%, top3 >= 95%, zero zero-result).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";

test("skills role harness passes thresholds", async () => {
  await new Promise((resolve, reject) => {
    execFile(
      process.execPath,
      ["--experimental-strip-types", "scripts/skills-role-harness.mjs"],
      { cwd: new URL("..", import.meta.url), timeout: 120000 },
      (err, stdout, stderr) => {
        if (err) {
          reject(new Error(`skills-role-harness failed:\n${stdout}\n${stderr}`));
          return;
        }
        assert.match(stdout, /HARNESS PASS/, "expected HARNESS PASS");
        resolve();
      },
    );
  });
});
