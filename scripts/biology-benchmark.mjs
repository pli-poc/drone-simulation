import {writeFile,mkdir} from 'node:fs/promises';
import {FlyBody,PROFILE} from '../src/biology/model.js';
import {FlightExperiment} from '../src/biology/experiment.js';
import {Environment} from '../src/core/environment.js';
const start=performance.now(),body=new FlyBody();for(let i=0;i<200;i++)body.step(.005);
const physicsWallSeconds=(performance.now()-start)/1000,hover=body.snapshot(),stimuli=[];
for(const vision of [true,false])for(const side of [-1,1]){
  const e=new FlightExperiment({vision});e.stimulus('loom',side);for(let i=0;i<300;i++)e.step(.002);
  stimuli.push({vision,side,escapes:e.insect.events,endpoint:e.insect.p,tilt:e.insect.body.snapshot().tilt});
}
const trials=[];for(const scenario of ['arena','home','dynamic','passage'])for(const seed of [42,193]){
  const env=new Environment({insectModel:'biological',scenario,seed,duration:5});while(!env.done)env.step(0);
  trials.push({scenario,seed,outcome:env.outcome,...env.metrics});
}
const result={schema:'mosquito-drone-lab/biological-benchmark@1',commit:process.env.GITHUB_SHA||'local',profile:PROFILE,created:new Date().toISOString(),physics:{simulatedSeconds:1,wallSeconds:physicsWallSeconds,simulatedSecondsPerWallSecond:1/physicsWallSeconds,dt:body.dt,steps:body.steps},hover:{endpoint:hover.p,tilt:hover.tilt,meanLiftOverWeight:hover.liftMean/hover.weight},stimuli,trials,limitations:'Numerical and software regression evidence only. No empirical biological trajectory validation. Oracle drone map and engineered fly controller.'};
await mkdir('test-results',{recursive:true});await writeFile('test-results/biology-benchmark.json',JSON.stringify(result,null,2));console.log(JSON.stringify({physics:result.physics,hover:result.hover,stimuli,trialCount:trials.length},null,2));
