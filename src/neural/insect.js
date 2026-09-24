import {FlyBody,PROFILE,rotate,scale,limited} from '../biology/model.js';
import {visualSample} from '../biology/insect.js';
import {sweptHit} from '../core/math.js';
import {ConnectomeLIF} from './engine.js';
/** Real graph -> spikes -> explicit engineered readout -> physical wings.
 * No hand-coded looming-to-escape branch. Flight stabilizer is still engineered.
 */
export class NeuralInsect {
  constructor(p,seed,options={},graph){
    if(!graph)throw new Error('Neural mode requires the verified full graph.');
    this.body=new FlyBody({p,frequency:options.bioFrequency||218,massScale:options.bioMassScale||1});
    this.body.alignHeading=false; // A neural backward command must not create a perpetual yaw chase.
    this.brain=new ConnectomeLIF(graph,{seed,dtMs:options.neuralDtMs||0.5});this.graph=graph;this.groups=graph.manifest.groups;
    this.mode='neural / assisted flight';this.queue=[];this.previous=null;this.visual=null;this.nextVisual=0;this.accumulator=0;this.visionEnabled=true;
    this.disconnected=false;this.collision=false;this.events=0;this.sensory={looming:0,angularSize:0,visualAvailable:false};this.rates={};this.command=[0,0,0];this.pulseUntil=-1;
    this.outputMask=new Uint8Array(graph.n);for(const [name,indices] of Object.entries(this.groups))if(/^(DN|wing_motor)/.test(name))for(const i of indices)this.outputMask[i]=1;
    this.outputSpikes=0;this.recordedSpikes=[];this.droppedSpikes=0;this.lastSummary=null;
  }
  get p(){return this.body.p;}get v(){return this.body.v;}
  lesion(population,on=true){const indices=Object.entries(this.groups).filter(([k])=>k.startsWith(population+'_')).flatMap(([,v])=>v);if(!indices.length)throw new Error('No such named population.');this.brain.lesion(indices,on);}
  step(dt,threat,boxes,c,time){
    if(this.collision)return;this.accumulator+=dt;const h=this.brain.dtMs/1000;
    while(this.accumulator+1e-12>=h){this.accumulator-=h;const t=this.brain.time;
      if(t+1e-9>=this.nextVisual){const s=visualSample(this.body,threat,boxes,t,this.previous);this.previous=s;this.queue.push({...s,ready:t+0.025});this.nextVisual=t+0.005;}
      while(this.queue.length&&this.queue[0].ready<=t+1e-10)this.visual=this.queue.shift();
      const sense=this.visionEnabled?this.visual:null;this.sensory={looming:sense?.expansion||0,angularSize:sense?.angularSize||0,visualAvailable:Boolean(sense),latency:0.025};
      // Population-level visual encoding is an explicit hypothesis, not a reconstructed retina.
      const strength=sense?.visible?180*Math.max(0,sense.expansion)/(1+Math.max(0,sense.expansion))*Math.min(1,sense.angularSize/0.1):0;
      const drives=[];for(const side of ['L','R']){const lateral=sense?.bearing[0]||0,sign=side==='L'?-1:1,gain=Math.max(0.1,(1+sign*lateral)/2);for(const pop of ['LC4','LPLC2'])drives.push({indices:this.groups[pop+'_'+side],hz:strength*gain});
        if(t<this.pulseUntil)drives.push({indices:this.groups['DNg02_'+side],hz:100});}
      const fired=this.brain.step(drives),firedSet=new Set(fired),decay=Math.exp(-h/0.025);
      for(const [name,indices] of Object.entries(this.groups)){let count=0;for(const i of indices)if(firedSet.has(i))count++;this.rates[name]=(this.rates[name]||0)*decay+(1-decay)*count/(h*Math.max(1,indices.length));}
      for(const i of fired){if(this.outputMask[i])this.outputSpikes++;this.recordedSpikes.push([this.brain.time,i]);}
      if(this.recordedSpikes.length>20000){this.droppedSpikes+=this.recordedSpikes.length-20000;this.recordedSpikes.splice(0,this.recordedSpikes.length-20000);}
      // Readout gains are engineering assumptions. They receive neuron rates, never stimulus geometry.
      const r=this.rates,L=(r.DNp01_L||0),R=(r.DNp01_R||0),flight=((r.DNg02_L||0)+(r.DNg02_R||0))/2,wm=(r.wing_motor_L||0)-(r.wing_motor_R||0);
      const local=[0.32*Math.tanh((L-R)/60+wm/100),0.12*Math.tanh((L+R)/100),0.22*Math.tanh(flight/60)-0.30*Math.tanh((L+R)/100)];
      this.command=this.disconnected?[0,0,0]:limited(rotate(this.body.q,local),0.5);
      const w=c.wind||0,wind=[w*Math.sin(t*.7),w*.12*Math.cos(t),w*.5*Math.cos(t*.43)],d=Math.hypot(...this.p.map((v,i)=>v-threat.p[i]));
      if(!c.bioNoWake&&d<.6)wind[1]-=.18*(1-d/.6);if(c.bioGust)for(let i=0;i<3;i++)wind[i]+=c.bioGust[i];const before=[...this.p];this.body.step(h,this.command,wind);
      if(sweptHit(before,this.p,boxes,PROFILE.span/2)){this.body.p=before;this.body.v=[0,0,0];this.collision=true;this.mode='neural / obstacle contact';return;}
    }
  }
  snapshot(){return {p:[...this.p],v:[...this.v],mode:this.mode,bio:{...this.body.snapshot(),sensory:{...this.sensory},escapeEvents:0,collision:this.collision,controller:'whole-MaleCNS-LIF + engineered motor decoder and stabilizer',connectome:true},neural:{...this.brain.summary(),dataset:this.graph.manifest.dataset,sourceHash:this.graph.manifest.assets.graph.decodedSha256,rates:{...this.rates},command:[...this.command],outputSpikes:this.outputSpikes,readoutDisconnected:this.disconnected,flightStabilizer:'engineered',sampleSpikes:this.recordedSpikes.slice(-300)}};}
}
