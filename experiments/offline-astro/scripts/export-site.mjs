import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { generateStaticSite } = await import(path.join(root, "generated/renderer.mjs"));
const content = JSON.parse(await readFile(path.join(root, "content/site.json"), "utf8"));
const imagePath = content.projects[0].image;
const assets = { [imagePath]: new Uint8Array(await readFile(path.join(root, "content", imagePath))) };
const files = await generateStaticSite(content, assets);
const outputRoot = path.join(root, "dist/offline-site");
for (const [relativePath, contents] of files) {
  const target = path.join(outputRoot, relativePath);
  if (!target.startsWith(`${outputRoot}${path.sep}`)) throw new Error(`Unsafe export path: ${relativePath}`);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, contents);
}
console.log(`Wrote ${files.size} local files to dist/offline-site/.`);
