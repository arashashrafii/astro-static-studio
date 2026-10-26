import { generateStaticSite } from "./generated/renderer.mjs";
import { createZip } from "./src/create-zip.mjs";

const contentEditor = document.querySelector("#content");
const imagePicker = document.querySelector("#photo");
const buildButton = document.querySelector("#build");
const status = document.querySelector("#status");
const downloads = document.querySelector("#downloads");
const preview = document.querySelector("#preview");
const initialContent = JSON.parse(document.querySelector("#initial-content").textContent);
const sampleImage = document.querySelector("#sample-image").textContent.trim();
contentEditor.value = JSON.stringify(initialContent, null, 2);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function asBlob(value, name) {
  const type = name.endsWith(".svg") ? "image/svg+xml" : name.endsWith(".png") ? "image/png" : name.endsWith(".webp") ? "image/webp" : name.endsWith(".jpg") || name.endsWith(".jpeg") ? "image/jpeg" : name.endsWith(".css") ? "text/css" : "text/html";
  return value instanceof Blob ? value : new Blob([value], { type });
}

function addArchiveDownload(bytes) {
  if (window.AndroidArchive?.postMessage) {
    let binary = "";
    const chunkSize = 32_768;
    for (let offset = 0; offset < bytes.length; offset += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
    }
    window.AndroidArchive.postMessage(JSON.stringify({
      type: "saveArchive",
      archiveBase64: btoa(binary)
    }));
    status.textContent = "Choose where to save the ZIP archive…";
    return;
  }

  const url = URL.createObjectURL(new Blob([bytes], { type: "application/zip" }));
  const item = document.createElement("li");
  const link = document.createElement("a");
  link.href = url;
  link.download = "offline-site.zip";
  link.textContent = "Download all static files (.zip)";
  link.addEventListener("click", () => setTimeout(() => URL.revokeObjectURL(url), 30_000), { once: true });
  item.append(link);
  downloads.append(item);
}

if (window.AndroidArchive) {
  window.AndroidArchive.onmessage = ({ data }) => {
    try {
      const result = JSON.parse(data);
      status.textContent = result.message || "The ZIP archive could not be saved.";
    } catch {
      status.textContent = "The ZIP archive could not be saved.";
    }
  };
}

buildButton.addEventListener("click", async () => {
  buildButton.disabled = true;
  downloads.replaceChildren();
  status.textContent = "Generating with the prepared Astro template…";
  try {
    const content = JSON.parse(contentEditor.value);
    const assets = {};
    if (imagePicker.files?.[0]) {
      const image = imagePicker.files[0];
      if (!["image/jpeg", "image/png", "image/webp"].includes(image.type)) {
        throw new TypeError("Choose a JPEG, PNG, or WebP image.");
      }
      const extension = image.name.toLowerCase().split(".").pop();
      const localPath = `images/editor-photo.${extension}`;
      content.projects[0].image = localPath;
      assets[localPath] = image;
    } else {
      assets["images/paper-study.svg"] = sampleImage;
    }

    const files = await generateStaticSite(content, assets);
    addArchiveDownload(await createZip(files));

    const html = files.get("index.html");
    const css = files.get("styles.css");
    const imagePath = content.projects[0].image;
    const imageUrl = URL.createObjectURL(asBlob(files.get(imagePath), imagePath));
    const cssTag = '<link rel="stylesheet" href="./styles.css">';
    const previewHtml = html
      .replace(cssTag, `<style>${css}</style>`)
      .replace(new RegExp(`((?:\\.\\./)*${escapeRegExp(imagePath)})`, "g"), imageUrl);
    preview.srcdoc = previewHtml;
    status.textContent = `Generated ${files.size} static files in a single archive.`;
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : "The site could not be generated.";
  } finally {
    buildButton.disabled = false;
  }
});

buildButton.click();
