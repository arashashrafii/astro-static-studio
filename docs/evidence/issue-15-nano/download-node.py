import concurrent.futures,hashlib,json,time,urllib.request
from pathlib import Path
root=Path(__file__).parent
url='https://media.githubusercontent.com/media/userland-run/nano/b3fd06ac608b1adb0024f26ca108bae970c6bbaa/runners/riscv/images/node'
size=90059416;step=4*1024*1024;started=time.time()
def get(start):
 end=min(start+step,size)-1;p=root/f'node.part-{start}'
 with urllib.request.urlopen(urllib.request.Request(url,headers={'Range':f'bytes={start}-{end}'}),timeout=90) as r:
  if r.status!=206 or r.headers.get('Content-Range')!=f'bytes {start}-{end}/{size}':raise RuntimeError('Range response mismatch')
  data=r.read()
 if len(data)!=end-start+1:raise RuntimeError('Partial range')
 p.write_bytes(data)
 return start
with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
 completed=list(pool.map(get,range(0,size,step)))
out=root/'node-full'
with out.open('wb') as f:
 for start in sorted(completed):f.write((root/f'node.part-{start}').read_bytes())
sha=hashlib.sha256(out.read_bytes()).hexdigest()
assert sha=='c1ea44df1775f02cf6956e1493728b7523acbdfdf1ce37294fcc9d01a09a7155',sha
report={'bytes':size,'sha256':sha,'downloadSeconds':round(time.time()-started,3),'source':url}
(root/'node-download.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report))
