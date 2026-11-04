import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ContentSchema} from '@astro-static-studio/contracts';
import {migrateV1ToV2} from '../packages/contracts/src/content-migration.js';
import {projectsIndexView} from '../apps/site/src/lib/projects-route.js';

const legacy=ContentSchema.parse({version:1,site:{name:'Route test',tagline:'',email:'',phone:''},entries:[
  {id:'a7b1bb0e-92b7-4772-b88e-60389c07c033',kind:'page',slug:'about',title:'About',summary:'',published:true,components:[]},
  {id:'9e9eeb74-5df7-4c51-9de7-d6e45b239074',kind:'project',slug:'sample',title:'Sample project',summary:'A saved project',published:true,components:[{type:'text',body:'Details'}]},
]});

test('/projects/ resolves the V2 Projects collection while retaining the V1 listing',()=>{
  const v1View=projectsIndexView(legacy);
  assert.equal(v1View.kind,'legacy');
  if(v1View.kind==='legacy')assert.deepEqual(v1View.entries.map(entry=>entry.slug),['sample']);

  const migrated=migrateV1ToV2(legacy);
  const v2View=projectsIndexView(migrated);
  assert.equal(v2View.kind,'collection');
  if(v2View.kind==='collection'){
    assert.equal(v2View.collection?.slug,'projects');
    assert.equal(v2View.collection?.routeBase,'portfolio');
    assert.deepEqual(v2View.items.filter(item=>item.collectionId===v2View.collection?.id&&item.published).map(item=>item.slug),['sample']);
  }
});
