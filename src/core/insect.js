import {RNG,add,sub,mul,norm,unit,limit,rayBox,AXES,sweptHit} from './math.js';
/** Procedural sensory-reactive surrogate. Not flybody, not a connectome, not species-calibrated. */
export class ReactiveInsect {
  constructor(p,seed) { this.p=[...p]; this.v=[0.15,0.02,0.18]; this.rng=new RNG(seed^0x76543); this.turn=[0,0,0]; this.clock=0; this.mode='cruise'; }
  step(dt,drone,boxes,c,time) {
    this.clock-=dt;
    if(this.clock<=0) { this.turn=[this.rng.signed(),this.rng.signed()*0.55,this.rng.signed()]; this.clock=0.18+this.rng.next()*0.65; }
    let drive=mul(this.turn,1.3*c.agility+0.2);
    const away=sub(this.p,drone.p),d=norm(away),closing=Math.max(0,-away.reduce((s,v,i)=>s+v*(this.v[i]-drone.v[i]),0)/(d||1));
    this.mode=d<0.95&&c.agility>0?'evasive':'cruise';
    if(this.mode==='evasive') drive=add(drive,mul(unit(away),Math.min(3.4,(1-d/0.95)*(1.8+closing)*c.agility)));
    for(const axis of AXES) {
      let r=1; for(const b of boxes) r=Math.min(r,rayBox(this.p,axis,b,0,1));
      if(r<0.45) drive=add(drive,mul(axis,-(0.45-r)*6));
    }
    // Deliberately inexpensive wake/disturbance surrogate; not CFD or a measured rotor field.
    const wind=[c.wind*Math.sin(time*0.7),c.wind*0.12*Math.cos(time),c.wind*0.5*Math.cos(time*0.43)];
    if(d<0.6) wind[1]-=0.18*(1-d/0.6);
    this.v=limit(add(this.v,mul(sub(add(drive,wind),mul(this.v,0.9)),dt)),0.28+0.72*c.agility);
    const next=add(this.p,mul(this.v,dt));
    if(sweptHit(this.p,next,boxes,0.004)) this.v=mul(this.v,-0.6); else this.p=next;
  }
}
