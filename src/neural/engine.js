/** Whole-connectome point-neuron runtime. Topology is empirical; physiology is a model.
 * v is deviation from -52 mV; g is an exponentially decaying current in mV.
 * Analytic subthreshold integration, discrete spike detection, fixed delay ring.
 * All retained neurons exist. Sparse mode only skips never-activated resting cells.
 */
export const NEURAL_MODEL = Object.freeze({id:'malecns-lif-v1',restMV:-52,thresholdMV:-45,resetMV:-52,tauMembraneMs:20,tauSynapseMs:5,refractoryMs:2.2,delayMs:1.8,weightMV:0.275,inputMV:68.75,defaultDtMs:0.5});
export class ConnectomeLIF {
  constructor(graph,{dtMs=0.5,seed=42,dense=false}={}) {
    if(![0.1,0.2,0.5,1].includes(dtMs))throw new Error('Unsupported neural timestep.');
    this.graph=graph;this.n=graph.n;this.dtMs=dtMs;this.dense=dense;
    this.v=new Float64Array(this.n);this.g=new Float64Array(this.n);this.refractory=new Int32Array(this.n);
    this.counts=new Uint32Array(this.n);this.silenced=new Uint8Array(this.n);this.marked=new Uint8Array(this.n);this.active=[];
    this.delayTicks=Math.max(1,Math.round(NEURAL_MODEL.delayMs/dtMs));this.refractoryTicks=Math.ceil(NEURAL_MODEL.refractoryMs/dtMs);
    this.ring=Array.from({length:this.delayTicks+1},()=>[]);this.tick=0;this.totalSpikes=0;this.events=0;this.transmissionEnabled=true;this.seed=seed>>>0;
    this.em=Math.exp(-dtMs/20);this.es=Math.exp(-dtMs/5);this.c=(this.em-this.es)/3;
  }
  random(){let x=this.seed+=0x6D2B79F5;x=Math.imul(x^(x>>>15),x|1);x^=x+Math.imul(x^(x>>>7),x|61);return ((x^(x>>>14))>>>0)/4294967296;}
  activate(i){if(!Number.isInteger(i)||i<0||i>=this.n)throw new Error('Neuron index out of bounds.');if(!this.marked[i]){this.marked[i]=1;this.active.push(i);}}
  stimulate(i,mv=NEURAL_MODEL.inputMV){if(!Number.isFinite(mv)||Math.abs(mv)>1000)throw new Error('Invalid stimulus.');this.activate(i);if(!this.silenced[i])this.v[i]+=mv;}
  lesion(indices,value=true){for(const i of indices){this.activate(i);this.silenced[i]=value?1:0;if(value){this.v[i]=0;this.g[i]=0;}}}
  step(drives=[]){
    const slot=this.tick%this.ring.length,arrivals=this.ring[slot];this.ring[slot]=[];
    const {offsets,post,weight,sign}=this.graph;
    for(const source of arrivals){if(!this.transmissionEnabled||this.silenced[source])continue;const factor=sign[source]*NEURAL_MODEL.weightMV;if(!factor)continue;
      for(let j=offsets[source];j<offsets[source+1];j++){const i=post[j];if(this.silenced[i])continue;this.activate(i);this.g[i]+=weight[j]*factor;this.events++;}}
    // Synthetic sensory Poisson impulses; rates are adapter assumptions, not reconstructed retina.
    for(const d of drives){if(!Number.isFinite(d.hz)||d.hz<0||d.hz>1000)throw new Error('Input rate must be 0–1000 Hz.');const probability=1-Math.exp(-d.hz*this.dtMs/1000);for(const i of d.indices)if(this.random()<probability)this.stimulate(i);}
    const fired=[],length=this.dense?this.n:this.active.length;
    for(let k=0;k<length;k++){const i=this.dense?k:this.active[k];if(this.silenced[i]){this.v[i]=0;this.g[i]=0;continue;}if(this.tick<this.refractory[i])continue;
      this.v[i]=this.em*this.v[i]+this.c*this.g[i];this.g[i]*=this.es;
      if(!Number.isFinite(this.v[i])||!Number.isFinite(this.g[i]))throw new Error('Neural solver produced nonfinite state.');
      if(this.v[i]>7){this.v[i]=0;this.g[i]=0;this.refractory[i]=this.tick+this.refractoryTicks;this.counts[i]++;fired.push(i);}}
    const pending=this.ring[(this.tick+this.delayTicks)%this.ring.length];for(const i of fired)pending.push(i);this.tick++;this.totalSpikes+=fired.length;this.lastSpikes=fired;return fired;
  }
  get time(){return this.tick*this.dtMs/1000;}
  summary(){return {model:NEURAL_MODEL.id,neurons:this.n,connections:this.graph.m,dtMs:this.dtMs,time:this.time,spikes:this.totalSpikes,activeNeurons:this.active.length,synapticEvents:this.events,effectiveDelayMs:this.delayTicks*this.dtMs,effectiveRefractoryMs:this.refractoryTicks*this.dtMs,allRetainedNeuronsAllocated:true,graphSampling:false};}
}
