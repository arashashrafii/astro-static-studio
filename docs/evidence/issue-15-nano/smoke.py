import hashlib,json,os,platform,resource,subprocess,time,sys
from pathlib import Path
root=Path(__file__).resolve().parent
source=root/'userland-run-nano-b3fd06a'
ram=os.environ.get('PROBE_RAM_MIB','512')
reportPath=root/f'smoke-{ram}-report.json'
report={'guestRamMiB':int(ram),'sourceCommit':'b3fd06ac608b1adb0024f26ca108bae970c6bbaa','release':'v0.3.0','environment':platform.platform(),'kind':'Host Node harness; not browser or Android','checks':[]}
for name in ['nano.min.wasm','node-full']:
 p=root/name
 report[name]={'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
env={**os.environ,'NANOVM_WASM':str(root/'nano.min.wasm'),'NANOVM_RAM_MB':ram}
for name,args in [('hello',[str(source/'test/hello.elf')]),('node-version',[str(root/'node-full'),'--cmd','node','--version']),('node-eval',[str(root/'node-full'),'--cmd','node','-e',"console.log('NANO-NODE-OK',process.version,process.arch)"])]:
 start=time.monotonic()
 try:
  r=subprocess.run(['node',str(source/'test/run.mjs'),*args],env=env,capture_output=True,text=True,timeout=60)
  result={'name':name,'exitCode':r.returncode,'stdout':r.stdout,'stderr':r.stderr,'elapsedSeconds':round(time.monotonic()-start,3)}
 except subprocess.TimeoutExpired as e:
  result={'name':name,'timedOut':True,'elapsedSeconds':round(time.monotonic()-start,3),'stdout':str(e.stdout),'stderr':str(e.stderr)}
 result['passed']=result.get('exitCode')==0 and (('Hello from NanoVM!' in result.get('stdout','')) if name=='hello' else ('v25.4.0' in result.get('stdout','')) if name=='node-version' else ('NANO-NODE-OK' in result.get('stdout','')))
 report['checks'].append(result)
 reportPath.write_text(json.dumps(report,indent=2))
 print(json.dumps({k:v for k,v in result.items() if k not in ['stderr']}),flush=True)
 if not result['passed']:break
report['maxChildRssKiB']=resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss
report['memoryNote']='Host child process maximum RSS; includes Node/WASM harness, not Android memory. Configured guest RAM recorded separately.'
reportPath.write_text(json.dumps(report,indent=2))

sys.exit(0 if all(c["passed"] for c in report["checks"]) else 1)
