// Astro 7.4.2's compiler emits inert metadata for component tooling, but its
// compiler runtime does not expose this helper yet. This shim is intentionally
// limited to that metadata value; rendering still uses Astro's own runtime.
export * from "astro/runtime/compiler/index.js";

export function createMetadata(file, metadata) {
  return { file, ...metadata };
}
