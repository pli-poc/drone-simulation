import test from 'node:test';
import assert from 'node:assert/strict';
import {Worker} from 'node:worker_threads';
import {mkdir,writeFile} from 'node:fs/promises';
function harness(path){
 const worker=new Worker(new URL('./worker-harness.mjs',import.meta.url),{workerData:{module:new URL(path,import.meta.url).href}});
 const wait=(predicate,ms=10000)=>new Promise((resolve,reject)=>{
  const cleanup=()=>{clearTimeout(timer);worker.off('message',message);worker.off('error',error);};
  const error=e=>{cleanup();reject(e);};
  const message=m=>{if(m.type==='error')error(new Error(m.message));else if(predicate(m)){cleanup();resolve(m);}};
  const timer=setTimeout(()=>error(new Error('Worker response timed out')),ms);
  worker.on('message',message);worker.on('error',error);
 });
 return {worker,wait,send:m=>worker.postMessage(m)};
}
test('biological laboratory worker accepts controls and exports force-driven traces',async()=>{
 const h=harness('../src/biology/worker.js');
 try{
  await h.wait(m=>m.type==='harness-ready');
  let response=h.wait(m=>m.type==='snapshot'&&!m.running);h.send({type:'running',value:false});await response;
  response=h.wait(m=>m.type==='snapshot'&&m.snapshot.bio.time===0);h.send({type:'reset',config:{frequency:220,wings:false}});await response;
  response=h.wait(m=>m.type==='snapshot'&&m.snapshot.bio.time>0);h.send({type:'step'});const result=await response;
  assert.ok(Math.abs(result.snapshot.bio.time-.005)<1e-9);assert.ok(result.snapshot.bio.v[1]<0);assert.equal(result.snapshot.bio.frequency,220);
  response=h.wait(m=>m.type==='export');h.send({type:'export'});assert.equal((await response).experiment.config.wings,false);
 }finally{await h.worker.terminate();}
});
test('training worker performs end-to-end biological-opponent learning and held-out evaluation',{timeout:150000},async()=>{
 const h=harness('../src/workers/training.worker.js');
 try{
  await h.wait(m=>m.type==='harness-ready');
  const response=h.wait(m=>m.type==='complete',140000);
  h.send({type:'train',episodes:2,config:{insectModel:'biological',scenario:'arena',duration:5,bioFrequency:220,bioMassScale:1.1,seed:42}});
  const m=await response;
  assert.ok(m.checkpoint.meta.updates>0);assert.equal(m.checkpoint.meta.config.insectModel,'biological');assert.equal(m.checkpoint.meta.config.bioFrequency,220);
  assert.equal(m.evaluation.baseline.episodes,12);assert.equal(m.evaluation.learned.episodes,12);
  assert.ok(Number.isFinite(m.evaluation.learned.meanReturn));
  await mkdir('test-results',{recursive:true});
  await writeFile('test-results/worker-training.json',JSON.stringify({scope:'Unmodified training worker exercised through a Node message adapter; not browser or biological validation.',commit:process.env.GITHUB_SHA||'local',elapsed:m.elapsed,meta:m.checkpoint.meta,history:m.history,evaluation:m.evaluation},null,2));
 }finally{await h.worker.terminate();}
});
