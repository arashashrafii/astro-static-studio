import http from 'node:http';
import {readFile,writeFile} from 'node:fs/promises';
import {chromium} from '../../experiments/browser-astro-build/node_modules/playwright/index.mjs';
const files=new Set(['index.html','app.mjs','webcontainer.mjs','fixture.json','create-zip.mjs','assets.json','expected.json']);
const types={html:'text/html',mjs:'text/javascript',json:'application/json'};
const assets=JSON.parse(await readFile(new URL('assets.json',import.meta.url)));
const server=http.createServer(async(req,res)=>{if(req.url==='/favicon.ico'){res.writeHead(204).end();return;}const path=req.url==='/'?'index.html':req.url.slice(1);const asset=assets.find(a=>a.url===req.url);if(asset){res.writeHead(200,{'Content-Type':'image/webp','Cache-Control':'no-store'});res.end(await readFile(asset.path));return;}if(!files.has(path)){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':types[path.split('.').pop()],'Cross-Origin-Opener-Policy':'same-origin','Cross-Origin-Embedder-Policy':'require-corp','Cache-Control':'no-store'});res.end(await readFile(new URL(path,import.meta.url)));});
await new Promise(r=>server.listen(4175,'127.0.0.1',r));
const browser=await chromium.connectOverCDP('http://127.0.0.1:9223');
const context=browser.contexts()[0];const page=context.pages().find(p=>p.url().includes(':4175')) ?? context.pages()[0] ?? await context.newPage();
page.setDefaultNavigationTimeout(20000);page.setDefaultTimeout(15000);
const evidence={startedAt:new Date().toISOString(),kind:'Android emulator only',requests:[],failedRequests:[],consoleErrors:[]};
context.on('request',r=>evidence.requests.push({url:r.url().split('?')[0],method:r.method(),type:r.resourceType()}));
context.on('requestfailed',r=>evidence.failedRequests.push({url:r.url().split('?')[0],error:r.failure()?.errorText}));
page.on('pageerror',e=>evidence.consoleErrors.push(e.message));
page.on('console',m=>{if(m.type()==='error')evidence.consoleErrors.push(m.text().slice(0,1500));});
try{
 await page.goto('http://127.0.0.1:4175/',{waitUntil:'load'});
 await page.locator('#run').click();
 await page.waitForFunction(()=>['passed','failed'].includes(window.fullBuildReport?.status),{},{timeout:1600000});
 evidence.report=await page.evaluate(()=>window.fullBuildReport);
 await page.screenshot({path:new URL('result.png',import.meta.url).pathname,fullPage:true,timeout:10000}).catch(e=>evidence.screenshotError=e.message);
 if(evidence.report.status==='passed'){
  const session=await context.newCDPSession(page);await session.send('Browser.setDownloadBehavior',{behavior:'default'});await page.locator('#download').click();evidence.nativeDownloadClicked=true;await page.waitForTimeout(10000);
 }
 console.log(JSON.stringify({status:evidence.report.status,capabilities:evidence.report.capabilities,stages:evidence.report.stages,error:evidence.report.error,failedRequests:evidence.failedRequests},null,2));
}catch(e){evidence.driverError=String(e.stack);console.log(evidence.driverError);process.exitCode=1;}
finally{
 evidence.finishedAt=new Date().toISOString();await writeFile(new URL('report.json',import.meta.url),JSON.stringify(evidence,null,2));/* Keep Blob page alive for native Android download. */await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));
}
