import {WebContainer} from './webcontainer.mjs';
const report=window.fullBuildReport={status:'ready',capabilities:{userAgent:navigator.userAgent,secureContext:isSecureContext,crossOriginIsolated,sharedArrayBuffer:typeof SharedArrayBuffer,sharedWorker:typeof SharedWorker},stages:[],logs:[]};
const status=document.querySelector('#status');
function log(s){s=s.replace(/\x1b\[[0-?]*[ -/]*[@-~]/g,'');if(/^[\\|/\-\s]*$/.test(s))return;report.logs.push(s);document.querySelector('#log').textContent=report.logs.join('\n');}
async function stage(name,fn,ms){status.textContent=name;report.currentStage=name;const start=performance.now();let timer;try{const value=await Promise.race([fn(),new Promise((_,reject)=>timer=setTimeout(()=>reject(Error(`${name} exceeded ${ms}ms`)),ms))]);report.stages.push({name,elapsedMs:Math.round(performance.now()-start),passed:true});return value;}catch(e){report.stages.push({name,elapsedMs:Math.round(performance.now()-start),passed:false,error:e.message});throw e;}finally{clearTimeout(timer);}}
document.querySelector('#run').onclick=async()=>{
 document.querySelector('#run').disabled=true;report.status='running';let wc;
 try{
  wc=await stage('runtime boot',()=>WebContainer.boot({coep:'require-corp'}),90000);
  report.runtimeBooted=true;
  await wc.mount({ 'package.json':{file:{contents:JSON.stringify({private:true})}} });
  async function command(name,args,timeout){return stage([name,...args].join(' '),async()=>{const process=await wc.spawn(name,args);const output=process.output.pipeTo(new WritableStream({write:chunk=>log(chunk)}));const code=await process.exit;await output;log(`Exit code: ${code}`);if(code!==0)throw Error(`${name} exited ${code}`);return code;},timeout);}
  await command('node',['--version'],15000);
  await command('npm',['install','is-number@7.0.0','--no-audit','--no-fund','--progress=false'],90000);
  await command('node',['-e',"const assert=require('node:assert/strict');const isNumber=require('is-number');assert.equal(isNumber(42),true);assert.equal(isNumber('no'),false);assert.equal(require('is-number/package.json').version,'7.0.0');console.log('is-number checks passed')"],15000);
  report.status='passed';status.textContent='Package install and runtime checks succeeded';
 }catch(e){report.status='failed';report.error=e.message;status.textContent=`Failed: ${e.message}`;log(e.stack??e.message);}
 finally{wc?.teardown();report.finishedAt=new Date().toISOString();}
};
