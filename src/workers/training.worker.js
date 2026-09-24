import {Environment} from '../core/environment.js';
import {Learner} from '../learning/dqn.js';
import {config} from '../core/world.js';
let generation=0;const yieldUI=()=>new Promise(resolve=>setTimeout(resolve,0));
self.onmessage=({data:m})=>{if(m.type==='cancel'){generation++;postMessage({type:'cancelled'});}if(m.type==='train'){const token=++generation;train(m,token).catch(e=>postMessage({type:'error',message:e.message}));}};
async function evaluate(c,model,token){
  const results=[];
  for(let k=0;k<12;k++){if(token!==generation)return null;const env=new Environment({...c,seed:700001+k*7919});while(!env.done){env.step(model?model.action(env.observation()):0);if(env.metrics.steps%60===0){await yieldUI();if(token!==generation)return null;}}results.push({seed:env.config.seed,...env.metrics,outcome:env.outcome});await yieldUI();}
  const avg=key=>results.reduce((s,r)=>s+r[key],0)/results.length;
  return {episodes:results.length,contactRate:avg('contacts'),collisions:results.reduce((s,r)=>s+r.collisions,0),meanReturn:avg('return'),meanInterventions:avg('interventions'),results};
}
async function train(m,token){
  const c=config(m.config),episodes=Math.max(1,Math.min(300,Math.floor(Number(m.episodes)||60))),learner=new Learner(c.seed+123,m.checkpoint||null),history=[],start=performance.now();
  for(let ep=0;ep<episodes;ep++){if(token!==generation)return;const env=new Environment({...c,seed:c.seed+ep*997});let state=env.observation();const epsilon=Math.max(0.06,0.4*Math.pow(0.96,ep));
    while(!env.done){const action=learner.choose(state,epsilon),r=env.step(action);learner.remember(state,action,r.reward,r.observation,r.terminated||r.truncated);state=r.observation;if(env.metrics.steps%40===0){await yieldUI();if(token!==generation)return;}}
    const row={episode:ep+1,return:env.metrics.return,contact:env.metrics.contacts,collisions:env.metrics.collisions,interventions:env.metrics.interventions,loss:learner.loss,epsilon};history.push(row);
    postMessage({type:'progress',episode:ep+1,episodes,row,updates:learner.updates,steps:learner.steps,elapsed:(performance.now()-start)/1000});await yieldUI();
  }
  postMessage({type:'evaluating',message:'Comparing policies on 12 held-out seeds each…'});
  const baseline=await evaluate(c,null,token);if(!baseline)return;const learned=await evaluate(c,learner.net,token);if(!learned)return;
  const checkpoint=learner.net.checkpoint({config:c,episodes,updates:learner.updates,seed:c.seed,created:new Date().toISOString()});
  postMessage({type:'complete',checkpoint,history,evaluation:{baseline,learned,scope:'Same scenario family; unseen random seeds, NOT unseen homes.'},elapsed:(performance.now()-start)/1000});
}
