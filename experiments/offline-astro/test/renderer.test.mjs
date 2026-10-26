import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { execFileSync, spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { createZip } from "../src/create-zip.mjs";

let attemptedFetches = [];
globalThis.fetch = async (url) => {
  attemptedFetches.push(String(url));
  throw new Error("Network is disabled for this offline rendering check.");
};
const { generateStaticSite } = await import("../generated/renderer.mjs");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const content = JSON.parse(await readFile(path.join(root, "content/site.json"), "utf8"));
const image = new Uint8Array(await readFile(path.join(root, "content/images/paper-study.svg")));

test("precompiled Astro template exports complete local pages while fetch is blocked", async () => {
  attemptedFetches = [];
  const files = await generateStaticSite(content, { "images/paper-study.svg": image });

  assert.deepEqual([...files.keys()].sort(), [
    "images/paper-study.svg",
    "index.html",
    "projects/paper-study/index.html",
    "styles.css"
  ]);
  const home = files.get("index.html");
  const project = files.get("projects/paper-study/index.html");
  assert.match(home, /^<!doctype html>/i);
  assert.match(home, /href="\.\/styles\.css"/);
  assert.match(home, /src="\.\/images\/paper-study\.svg"/);
  assert.match(home, /href="\.\/projects\/paper-study\/index\.html"/);
  assert.match(project, /href="\.\.\/\.\.\/styles\.css"/);
  assert.match(project, /src="\.\.\/\.\.\/images\/paper-study\.svg"/);
  assert.match(project, /<title>Paper study \| Mira Solis<\/title>/);
  assert.match(files.get("styles.css"), /grid-template-columns/);
  assert.deepEqual(files.get("images/paper-study.svg"), image);
  assert.deepEqual(attemptedFetches, []);
});

test("generated files can be written and read back as an independent static site", async () => {
  const files = await generateStaticSite(content, { "images/paper-study.svg": image });
  const outputRoot = await mkdtemp(path.join(os.tmpdir(), "offline-astro-site-"));
  try {
    for (const [relativePath, value] of files) {
      const target = path.join(outputRoot, relativePath);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, value);
    }
    const home = await readFile(path.join(outputRoot, "index.html"), "utf8");
    const project = await readFile(path.join(outputRoot, "projects/paper-study/index.html"), "utf8");
    const savedImage = await readFile(path.join(outputRoot, "images/paper-study.svg"));
    assert.match(home, /Objects shaped by light and clay\./);
    assert.match(project, /A quiet study in folded form/);
    assert.deepEqual(savedImage, Buffer.from(image));
  } finally {
    await rm(outputRoot, { recursive: true, force: true });
  }
});

test("unsafe project paths and missing images fail with clear errors", async () => {
  const unsafe = structuredClone(content);
  unsafe.projects[0].slug = "../outside";
  await assert.rejects(
    generateStaticSite(unsafe, { "images/paper-study.svg": image }),
    /invalid URL name/
  );
  await assert.rejects(generateStaticSite(content, {}), /missing from the local assets/);
  await assert.rejects(
    generateStaticSite(content, { "../../outside.svg": image, "images/paper-study.svg": image }),
    /Unsupported local asset path/
  );
});

const archiveReadersAvailable =
  spawnSync("unzip", ["-v"], { stdio: "ignore" }).status === 0 &&
  spawnSync("python3", ["--version"], { stdio: "ignore" }).status === 0;

test("ZIP download keeps nested and UTF-8 paths and preserves entry bytes", { skip: !archiveReadersAvailable }, async () => {
  const files = await generateStaticSite(content, { "images/paper-study.svg": image });
  const unicodeData = new Uint8Array([0, 1, 127, 255]);
  files.set("media/über-sample.bin", unicodeData);
  const archive = await createZip(files);
  const outputRoot = await mkdtemp(path.join(os.tmpdir(), "offline-astro-zip-"));
  const archivePath = path.join(outputRoot, "offline-site.zip");
  try {
    await writeFile(archivePath, archive);
    const checked = spawnSync("unzip", ["-t", archivePath], { encoding: "utf8" });
    assert.equal(checked.status, 0, checked.stderr || checked.stdout);
    const pythonCheck = [
      "import sys, zipfile",
      "archive = zipfile.ZipFile(sys.argv[1])",
      "assert archive.testzip() is None",
      "assert archive.read('images/paper-study.svg') == open(sys.argv[2], 'rb').read()",
      "assert archive.read('media/über-sample.bin') == bytes([0, 1, 127, 255])",
      "print('\\n'.join(archive.namelist()))"
    ].join("; ");
    const entries = execFileSync("python3", ["-c", pythonCheck, archivePath, path.join(root, "content/images/paper-study.svg")], { encoding: "utf8" }).trim().split(/\r?\n/);
    assert.deepEqual(entries, [
      "index.html",
      "projects/paper-study/index.html",
      "styles.css",
      "images/paper-study.svg",
      "media/über-sample.bin"
    ]);
  } finally {
    await rm(outputRoot, { recursive: true, force: true });
  }
});
