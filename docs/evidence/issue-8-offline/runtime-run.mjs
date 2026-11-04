import http from 'node:http';
import {readFile,writeFile} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {chromium} from '../../experiments/browser-astro-build/node_modules/playwright/index.mjs';
const exec=promisify(execFile),root=new URL('./',import.meta.url),target='http://127.0.0.1:4175/';
const adb=async(...args)=>(await exec('adb',['-s','emulator-5556',...args],{timeout:20000,maxBuffer:4*1024*1024})).stdout;
const evidence={startedAt:new Date().toISOString(),kind:'Android emulator only',requests:[],errors:[]};
const files=new Set(['index.html','app.mjs','webcontainer.mjs','fixture.json','create-zip.mjs','assets.json','expected.json']);
const assets=JSON.parse(await readFile(new URL('assets.json',root)));let disconnected=false;
const server=http.createServer(async(req,res)=>{try{if(req.url==='/favicon.ico'){res.writeHead(204).end();return;}const asset=assets.find(a=>a.url===req.url);if(asset){res.writeHead(200,{'Content-Type':'image/webp','Cache-Control':'no-store'});res.end(await readFile(asset.path));return;}const path=req.url==='/'?'index.html':req.url.slice(1);if(!files.has(path)){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':path.endsWith('.mjs')?'text/javascript':path.endsWith('.json')?'application/json':'text/html','Cross-Origin-Opener-Policy':'same-origin','Cross-Origin-Embedder-Policy':'require-corp','Cache-Control':'no-store'});res.end(await readFile(new URL(path,root)));}catch(e){res.writeHead(500).end(String(e));}});
await new Promise(r=>server.listen(4175,'127.0.0.1',r));
let browser,page;
async function connect(){for(let i=0;i<60;i++){try{return await chromium.connectOverCDP('http://127.0.0.1:9223',{timeout:5000});}catch(e){if(i===59)throw e;await new Promise(r=>setTimeout(r,1000));}}}
function observe(context){context.on('request',r=>evidence.requests.push({at:new Date().toISOString(),offline:disconnected,url:r.url().split('?')[0],method:r.method()}));}
async function probe(p){return p.evaluate(async()=>{try{const r=await fetch('https://registry.npmjs.org/astro?issue8='+Date.now(),{cache:'no-store',signal:AbortSignal.timeout(8000)});return{online:navigator.onLine,fetchSucceeded:true,status:r.status};}catch(e){return{online:navigator.onLine,fetchSucceeded:false,error:String(e)};}});}
async function newPage(cold=false){const c=browser.contexts()[0];observe(c);const p=c.pages().find(p=>p.url().includes(':4175'))??c.pages()[0]??await c.newPage();p.setDefaultTimeout(20000);p.on('pageerror',e=>evidence.errors.push({phase:cold?'cold':'warm',message:e.message}));await p.goto(target,{waitUntil:'load',timeout:30000});if(cold)await p.evaluate(()=>window.coldProbe=true);return p;}
async function capture(name){await writeFile(new URL(name,root),JSON.stringify(evidence,null,2));}
try{
 evidence.originalWifi=(await adb('shell','settings','get','global','wifi_on')).trim();evidence.originalData=(await adb('shell','settings','get','global','mobile_data')).trim();
 evidence.anrBefore=await adb('logcat','-b','events','-d','-s','am_anr');
 browser=await connect();page=await newPage();evidence.onlineControl=await probe(page);if(!evidence.onlineControl.fetchSucceeded)throw Error('Online control fetch failed before test');
 await page.locator('#run').click();await page.waitForFunction(()=>['awaiting_disconnect','failed'].includes(window.fullBuildReport?.status),{},{timeout:180000});
 if(await page.evaluate(()=>window.fullBuildReport.status)==='failed')throw Error('Online prerequisite failed: '+await page.evaluate(()=>window.fullBuildReport.error));
 evidence.onlineReport=await page.evaluate(()=>window.fullBuildReport);await capture('progress.json');
 await adb('shell','svc','wifi','disable');await adb('shell','svc','data','disable');disconnected=true;evidence.disconnectedAt=new Date().toISOString();
 await new Promise(r=>setTimeout(r,2000));evidence.offlineControl=await probe(page);evidence.routesAfterDisconnect=await adb('shell','ip','route');evidence.wifiAfterDisconnect=await adb('shell','settings','get','global','wifi_on');evidence.dataAfterDisconnect=await adb('shell','settings','get','global','mobile_data');
 if(evidence.offlineControl.fetchSucceeded||evidence.routesAfterDisconnect.includes('default via'))throw Error('Network disconnect verification failed');
 await page.evaluate(()=>window.networkOffConfirmed=true);console.log('Network disconnected and verified; actual-template offline run started');await capture('progress.json');
 await page.waitForFunction(()=>['passed','failed'].includes(window.fullBuildReport?.status),{},{timeout:120000});evidence.warmReport=await page.evaluate(()=>window.fullBuildReport);await capture('warm-report.json');
 evidence.anrAfterWarm=await adb('logcat','-b','events','-d','-s','am_anr');await capture('warm-report.json');
 await browser.close();await adb('shell','am','force-stop','com.android.chrome');await adb('shell','am','start','-a','android.intent.action.VIEW','-d',target,'com.android.chrome');browser=await connect();page=await newPage(true);evidence.coldControl=await probe(page);evidence.mainOriginServiceWorkers=await page.evaluate(async()=>(await navigator.serviceWorker.getRegistrations()).map(r=>r.scope));await page.locator('#run').click();
 await page.waitForFunction(()=>['passed','failed'].includes(window.fullBuildReport?.status),{},{timeout:180000});evidence.coldReport=await page.evaluate(()=>window.fullBuildReport);await capture('cold-report.json');
 server.closeAllConnections();await new Promise(r=>server.close(r));try{await page.goto(target,{waitUntil:'load',timeout:15000});evidence.noServerOfflineReload={navigated:true,title:await page.title()};}catch(e){evidence.noServerOfflineReload={navigated:false,error:String(e)};}
 evidence.anrAfter=await adb('logcat','-b','events','-d','-s','am_anr');
 console.log(JSON.stringify({warm:evidence.warmReport?.status,warmBuilds:evidence.warmReport?.builds,cold:evidence.coldReport?.status,coldError:evidence.coldReport?.error,noServer:evidence.noServerOfflineReload},null,2));
}catch(e){evidence.driverError=String(e.stack);console.log(evidence.driverError);}
finally{evidence.finishedAt=new Date().toISOString();await capture('report.json');await writeFile(new URL('stop-memory',root),'stop');if(evidence.originalWifi!==undefined)await adb('shell','svc','wifi',evidence.originalWifi==='0'?'disable':'enable').catch(()=>{});if(evidence.originalData!==undefined)await adb('shell','svc','data',evidence.originalData==='0'?'disable':'enable').catch(()=>{});await browser?.close().catch(()=>{});server.closeAllConnections();server.close();}
