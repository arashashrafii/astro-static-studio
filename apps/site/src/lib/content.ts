import data from '../../../../content/content.json';
import { ContentSchema } from '@astro-static-studio/contracts';
export async function content(){return ContentSchema.parse(data);}
