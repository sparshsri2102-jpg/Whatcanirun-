/**
 * Guards the model catalog against wrong specs shipping again.
 * (Regression test for the DeepSeek-V4 Flash ~150B/256k incident —
 * official source is 284B total / 13B active / 1M context.)
 *
 * Runs the validator in LOCAL mode (no network): internal consistency,
 * quant plausibility bands, MoE active<=total, URL shape, date format.
 * Run with --live in CI / pre-release for Hugging Face source checks:
 *   npm run check:catalog:live
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";

test("catalog passes local validation (no errors)", async () => {
  await new Promise((resolve, reject) => {
    execFile(
      process.execPath,
      ["--experimental-strip-types", "scripts/validate-catalog.mjs"],
      { cwd: new URL("..", import.meta.url), timeout: 60000 },
      (err, stdout, stderr) => {
        if (err) {
          reject(new Error(`validate-catalog failed:\n${stdout}\n${stderr}`));
          return;
        }
        assert.match(stdout, /0 error\(s\)/, "expected zero validation errors");
        resolve();
      },
    );
  });
});
