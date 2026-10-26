import { readFile, writeFile, rename } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { ContentSchema, type Content } from '@astro-static-studio/contracts';
export const root=fileURLToPath(new URL('../../../',import.meta.url));
export const contentPath=resolve(root,'content/content.json');
export async function readContent(){return ContentSchema.parse(JSON.parse(await readFile(contentPath,'utf8')));}
export async function saveContent(input:unknown):Promise<Content>{const data=ContentSchema.parse(input);await writeFile(contentPath+'.tmp',JSON.stringify(data,null,2));await rename(contentPath+'.tmp',contentPath);return data;}
