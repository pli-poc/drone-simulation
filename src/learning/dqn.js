import {RNG,clamp} from '../core/math.js';
export const INPUTS=19,HIDDEN=24,OUTPUTS=7;
export const SCHEMA='mosquito-drone-lab/residual-dqn@1';
const lengths={w1:INPUTS*HIDDEN,b1:HIDDEN,w2:HIDDEN*OUTPUTS,b2:OUTPUTS};
export class Network {
  constructor(seed=123) {
    const r=new RNG(seed); this.w1=Array.from({length:lengths.w1},()=>r.signed()*0.15); this.b1=Array(HIDDEN).fill(0);
    this.w2=Array.from({length:lengths.w2},()=>r.signed()*0.03); this.b2=Array(OUTPUTS).fill(0);
  }
  forward(x) {
    const h=new Array(HIDDEN),q=new Array(OUTPUTS);
    for(let j=0;j<HIDDEN;j++) {let s=this.b1[j];for(let i=0;i<INPUTS;i++) s+=this.w1[j*INPUTS+i]*x[i];h[j]=Math.tanh(s);}
    for(let a=0;a<OUTPUTS;a++) {let s=this.b2[a];for(let j=0;j<HIDDEN;j++) s+=this.w2[a*HIDDEN+j]*h[j];q[a]=s;}
    return {h,q};
  }
  action(x) {const {q}=this.forward(x); let a=0;for(let i=1;i<q.length;i++) if(q[i]>q[a])a=i;return a;}
  checkpoint(meta={}) {return {schema:SCHEMA,dimensions:[INPUTS,HIDDEN,OUTPUTS],algorithm:'residual-dqn',meta,weights:Object.fromEntries(Object.keys(lengths).map(k=>[k,[...this[k]]]))};}
  load(data) {
    if(!data||data.schema!==SCHEMA||JSON.stringify(data.dimensions)!==JSON.stringify([INPUTS,HIDDEN,OUTPUTS])) throw new Error('Incompatible policy format or observation dimensions.');
    for(const [k,n] of Object.entries(lengths)) if(!Array.isArray(data.weights?.[k])||data.weights[k].length!==n||data.weights[k].some(v=>typeof v!=='number'||!Number.isFinite(v)||Math.abs(v)>100)) throw new Error('Invalid or non-finite policy weights.');
    for(const k of Object.keys(lengths)) this[k]=[...data.weights[k]]; return this;
  }
}
/** Small transparent DQN baseline, implemented without an ML runtime dependency. */
export class Learner {
  constructor(seed=123,checkpoint=null) {this.net=new Network(seed);if(checkpoint)this.net.load(checkpoint);this.target=new Network(seed).load(this.net.checkpoint());this.rng=new RNG(seed^9981);this.memory=[];this.cursor=0;this.steps=0;this.updates=0;this.loss=0;}
  choose(x,epsilon) {return this.rng.next()<epsilon?Math.floor(this.rng.next()*OUTPUTS):this.net.action(x);}
  remember(s,a,r,next,done) {
    const item={s:[...s],a,r,next:[...next],done}; if(this.memory.length<4096)this.memory.push(item);else{this.memory[this.cursor]=item;this.cursor=(this.cursor+1)%4096;}
    this.steps++; if(this.memory.length>=64&&this.steps%4===0)this.optimize();
  }
  optimize() {
    let loss=0; const lr=0.003/8;
    for(let b=0;b<8;b++) {
      const e=this.memory[Math.floor(this.rng.next()*this.memory.length)],{h,q}=this.net.forward(e.s);
      const target=clamp(e.r+(e.done?0:0.97*Math.max(...this.target.forward(e.next).q)),-30,30);
      const raw=q[e.a]-target,delta=clamp(raw,-1,1);loss+=Math.abs(raw)<1?0.5*raw*raw:Math.abs(raw)-0.5;
      const old=[];for(let j=0;j<HIDDEN;j++)old.push(this.net.w2[e.a*HIDDEN+j]);
      for(let j=0;j<HIDDEN;j++) {
        this.net.w2[e.a*HIDDEN+j]-=lr*(delta*h[j]+1e-5*this.net.w2[e.a*HIDDEN+j]);
        const dh=delta*old[j]*(1-h[j]*h[j]);
        for(let i=0;i<INPUTS;i++)this.net.w1[j*INPUTS+i]-=lr*(dh*e.s[i]+1e-5*this.net.w1[j*INPUTS+i]);
        this.net.b1[j]-=lr*dh;
      }
      this.net.b2[e.a]-=lr*delta;
    }
    this.loss=loss/8;this.updates++;if(this.updates%100===0)this.target.load(this.net.checkpoint());
  }
}
