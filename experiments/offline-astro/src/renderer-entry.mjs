import SitePage from "../generated/SitePage.compiled.mjs";
import { siteCss } from "../generated/site-style.mjs";

const renderInstruction = Symbol.for("astro:render");
const imagePathPattern = /^images\/[A-Za-z0-9._-]+\.(?:svg|png|jpe?g|webp)$/i;

function validateContent(content, assets) {
  const requiredText = ["siteTitle", "tagline", "heading", "introduction", "contact"];
  if (!content || typeof content !== "object") throw new TypeError("Site content must be an object.");
  for (const key of requiredText) {
    if (typeof content[key] !== "string" || content[key].trim() === "") {
      throw new TypeError(`Site content needs a non-empty ${key}.`);
    }
  }
  if (!Array.isArray(content.projects) || content.projects.length === 0) {
    throw new TypeError("Add at least one project before exporting.");
  }
  for (const name of Object.keys(assets ?? {})) {
    if (!imagePathPattern.test(name)) throw new TypeError(`Unsupported local asset path: ${name}`);
  }
  for (const [index, project] of content.projects.entries()) {
    if (!project || typeof project !== "object") throw new TypeError(`Project ${index + 1} must be an object.`);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(project.slug ?? "")) {
      throw new TypeError(`Project ${index + 1} has an invalid URL name.`);
    }
    for (const key of ["title", "description", "alt"]) {
      if (typeof project[key] !== "string" || project[key].trim() === "") {
        throw new TypeError(`Project ${project.slug} needs a non-empty ${key}.`);
      }
    }
    if (!imagePathPattern.test(project.image ?? "")) {
      throw new TypeError(`Project ${project.slug} has an unsupported local image path.`);
    }
    if (!Object.hasOwn(assets ?? {}, project.image)) {
      throw new TypeError(`Project image ${project.image} is missing from the local assets.`);
    }
  }
}

async function renderPage(props) {
  const result = {
    clientDirectives: new Set(),
    createAstro: (componentProps, slots) => ({
      props: componentProps,
      slots,
      url: new URL("https://offline-template.invalid/")
    })
  };
  const template = SitePage(result, props, {});
  let html = "";
  await template.render({
    write(chunk) {
      if (chunk && typeof chunk === "object" && chunk[renderInstruction]) {
        if (chunk.type === "head" || chunk.type === "maybe-head") return;
        throw new Error(`Unsupported Astro render instruction: ${chunk.type ?? "unknown"}`);
      }
      if (chunk instanceof Uint8Array) html += new TextDecoder().decode(chunk);
      else html += String(chunk);
    }
  });
  return `<!doctype html>\n${html}`;
}

/** Render a static site using a precompiled Astro component and local assets. */
export async function generateStaticSite(content, assets) {
  validateContent(content, assets);
  const files = new Map();
  files.set("index.html", await renderPage({ content, rootPath: "./" }));
  for (const project of content.projects) {
    const rootPath = "../../";
    files.set(`projects/${project.slug}/index.html`, await renderPage({ content, project, rootPath }));
  }
  files.set("styles.css", siteCss);
  for (const [name, value] of Object.entries(assets)) files.set(name, value);
  return files;
}
