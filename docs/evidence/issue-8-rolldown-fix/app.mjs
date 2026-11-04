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
  async function command(name,args,timeout){return stage([name,...args].join(' '),async()=>{const process=await wc.spawn(name,args,{env:{ASTRO_TELEMETRY_DISABLED:'1',NAPI_RS_FORCE_WASI:'true'}});const abort=new AbortController();const output=process.output.pipeTo(new WritableStream({write:chunk=>log(chunk)}),{signal:abort.signal}).catch(e=>{if(e.name!=='AbortError')log(String(e));});const code=await process.exit;log(`Exit code received: ${code}`);let drained=false;await Promise.race([output.then(()=>drained=true),new Promise(r=>setTimeout(r,2000))]);if(!drained){report.outputDrainTimeouts=(report.outputDrainTimeouts??0)+1;abort.abort();}log(`Exit code: ${code}`);if(code!==0)throw Error(`${name} exited ${code}`);return code;},timeout);}
  await command('node',['--version'],15000);
  await command('npm',['ci','--no-audit','--no-fund','--progress=false','--force','--loglevel=http','--ignore-scripts','--fetch-timeout=30000','--fetch-retries=0'],180000);
  report.builds=[];
  for(let i=1;i<=10;i++){
   const marker=`LATEST-ASTRO-BUILD-${i}`;
   await wc.fs.writeFile('src/data.json',JSON.stringify({title:marker}));
   const start=performance.now();await command('node',['--input-type=module','-e',"const keep=setInterval(()=>{},1000);try{const {build}=await import('astro');await build({});console.log('BUILD_API_RESOLVED');clearInterval(keep);process.exit(0)}catch(e){console.error(e);process.exit(1)}"],120000);
   for(const path of ['dist/index.html','dist/about/index.html']){const html=await wc.fs.readFile(path,'utf8');if(!html.includes(marker))throw Error(`Missing ${marker} in ${path}`);}
   report.builds.push({number:i,marker,elapsedMs:Math.round(performance.now()-start)});
  }
  const outputs=new Map();async function walk(path,relative=''){for(const entry of await wc.fs.readdir(path,{withFileTypes:true})){const rel=relative?`${relative}/${entry.name}`:entry.name;if(entry.isDirectory())await walk(`${path}/${entry.name}`,rel);else outputs.set(rel,await wc.fs.readFile(`${path}/${entry.name}`));}}
  await walk('dist');const decoder=new TextDecoder();
  for(const path of ['index.html','about/index.html'])if(!decoder.decode(outputs.get(path)).includes('LATEST-ASTRO-BUILD-10'))throw Error(`Updated marker missing in ${path}`);
  report.outputs=[...outputs].map(([path,bytes])=>({path,bytes:bytes.length}));report.html=Object.fromEntries([...outputs].filter(([p])=>p.endsWith('.html')).map(([p,b])=>[p,decoder.decode(b)]));
  const home=report.html['index.html'];
  report.assetChecks={svg:outputs.has('badge.svg'),css:[...outputs.keys()].some(p=>p.endsWith('.css'))||/<style[^>]*>[\s\S]*font-family:system-ui/.test(home),js:[...outputs.keys()].some(p=>p.endsWith('.js'))||/<script[^>]*>[\s\S]*Clicked/.test(home)};
  if(!Object.values(report.assetChecks).every(Boolean))throw Error('Expected static image/CSS/JS output missing');
  const zip=await createZip(outputs);const a=document.querySelector('#download');a.href=URL.createObjectURL(new Blob([zip],{type:'application/zip'}));a.hidden=false;
  report.status='passed';status.textContent='Ten real Astro CLI builds succeeded in browser';
 }catch(e){report.status='failed';report.error=e.message;status.textContent=`Failed: ${e.message}`;log(e.stack??e.message);}
 finally{wc?.teardown();report.finishedAt=new Date().toISOString();}
};
