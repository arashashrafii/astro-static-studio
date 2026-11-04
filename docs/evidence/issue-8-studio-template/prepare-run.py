from pathlib import Path
import json
p=Path('.tmp/issue-8-studio');f=json.loads((p/'fixture.json').read_text());f['package-lock.json']=(p/'snapshot/package-lock.json').read_text();(p/'fixture.json').write_text(json.dumps(f))
s=(p/'app.mjs').read_text();a=s.index('  async function command(');b=s.index("  await command('node'",a);s=s[:a]+(p/'command-function.txt').read_text()+'\n'+s[b:]
a=s.index('  report.builds=[]');b=s.index('  const outputs=',a)
s=s[:a]+'''  const expected=await(await fetch('./expected.json')).json();
  const assets=await(await fetch('./assets.json')).json();
  await stage('mount actual media',async()=>{for(const asset of assets){await wc.fs.mkdir(asset.path.slice(0,asset.path.lastIndexOf('/')),{recursive:true});const bytes=new Uint8Array(await(await fetch(asset.url)).arrayBuffer());await wc.fs.writeFile(asset.path,bytes);}},120000);
  report.builds=[];
  for(let i=1;i<=2;i++){
   const marker=i===1?expected.siteName:'STUDIO-ANDROID-UPDATED';
   if(i===2){const data=JSON.parse(await wc.fs.readFile('content/content.json','utf8'));data.site.name=marker;await wc.fs.writeFile('content/content.json',JSON.stringify(data));}
   const started=performance.now();await command('node',['--input-type=module','-e',"const keep=setInterval(()=>{},1000);try{const {build}=await import('astro');await build({root:'./apps/site'});console.log('BUILD_API_RESOLVED');clearInterval(keep);process.exit(0)}catch(e){console.error(e);process.exit(1)}"],240000);
   for(const path of expected.routes){const html=await wc.fs.readFile('apps/site/dist/'+path,'utf8');if(!html.includes(marker))throw Error(`Missing updated site name in ${path}`);}
   report.builds.push({number:i,marker,routesVerified:expected.routes.length,elapsedMs:Math.round(performance.now()-started)});
  }
'''+s[b:]
s=s.replace("await walk('dist')","await walk('apps/site/dist')")
a=s.index("  for(const path of ['index.html'");b=s.index('  const zip=',a)
s=s[:a]+'''  for(const path of expected.routes)if(!outputs.has(path))throw Error(`Missing route ${path}`);
  report.outputs=[...outputs].map(([path,bytes])=>({path,bytes:bytes.length}));
  report.assetChecks={allMedia:assets.every(a=>outputs.has(a.path.replace('apps/site/public/',''))),css:[...outputs.keys()].some(p=>p.endsWith('.css')),js:[...outputs.keys()].some(p=>p.endsWith('.js'))};
  if(!Object.values(report.assetChecks).every(Boolean))throw Error('Missing media/CSS/JS');
  report.htmlRoutes=expected.routes;
'''+s[b:]
s=s.replace("a.hidden=false;","a.download='studio-issue8.zip';a.hidden=false;report.zipBytes=zip.length;report.zipSha256=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',zip))).map(b=>b.toString(16).padStart(2,'0')).join('');")
s=s.replace('Ten real Astro CLI builds succeeded in browser','Actual Studio template built twice in browser');(p/'app.mjs').write_text(s)
s=(p/'run.mjs').read_text().replace("'create-zip.mjs'","'create-zip.mjs','assets.json','expected.json'")
s=s.replace("const server=http.createServer", "const assets=JSON.parse(await readFile(new URL('assets.json',import.meta.url)));\nconst server=http.createServer")
s=s.replace("if(!files.has(path)){", "const asset=assets.find(a=>a.url===req.url);if(asset){res.writeHead(200,{'Content-Type':'image/webp','Cache-Control':'no-store'});res.end(await readFile(asset.path));return;}if(!files.has(path)){")
a=s.index(" if(evidence.report.status==='passed'){");b=s.index(' console.log(',a)
s=s[:a]+''' if(evidence.report.status==='passed'){
  const session=await context.newCDPSession(page);await session.send('Browser.setDownloadBehavior',{behavior:'default'});await page.locator('#download').click();evidence.nativeDownloadClicked=true;await page.waitForTimeout(10000);
 }
'''+s[b:]
s=s.replace("await page.close().catch(()=>{});",'/* Keep Blob page alive for native Android download. */');(p/'run.mjs').write_text(s)
