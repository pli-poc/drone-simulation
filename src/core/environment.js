import {config,scene,obstacles,navGoal} from './world.js';
import {ReactiveInsect} from './insect.js';
import {Sensors} from './sensors.js';
import {propose,filter,features,ENVELOPE} from './control.js';
import {add,sub,mul,norm,limit,distance,boxDistance,sweptHit,segmentOriginDistance} from './math.js';
export const STEP=0.1,PHYSICS_STEP=1/60;
/** One authoritative engine is used by both the viewer worker and the training worker. */
export class Environment {
  constructor(input={}) { this.reset(input); }
  reset(input={}) {
    this.config=config(input); this.world=scene(this.config.scenario); this.time=0; this.ticks=0;
    this.drone={p:[...this.world.spawn],v:[0,0,0],yaw:0};
    this.insect=new ReactiveInsect(this.world.insectSpawn,this.config.seed);
    this.sensors=new Sensors(this.config.seed); this.track=null;
    this.metrics={contacts:0,collisions:0,interventions:0,nearMissSteps:0,minClearance:10,pathLength:0,return:0,trackingSteps:0,steps:0};
    this.safety={reason:'WAITING FOR TRACK',intervention:false,protectedTarget:false};
    this.done=false; this.outcome='running'; this.lastAction=0;
    this.sensors.sample(0,this.drone,this.insect,this.boxes(),this.config);
    this.track=this.sensors.deliver(0);
    return this.observation();
  }
  boxes() { return obstacles(this.world,this.time); }
  observation() { return features(this.drone,this.track,this.sensors.ranges,this.config,this.time); }
  head() {return add(this.drone.p,[Math.sin(this.drone.yaw)*0.2,0,Math.cos(this.drone.yaw)*0.2]);}
  step(action=0) {
    if(this.done) return {observation:this.observation(),reward:0,terminated:this.outcome!=='timeout',truncated:this.outcome==='timeout'};
    if(!Number.isInteger(action)||action<0||action>6) throw new Error('Action must be an integer in [0,6].');
    const c=this.config,goal=c.task==='navigation'?navGoal(this.time):this.insect.p;
    const oldDistance=distance(this.drone.p,goal); this.lastAction=action;
    const desired=propose(this.drone,this.track,this.sensors.ranges,c,this.time,action);
    this.safety=filter(this.drone,desired,this.boxes(),c,this.track);
    if(this.safety.intervention) this.metrics.interventions++;
    for(let i=0;i<6;i++) {
      const boxes=this.boxes(),before=[...this.drone.p],oldHead=this.head(),oldTarget=[...this.insect.p];
      const a=limit(mul(sub(this.safety.command,this.drone.v),5),4);
      this.drone.v=limit(add(this.drone.v,mul(a,PHYSICS_STEP)),c.speed);
      const next=add(before,mul(this.drone.v,PHYSICS_STEP));
      if(sweptHit(before,next,boxes,ENVELOPE)) {this.metrics.collisions++;this.drone.v=[0,0,0];this.done=true;this.outcome='collision';}
      else {this.drone.p=next;this.metrics.pathLength+=distance(before,next);}
      if(Math.hypot(this.drone.v[0],this.drone.v[2])>0.08) this.drone.yaw=Math.atan2(this.drone.v[0],this.drone.v[2]);
      this.insect.step(PHYSICS_STEP,this.drone,boxes,c,this.time);
      this.time+=PHYSICS_STEP; this.ticks++;
      const clearance=Math.min(...boxes.map(b=>boxDistance(this.drone.p,b)))-ENVELOPE;
      this.metrics.minClearance=Math.min(this.metrics.minClearance,clearance);
      const protectedContact=boxes.some(b=>b.kind==='person'&&boxDistance(this.insect.p,b)<0.75);
      // Continuous relative contact geometry. Neither contact nor disappearance implies electrocution.
      if(!this.done&&c.task==='contact'&&!protectedContact&&!this.safety.protectedTarget&&this.track?.confidence>0.2&&segmentOriginDistance(sub(oldHead,oldTarget),sub(this.head(),this.insect.p))<0.072) {
        this.metrics.contacts++;this.done=true;this.outcome='contact';
      }
      this.track=this.sensors.deliver(this.time);
      if(this.done) break;
    }
    this.sensors.sample(this.time,this.drone,this.insect,this.boxes(),c);
    this.track=this.sensors.deliver(this.time);
    if(this.metrics.minClearance<0.08) this.metrics.nearMissSteps++;
    this.metrics.steps++; if(this.track) this.metrics.trackingSteps++;
    const newGoal=c.task==='navigation'?goal:this.insect.p;
    const d=distance(this.drone.p,newGoal);
    // Privileged *reward* shaping only. Ground-truth target position is never a policy input.
    const reward=2*(oldDistance-d)-0.012-0.003*d-(this.safety.intervention?0.05:0)+(this.outcome==='contact'?8:0)-(this.outcome==='collision'?15:0);
    this.metrics.return+=reward;
    if(!this.done&&this.time>=c.duration-1e-6) {this.done=true;this.outcome='timeout';}
    return {observation:this.observation(),reward,terminated:this.done&&this.outcome!=='timeout',truncated:this.done&&this.outcome==='timeout'};
  }
  snapshot() {
    return {schema:1,time:this.time,config:{...this.config},drone:{p:[...this.drone.p],v:[...this.drone.v],yaw:this.drone.yaw},insect:{p:[...this.insect.p],v:[...this.insect.v],mode:this.insect.mode},track:this.track?structuredClone(this.track):null,ranges:[...this.sensors.ranges],safety:{...this.safety},metrics:{...this.metrics},outcome:this.outcome,done:this.done,action:this.lastAction,separation:distance(this.drone.p,this.insect.p),speed:norm(this.drone.v),electrical:{enabled:false,confirmedNeutralizations:0},goal:this.config.task==='navigation'?navGoal(this.time):null};
  }
}
