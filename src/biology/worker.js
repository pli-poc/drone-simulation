import {FlightExperiment} from './experiment.js';
let experiment=new FlightExperiment(),running=true,rate=.02,accumulator=0,last=performance.now();
function emit(){postMessage({type:'snapshot',snapshot:experiment.snapshot(),running,rate});}
self.onmessage=({data:m})=>{try{
  if(m.type==='reset'){experiment=new FlightExperiment(m.config||experiment.config);accumulator=0;}
  else if(m.type==='running'){running=Boolean(m.value);accumulator=0;last=performance.now();}
  else if(m.type==='rate'){rate=[.02,.1,1].includes(m.value)?m.value:.02;accumulator=0;}
  else if(m.type==='toggle')experiment.toggle(m.key,m.value);
  else if(m.type==='stimulus')experiment.stimulus(m.kind,m.side);
  else if(m.type==='step'){running=false;for(let i=0;i<25;i++)experiment.step(.0002);}
  else if(m.type==='export'){postMessage({type:'export',experiment:experiment.export()});return;}
  emit();
}catch(e){running=false;postMessage({type:'error',message:e.message});}};
setInterval(()=>{const now=performance.now();accumulator+=running?Math.min(.08,(now-last)/1000)*rate:0;last=now;
  try{let n=0;while(accumulator>=.0002&&n<400){experiment.step(.0002);accumulator-=.0002;n++;}if(n)emit();}catch(e){running=false;postMessage({type:'error',message:e.message});}
},25);emit();
