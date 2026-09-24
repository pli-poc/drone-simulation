import {BiologicalInsect} from './insect.js';
import {PROFILE,length,clamp} from './model.js';
export class FlightExperiment{
  constructor(options={}){this.reset(options);}
  reset(options={}){
    this.config={task:['hover','straight','cruise'].includes(options.task)?options.task:'hover',frequency:clamp(Number(options.frequency)||218,196,240),massScale:clamp(Number(options.massScale)||1,.7,1.3),vision:options.vision!==false,gyro:options.gyro!==false,wings:options.wings!==false,stabilizer:options.stabilizer!==false,seed:42};
    this.insect=new BiologicalInsect([0,1.5,0],42,{bioFrequency:this.config.frequency,bioMassScale:this.config.massScale});this.time=0;this.events=[];this.trace=[];this.loom=null;this.gustUntil=-1;this.traceAt=0;this.sampleControls();
  }
  sampleControls(){this.insect.visionEnabled=this.config.vision;this.insect.body.gyroEnabled=this.config.gyro;this.insect.body.wingsEnabled=this.config.wings;this.insect.body.controller=this.config.stabilizer;}
  toggle(key,value){if(!['vision','gyro','wings','stabilizer'].includes(key))throw new Error('Unknown control.');this.config[key]=Boolean(value);this.sampleControls();this.events.push({time:this.time,type:key,enabled:Boolean(value)});}
  stimulus(kind,side=1){if(kind==='loom'){this.loom={start:this.time,side:side===-1?-1:1,anchor:[...this.insect.p]};}else if(kind==='gust')this.gustUntil=this.time+.12;else if(kind==='roll')this.insect.body.omega[2]+=10;else throw new Error('Unknown stimulus.');this.events.push({time:this.time,type:kind,side});}
  step(dt=.002){
    const threat={p:[100,100,100],v:[0,0,0],radius:.06};
    if(this.loom){const age=this.time-this.loom.start;if(age<.4){const d=Math.max(.09,.8-2.4*age);threat.p=this.loom.anchor.map((v,i)=>v+(i===0?this.loom.side*d:i===2?d*.3:0));}else this.loom=null;}
    this.insect.step(dt,threat,[],{agility:1,wind:0,bioNoWake:true,bioTask:this.config.task,bioGust:this.time<this.gustUntil?[.6,0,0]:null},this.time);this.time+=dt;
    if(this.time>=this.traceAt){this.traceAt=this.time+.002;const b=this.insect.body,s=this.insect.sensory;this.trace.push({time:this.time,p:[...b.p],v:[...b.v],q:[...b.q],lift:b.verticalWingForce,liftMean:b.liftMean,power:b.lastForces.power,looming:s.looming,mode:this.insect.mode,phase:b.phase});if(this.trace.length>10000)this.trace.shift();}
  }
  snapshot(){return {...this.insect.snapshot(),config:{...this.config},speed:length(this.insect.v),events:this.events.slice(-20),stimulus:this.loom?'loom':this.time<this.gustUntil?'gust':'none'};}
  export(){return {schema:'mosquito-drone-lab/biological-experiment@1',profile:PROFILE,config:this.config,events:this.events,trace:this.trace,traceCapacity:10000,limitations:'Reduced-order wing-driven fruit-fly model. Engineered sensory controller, approximate aerodynamics; no connectome, no experimental flight-trajectory validation, not a mosquito.'};}
}
