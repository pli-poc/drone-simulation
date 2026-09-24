import {Environment,STEP} from '../core/environment.js';
import {Network} from '../learning/dqn.js';
import {environmentFactory} from '../neural/environment.js';
let env=new Environment(),running=true,rate=1,policy=null,episode=1,totalContacts=0,totalCollisions=0,accumulator=0,last=performance.now(),generation=0,loading=false;
const emit=()=>postMessage({type:'snapshot',snapshot:env.snapshot(),running,episode,totalContacts,totalCollisions,controller:policy?'learned':'baseline'});
self.onmessage=async({data:m})=>{try{
  if(m.type==='configure'){
    const token=++generation,resume=running;running=false;loading=true;accumulator=0;
    const factory=await environmentFactory(m.config,(message,loaded,total)=>{if(token===generation)postMessage({type:'loading',message,loaded,total});});
    if(token!==generation)return;env=factory(m.config);episode=1;totalContacts=0;totalCollisions=0;loading=false;running=resume;last=performance.now();emit();
  }else if(m.type==='running'){running=!loading&&Boolean(m.value);accumulator=0;last=performance.now();emit();}
  else if(m.type==='rate')rate=[1,2,4].includes(m.value)?m.value:1;
  else if(m.type==='reset'&&!loading){env.reset(env.config);accumulator=0;emit();}
  else if(m.type==='policy'){policy=m.checkpoint?new Network().load(m.checkpoint):null;emit();}
  else if(m.type==='step'&&!loading){running=false;advance();emit();}
}catch(error){loading=false;running=false;postMessage({type:'error',message:error.message});}};
function advance(){if(env.done){totalContacts+=env.metrics.contacts;totalCollisions+=env.metrics.collisions;episode++;env.reset({...env.config,seed:env.config.seed+997});}env.step(policy?policy.action(env.observation()):0);}
setInterval(()=>{const now=performance.now();accumulator+=running&&!loading?Math.min(.2,(now-last)/1000)*rate:0;last=now;let moved=false;
  try{const deadline=performance.now()+40;while(accumulator>=STEP&&performance.now()<deadline){advance();accumulator-=STEP;moved=true;}if(moved)emit();}catch(e){running=false;postMessage({type:'error',message:e.message});}
},30);emit();
