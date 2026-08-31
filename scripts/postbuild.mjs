import { cpSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const outputPublic = join(root, ".output", "public");
const distDir = join(root, "dist");

if (existsSync(outputPublic)) {
  if (!existsSync(distDir)) {
    mkdirSync(distDir, { recursive: true });
  }
  cpSync(outputPublic, distDir, { recursive: true });
  console.log("[postbuild] Synchronized .output/public -> dist/");
}
