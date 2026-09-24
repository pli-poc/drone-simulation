import {NeuralInsect} from './insect.js';
import {NEURAL_MODEL} from './engine.js';
export class NeuralExperiment{
  constructor(graph,options={}){this.graph=graph;this.reset(options);}
  reset(options={}){this.options={seed:42,neuralDtMs:options.neuralDtMs||0.5};this.insect=new NeuralInsect([0,1.5,0],42,this.options,this.graph);this.loom=null;this.gustUntil=-1;this.events=[];this.trace=[];this.nextTrace=0;}
  get time(){return this.insect.brain.time;}
  stimulus(kind,side=1){if(kind==='loom')this.loom={start:this.time,side:side<0?-1:1,p:[...this.insect.p]};else if(kind==='gust')this.gustUntil=this.time+.12;else if(kind==='pulse')this.insect.pulseUntil=this.time+.1;else throw new Error('Unknown neural experiment stimulus.');this.events.push({time:this.time,kind,side});}
  toggle(key,enabled){if(key==='vision')this.insect.visionEnabled=Boolean(enabled);else if(key==='wings')this.insect.body.wingsEnabled=Boolean(enabled);else if(key==='stabilizer')this.insect.body.controller=Boolean(enabled);else if(key==='transmission')this.insect.brain.transmissionEnabled=Boolean(enabled);else if(key==='readout')this.insect.disconnected=!enabled;else if(['LC4','LPLC2','DNp01'].includes(key))this.insect.lesion(key,!enabled);else throw new Error('Unknown neural ablation.');this.events.push({time:this.time,key,enabled:Boolean(enabled)});}
  step(dt=.005){const t=this.time,threat={p:[100,100,100],radius:.06};if(this.loom){const age=t-this.loom.start;if(age<.4){const d=Math.max(.09,.8-2.4*age);threat.p=this.loom.p.map((v,i)=>v+(i===0?this.loom.side*d:i===2?d*.3:0));}else this.loom=null;}
    this.insect.step(dt,threat,[],{wind:0,bioNoWake:true,bioGust:t<this.gustUntil?[.6,0,0]:null},t);
    if(this.time>=this.nextTrace){this.nextTrace=this.time+.005;const s=this.insect.snapshot();this.trace.push({time:this.time,p:s.p,v:s.v,q:s.bio.q,command:s.neural.command,rates:s.neural.rates,spikes:s.neural.spikes,looming:s.bio.sensory.looming});if(this.trace.length>10000)this.trace.shift();}}
  snapshot(){return {...this.insect.snapshot(),events:this.events.slice(-10)};}
  export(){const n=this.insect.brain;return {schema:'mosquito-drone-lab/neural-experiment@1',dataset:this.graph.manifest,model:NEURAL_MODEL,options:this.options,summary:n.summary(),events:this.events,trace:this.trace,traceCapacity:10000,spikeTrace:this.insect.recordedSpikes,spikeTraceCapacity:20000,spikeTraceDropped:this.insect.droppedSpikes,neuronSpikeCounts:Array.from(n.counts,(count,i)=>[this.graph.ids[i],count]),limitations:'All traced MaleCNS neurons and their internal connections. Point-neuron dynamics, synthetic sensory input, engineered motor decoder and flight stabilizer; not a validated biological flight controller or mosquito.'};}
}
