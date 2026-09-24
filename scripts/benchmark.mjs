import {Environment} from '../src/core/environment.js';
import {writeFile,mkdir} from 'node:fs/promises';
const started=performance.now(),rows=[];
for(const scenario of ['arena','home','dynamic','passage'])for(const seed of [42,91,123,234]){
  const e=new Environment({scenario,seed,duration:12});while(!e.done)e.step(0);rows.push({scenario,seed,outcome:e.outcome,...e.metrics});
}
const report={schema:1,commit:process.env.GITHUB_SHA||'local',controller:'predictive-baseline',scope:'16 deterministic software benchmark episodes. Not biological or safety validation.',wallSeconds:(performance.now()-started)/1000,rows};
await mkdir('test-results',{recursive:true});await writeFile('test-results/benchmark.json',JSON.stringify(report,null,2));
console.table(rows.map(({scenario,seed,outcome,contacts,collisions,interventions,return:r})=>({scenario,seed,outcome,contacts,collisions,interventions,return:r.toFixed(3)})));
