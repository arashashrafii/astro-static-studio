import { z } from 'zod';
export const MediaSchema = z.object({ src: z.string().regex(/^\/media\/[a-f0-9-]+\.webp$/), alt: z.string().max(500) });
export const ComponentSchema = z.discriminatedUnion('type', [
 z.object({type:z.literal('text'),body:z.string().max(50000)}),
 z.object({type:z.literal('gallery'),images:z.array(MediaSchema).max(100)})
]);
export const EntrySchema = z.object({id:z.string().uuid(),kind:z.enum(['page','project']),slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).refine(s=>!['projects','media','admin','api'].includes(s),'آدرس رزرو شده است'),title:z.string().trim().min(1).max(200),summary:z.string().max(1000),categories:z.array(z.string().trim().min(1).max(80)).max(10).optional(),tags:z.array(z.string().trim().min(1).max(80)).max(30).optional(),releaseDate:z.string().max(80).optional(),published:z.boolean(),components:z.array(ComponentSchema).max(30)});
export const ContentSchema = z.object({version:z.literal(1),site:z.object({name:z.string().trim().min(1).max(200),tagline:z.string().max(500),email:z.union([z.email(),z.literal('')]),phone:z.string().max(80)}),entries:z.array(EntrySchema).max(500)}).superRefine((v,ctx)=>{for(const key of ['id','slug'] as const){const seen=new Set();v.entries.forEach((e,i)=>{if(seen.has(e[key]))ctx.addIssue({code:'custom',path:['entries',i,key],message:'مقدار تکراری است'});seen.add(e[key]);});}});
export type Content = z.infer<typeof ContentSchema>;
export type Entry = z.infer<typeof EntrySchema>;
export type Component = z.infer<typeof ComponentSchema>;
export interface ThemeInterface { id:string; name:string; version:string; components:readonly Component['type'][]; tokens:{background:string;foreground:string;accent:string}; }
export interface PublishResult { outputDirectory:string; builtAt:string; }
export interface PublisherInterface { id:string; publish():Promise<PublishResult>; }
