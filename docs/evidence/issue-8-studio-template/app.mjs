import {WebContainer} from './webcontainer.mjs';
import {createZip} from './create-zip.mjs';
const report=window.fullBuildReport={status:'ready',capabilities:{userAgent:navigator.userAgent,secureContext:isSecureContext,crossOriginIsolated,sharedArrayBuffer:typeof SharedArrayBuffer},stages:[],logs:[]};
const status=document.querySelector('#status');
function log(s){s=s.replace(/\x1b\[[0-?]*[ -/]*[@-~]/g,'');if(/^[\\|/\-\s]*$/.test(s))return;report.logs.push(s);document.querySelector('#log').textContent=report.logs.join('\n');}
async function stage(name,fn,ms){status.textContent=name;report.currentStage=name;const start=performance.now();let timer;try{const value=await Promise.race([fn(),new Promise((_,reject)=>timer=setTimeout(()=>reject(Error(`${name} exceeded ${ms}ms`)),ms))]);report.stages.push({name,elapsedMs:Math.round(performance.now()-start),passed:true});return value;}catch(e){report.stages.push({name,elapsedMs:Math.round(performance.now()-start),passed:false,error:e.message});throw e;}finally{clearTimeout(timer);}}
document.querySelector('#run').onclick=async()=>{
 document.querySelector('#run').disabled=true;report.status='running';let wc;
 try{
  wc=await stage('runtime boot',()=>WebContainer.boot({coep:'require-corp'}),90000);
  report.runtimeBooted=true;
  const files=await(await fetch('./fixture.json')).json();const tree={};
  for(const [path,contents]of Object.entries(files)){const parts=path.split('/');let node=tree;for(const dir of parts.slice(0,-1)){node[dir]??={directory:{}};node=node[dir].directory;}node[parts.at(-1)]={file:{contents}};}
  await wc.mount(tree);
async function command(name, args, timeout) {
  return stage([name, ...args].join(' '), async () => {
    const process = await wc.spawn(name, args, {
      env: { ASTRO_TELEMETRY_DISABLED: '1', NAPI_RS_FORCE_WASI: 'true' },
    });
    let sinkOpen = true;
    const output = process.output
      .pipeTo(new WritableStream({
        write(chunk) {
          if (sinkOpen) log(chunk);
        },
        close() { sinkOpen = false; },
        abort() { sinkOpen = false; },
      }))
      .catch((error) => {
        sinkOpen = false;
        log(`Output stream ended with an error: ${error}`);
      });

    const code = await process.exit;
    log(`Exit code received: ${code}`);
    let drained = false;
    await Promise.race([
      output.then(() => { drained = true; }),
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ]);
    if (!drained) {
      report.outputDrainTimeouts = (report.outputDrainTimeouts ?? 0) + 1;
      // WebContainer owns this stream; leave its reader alone after the bounded wait.
    }
    log(`Exit code: ${code}`);
    if (code !== 0) throw Error(`${name} exited ${code}`);
    return code;
  }, timeout);
}

  await command('node',['--version'],15000);
  await command('npm',['ci','--no-audit','--no-fund','--progress=false','--force','--loglevel=http','--ignore-scripts','--fetch-timeout=30000','--fetch-retries=0'],180000);
  const expected=await(await fetch('./expected.json')).json();
  const assets=await(await fetch('./assets.json')).json();
  await stage('mount actual media',async()=>{for(const asset of assets){await wc.fs.mkdir(asset.path.slice(0,asset.path.lastIndexOf('/')),{recursive:true});const bytes=new Uint8Array(await(await fetch(asset.url)).arrayBuffer());await wc.fs.writeFile(asset.path,bytes);}},120000);
  report.builds=[];
  for(let i=1;i<=1;i++){
   const marker='STUDIO-ANDROID-UPDATED';
   if(i===1){const data=JSON.parse(await wc.fs.readFile('content/content.json','utf8'));data.site.name=marker;await wc.fs.writeFile('content/content.json',JSON.stringify(data));}
   const started=performance.now();await command('node',['--input-type=module','-e',"const keep=setInterval(()=>{},1000);try{const {build}=await import('astro');await build({root:'./apps/site'});console.log('BUILD_API_RESOLVED');clearInterval(keep);process.exit(0)}catch(e){console.error(e);process.exit(1)}"],240000);
   for(const path of expected.routes){const html=await wc.fs.readFile('apps/site/dist/'+path,'utf8');if(!html.includes(marker))throw Error(`Missing updated site name in ${path}`);}
   report.builds.push({number:i,marker,routesVerified:expected.routes.length,elapsedMs:Math.round(performance.now()-started)});
  }
  const outputs=new Map();async function walk(path,relative=''){for(const entry of await wc.fs.readdir(path,{withFileTypes:true})){const rel=relative?`${relative}/${entry.name}`:entry.name;if(entry.isDirectory())await walk(`${path}/${entry.name}`,rel);else outputs.set(rel,await wc.fs.readFile(`${path}/${entry.name}`));}}
  await walk('apps/site/dist');const decoder=new TextDecoder();
  for(const path of expected.routes)if(!outputs.has(path))throw Error(`Missing route ${path}`);
  report.outputs=[...outputs].map(([path,bytes])=>({path,bytes:bytes.length}));
  const home=new DOMParser().parseFromString(decoder.decode(outputs.get('index.html')),'text/html');report.assetChecks={allMedia:assets.every(a=>outputs.has(a.path.replace('apps/site/public/',''))),css:[...outputs.keys()].some(p=>p.endsWith('.css'))||[...home.querySelectorAll('style')].some(e=>e.textContent.includes('.grid')),js:[...outputs.keys()].some(p=>p.endsWith('.js'))||[...home.querySelectorAll('script')].some(e=>e.textContent.includes('data-project-filter'))};
  if(!Object.values(report.assetChecks).every(Boolean))throw Error('Missing media/CSS/JS');
  report.htmlRoutes=expected.routes;
  const zip=await createZip(outputs);const a=document.querySelector('#download');a.href=URL.createObjectURL(new Blob([zip],{type:'application/zip'}));a.download='studio-issue8.zip';a.hidden=false;report.zipBytes=zip.length;report.zipSha256=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',zip))).map(b=>b.toString(16).padStart(2,'0')).join('');
  report.status='passed';status.textContent='Actual Studio template and media built in browser';
 }catch(e){report.status='failed';report.error=e.message;status.textContent=`Failed: ${e.message}`;log(e.stack??e.message);}
 finally{wc?.teardown();report.finishedAt=new Date().toISOString();}
};
