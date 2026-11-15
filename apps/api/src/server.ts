import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, readdir, stat, unlink, writeFile, rename } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { readContent,saveContent,root } from './store.js';
import { localPublisher } from './publisher.js';
import { cloudflarePublishing } from './publishing.js';
import { exportBackup, restoreBackup } from './backup.js';
import { getSetupState, initializeSite } from './site-setup.js';
import { applyThemeConfiguration } from './publisher.js';
import { atelierManifest } from '../../../packages/theme/src/atelier-manifest.js';
import { defaultThemeConfiguration, diagnosticsForState, readThemeConfiguration, themeConfigPath, themeState, validateThemeConfiguration } from './theme-settings.js';
import { ThemeConfigurationV1Schema } from '../../../packages/theme/src/contract.js';
const app=express();
function isAllowedOrigin(req:express.Request):boolean{
 if(req.method==='GET'||req.method==='HEAD')return true;
 const origin=req.headers.origin;
 if(!origin)return false;
 if(origin==='http://localhost:5173'||origin==='http://127.0.0.1:5173'||origin==='http://localhost:3000'||origin==='http://127.0.0.1:3000')return true;
 try{
  const originHost=new URL(origin).host;
  const requestHost=req.headers['x-forwarded-host']||req.headers.host;
  return Boolean(requestHost&&originHost===String(requestHost).split(',')[0].trim());
 }catch{return false;}
}
app.use((req,res,next)=>{if(!isAllowedOrigin(req)){res.status(403).json({error:'مبدأ درخواست مجاز نیست'});return;}next();});
app.use(express.json({limit:'5mb'}));
const mediaDirectory=resolve(root,'apps/site/public/media');
const originalsDirectory=resolve(root,'content/media-originals');
const backupPaths={contentPath:resolve(root,'content/content.json'),mediaDirectory,originalsDirectory};
app.use('/media',express.static(mediaDirectory,{fallthrough:false,dotfiles:'deny'}));
app.get('/api/content',async(_req,res)=>{res.json(await readContent());});
app.get('/api/theme',async(_req,res,next)=>{try{
 const content=await readContent();
 const stored=await readThemeConfiguration(themeConfigPath,content);
 const hasErrors=stored.diagnostics.some(diagnostic=>diagnostic.severity==='error');
 const configuration=hasErrors?defaultThemeConfiguration(content):stored.configuration;
 res.json(themeState(configuration,diagnosticsForState(stored.diagnostics),stored.exists&&!hasErrors));
}catch(error){next(error);}});
app.get('/api/status',async(_req,res,next)=>{try{let previewAvailable=false;try{await stat(resolve(root,'apps/site/dist/index.html'));previewAvailable=true;}catch{try{const preview=await fetch('http://127.0.0.1:4321',{signal:AbortSignal.timeout(1500)});previewAvailable=preview.ok;}catch{}}const setup=await getSetupState();res.json({previewAvailable,siteInitialized:setup.initialized,setupMode:setup.mode??null});}catch(e){next(e);}});
let busy=false;
app.post('/api/theme/select',async(req,res,next)=>{if(busy){res.status(409).json({error:'عملیات دیگری در حال اجراست'});return;}busy=true;try{
 const themeId=req.body?.themeId;
 if(themeId!==atelierManifest.id)throw new Error(`قالب «${String(themeId??'') }» نصب‌شده یا تأییدشده نیست. فعلاً فقط قالب Atelier در دسترس است.`);
 const content=await readContent();
 const stored=await readThemeConfiguration(themeConfigPath,content);
 const hasErrors=stored.diagnostics.some(diagnostic=>diagnostic.severity==='error');
 const configuration=hasErrors?defaultThemeConfiguration(content):{
  ...stored.configuration,
  selectedTheme:{id:atelierManifest.id,version:atelierManifest.version},
 };
 const validation=validateThemeConfiguration(configuration,content);
 const errors=validation.diagnostics.filter(diagnostic=>diagnostic.severity==='error');
 if(!validation.configuration||errors.length)throw new Error(errors.map(diagnostic=>diagnostic.message).join('\n')||'تنظیمات قالب معتبر نیست.');
 const build=await applyThemeConfiguration(validation.configuration);
 const warnings=diagnosticsForState(validation.diagnostics);
 res.json({...themeState(validation.configuration,warnings,true),build});
}catch(error){next(error);}finally{busy=false;}});
app.post('/api/site/setup',async(req,res,next)=>{if(busy){res.status(409).json({error:'عملیات دیگری در حال اجراست'});return;}busy=true;try{const {mode,siteName,backupConfirmed}=req.body??{};if(mode!=='sample'&&mode!=='new-site')throw new Error('روش راه‌اندازی نامعتبر است');let backupFile:string|undefined;if(mode==='new-site'){if(backupConfirmed!==true)throw new Error('برای ساخت سایت تازه، ابتدا نسخهٔ پشتیبان را دانلود و جایگزینی محتوا را تأیید کنید.');const backup=await exportBackup(backupPaths);const directory=resolve(root,'content/backups');await mkdir(directory,{recursive:true});const filename=`before-new-site-${new Date().toISOString().replaceAll(':','-')}.astro-studio.json`;const temporary=resolve(directory,`${filename}.tmp`);backupFile=resolve(directory,filename);await writeFile(temporary,backup,{flag:'wx'});await rename(temporary,backupFile);}const content=await initializeSite(mode,typeof siteName==='string'?siteName:'');res.json({content,backupCreated:Boolean(backupFile)});}catch(e){next(e);}finally{busy=false;}});
app.put('/api/content',async(req,res,next)=>{if(busy){res.status(409).json({error:'ساخت یا ذخیره در حال انجام است'});return;}busy=true;try{res.json(await saveContent(req.body));}catch(e){next(e);}finally{busy=false;}});
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:20*1024*1024,files:1}});
const backupUpload=multer({storage:multer.memoryStorage(),limits:{fileSize:120*1024*1024,files:1}});
app.get('/api/backup',async(_req,res,next)=>{if(busy){res.status(409).json({error:'عملیات دیگری در حال اجراست؛ پس از پایان آن دوباره نسخهٔ پشتیبان بگیرید.'});return;}busy=true;try{const bundle=await exportBackup(backupPaths);res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Content-Disposition',`attachment; filename="astro-static-studio-backup-${new Date().toISOString().slice(0,10)}.json"`);res.send(bundle);}catch(e){next(e);}finally{busy=false;}});
app.post('/api/backup/restore',backupUpload.single('backup'),async(req,res,next)=>{if(busy){res.status(409).json({error:'عملیات دیگری در حال اجراست'});return;}busy=true;try{if(!req.file)throw new Error('فایل پشتیبان را انتخاب کنید');const result=await restoreBackup(req.file.buffer,{...backupPaths,tempDirectory:resolve(root,'content')});if(!(await getSetupState()).initialized)await initializeSite('sample','');res.json({content:await readContent(),...result});}catch(e){next(e);}finally{busy=false;}});
app.get('/api/media/originals',async(_req,res,next)=>{try{const files=await readdir(originalsDirectory).catch((e:NodeJS.ErrnoException)=>e.code==='ENOENT'?[]:Promise.reject(e));res.json({ids:files.filter(name=>/^[a-f0-9-]{36}\.(?:jpg|jpeg|png)$/.test(name)).map(name=>name.slice(0,36))});}catch(e){next(e);}});
app.get('/api/media/stats',async(_req,res,next)=>{try{const mediaEntries=await readdir(mediaDirectory,{withFileTypes:true}).catch((e:NodeJS.ErrnoException)=>e.code==='ENOENT'?[]:Promise.reject(e));const mediaFiles=mediaEntries.filter(entry=>entry.isFile()&&!entry.name.startsWith('.'));let totalMediaBytes=0;for(const entry of mediaFiles){const info=await stat(resolve(mediaDirectory,entry.name)).catch(()=>null);if(info)totalMediaBytes+=info.size;}const originalEntries=await readdir(originalsDirectory,{withFileTypes:true}).catch((e:NodeJS.ErrnoException)=>e.code==='ENOENT'?[]:Promise.reject(e));const originalsCount=originalEntries.filter(entry=>entry.isFile()&&!entry.name.startsWith('.')).length;res.json({hostedMediaCount:mediaFiles.length,originalsCount,totalMediaBytes});}catch(e){next(e);}});
app.get('/api/media/originals/:id',async(req,res,next)=>{try{if(!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(req.params.id))throw new Error('تصویر اصلی پیدا نشد');let found:string|undefined;for(const ext of ['jpg','jpeg','png']){try{found=resolve(originalsDirectory,`${req.params.id}.${ext}`);await stat(found);break;}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}}if(!found)throw new Error('نسخهٔ اصلی این تصویر در دسترس نیست');const bytes=await readFile(found);res.setHeader('Content-Type',found.endsWith('.png')?'image/png':'image/jpeg');res.setHeader('Content-Disposition',`attachment; filename="original-${req.params.id}.${found.split('.').at(-1)}"`);res.send(bytes);}catch(e){next(e);}});
app.post('/api/media',upload.single('image'),async(req,res,next)=>{if(busy){res.status(409).json({error:'عملیات دیگری در حال اجراست'});return;}busy=true;let originalPath:string|undefined,webpPath:string|undefined;try{if(!req.file)throw new Error('تصویر انتخاب نشده');const source=sharp(req.file.buffer,{limitInputPixels:40_000_000});const meta=await source.metadata();if(!['jpeg','png'].includes(meta.format??''))throw new Error('فقط JPEG و PNG پذیرفته می‌شود');if(!meta.width||!meta.height)throw new Error('ابعاد تصویر قابل خواندن نیست');const id=randomUUID();const extension=meta.format==='png'?'png':'jpg';await mkdir(mediaDirectory,{recursive:true});await mkdir(originalsDirectory,{recursive:true});originalPath=resolve(originalsDirectory,`${id}.${extension}`);webpPath=resolve(mediaDirectory,`${id}.webp`);await writeFile(originalPath,req.file.buffer,{flag:'wx'});await source.rotate().resize({width:2000,height:2000,fit:'inside',withoutEnlargement:true}).webp({quality:82}).toFile(webpPath);const outputMeta=await sharp(webpPath).metadata();const outputStat=await stat(webpPath);res.json({src:`/media/${id}.webp`,alt:'',originalSize:req.file.size,webpSize:outputStat.size,originalWidth:meta.width,originalHeight:meta.height,webpWidth:outputMeta.width,webpHeight:outputMeta.height,originalAvailable:true,quality:82});}catch(e){if(originalPath)await unlink(originalPath).catch(()=>{});if(webpPath)await unlink(webpPath).catch(()=>{});next(e);}finally{busy=false;}});
app.post('/api/build',async(_req,res,next)=>{if(busy){res.status(409).json({error:'عملیات دیگری در حال اجراست'});return;}busy=true;try{res.json(await localPublisher.publish());}catch(e){next(e);}finally{busy=false;}});
app.get('/api/cloudflare/status',async(_req,res,next)=>{try{res.json(await cloudflarePublishing.status());}catch(e){next(e);}});
app.get('/api/cloudflare/projects',async(_req,res,next)=>{try{res.json({projects:await cloudflarePublishing.projects()});}catch(e){next(e);}});
app.post('/api/cloudflare/account/select',async(req,res,next)=>{if(busy){res.status(409).json({error:'عملیات دیگری در حال اجراست'});return;}busy=true;try{res.json(await cloudflarePublishing.selectAccount(req.body?.accountId));}catch(e){next(e);}finally{busy=false;}});
app.post('/api/cloudflare/connect',async(_req,res,next)=>{if(busy){res.status(409).json({error:'عملیات دیگری در حال اجراست'});return;}busy=true;try{await cloudflarePublishing.connect();res.json({connected:true});}catch(e){next(e);}finally{busy=false;}});
app.post('/api/cloudflare/disconnect',async(_req,res,next)=>{if(busy){res.status(409).json({error:'عملیات دیگری در حال اجراست'});return;}busy=true;try{await cloudflarePublishing.disconnect();res.json({connected:false});}catch(e){next(e);}finally{busy=false;}});
app.post('/api/cloudflare/project/select',async(req,res,next)=>{if(busy){res.status(409).json({error:'عملیات دیگری در حال اجراست'});return;}busy=true;try{res.json(await cloudflarePublishing.selectProject(req.body?.projectName));}catch(e){next(e);}finally{busy=false;}});
app.post('/api/cloudflare/project/create',async(req,res,next)=>{if(busy){res.status(409).json({error:'عملیات دیگری در حال اجراست'});return;}busy=true;try{res.json(await cloudflarePublishing.createProject(req.body?.projectName));}catch(e){next(e);}finally{busy=false;}});
app.post('/api/cloudflare/publish',async(req,res,next)=>{if(busy){res.status(409).json({error:'عملیات دیگری در حال اجراست'});return;}busy=true;try{const environment=req.body?.environment;if(environment==='production'&&req.body?.confirmedProduction!==true)throw new Error('برای انتشار عمومی باید تأیید صریح بدهید.');res.json(await cloudflarePublishing.publish(environment));}catch(e){next(e);}finally{busy=false;}});
const siteDistDirectory=resolve(root,'apps/site/dist');
const adminDistDirectory=resolve(root,'apps/admin/dist');
app.use('/_astro',express.static(resolve(siteDistDirectory,'_astro')));
app.use('/preview',async(req,res,next)=>{
 if(req.originalUrl==='/preview'){res.redirect(302,'/preview/');return;}
 if(req.method!=='GET'&&req.method!=='HEAD'){next();return;}
 try{
  const subPath=decodeURIComponent(req.path||'/').replace(/^\/+/,'');
  let candidate=resolve(siteDistDirectory,subPath);
  if(candidate!==siteDistDirectory&&!candidate.startsWith(siteDistDirectory+'/')){res.status(403).send('Forbidden');return;}
  const info=await stat(candidate).catch(()=>null);
  if(info?.isDirectory()){candidate=resolve(candidate,'index.html');}
  else if(!info&&!subPath.includes('.')){candidate=resolve(candidate,'index.html');}
  const fileInfo=await stat(candidate).catch(()=>null);
  if(fileInfo?.isFile()&&candidate.endsWith('.html')){
   const html=(await readFile(candidate,'utf8'))
    .replace(/(href|src)=["']\/(?!(?:media|preview|_astro)\/|\/)([^"']*)["']/g,'$1="/preview/$2"')
    .replace(/(href|src)=["']\/_astro\/([^"']*)["']/g,'$1="/preview/_astro/$2"');
   res.setHeader('Content-Type','text/html; charset=utf-8');
   res.send(html);
   return;
  }
  if(fileInfo?.isFile()){res.sendFile(candidate);return;}
  if(req.path==='/'||req.path===''){
   res.status(503).setHeader('Content-Type','text/html; charset=utf-8').send('<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><title>پیش‌نمایش ساخته نشده است</title></head><body style="font-family:system-ui;padding:2rem;max-width:640px;margin:auto"><h1>پیش‌نمایش سایت هنوز ساخته نشده است</h1><p>از بخش «انتشار» در داشبورد، گزینهٔ «ساخت پیش‌نمایش محلی» را بزنید.</p><p><a href="/">بازگشت به داشبورد</a></p></body></html>');
   return;
  }
  next();
 }catch(error){next(error);}
});
app.use(express.static(adminDistDirectory,{setHeaders(res,filePath){if(filePath.endsWith('sw.js')||filePath.endsWith('registerSW.js')){res.setHeader('Cache-Control','no-cache, no-store, must-revalidate');}else if(filePath.endsWith('.webmanifest')){res.setHeader('Content-Type','application/manifest+json; charset=utf-8');res.setHeader('Cache-Control','no-cache');}}}));
app.use((req,res,next)=>{
 if(req.method!=='GET'||req.path.startsWith('/api/')||req.path.startsWith('/media/')||req.path.startsWith('/preview')){next();return;}
 res.sendFile(resolve(adminDistDirectory,'index.html'),error=>{if(error)next();});
});
app.use((err:unknown,_req:express.Request,res:express.Response,_next:express.NextFunction)=>{console.error(err);res.status(400).json({error:err instanceof Error?err.message:'خطای درخواست'});});
const port=Number(process.env.PORT)||3000;
app.listen(port,'0.0.0.0',()=>console.log(`Astro Static Studio running on http://0.0.0.0:${port}`));
