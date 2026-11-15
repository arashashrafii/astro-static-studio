import { createHash } from 'node:crypto';
import { ContentV2Schema, type ContentV2 } from './content-v2.js';

function placementUuid(key: string): string {
  const bytes = createHash('sha256').update(`astro-static-studio-placement-v1:${key}`).digest().subarray(0, 16);
  // UUIDv8 reserves the layout for application-defined, deterministic identifiers.
  bytes[6] = (bytes[6] & 0x0f) | 0x80;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(',')}]`;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map(key => `${JSON.stringify(key)}:${stableSerialize(record[key])}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

/** Assign deterministic theme-neutral placement IDs to V2 page blocks. Existing IDs are preserved. */
export function ensureV2PlacementIdsV1(input: unknown): ContentV2 {
  const source = ContentV2Schema.parse(input);
  const usedPlacementIds = new Set(source.pages.flatMap(page => page.blocks.flatMap(block => block.placementId ? [block.placementId] : [])));
  const migrated: ContentV2 = {
    ...source,
    pages: source.pages.map(page => {
      const signatureCounts = new Map<string, number>();
      return {
        ...page,
        blocks: page.blocks.map(block => {
          const { placementId: currentId, ...identity } = block;
          const signature = stableSerialize(identity);
          let occurrence = signatureCounts.get(signature) ?? 0;
          if (currentId) return block;
          let placementId = placementUuid(`${page.id}:${signature}:${occurrence}`);
          while (usedPlacementIds.has(placementId)) {
            occurrence += 1;
            placementId = placementUuid(`${page.id}:${signature}:${occurrence}`);
          }
          signatureCounts.set(signature, occurrence + 1);
          usedPlacementIds.add(placementId);
          return { ...block, placementId };
        }),
      };
    }),
  };
  return ContentV2Schema.parse(migrated);
}
