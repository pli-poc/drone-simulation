import {RNG,AXES,add,sub,mul,limit,distance,rayBox,sweptHit,clamp} from './math.js';
/** Idealized 360-degree detection-output proxy, NOT a rendered/learned camera detector. */
export class Sensors {
  constructor(seed) { this.rng=new RNG(seed^0x24681); this.queue=[]; this.last=null; this.previous=null; this.ranges=AXES.map(()=>0); this.samples=0; }
  sample(time,drone,insect,boxes,c) {
    this.ranges=AXES.map(axis=>{
      let r=c.range; for(const b of boxes) r=Math.min(r,rayBox(drone.p,axis,b,0,c.range));
      return this.rng.next()<c.dropout?0:clamp(r+this.rng.normal()*0.015,0,c.range);
    });
    const d=distance(drone.p,insect.p);
    if(d<c.range&&!sweptHit(drone.p,insect.p,boxes,0)&&this.rng.next()>c.dropout) {
      const noise=0.008+d*0.003;
      this.queue.push({time,deliver:time+c.latency/1000,p:insect.p.map(v=>v+this.rng.normal()*noise)});
    }
    this.samples++;
  }
  deliver(time) {
    while(this.queue.length&&this.queue[0].deliver<=time+1e-8) {
      const m=this.queue.shift(); let v=[0,0,0];
      if(this.last) v=limit(mul(sub(m.p,this.last.p),1/Math.max(0.05,m.time-this.last.time)),2);
      this.previous=this.last; this.last={...m,v};
    }
    if(!this.last) return null;
    const age=Math.max(0,time-this.last.time);
    if(age>0.8) return null;
    return {p:add(this.last.p,mul(this.last.v,Math.min(age,0.2))),v:[...this.last.v],age,confidence:Math.exp(-age*2.2)*0.96};
  }
}
