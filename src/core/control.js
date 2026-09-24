import {add,sub,mul,limit,norm,boxDistance,sweptHit,clamp,AXES} from './math.js';
import {navGoal} from './world.js';
export const ACTIONS=[[0,0,0],[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
export const ENVELOPE=0.27; // Conservative whole-vehicle/contact-head sphere, in metres.
export function propose(drone,track,ranges,c,time,action=0) {
  if(c.task==='contact'&&(!track||track.confidence<0.2)) return [0,0,0];
  const goal=c.task==='navigation'?navGoal(time):add(track.p,mul(track.v,0.18));
  let v=limit(mul(sub(goal,drone.p),1.45),c.speed);
  v=add(v,mul(ACTIONS[action]||ACTIONS[0],0.38));
  for(let i=0;i<6;i++) {
    const r=Math.max(0,ranges[i]-ENVELOPE);
    if(r<0.65) v=add(v,mul(AXES[i],-Math.min(1.4,(0.65-r)*2.2)));
  }
  return limit(v,c.speed);
}
/** Explicit oracle-map safety benchmark. Replacing this with estimated occupancy is a release gate. */
export function filter(drone,desired,boxes,c,track) {
  const protectedTarget=c.task==='contact'&&track&&boxes.some(b=>b.kind==='person'&&boxDistance(track.p,b)<0.75);
  if(protectedTarget) desired=[0,0,0];
  const candidates=[desired,mul(desired,0.55),[0,0,0],[0,0.7,0],[0,-0.4,0],[-0.6,0,0],[0.6,0,0],[0,0,-0.6],[0,0,0.6]];
  let chosen=null,best=Infinity;
  for(const cmd of candidates) {
    let p=[...drone.p],v=[...drone.v],ok=true;
    for(let n=0;n<12;n++) {
      v=add(v,mul(limit(mul(sub(cmd,v),5),4),0.05));
      const q=add(p,mul(v,0.05));
      if(sweptHit(p,q,boxes.map(b=>b.kind==='person'?{...b,size:b.size.map(x=>x+1.1)}:b),ENVELOPE+0.06)) {ok=false;break;} p=q;
    }
    if(ok) { const score=norm(sub(cmd,desired)); if(score<best) {chosen=cmd;best=score;} }
  }
  const command=chosen||[0,0,0];
  const intervention=protectedTarget||norm(sub(command,desired))>0.05||!chosen;
  return {command,intervention,reason:protectedTarget?'PERSON EXCLUSION':!chosen?'BRAKE / NO CLEAR PATH':intervention?'CLEARANCE FILTER':'CLEAR',protectedTarget:Boolean(protectedTarget)};
}
export function features(drone,track,ranges,c,time) {
  const p=track?sub(track.p,drone.p):[0,0,0],v=track?track.v:[0,0,0];
  return [...p.map(x=>clamp(x/4,-1,1)),...v.map(x=>clamp(x/2,-1,1)),...drone.v.map(x=>clamp(x/2.4,-1,1)),...ranges.map(x=>clamp(x/c.range,0,1)),track?.confidence||0,clamp(track?.age??1,0,1),drone.p[1]/3,clamp(norm(p)/8,0,1)];
}
