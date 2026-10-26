import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { transform } from "@astrojs/compiler-rs";
import { build } from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const astroPackage = JSON.parse(await readFile(path.join(root, "node_modules/astro/package.json"), "utf8"));
const compilerPackage = JSON.parse(await readFile(path.join(root, "node_modules/@astrojs/compiler-rs/package.json"), "utf8"));
const astroCompilerRange = astroPackage.dependencies["@astrojs/compiler-rs"];
if (astroCompilerRange !== "^0.5.1" || compilerPackage.version !== "0.5.2") {
  throw new Error(`Expected Astro 7.4.2 with compiler-rs 0.5.2; found Astro ${astroPackage.version} and compiler-rs ${compilerPackage.version}.`);
}

const componentPath = path.join(root, "src/SitePage.astro");
const componentSource = await readFile(componentPath, "utf8");
const compiled = await transform(componentSource, {
  filename: componentPath,
  internalURL: "astro/compiler-runtime",
  astroGlobalArgs: "undefined",
  scopedStyleStrategy: "attribute"
});
const compileError = compiled.diagnostics.find((diagnostic) => diagnostic.severity === "error");
if (compileError) throw new Error(`Astro compilation failed: ${compileError.text}`);
if (compiled.css.length > 0 || compiled.scripts.length > 0) {
  throw new Error("This experiment only supports templates without Astro style or script blocks.");
}
const imports = [...compiled.code.matchAll(/^import\s+(?:[^\n]*?\s+from\s+)?["']([^"']+)["'];?\s*$/gm)].map((match) => match[1]);
if (imports.some((specifier) => specifier !== "astro/compiler-runtime")) {
  throw new Error(`Unsupported compiled Astro import: ${imports.find((specifier) => specifier !== "astro/compiler-runtime")}`);
}

const generatedDir = path.join(root, "generated");
await mkdir(generatedDir, { recursive: true });
await writeFile(path.join(generatedDir, "SitePage.compiled.mjs"), compiled.code);
const css = await readFile(path.join(root, "src/site.css"), "utf8");
await writeFile(path.join(generatedDir, "site-style.mjs"), `export const siteCss = ${JSON.stringify(css)};\n`);
const bundle = await build({
  absWorkingDir: root,
  entryPoints: ["src/renderer-entry.mjs"],
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  outfile: "generated/renderer.mjs",
  alias: { "astro/compiler-runtime": "./scripts/runtime-shim.mjs" },
  nodePaths: [path.join(root, "node_modules")],
  logLevel: "warning",
  metafile: true
});
const output = Object.values(bundle.metafile.outputs).find((item) => item.entryPoint === "src/renderer-entry.mjs");
if (!output || output.imports.length > 0) {
  throw new Error("The browser renderer must be fully bundled with no runtime imports.");
}
console.log(`Prepared browser ESM renderer from Astro ${astroPackage.version} / compiler-rs ${compilerPackage.version}.`);
