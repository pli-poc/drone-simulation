import {Environment,STEP} from '../core/environment.js';
import {Network} from '../learning/dqn.js';
let env=new Environment(),running=true,rate=1,policy=null,episode=1,totalContacts=0,totalCollisions=0,accumulator=0,last=performance.now();
const emit=()=>postMessage({type:'snapshot',snapshot:env.snapshot(),running,episode,totalContacts,totalCollisions,controller:policy?'learned':'baseline'});
self.onmessage=({data:m})=>{
  try {
    if(m.type==='configure'){env=new Environment(m.config);episode=1;totalContacts=0;totalCollisions=0;accumulator=0;emit();}
    else if(m.type==='running'){running=Boolean(m.value);accumulator=0;last=performance.now();emit();}
    else if(m.type==='rate'){rate=[1,2,4].includes(m.value)?m.value:1;}
    else if(m.type==='reset'){env.reset(env.config);accumulator=0;emit();}
    else if(m.type==='policy'){policy=m.checkpoint?new Network().load(m.checkpoint):null;emit();}
    else if(m.type==='step'){running=false;advance();emit();}
  }catch(error){postMessage({type:'error',message:error.message});}
};
function advance(){
  if(env.done){totalContacts+=env.metrics.contacts;totalCollisions+=env.metrics.collisions;episode++;env.reset({...env.config,seed:env.config.seed+997});}
  env.step(policy?policy.action(env.observation()):0);
}
setInterval(()=>{
  const now=performance.now();accumulator+=running?Math.min(0.2,(now-last)/1000)*rate:0;last=now;
  let moved=false;while(accumulator>=STEP){advance();accumulator-=STEP;moved=true;}
  if(moved)emit();
},30);
emit();
