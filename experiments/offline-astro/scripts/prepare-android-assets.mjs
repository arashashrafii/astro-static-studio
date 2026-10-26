import { cp, mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const target = path.join(root, "android/app/src/main/assets/www");

await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
await Promise.all([
  cp(path.join(root, "demo.html"), path.join(target, "demo.html")),
  cp(path.join(root, "demo.mjs"), path.join(target, "demo.mjs")),
  cp(path.join(root, "src/create-zip.mjs"), path.join(target, "src/create-zip.mjs")),
  cp(path.join(root, "generated"), path.join(target, "generated"), { recursive: true })
]);

console.log(`Packaged offline editor assets in ${path.relative(root, target)}.`);
