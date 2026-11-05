import {
  atelierManifest,
} from '@astro-static-studio/theme/atelier-manifest';
import {
  createAtelierDefaultSettings,
  createThemeAdapter,
} from '@astro-static-studio/theme/studio/adapter';
import type { Content } from '@astro-static-studio/contracts';
import type { ContentV2 } from '@astro-static-studio/contracts/content-v2';
import type { ThemeCapability, ThemeRouteModel } from '@astro-static-studio/theme/contract';

const adapter = createThemeAdapter();

// These capabilities are implemented by the bundled Atelier renderer. RTL is
// included after the page templates and gallery controls are direction-aware.
const availableCapabilities: ThemeCapability[] = [
  'content.v1', 'content.v2', 'routes.static', 'route.home', 'route.page',
  'route.collectionList', 'route.collectionItem', 'field.text', 'field.richText',
  'field.category', 'field.gallery', 'field.link', 'media.webp', 'direction.ltr', 'direction.rtl',
];

/** Resolve validated content into the route view models consumed by Astro pages. */
export function atelierRoutes(content: Content | ContentV2): ThemeRouteModel[] {
  return adapter.map({
    content,
    manifest: atelierManifest,
    settings: createAtelierDefaultSettings(content),
    availableCapabilities,
  });
}
