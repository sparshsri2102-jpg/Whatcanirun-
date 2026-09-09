/**
 * Matcher regression: every preset x every context tier.
 * (Covers the "try it at every gpu and machine config" gate.)
 */
import { test } from "node:test";
import { execFile } from "node:child_process";

test("matcher passes full preset x context regression", async () => {
  await new Promise((resolve, reject) => {
    execFile(
      process.execPath,
      ["--experimental-strip-types", "scripts/match-regression.mjs"],
      { cwd: new URL("..", import.meta.url), timeout: 180000 },
      (err, stdout, stderr) => {
        if (err) {
          reject(new Error(`match-regression failed:\n${stdout}\n${stderr}`));
          return;
        }
        resolve();
      },
    );
  });
});
