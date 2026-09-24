import {FlyBody,PROFILE,rotate,inverseRotate,add,scale,unit,length,limited,clamp} from './model.js';
import {RNG,rayBox,sweptHit,AXES} from '../core/math.js';
/** Sensory adapter: geometry is visible here, never to the insect motor controller.
 * Visual distance/range and ideal body velocity are synthetic proxies, not compound-eye images.
 */
export function visualSample(body,threat,boxes,time,previous=null){
  const delta=threat.p.map((x,i)=>x-body.p[i]),distance=length(delta),visible=!sweptHit(body.p,threat.p,boxes,0);
  const angularSize=visible?2*Math.atan((threat.radius??0.28)/Math.max(distance,0.001)):0;
  const expansion=previous&&visible&&previous.visible?Math.max(0,(angularSize-previous.angularSize)/Math.max(1e-5,time-previous.time)):0;
  const ranges=AXES.map(axis=>{const direction=rotate(body.q,axis);let r=0.6;for(const b of boxes)r=Math.min(r,rayBox(body.p,direction,b,0,0.6));return r;});
  return {time,visible,angularSize,expansion,bearing:inverseRotate(body.q,unit(delta)),ranges};
}
/** Frozen engineered sensory controller over real force-integrated wings/body, not a brain model. */
export class BiologicalInsect{
  constructor(p,seed,options={}){
    this.body=new FlyBody({p,frequency:options.bioFrequency??218,massScale:options.bioMassScale??1});this.rng=new RNG(seed^0x51977);this.heading=this.rng.next()*Math.PI*2;this.timer=0;this.escapeUntil=-1;this.escape=[0,0,0];this.mode='cruise';this.queue=[];this.nextVisual=0;this.previous=null;this.visual=null;this.visionEnabled=options.bioVision!==false;this.delay=(options.bioLatency??25)/1000;this.anchor=[...p];this.collision=false;this.sensory={looming:0,angularSize:0,visualAvailable:false};this.events=0;
  }
  get p(){return this.body.p;}get v(){return this.body.v;}
  step(dt,drone,boxes,c,time){
    if(this.collision)return;
    const n=Math.ceil(dt/0.005),h=dt/n;
    for(let k=0;k<n;k++){
      const t=time+k*h;
      if(t+1e-9>=this.nextVisual){const raw=visualSample(this.body,drone,boxes,t,this.previous);this.previous=raw;this.queue.push({...raw,ready:t+this.delay});this.nextVisual=t+0.005;}
      while(this.queue.length&&this.queue[0].ready<=t+1e-10)this.visual=this.queue.shift();
      const sense=this.visionEnabled?this.visual:null;this.sensory={looming:sense?.expansion||0,angularSize:sense?.angularSize||0,visualAvailable:Boolean(sense),latency:this.delay};
      this.timer-=h;if(this.timer<=0){this.heading+=this.rng.signed()*1.6;this.timer=0.3+this.rng.next()*1.2;}
      if(sense?.visible&&sense.expansion>0.7&&sense.angularSize>0.08&&c.agility>0&&t>this.escapeUntil+0.12){
        const bearing=rotate(this.body.q,sense.bearing);this.escape=scale(unit([-bearing[0],0.25,-bearing[2]]),0.35+0.25*c.agility);this.escapeUntil=t+0.16;this.events++;
      }
      const escaping=t<this.escapeUntil;this.mode=escaping?'banked escape':'cruise';
      let cruise=c.bioTask==='hover'?limited(this.anchor.map((x,i)=>(x-this.p[i])*2),0.3):c.bioTask==='straight'?[0,0,0.25]:[Math.sin(this.heading)*0.25,Math.sin(t*0.8+this.heading)*0.025,Math.cos(this.heading)*0.25];
      let goal=escaping?[...this.escape]:cruise;
      if(sense)for(let i=0;i<6;i++)if(sense.ranges[i]<0.24)goal=add(goal,scale(rotate(this.body.q,AXES[i]),-(0.24-sense.ranges[i])*4));
      goal=limited(goal,0.8);
      const away=this.p.map((x,i)=>x-drone.p[i]),d=length(away),wind=[c.wind*Math.sin(t*0.7),c.wind*0.12*Math.cos(t),c.wind*0.5*Math.cos(t*0.43)];
      if(!c.bioNoWake&&d<0.6)wind[1]-=0.18*(1-d/0.6);
      if(c.bioGust)for(let i=0;i<3;i++)wind[i]+=c.bioGust[i]; // Explicitly uncalibrated drone-wake proxy.
      const before=[...this.p];this.body.step(h,goal,wind);
      if(sweptHit(before,this.p,boxes,PROFILE.span/2)){this.body.p=before;this.body.v=[0,0,0];this.collision=true;this.mode='obstacle contact';return;}
    }
  }
  snapshot(){return {p:[...this.p],v:[...this.v],mode:this.mode,bio:{...this.body.snapshot(),sensory:{...this.sensory},escapeEvents:this.events,collision:this.collision,controller:'engineered-sensory-wing-controller',connectome:false}};}
}
