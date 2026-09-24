import {loadConnectome} from './assets.js';
import {NeuralExperiment} from './experiment.js';
let graph=null,experiment=null,running=false,rate=.1,accumulator=0,advance=0,last=performance.now(),started=performance.now(),generation=0,loading=false;
const emit=()=>experiment&&postMessage({type:'snapshot',snapshot:experiment.snapshot(),running,wallSeconds:(performance.now()-started)/1000});
self.onmessage=async({data:m})=>{try{
  if(m.type==='load'&&!loading){loading=true;const token=++generation;graph=await loadConnectome((message,loaded,total)=>postMessage({type:'loading',message,loaded,total}));if(token!==generation)return;experiment=new NeuralExperiment(graph);loading=false;started=performance.now();postMessage({type:'ready',manifest:graph.manifest,coordinates:graph.coordinates});emit();}
  else if(!experiment)throw new Error('Load the verified connectome first.');
  else if(m.type==='reset'){running=false;advance=0;accumulator=0;experiment.reset({neuralDtMs:m.dtMs});started=performance.now();emit();}
  else if(m.type==='running'){running=Boolean(m.value);accumulator=0;last=performance.now();emit();}
  else if(m.type==='rate')rate=[.02,.1,1].includes(m.value)?m.value:.1;
  else if(m.type==='advance'){running=false;advance=Math.min(.5,advance+.05);}
  else if(m.type==='stimulus'){experiment.stimulus(m.kind,m.side);emit();}
  else if(m.type==='toggle'){experiment.toggle(m.key,m.value);emit();}
  else if(m.type==='export')postMessage({type:'export',experiment:experiment.export()});
}catch(e){loading=false;running=false;postMessage({type:'error',message:e.message});}};
setInterval(()=>{const now=performance.now();accumulator=Math.min(.1,accumulator+(running?Math.min(.1,(now-last)/1000)*rate:0));last=now;
  if(!experiment)return;const deadline=now+30;let moved=false;
  try{while((accumulator>=.001||advance>=.001)&&performance.now()<deadline){experiment.step(.001);if(advance>=.001)advance-=.001;else accumulator-=.001;moved=true;}if(moved)emit();}catch(e){running=false;advance=0;postMessage({type:'error',message:e.message});}
},25);
