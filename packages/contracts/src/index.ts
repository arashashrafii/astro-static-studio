export {
  CollectionFieldSchema,
  CollectionItemV2Schema,
  CollectionV2Schema,
  ContentV2Schema,
  PageBlockV2Schema,
  PageV2Schema,
  RichTextDocumentSchema,
  collectionItemDescription,
  descriptionForDisplay,
  migrateV1PlainTextToRichText,
  richTextToPlainText,
  type CollectionFieldV2,
  type CollectionItemV2,
  type CollectionV2,
  type ContentV2,
  type PageBlockV2,
  type PageV2,
  type RichTextDocumentV2,
} from './content-v2.js';

export interface ThemeInterface {
  id: string;
  name: string;
  version: string;
  components: readonly ('richText' | 'gallery' | 'image' | 'collectionView')[];
  tokens: { background: string; foreground: string; accent: string };
}

export interface PublishResult {
  outputDirectory: string;
  builtAt: string;
}

export interface PublisherInterface {
  id: string;
  publish(): Promise<PublishResult>;
}
